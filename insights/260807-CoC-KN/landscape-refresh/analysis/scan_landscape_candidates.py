#!/usr/bin/env python3
"""Find high-signal Agentic AI projects missing from the current landscape.

The scan combines:

1. GitHub WatchEvent counts visible in OpenDigger ClickHouse from 2026-05-01
   through 2026-07-28.
2. GitHub repository OpenRank for the last three completed months available in
   the database: 2026-04, 2026-05, and 2026-06.
3. Current GitHub repository metadata and targeted GitHub repository searches.
4. Exact GitHub stargazer timestamps for the highest-signal candidate subset
   when the caller has access to that repository-level endpoint.

The recent ClickHouse partitions are incomplete. Absolute WatchEvent and
OpenRank totals must not be used as ecosystem-level trend claims. They are used
only as candidate-discovery signals and are cross-checked against the current
GitHub repository snapshot. GitHub restricted public access to stargazer lists
in July 2026, so exact recent star growth is unavailable for most public
repositories unless the token has collaborator access.
"""

from __future__ import annotations

import argparse
import base64
import csv
import json
import math
import os
import re
import sys
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import clickhouse_connect
import requests
from dotenv import load_dotenv


REPO_ROOT = Path(__file__).resolve().parents[4]
EVENT_DIR = REPO_ROOT / "presentations" / "260807-CoC-KN" / "landscape-refresh"
DATA_DIR = EVENT_DIR / "data"
ENV_PATH = REPO_ROOT / "scripts" / ".env"
LANDSCAPE_CSV = REPO_ROOT / "data" / "agentic-ai-projects.csv"

STAR_START = "2026-05-01"
STAR_END_EXCLUSIVE = "2026-07-29"
STAR_CUTOFF_UTC = datetime(2026, 4, 30, 16, 0, 0, tzinfo=timezone.utc)
OPENRANK_START = "2026-04-01"
OPENRANK_END_EXCLUSIVE = "2026-07-01"
GITHUB_SNAPSHOT_DATE = "2026-07-28"

CORE_AGENT_TERMS = [
    "agent",
    "agents",
    "agentic",
    "autonomous agent",
    "multi-agent",
    "multi agent",
    "coding agent",
    "developer agent",
    "computer use",
    "mcp",
    "model context protocol",
    "tool calling",
    "function calling",
    "agent framework",
    "agent runtime",
    "agent orchestration",
    "agent workflow",
    "agent memory",
    "agent sandbox",
    "a2a",
]

MODEL_INFRA_TERMS = [
    "llm inference",
    "model serving",
    "inference engine",
    "inference server",
    "llm gateway",
    "model gateway",
    "model router",
    "model routing",
    "fine-tuning",
    "finetuning",
    "model training",
    "llm training",
    "reinforcement learning",
    "rl training",
    "post-training",
    "evaluation",
    "observability",
    "sandbox",
    "vector database",
    "retrieval augmented",
    "rag",
    "graphrag",
    "knowledge graph",
    "embedding",
    "vllm",
    "sglang",
    "llama.cpp",
    "gpu inference",
    "distributed training",
    "token routing",
]

MODEL_TERMS = [
    "large language model",
    "language model",
    "foundation model",
    "multimodal model",
    "vision language model",
    "diffusion language model",
    "open-weight",
    "open weight",
    "mixture of experts",
    "reasoning model",
    "generative ai model",
]

COLLECTION_TERMS = [
    "awesome list",
    "curated list",
    "collection of",
    "course",
    "tutorial",
    "cheat sheet",
    "cheatsheet",
    "interview",
    "book",
    "newsletter",
    "prompt collection",
]

REPO_NAME_EXCLUSIONS = [
    r"(^|[-_.])awesome($|[-_.])",
    r"[-_.]skills?$",
    r"[-_.]prompts?$",
    r"[-_.]best[-_.]?practices?$",
    r"[-_.]course$",
    r"[-_.]tutorials?$",
]

