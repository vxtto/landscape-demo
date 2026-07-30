#!/usr/bin/env python3
"""Discover high-signal awesome-like repositories for the agentic era.

The scan is intentionally candidate-first rather than exhaustive. It combines:

- targeted GitHub repository search and current repository metadata;
- visible GitHub WatchEvent counts from OpenDigger for 2026-05-01..2026-07-28;
- distinct issue/PR/review participants over the same event window;
- repository OpenRank for the latest three completed months currently usable
  for comparison: 2026-04, 2026-05, and 2026-06;
- README structure and semantic signals that indicate whether a collection can
  be consumed by a coding agent as instructions, skills, prompts, tools, or
  repeatable workflows.

OpenDigger's recent event and OpenRank partitions are coverage-sensitive.
WatchEvent counts are therefore discovery signals, not exact GitHub star
growth. The output keeps this distinction explicit.
"""

from __future__ import annotations

import argparse
import base64
import csv
import hashlib
import json
import math
import os
import re
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import requests
from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parents[3]
OUTPUT_DIR = ROOT / "outputs" / "awesome-agentic-landscape-260729"
DATA_DIR = OUTPUT_DIR / "data"
RAW_DIR = DATA_DIR / "raw"
ENV_PATH = ROOT / "scripts" / ".env"
CANDIDATE_POOL_PATH = (
    ROOT
    / "presentations"
    / "260807-CoC-KN"
    / "landscape-refresh"
    / "data"
    / "candidate_pool.csv"
)

GITHUB_SNAPSHOT_DATE = "2026-07-29"
EVENT_START = "2026-05-01"
EVENT_END_EXCLUSIVE = "2026-07-29"
OPENRANK_START = "2026-04-01"
OPENRANK_END_EXCLUSIVE = "2026-07-01"
OPENRANK_MONTHS = ("202604", "202605", "202606")
CLICKHOUSE_API = "https://mosn.io/api/insight/ck/getData"

SEARCH_QUERIES = [
    'awesome agent in:name,description,readme stars:>100 pushed:>=2026-04-01',
    'awesome coding-agent in:name,description,readme stars:>50 pushed:>=2026-04-01',
    'awesome claude-code in:name,description,readme stars:>50 pushed:>=2026-04-01',
    'awesome codex in:name,description,readme stars:>50 pushed:>=2026-04-01',
    '"agent skills" in:name,description,readme stars:>100 pushed:>=2026-04-01',
    'awesome mcp in:name,description,readme stars:>100 pushed:>=2026-04-01',
    'awesome prompts agent in:name,description,readme stars:>100 pushed:>=2026-04-01',
    'awesome ai-agents in:name,description,readme stars:>100 pushed:>=2026-04-01',
    'awesome "best practices" ai in:name,description,readme stars:>50 pushed:>=2026-04-01',
    '"system prompts" "coding agent" in:name,description,readme stars:>100 pushed:>=2026-04-01',
]

MANUAL_SEEDS = [
    "github/awesome-copilot",
    "hesreallyhim/awesome-claude-code",
    "composio-community/awesome-codex-skills",
    "sickn33/agentic-awesome-skills",
    "VoltAgent/awesome-agent-skills",
    "punkpeye/awesome-mcp-servers",
    "wong2/awesome-mcp-servers",
    "e2b-dev/awesome-ai-agents",
    "Shubhamsaboo/awesome-llm-apps",
    "openai/skills",
    "google/skills",
    "vercel-labs/skills",
    "anthropics/skills",
]

PARTICIPANT_EVENT_TYPES = (
    "IssuesEvent",
    "IssueCommentEvent",
    "PullRequestEvent",
    "PullRequestReviewEvent",
    "PullRequestReviewCommentEvent",
)