GITHUB_SEARCH_QUERIES = [
    '"agentic" in:name,description,readme stars:>500 pushed:>=2026-05-01',
    '"ai agent" in:name,description,readme stars:>500 pushed:>=2026-05-01',
    '"coding agent" in:name,description,readme stars:>500 pushed:>=2026-05-01',
    '"agent framework" in:name,description,readme stars:>300 pushed:>=2026-05-01',
    '"model context protocol" in:name,description,readme stars:>300 pushed:>=2026-05-01',
    '"agent memory" in:name,description,readme stars:>300 pushed:>=2026-05-01',
    '"computer use" agent in:name,description,readme stars:>300 pushed:>=2026-05-01',
    '"llm inference" in:name,description,readme stars:>500 pushed:>=2026-05-01',
    '"model serving" in:name,description,readme stars:>500 pushed:>=2026-05-01',
    '"reinforcement learning" llm in:name,description,readme stars:>500 pushed:>=2026-05-01',
    '"reasoning model" in:name,description,readme stars:>500 pushed:>=2026-05-01',
    '"diffusion language model" in:name,description,readme stars:>100 pushed:>=2026-05-01',
]


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--skip-exact-star-growth",
        action="store_true",
        help="Skip GitHub stargazer timestamp queries.",
    )
    parser.add_argument(
        "--exact-star-limit",
        type=int,
        default=120,
        help="Maximum number of candidates to verify with stargazer timestamps.",
    )
    return parser.parse_args()


def direct_network_setup() -> None:
    for key in (
        "HTTP_PROXY",
        "HTTPS_PROXY",
        "ALL_PROXY",
        "http_proxy",
        "https_proxy",
        "all_proxy",
    ):
        os.environ.pop(key, None)
    host = os.getenv("CLICKHOUSE_HOST", "").strip()
    existing = [x for x in os.getenv("NO_PROXY", "").split(",") if x]
    for item in (host, "api.github.com", "github.com", "127.0.0.1", "localhost"):
        if item and item not in existing:
            existing.append(item)
    os.environ["NO_PROXY"] = ",".join(existing)
    os.environ["no_proxy"] = os.environ["NO_PROXY"]


def get_clickhouse_client():
    return clickhouse_connect.get_client(
        host=os.getenv("CLICKHOUSE_HOST", "").strip(),
        port=8123,
        username=os.getenv("CLICKHOUSE_USER"),
        password=os.getenv("CLICKHOUSE_PASSWORD"),
    )


def github_headers(accept: str = "application/vnd.github+json") -> dict[str, str]:
    headers = {
        "Accept": accept,
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "agentic-ai-landscape-refresh",
    }
    token = os.getenv("GITHUB_TOKEN", "").strip() or os.getenv("GH_TOKEN", "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def github_get(
    url: str,
    *,
    accept: str = "application/vnd.github+json",
    params: dict[str, Any] | None = None,
    retries: int = 4,
) -> requests.Response:
    last_error: Exception | None = None
    for attempt in range(retries):
        try:
            response = requests.get(
                url,
                headers=github_headers(accept),
                params=params,
                timeout=30,
            )
            if response.status_code in (200, 404, 422):
                return response
            if response.status_code in (403, 429):
                reset_at = int(response.headers.get("X-RateLimit-Reset", "0") or "0")
                wait = max(reset_at - int(time.time()), 2)
                wait = min(wait, 60)
                time.sleep(wait)
                continue
            response.raise_for_status()
        except Exception as exc:  # pragma: no cover - network-specific
            last_error = exc
            time.sleep(2**attempt)
    if last_error:
        raise last_error
    raise RuntimeError(f"GitHub request failed: {url}")