AGENT_TERMS = (
    "agent",
    "agentic",
    "coding agent",
    "ai agent",
    "claude code",
    "codex",
    "copilot",
    "computer use",
    "multi-agent",
)
CONSUMABLE_TERMS = (
    "skill",
    "skills",
    "instruction",
    "instructions",
    "prompt",
    "prompts",
    "subagent",
    "subagents",
    "hook",
    "hooks",
    "workflow",
    "workflows",
    "best practice",
    "playbook",
    "configuration",
    "configurations",
    "mcp",
    "model context protocol",
)
LEARNING_ONLY_TERMS = (
    "course",
    "books",
    "papers",
    "newsletter",
    "interview questions",
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--refresh-github",
        action="store_true",
        help="Refresh targeted GitHub search instead of using the cached response.",
    )
    parser.add_argument(
        "--readme-limit",
        type=int,
        default=36,
        help="Maximum number of high-signal README files to fetch.",
    )
    parser.add_argument(
        "--shortlist-limit",
        type=int,
        default=24,
        help="Maximum number of projects in the provisional human-review shortlist.",
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
    os.environ["NO_PROXY"] = ",".join(
        [
            "api.github.com",
            "github.com",
            "raw.githubusercontent.com",
            "mosn.io",
            "127.0.0.1",
            "localhost",
        ]
    )
    os.environ["no_proxy"] = os.environ["NO_PROXY"]


def github_headers() -> dict[str, str]:
    headers = {
        "Accept": "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "User-Agent": "agentic-ai-awesome-landscape",
    }
    token = os.getenv("GITHUB_TOKEN", "").strip() or os.getenv("GH_TOKEN", "").strip()
    if token:
        headers["Authorization"] = f"Bearer {token}"
    return headers


def github_get(
    url: str,
    *,
    params: dict[str, Any] | None = None,
    retries: int = 3,
) -> requests.Response:
    last_response: requests.Response | None = None
    for attempt in range(retries):
        response = requests.get(
            url,
            headers=github_headers(),
            params=params,
            timeout=35,
        )
        last_response = response
        if response.status_code in (200, 404, 422):
            return response
        if response.status_code in (403, 429, 500, 502, 503, 504):
            if attempt < retries - 1:
                time.sleep(2**attempt)
                continue
        response.raise_for_status()
    assert last_response is not None
    return last_response


def clickhouse_query(sql: str) -> list[dict[str, Any]]:
    session = requests.Session()
    session.trust_env = False
    query_fingerprint = hashlib.sha256(sql.encode("utf-8")).hexdigest()[:16]
    response = session.get(
        CLICKHOUSE_API,
        params={
            "sql": sql,
            "reqType": f"awesome-agentic-landscape-260729-{query_fingerprint}",
        },
        timeout=90,
    )
    response.raise_for_status()
    payload = response.json()
    if not payload.get("success"):
        raise RuntimeError(payload)
    return list(payload.get("data") or [])


def read_csv(path: Path) -> list[dict[str, str]]:
    if not path.exists():
        return []
    with path.open(newline="", encoding="utf-8") as handle:
        return list(csv.DictReader(handle))


def write_csv(path: Path, rows: list[dict[str, Any]], fieldnames: list[str]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(rows)


def search_github(refresh: bool) -> list[dict[str, Any]]:
    cache_path = RAW_DIR / "github_search_results.json"
    if cache_path.exists() and not refresh:
        return json.loads(cache_path.read_text(encoding="utf-8"))

    results: list[dict[str, Any]] = []
    for query_index, query in enumerate(SEARCH_QUERIES, 1):
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
        for item_index, item in enumerate(response.json().get("items") or [], 1):
            results.append(
                {
                    "query": query,
                    "query_index": query_index,
                    "item_index": item_index,
                    "item": item,
                }
            )
    cache_path.write_text(
        json.dumps(results, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )
    return results


def pool_seed_rows() -> dict[str, dict[str, Any]]:
    selected: dict[str, dict[str, Any]] = {}
    for row in read_csv(CANDIDATE_POOL_PATH):
        name = (row.get("repo_name") or "").strip()
        leaf = name.rsplit("/", 1)[-1].lower()
        text = " ".join(
            [
                name,
                row.get("description") or "",
                row.get("topics") or "",
            ]
        ).lower()
        is_collection = (
            "awesome" in leaf
            or leaf in {"skills", "prompts"}
            or leaf.endswith("-skills")
            or leaf.endswith("_skills")
        )
        agent_fit = any(term in text for term in AGENT_TERMS + CONSUMABLE_TERMS)
        if is_collection and agent_fit:
            selected[name.lower()] = dict(row)
    return selected


def normalized_search_item(item: dict[str, Any]) -> dict[str, Any]:
    return {
        "repo_id": int(item.get("id") or 0),
        "repo_name": item.get("full_name") or "",
        "description": item.get("description") or "",
        "stars_current": int(item.get("stargazers_count") or 0),
        "forks_current": int(item.get("forks_count") or 0),
        "open_issues_current": int(item.get("open_issues_count") or 0),
        "language": item.get("language") or "",
        "license": (item.get("license") or {}).get("spdx_id") or "",
        "created_at": (item.get("created_at") or "")[:10],
        "pushed_at": item.get("pushed_at") or "",
        "topics": ",".join(item.get("topics") or []),
        "archived": bool(item.get("archived")),
        "disabled": bool(item.get("disabled")),
        "is_fork": bool(item.get("fork")),
        "html_url": item.get("html_url") or "",
        "github_snapshot_date": GITHUB_SNAPSHOT_DATE,
    }


def fetch_repo_metadata(repo_name: str) -> dict[str, Any] | None:
    response = github_get(f"https://api.github.com/repos/{repo_name}")
    if response.status_code != 200:
        return None
    return normalized_search_item(response.json())


def fetch_readme(repo_name: str) -> str:
    response = github_get(f"https://api.github.com/repos/{repo_name}/readme")
    if response.status_code != 200:
        return ""
    payload = response.json()
    try:
        return base64.b64decode(payload.get("content", "")).decode(
            "utf-8",
            errors="replace",
        )[:100000]
    except (TypeError, ValueError):
        return ""


def sql_in(values: list[str]) -> str:
    return ",".join("'" + value.replace("'", "''") + "'" for value in values)


def query_metrics(records: list[dict[str, Any]]) -> dict[int, dict[str, Any]]:
    repo_ids = sorted(
        {
            int(float(record.get("repo_id") or 0))
            for record in records
            if int(float(record.get("repo_id") or 0)) > 0
        }
    )
    metrics: dict[int, dict[str, Any]] = {
        repo_id: {
            "watch_events_visible_3m": 0,
            "participants_3m": 0,
            "openrank_202604": 0.0,
            "openrank_202605": 0.0,
            "openrank_202606": 0.0,
            "openrank_3m": 0.0,
            "activity_months": 0,
        }
        for repo_id in repo_ids
    }
    participant_types = sql_in(list(PARTICIPANT_EVENT_TYPES))
    for start in range(0, len(repo_ids), 50):
        chunk = repo_ids[start : start + 50]
        ids_sql = ",".join(str(repo_id) for repo_id in chunk)
        event_rows = clickhouse_query(
            f"""
            SELECT
                repo_id,
                countIf(type = 'WatchEvent') AS watch_events_visible_3m,
                uniqExactIf(actor_id, type IN ({participant_types})) AS participants_3m,
                uniqExactIf(toYYYYMM(created_at), type IN ({participant_types})) AS activity_months
            FROM opensource.events
            WHERE platform = 'GitHub'
              AND repo_id IN ({ids_sql})
              AND created_at >= '{EVENT_START}'
              AND created_at < '{EVENT_END_EXCLUSIVE}'
            GROUP BY repo_id
            """
        )
        for row in event_rows:
            repo_id = int(row["repo_id"])
            if repo_id not in metrics:
                continue
            metrics[repo_id].update(
                {
                    "watch_events_visible_3m": int(
                        row.get("watch_events_visible_3m") or 0
                    ),
                    "participants_3m": int(row.get("participants_3m") or 0),
                    "activity_months": int(row.get("activity_months") or 0),
                }
            )

        openrank_rows = clickhouse_query(
            f"""
            SELECT
                repo_id,
                toYYYYMM(created_at) AS month,
                round(sum(openrank), 2) AS openrank
            FROM opensource.global_openrank
            WHERE platform = 'GitHub'
              AND type = 'Repo'
              AND repo_id IN ({ids_sql})
              AND created_at >= '{OPENRANK_START}'
              AND created_at < '{OPENRANK_END_EXCLUSIVE}'
            GROUP BY repo_id, month
            ORDER BY repo_id, month
            """
        )
        for row in openrank_rows:
            repo_id = int(row["repo_id"])
            month = str(row["month"])
            if repo_id not in metrics or month not in OPENRANK_MONTHS:
                continue
            metrics[repo_id][f"openrank_{month}"] = float(row.get("openrank") or 0)

    for values in metrics.values():
        values["openrank_3m"] = round(
            sum(float(values[f"openrank_{month}"]) for month in OPENRANK_MONTHS),
            2,
        )
    return metrics


def keyword_hits(text: str, terms: tuple[str, ...]) -> list[str]:
    lowered = text.lower()
    return sorted({term for term in terms if term in lowered})


def collection_form(repo_name: str, text: str) -> str:
    leaf = repo_name.rsplit("/", 1)[-1].lower()
    if "awesome" in leaf:
        return "classic_awesome"
    if leaf == "skills" or leaf.endswith("-skills") or leaf.endswith("_skills"):
        return "skill_catalog"
    if "prompt" in leaf or "instruction" in text.lower():
        return "prompt_or_instruction_archive"
    return "awesome_like_collection"


def theme(text: str) -> str:
    lowered = text.lower()
    if any(term in lowered for term in ("claude code", "codex", "copilot", "coding agent")):
        return "coding_agent_practice"
    if "mcp" in lowered or "model context protocol" in lowered:
        return "mcp_and_tools"
    if "skill" in lowered:
        return "agent_skills"
    if "prompt" in lowered or "instruction" in lowered:
        return "prompts_and_instructions"
    if "agent" in lowered:
        return "agent_projects_and_architecture"
    return "adjacent_ai_collection"


def readme_features(readme: str) -> dict[str, Any]:
    headings = len(re.findall(r"(?m)^#{1,4}\s+", readme))
    markdown_links = len(re.findall(r"\[[^\]]+\]\([^)]+\)", readme))
    github_links = len(set(re.findall(r"https?://github\.com/[^)\s#]+", readme)))
    resource_files = len(
        re.findall(
            r"(?i)(?:SKILL\.md|AGENTS\.md|CLAUDE\.md|\.mdc|\.prompt\.md|commands?/)",
            readme,
        )
    )
    lowered = readme.lower()
    return {
        "readme_headings": headings,
        "readme_markdown_links": markdown_links,
        "readme_github_links": github_links,
        "readme_agent_file_mentions": resource_files,
        "has_contributing_signal": int(
            "contributing" in lowered
            or "contribution guide" in lowered
            or "submit a pr" in lowered
        ),
        "has_taxonomy_signal": int(
            any(term in lowered for term in ("table of contents", "categories", "contents"))
        ),
    }


def scaled_log(value: float, cap: float) -> float:
    return min(math.log1p(max(value, 0)) / math.log1p(cap), 1.0)


def days_since_push(pushed_at: str) -> int:
    if not pushed_at:
        return 9999
    pushed = datetime.fromisoformat(pushed_at.replace("Z", "+00:00"))
    snapshot = datetime(2026, 7, 29, tzinfo=timezone.utc)
    return max((snapshot - pushed).days, 0)


def score_record(record: dict[str, Any]) -> dict[str, Any]:
    text = " ".join(
        [
            record.get("repo_name") or "",
            record.get("description") or "",
            record.get("topics") or "",
            record.get("readme") or "",
        ]
    )
    agent_hits = keyword_hits(text, AGENT_TERMS)
    consumable_hits = keyword_hits(text, CONSUMABLE_TERMS)
    learning_hits = keyword_hits(text, LEARNING_ONLY_TERMS)
    form = collection_form(record["repo_name"], text)
    days = days_since_push(record.get("pushed_at") or "")

    semantic_fit = min(
        18.0
        + 2.0 * len(agent_hits)
        + 2.5 * len(consumable_hits)
        + (5.0 if form in {"classic_awesome", "skill_catalog"} else 0.0)
        - 3.0 * len(learning_hits),
        30.0,
    )
    traction = (
        10.0 * scaled_log(float(record.get("stars_current") or 0), 100000)
        + 10.0
        * scaled_log(float(record.get("watch_events_visible_3m") or 0), 1500)
    )
    collaboration = (
        9.0 * scaled_log(float(record.get("participants_3m") or 0), 150)
        + 7.0 * scaled_log(float(record.get("openrank_3m") or 0), 180)
    )
    freshness = 10.0 if days <= 14 else 8.0 if days <= 30 else 5.0 if days <= 90 else 1.0
    curation = min(
        14.0,
        2.5 * scaled_log(float(record.get("readme_markdown_links") or 0), 300)
        + 2.5 * scaled_log(float(record.get("readme_github_links") or 0), 200)
        + 2.0 * scaled_log(float(record.get("readme_headings") or 0), 40)
        + 2.0 * int(record.get("has_contributing_signal") or 0)
        + 2.0 * int(record.get("has_taxonomy_signal") or 0)
        + 3.0
        * scaled_log(float(record.get("readme_agent_file_mentions") or 0), 20),
    )
    total = round(semantic_fit + traction + collaboration + freshness + curation, 2)

    evidence_components = sum(
        [
            int(float(record.get("stars_current") or 0) > 0),
            int(float(record.get("watch_events_visible_3m") or 0) > 0),
            int(float(record.get("participants_3m") or 0) > 0),
            int(float(record.get("openrank_3m") or 0) > 0),
            int(bool(record.get("readme"))),
        ]
    )
    evidence_grade = "A" if evidence_components >= 5 else "B" if evidence_components >= 3 else "C"

    if semantic_fit < 20 or days > 180:
        recommendation = "exclude_or_watch"
    elif total >= 63 and evidence_grade in {"A", "B"}:
        recommendation = "core_candidate"
    elif total >= 52:
        recommendation = "watch_candidate"
    else:
        recommendation = "exclude_or_watch"

    return {
        "collection_form": form,
        "theme": theme(text),
        "agent_hits": ",".join(agent_hits),
        "consumable_hits": ",".join(consumable_hits),
        "learning_only_hits": ",".join(learning_hits),
        "semantic_fit_score": round(semantic_fit, 2),
        "traction_score": round(traction, 2),
        "collaboration_score": round(collaboration, 2),
        "freshness_score": round(freshness, 2),
        "curation_score": round(curation, 2),
        "awesome_value_score": total,
        "evidence_grade": evidence_grade,
        "recommendation": recommendation,
        "days_since_push": days,
    }


def merge_candidates(search_rows: list[dict[str, Any]]) -> dict[str, dict[str, Any]]:
    candidates = pool_seed_rows()
    query_hits: dict[str, list[str]] = {}
    for result in search_rows:
        item = result["item"]
        normalized = normalized_search_item(item)
        name = normalized["repo_name"]
        key = name.lower()
        query_hits.setdefault(key, []).append(result["query"])
        existing = candidates.get(key, {})
        existing.update(normalized)
        candidates[key] = existing

    for repo_name in MANUAL_SEEDS:
        candidates.setdefault(repo_name.lower(), {"repo_name": repo_name})

    for key, record in candidates.items():
        record["github_search_queries"] = " || ".join(sorted(set(query_hits.get(key, []))))
        record.setdefault("github_snapshot_date", "2026-07-28")
    return candidates


def provisional_priority(record: dict[str, Any]) -> float:
    text = " ".join(
        [
            record.get("repo_name") or "",
            record.get("description") or "",
            record.get("topics") or "",
        ]
    ).lower()
    semantic = sum(term in text for term in AGENT_TERMS + CONSUMABLE_TERMS)
    return (
        4.0 * scaled_log(float(record.get("stars_current") or 0), 100000)
        + 2.0 * scaled_log(float(record.get("watch_events_visible") or 0), 1000)
        + 0.5 * semantic
    )


def main() -> None:
    args = parse_args()
    load_dotenv(ENV_PATH)
    direct_network_setup()
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    search_rows = search_github(args.refresh_github)
    candidates = merge_candidates(search_rows)
    previous_rows = {
        row["repo_name"].lower(): row
        for row in read_csv(DATA_DIR / "awesome_agentic_candidates.csv")
        if row.get("repo_name")
    }

    # Search results already carry fresh metadata. Refresh only manual seeds or
    # cached pool candidates that were not returned by today's targeted search.
    for key, record in list(candidates.items()):
        if (
            record.get("github_snapshot_date") == GITHUB_SNAPSHOT_DATE
            and record.get("repo_id")
        ):
            continue
        metadata = fetch_repo_metadata(record.get("repo_name") or key)
        if metadata:
            record.update(metadata)

    active_records = [
        record
        for record in candidates.values()
        if record.get("repo_name")
        and not bool(record.get("archived"))
        and not bool(record.get("disabled"))
        and not bool(record.get("is_fork"))
        and int(float(record.get("stars_current") or 0)) >= 50
    ]

    metric_map = query_metrics(active_records)
    for record in active_records:
        repo_id = int(float(record.get("repo_id") or 0))
        record.update(metric_map.get(repo_id, {}))

    readme_targets = sorted(
        active_records,
        key=provisional_priority,
        reverse=True,
    )[: args.readme_limit]
    for record in readme_targets:
        readme = fetch_readme(record["repo_name"])
        record["readme"] = readme
        record.update(readme_features(readme))
    for record in active_records:
        previous = previous_rows.get(record["repo_name"].lower(), {})
        record.setdefault("readme", "")
        for key, value in readme_features("").items():
            record.setdefault(key, previous.get(key, value))
        record.update(score_record(record))

    active_records.sort(
        key=lambda row: (
            float(row.get("awesome_value_score") or 0),
            int(float(row.get("participants_3m") or 0)),
            int(float(row.get("stars_current") or 0)),
        ),
        reverse=True,
    )
    for rank, record in enumerate(active_records, 1):
        record["rank"] = rank

    fieldnames = [
        "rank",
        "repo_id",
        "repo_name",
        "html_url",
        "description",
        "collection_form",
        "theme",
        "awesome_value_score",
        "recommendation",
        "evidence_grade",
        "stars_current",
        "watch_events_visible_3m",
        "participants_3m",
        "activity_months",
        "openrank_202604",
        "openrank_202605",
        "openrank_202606",
        "openrank_3m",
        "pushed_at",
        "days_since_push",
        "created_at",
        "forks_current",
        "open_issues_current",
        "language",
        "license",
        "topics",
        "semantic_fit_score",
        "traction_score",
        "collaboration_score",
        "freshness_score",
        "curation_score",
        "readme_headings",
        "readme_markdown_links",
        "readme_github_links",
        "readme_agent_file_mentions",
        "has_contributing_signal",
        "has_taxonomy_signal",
        "agent_hits",
        "consumable_hits",
        "learning_only_hits",
        "github_search_queries",
        "github_snapshot_date",
    ]
    write_csv(DATA_DIR / "awesome_agentic_candidates.csv", active_records, fieldnames)

    shortlist = [
        row
        for row in active_records
        if row["recommendation"] in {"core_candidate", "watch_candidate"}
    ][: args.shortlist_limit]
    write_csv(DATA_DIR / "provisional_shortlist.csv", shortlist, fieldnames)

    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "github_snapshot_date": GITHUB_SNAPSHOT_DATE,
        "event_window": [EVENT_START, EVENT_END_EXCLUSIVE],
        "openrank_window": [OPENRANK_START, OPENRANK_END_EXCLUSIVE],
        "search_queries": SEARCH_QUERIES,
        "candidate_count": len(active_records),
        "shortlist_count": len(shortlist),
        "recommendation_counts": {
            label: sum(row["recommendation"] == label for row in active_records)
            for label in ("core_candidate", "watch_candidate", "exclude_or_watch")
        },
        "quality_notes": [
            "WatchEvent counts are visible OpenDigger events, not exact GitHub star growth.",
            "2026 OpenRank is coverage- and backfill-sensitive; the scan uses it as a ranking signal only.",
            "Distinct participants count issue, PR, comment, and review actors in the event window.",
            "README-derived curation features are heuristics and require editorial review.",
        ],
    }
    (DATA_DIR / "scan_summary.json").write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print()
    for row in shortlist:
        print(
            f"{row['rank']:>2}. {row['repo_name']:<52} "
            f"score={row['awesome_value_score']:>5} "
            f"stars={int(float(row.get('stars_current') or 0)):>7} "
            f"watch={int(float(row.get('watch_events_visible_3m') or 0)):>5} "
            f"participants={int(float(row.get('participants_3m') or 0)):>4} "
            f"openrank={float(row.get('openrank_3m') or 0):>7.2f}"
        )


if __name__ == "__main__":
    main()