def load_existing_landscape() -> tuple[set[int], set[str]]:
    with LANDSCAPE_CSV.open(newline="", encoding="utf-8") as handle:
        rows = list(csv.DictReader(handle))
    ids = {
        int(row["repo_id"])
        for row in rows
        if (row.get("repo_id") or "").strip().isdigit()
    }
    names = {
        (row.get("repo_name") or "").strip().lower()
        for row in rows
        if (row.get("repo_name") or "").strip()
    }
    return ids, names


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def query_data_quality(client) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []

    context = client.query(
        """
        SELECT version(), timezone(), max(created_at)
        FROM opensource.events
        """
    ).first_row
    rows.append(
        {
            "check": "events_context",
            "period": "all",
            "rows": "",
            "repos": "",
            "metric_value": str(context[2]),
            "note": f"ClickHouse {context[0]}, timezone {context[1]}",
        }
    )

    openrank = client.query(
        """
        SELECT
            toYYYYMM(created_at) AS month,
            count() AS rows,
            uniqExact(repo_id) AS repos,
            round(sum(openrank), 2) AS metric_value
        FROM opensource.global_openrank
        WHERE platform = 'GitHub'
          AND type = 'Repo'
          AND created_at >= '2026-01-01'
        GROUP BY month
        ORDER BY month
        """
    )
    for month, row_count, repos, value in openrank.result_rows:
        rows.append(
            {
                "check": "global_openrank_coverage",
                "period": str(month),
                "rows": row_count,
                "repos": repos,
                "metric_value": value,
                "note": "Recent months show material coverage loss.",
            }
        )

    watch = client.query(
        """
        SELECT
            toYYYYMM(created_at) AS month,
            count() AS rows,
            uniqExact(repo_id) AS repos
        FROM opensource.events
        WHERE platform = 'GitHub'
          AND type = 'WatchEvent'
          AND created_at >= '2026-04-01'
          AND created_at < '2026-07-29'
        GROUP BY month
        ORDER BY month
        """
    )
    for month, row_count, repos in watch.result_rows:
        rows.append(
            {
                "check": "watch_event_coverage",
                "period": str(month),
                "rows": row_count,
                "repos": repos,
                "metric_value": row_count,
                "note": "Candidate-discovery signal only; not absolute GitHub star growth.",
            }
        )

    repo_info = client.query(
        """
        SELECT
            max(updated_at),
            count(),
            countIf(description = ''),
            countIf(length(topics) = 0),
            countIf(readme_text = '')
        FROM opensource.repo_info
        WHERE platform = 'GitHub'
          AND status = 'normal'
        """
    ).first_row
    rows.append(
        {
            "check": "repo_info_freshness",
            "period": "all",
            "rows": repo_info[1],
            "repos": repo_info[1],
            "metric_value": str(repo_info[0]),
            "note": (
                f"missing description={repo_info[2]}, topics={repo_info[3]}, "
                f"readme={repo_info[4]}"
            ),
        }
    )
    return rows


def query_candidate_metrics(client) -> tuple[dict[int, dict[str, Any]], dict[int, dict[str, Any]]]:
    star_rows = client.query(
        f"""
        SELECT
            repo_id,
            argMax(repo_name, created_at) AS latest_repo_name,
            count() AS star_events
        FROM opensource.events
        WHERE platform = 'GitHub'
          AND type = 'WatchEvent'
          AND created_at >= '{STAR_START}'
          AND created_at < '{STAR_END_EXCLUSIVE}'
          AND repo_id > 0
          AND repo_name != ''
        GROUP BY repo_id
        ORDER BY star_events DESC
        LIMIT 2500
        """
    )
    star_metrics: dict[int, dict[str, Any]] = {}
    for rank, (repo_id, repo_name, star_events) in enumerate(star_rows.result_rows, 1):
        star_metrics[int(repo_id)] = {
            "repo_name": repo_name,
            "watch_events_visible": int(star_events),
            "watch_rank": rank,
        }

    openrank_rows = client.query(
        f"""
        SELECT
            repo_id,
            argMax(repo_name, created_at) AS latest_repo_name,
            round(sum(openrank), 2) AS openrank_3m,
            round(max(openrank), 2) AS openrank_peak,
            groupArray((toYYYYMM(created_at), round(openrank, 2))) AS openrank_months
        FROM opensource.global_openrank
        WHERE platform = 'GitHub'
          AND type = 'Repo'
          AND created_at >= '{OPENRANK_START}'
          AND created_at < '{OPENRANK_END_EXCLUSIVE}'
          AND repo_id > 0
          AND repo_name != ''
        GROUP BY repo_id
        ORDER BY openrank_3m DESC
        LIMIT 4000
        """
    )
    openrank_metrics: dict[int, dict[str, Any]] = {}
    for rank, row in enumerate(openrank_rows.result_rows, 1):
        repo_id, repo_name, openrank_3m, peak, months = row
        normalized_months = {
            str(month): float(value)
            for month, value in sorted(months, key=lambda x: x[0])
        }
        openrank_metrics[int(repo_id)] = {
            "repo_name": repo_name,
            "openrank_3m": float(openrank_3m),
            "openrank_peak": float(peak),
            "openrank_rank": rank,
            "openrank_202604": normalized_months.get("202604", ""),
            "openrank_202605": normalized_months.get("202605", ""),
            "openrank_202606": normalized_months.get("202606", ""),
        }
    return star_metrics, openrank_metrics


def query_repo_info(client, repo_ids: list[int]) -> dict[int, dict[str, Any]]:
    output: dict[int, dict[str, Any]] = {}
    for start in range(0, len(repo_ids), 500):
        chunk = repo_ids[start : start + 500]
        id_list = ",".join(str(repo_id) for repo_id in chunk)
        result = client.query(
            f"""
            SELECT
                id,
                updated_at,
                description,
                primary_language,
                license_spdx_id,
                topics,
                substring(readme_text, 1, 8000),
                created_at,
                isFork
            FROM opensource.repo_info
            WHERE platform = 'GitHub'
              AND status = 'normal'
              AND id IN ({id_list})
            """
        )
        for row in result.result_rows:
            (
                repo_id,
                updated_at,
                description,
                language,
                license_id,
                topics,
                readme,
                created_at,
                is_fork,
            ) = row
            output[int(repo_id)] = {
                "repo_info_updated_at": str(updated_at),
                "description": description or "",
                "language": language or "",
                "license": license_id or "",
                "topics": ",".join(topics or []),
                "readme": readme or "",
                "created_at": str(created_at)[:10],
                "is_fork": int(is_fork),
            }
    return output


def keyword_count(terms: list[str], text: str) -> int:
    count = 0
    for term in terms:
        if re.search(r"\b" + re.escape(term) + r"\b", text, re.IGNORECASE):
            count += 1
    return count


def relevance_features(record: dict[str, Any]) -> dict[str, Any]:
    repo_name = str(record.get("repo_name") or "")
    text = " ".join(
        [
            repo_name,
            str(record.get("description") or ""),
            str(record.get("topics") or ""),
            str(record.get("readme") or "")[:8000],
        ]
    ).lower()
    agent = keyword_count(CORE_AGENT_TERMS, text)
    infra = keyword_count(MODEL_INFRA_TERMS, text)
    model = keyword_count(MODEL_TERMS, text)
    collection = keyword_count(COLLECTION_TERMS, text)
    name_part = repo_name.rsplit("/", 1)[-1].lower()
    name_excluded = any(re.search(pattern, name_part) for pattern in REPO_NAME_EXCLUSIONS)

    score = agent * 4 + infra * 2 + model * 2 - collection * 3
    relevant = (
        (agent >= 1 and score >= 5)
        or (infra >= 2 and score >= 5)
        or (model >= 2 and score >= 5)
    )
    if name_excluded and agent < 4:
        relevant = False

    if agent >= 1:
        layer = "Agent Infra"
    elif infra >= 2:
        layer = "Model Infra"
    elif model >= 2:
        layer = "Large Models"
    else:
        layer = "Needs review"

    return {
        "relevance_score": score,
        "agent_signal_count": agent,
        "model_infra_signal_count": infra,
        "model_signal_count": model,
        "collection_signal_count": collection,
        "auto_relevant": relevant,
        "suggested_layer": layer,
    }


def github_search() -> dict[int, dict[str, Any]]:
    found: dict[int, dict[str, Any]] = {}
    for query_index, query in enumerate(GITHUB_SEARCH_QUERIES, 1):
        response = github_get(
            "https://api.github.com/search/repositories",
            params={
                "q": query,
                "sort": "stars",
                "order": "desc",
                "per_page": 100,
                "page": 1,
            },
        )
        if response.status_code != 200:
            continue
        for item_index, item in enumerate(response.json().get("items", []), 1):
            repo_id = int(item["id"])
            entry = found.setdefault(
                repo_id,
                {
                    "github_search_rank": query_index * 1000 + item_index,
                    "github_search_queries": [],
                    "github_search_item": item,
                },
            )
            entry["github_search_rank"] = min(
                entry["github_search_rank"], query_index * 1000 + item_index
            )
            entry["github_search_queries"].append(query)
    return found


def fetch_repo_metadata(repo_id: int) -> dict[str, Any] | None:
    response = github_get(f"https://api.github.com/repositories/{repo_id}")
    if response.status_code != 200:
        return None
    item = response.json()
    return {
        "repo_id": repo_id,
        "repo_name": item.get("full_name", ""),
        "description": item.get("description") or "",
        "topics": ",".join(item.get("topics") or []),
        "stars_current": int(item.get("stargazers_count") or 0),
        "forks_current": int(item.get("forks_count") or 0),
        "open_issues_current": int(item.get("open_issues_count") or 0),
        "language": item.get("language") or "",
        "license": (item.get("license") or {}).get("spdx_id") or "",
        "created_at": (item.get("created_at") or "")[:10],
        "pushed_at": item.get("pushed_at") or "",
        "archived": bool(item.get("archived")),
        "disabled": bool(item.get("disabled")),
        "is_fork": bool(item.get("fork")),
        "html_url": item.get("html_url") or "",
    }


def fetch_readme(repo_name: str) -> str:
    response = github_get(f"https://api.github.com/repos/{repo_name}/readme")
    if response.status_code != 200:
        return ""
    payload = response.json()
    try:
        return base64.b64decode(payload.get("content", "")).decode(
            "utf-8", errors="replace"
        )[:12000]
    except Exception:
        return ""


def fetch_stargazer_page(
    repo_name: str, page: int
) -> list[dict[str, Any]] | None:
    response = github_get(
        f"https://api.github.com/repos/{repo_name}/stargazers",
        accept="application/vnd.github.star+json",
        params={"per_page": 100, "page": page},
    )
    if response.status_code != 200:
        return None
    return response.json()


def exact_star_growth(repo_name: str, total_stars: int) -> int | None:
    if total_stars <= 0:
        return 0
    total_pages = math.ceil(total_stars / 100)
    low, high = 1, total_pages
    first_page_at_or_after: int | None = None

    while low <= high:
        middle = (low + high) // 2
        page_rows = fetch_stargazer_page(repo_name, middle)
        if page_rows is None:
            return None
        if not page_rows:
            high = middle - 1
            continue
        last_timestamp = page_rows[-1].get("starred_at")
        if not last_timestamp:
            return None
        last_dt = datetime.fromisoformat(last_timestamp.replace("Z", "+00:00"))
        if last_dt >= STAR_CUTOFF_UTC:
            first_page_at_or_after = middle
            high = middle - 1
        else:
            low = middle + 1

    if first_page_at_or_after is None:
        return 0

    page_rows = fetch_stargazer_page(repo_name, first_page_at_or_after)
    if page_rows is None:
        return None
    before_on_page = 0
    for item in page_rows:
        timestamp = item.get("starred_at")
        if not timestamp:
            return None
        starred_at = datetime.fromisoformat(timestamp.replace("Z", "+00:00"))
        if starred_at < STAR_CUTOFF_UTC:
            before_on_page += 1

    stars_before = (first_page_at_or_after - 1) * 100 + before_on_page
    return max(total_stars - stars_before, 0)


def safe_log(value: float) -> float:
    return math.log10(max(value, 0) + 1)


def preliminary_priority(record: dict[str, Any]) -> float:
    watch = float(record.get("watch_events_visible") or 0)
    openrank = float(record.get("openrank_peak") or 0)
    stars = float(record.get("stars_current") or 0)
    relevance = float(record.get("relevance_score") or 0)
    search_bonus = 1.0 if record.get("github_search_queries") else 0.0
    return (
        2.5 * safe_log(watch)
        + 2.0 * safe_log(openrank)
        + 1.0 * safe_log(stars)
        + 0.25 * relevance
        + search_bonus
    )


def final_priority(record: dict[str, Any]) -> float:
    exact_growth = record.get("stars_growth_exact")
    growth_value = float(exact_growth) if exact_growth not in (None, "") else 0.0
    return (
        3.0 * safe_log(growth_value)
        + 2.0 * safe_log(float(record.get("openrank_peak") or 0))
        + 0.8 * safe_log(float(record.get("stars_current") or 0))
        + 0.3 * float(record.get("relevance_score") or 0)
    )


def main() -> None:
    args = parse_args()
    load_dotenv(ENV_PATH)
    direct_network_setup()
    DATA_DIR.mkdir(parents=True, exist_ok=True)

    existing_ids, existing_names = load_existing_landscape()
    client = get_clickhouse_client()

    quality_rows = query_data_quality(client)
    write_csv(
        DATA_DIR / "data_quality_checks.csv",
        quality_rows,
        ["check", "period", "rows", "repos", "metric_value", "note"],
    )

    star_metrics, openrank_metrics = query_candidate_metrics(client)
    search_results = github_search()
    candidate_ids = (
        set(star_metrics)
        | set(openrank_metrics)
        | set(search_results)
    ) - existing_ids

    repo_info = query_repo_info(client, sorted(candidate_ids))
    candidate_records: list[dict[str, Any]] = []
    for repo_id in candidate_ids:
        record: dict[str, Any] = {
            "repo_id": repo_id,
            "repo_name": "",
            "watch_events_visible": 0,
            "watch_rank": "",
            "openrank_3m": 0,
            "openrank_peak": 0,
            "openrank_rank": "",
            "openrank_202604": "",
            "openrank_202605": "",
            "openrank_202606": "",
            "github_search_rank": "",
            "github_search_queries": "",
            "readme": "",
        }
        if repo_id in star_metrics:
            record.update(star_metrics[repo_id])
        if repo_id in openrank_metrics:
            current_name = record.get("repo_name")
            record.update(openrank_metrics[repo_id])
            if current_name:
                record["repo_name"] = current_name
        if repo_id in repo_info:
            record.update(repo_info[repo_id])
        if repo_id in search_results:
            search = search_results[repo_id]
            item = search["github_search_item"]
            record["github_search_rank"] = search["github_search_rank"]
            record["github_search_queries"] = " || ".join(
                search["github_search_queries"]
            )
            if not record.get("repo_name"):
                record["repo_name"] = item.get("full_name") or ""
            if not record.get("description"):
                record["description"] = item.get("description") or ""
            if not record.get("topics"):
                record["topics"] = ",".join(item.get("topics") or [])

        record.update(relevance_features(record))
        if record["auto_relevant"]:
            candidate_records.append(record)

    candidate_records.sort(
        key=lambda row: (
            int(row.get("watch_rank") or 10**9),
            int(row.get("openrank_rank") or 10**9),
        )
    )

    bucket_ids: set[int] = set()
    star_bucket = sorted(
        candidate_records,
        key=lambda row: int(row.get("watch_rank") or 10**9),
    )[:100]
    openrank_bucket = sorted(
        candidate_records,
        key=lambda row: int(row.get("openrank_rank") or 10**9),
    )[:100]
    search_bucket = sorted(
        [row for row in candidate_records if row.get("github_search_rank")],
        key=lambda row: int(row.get("github_search_rank") or 10**9),
    )[:80]
    for row in star_bucket + openrank_bucket + search_bucket:
        bucket_ids.add(int(row["repo_id"]))

    selected = [row for row in candidate_records if int(row["repo_id"]) in bucket_ids]

    metadata: dict[int, dict[str, Any]] = {}
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {
            executor.submit(fetch_repo_metadata, int(row["repo_id"])): int(
                row["repo_id"]
            )
            for row in selected
        }
        for future in as_completed(futures):
            repo_id = futures[future]
            try:
                result = future.result()
            except Exception as exc:  # pragma: no cover - network-specific
                print(f"metadata error {repo_id}: {exc}", file=sys.stderr)
                continue
            if result:
                metadata[repo_id] = result

    refreshed: list[dict[str, Any]] = []
    for row in selected:
        repo_id = int(row["repo_id"])
        if repo_id not in metadata:
            continue
        row.update(metadata[repo_id])
        if row["repo_name"].lower() in existing_names:
            continue
        if row["archived"] or row["disabled"] or row["is_fork"]:
            continue
        refreshed.append(row)

    readme_targets = sorted(
        refreshed,
        key=preliminary_priority,
        reverse=True,
    )[:160]
    readmes: dict[int, str] = {}
    with ThreadPoolExecutor(max_workers=12) as executor:
        futures = {
            executor.submit(fetch_readme, row["repo_name"]): int(row["repo_id"])
            for row in readme_targets
        }
        for future in as_completed(futures):
            repo_id = futures[future]
            try:
                readmes[repo_id] = future.result()
            except Exception as exc:  # pragma: no cover - network-specific
                print(f"readme error {repo_id}: {exc}", file=sys.stderr)
                readmes[repo_id] = ""

    final_candidates: list[dict[str, Any]] = []
    for row in refreshed:
        repo_id = int(row["repo_id"])
        if repo_id in readmes:
            row["readme"] = readmes[repo_id]
        row.update(relevance_features(row))
        if not row["auto_relevant"]:
            continue
        row["preliminary_priority"] = round(preliminary_priority(row), 4)
        final_candidates.append(row)

    exact_targets = sorted(
        final_candidates,
        key=preliminary_priority,
        reverse=True,
    )[: args.exact_star_limit]
    exact_growth: dict[int, int | None] = {}
    if not args.skip_exact_star_growth:
        with ThreadPoolExecutor(max_workers=8) as executor:
            futures = {
                executor.submit(
                    exact_star_growth,
                    row["repo_name"],
                    int(row["stars_current"]),
                ): int(row["repo_id"])
                for row in exact_targets
            }
            for future in as_completed(futures):
                repo_id = futures[future]
                try:
                    exact_growth[repo_id] = future.result()
                except Exception as exc:  # pragma: no cover - network-specific
                    print(f"stargazer error {repo_id}: {exc}", file=sys.stderr)
                    exact_growth[repo_id] = None

    for row in final_candidates:
        growth = exact_growth.get(int(row["repo_id"]), "")
        row["stars_growth_exact"] = growth
        if growth not in (None, ""):
            base = max(int(row["stars_current"]) - int(growth), 0)
            row["stars_growth_pct"] = (
                round(100 * int(growth) / base, 1) if base > 0 else ""
            )
        else:
            row["stars_growth_pct"] = ""
        row["final_priority"] = round(final_priority(row), 4)
        row["github_snapshot_date"] = GITHUB_SNAPSHOT_DATE
        row["readme"] = ""

    final_candidates.sort(key=final_priority, reverse=True)

    fieldnames = [
        "repo_id",
        "repo_name",
        "suggested_layer",
        "description",
        "stars_current",
        "stars_growth_exact",
        "stars_growth_pct",
        "watch_events_visible",
        "watch_rank",
        "openrank_202604",
        "openrank_202605",
        "openrank_202606",
        "openrank_peak",
        "openrank_3m",
        "openrank_rank",
        "relevance_score",
        "agent_signal_count",
        "model_infra_signal_count",
        "model_signal_count",
        "topics",
        "language",
        "license",
        "created_at",
        "pushed_at",
        "forks_current",
        "open_issues_current",
        "github_search_queries",
        "repo_info_updated_at",
        "preliminary_priority",
        "final_priority",
        "github_snapshot_date",
        "html_url",
    ]
    write_csv(DATA_DIR / "candidate_pool.csv", final_candidates, fieldnames)

    star_growth_note = (
        "Exact star growth was checked from GitHub stargazer timestamps for a "
        "bounded high-signal subset."
        if exact_checked
        else "Exact recent star growth is unavailable: GitHub's public "
        "stargazer-list endpoint is now restricted. Visible WatchEvent counts "
        "are retained only as an incomplete discovery signal."
    )
    summary = {
        "generated_at": datetime.now().astimezone().isoformat(),
        "existing_landscape_repositories": len(existing_ids),
        "raw_candidate_ids": len(candidate_ids),
        "auto_relevant_before_github_refresh": len(candidate_records),
        "github_refreshed_candidates": len(refreshed),
        "final_candidate_pool": len(final_candidates),
        "exact_star_growth_checked": len(exact_growth),
        "date_windows": {
            "visible_watch_events": [STAR_START, STAR_END_EXCLUSIVE],
            "openrank": [OPENRANK_START, OPENRANK_END_EXCLUSIVE],
            "github_snapshot": GITHUB_SNAPSHOT_DATE,
        },
        "known_limitations": [
            "OpenDigger GitHub event and OpenRank coverage declines materially after April 2026.",
            "WatchEvent counts are discovery signals, not complete GitHub star growth.",
            star_growth_note,
            "Automated relevance screening still requires human review before landscape inclusion.",
        ],
    }
    (DATA_DIR / "scan_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"Candidate pool: {DATA_DIR / 'candidate_pool.csv'}")


if __name__ == "__main__":
    main()
