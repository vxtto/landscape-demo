#!/usr/bin/env python3
"""Audit recent and fast-rising projects missed by the original Top-N shortlist.

The original scan optimized for absolute WatchEvent, OpenRank, and GitHub-search
rank. This supplemental pass keeps those sources but creates a separate review
lane for repositories created in the last three months or showing sharp recent
attention/activity growth.

GitHub metadata fetched after the keynote cutoff is labelled as a post-cutoff
observation. It must not silently replace the 2026-07-28 talk snapshot.
"""

from __future__ import annotations

import csv
import json
import math
import os
import subprocess
import sys
from collections import defaultdict
from datetime import date
from pathlib import Path
from typing import Any

import clickhouse_connect
from dotenv import load_dotenv


REPO_ROOT = Path(__file__).resolve().parents[4]
DATA_DIR = REPO_ROOT / "insights" / "260807-CoC-KN" / "landscape-refresh" / "data"
MAIN_CSV = REPO_ROOT / "data" / "agentic-ai-projects.csv"
POOL_CSV = DATA_DIR / "candidate_pool.csv"
OUTPUT_CSV = DATA_DIR / "recent_velocity_candidates.csv"
OUTPUT_JSON = DATA_DIR / "recent_velocity_audit_summary.json"

CUTOFF = date(2026, 7, 28)
RECENT_START = date(2026, 4, 28)
OBSERVED_AT = date.today().isoformat()

SEARCH_QUERIES = [
    '"agentic" created:2026-04-28..2026-07-28 stars:>300',
    '"ai agent" created:2026-04-28..2026-07-28 stars:>300',
    '"coding agent" created:2026-04-28..2026-07-28 stars:>300',
    '"agent framework" created:2026-04-28..2026-07-28 stars:>200',
    '"agent memory" created:2026-04-28..2026-07-28 stars:>100',
    '"model context protocol" created:2026-04-28..2026-07-28 stars:>200',
    '"agent sandbox" created:2026-04-28..2026-07-28 stars:>100',
    '"computer use" agent created:2026-04-28..2026-07-28 stars:>200',
    '"llm gateway" created:2026-04-28..2026-07-28 stars:>100',
    '"model serving" created:2026-04-28..2026-07-28 stars:>200',
    '"llm inference" created:2026-04-28..2026-07-28 stars:>200',
    '"post-training" created:2026-04-28..2026-07-28 stars:>100',
]

INFRA_TERMS = {
    "agent",
    "agentic",
    "harness",
    "framework",
    "runtime",
    "orchestrat",
    "memory",
    "context",
    "mcp",
    "a2a",
    "sandbox",
    "microvm",
    "computer-use",
    "computer use",
    "gateway",
    "inference",
    "serving",
    "post-training",
    "reinforcement learning",
    "observability",
    "evaluation",
}

COLLECTION_TERMS = {
    "awesome",
    "course",
    "tutorial",
    "learning roadmap",
    "curated resources",
    "templates",
    "skill to",
}


def load_rows(path: Path) -> list[dict[str, str]]:
    with path.open(newline="", encoding="utf-8-sig") as handle:
        return list(csv.DictReader(handle))


def gh_search(query: str) -> list[dict[str, Any]]:
    command = [
        "gh",
        "api",
        "search/repositories",
        "-X",
        "GET",
        "-f",
        f"q={query}",
        "-f",
        "sort=stars",
        "-f",
        "order=desc",
        "-f",
        "per_page=100",
    ]
    command_env = os.environ.copy()
    for key in (
        "HTTP_PROXY",
        "HTTPS_PROXY",
        "ALL_PROXY",
        "http_proxy",
        "https_proxy",
        "all_proxy",
    ):
        command_env.pop(key, None)
    result = subprocess.run(
        command,
        capture_output=True,
        text=True,
        env=command_env,
    )
    if result.returncode:
        raise RuntimeError(result.stderr.strip() or f"gh api failed for {query}")
    return json.loads(result.stdout).get("items", [])


def query_clickhouse(
    repo_ids: list[int],
) -> tuple[dict[int, int], dict[int, dict[str, float]], str]:
    env_candidates = [
        REPO_ROOT / ".env",
        REPO_ROOT / "scripts" / ".env",
        REPO_ROOT.parent / "agentic-ai-landscape" / ".env",
        REPO_ROOT.parent / "agentic-ai-landscape" / "scripts" / ".env",
    ]
    for env_path in env_candidates:
        if env_path.exists():
            load_dotenv(env_path)
            break

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
    try:
        client = clickhouse_connect.get_client(
            host=host,
            port=8123,
            username=os.getenv("CLICKHOUSE_USER"),
            password=os.getenv("CLICKHOUSE_PASSWORD"),
        )
    except Exception as exc:  # Keep the dated local snapshot usable offline.
        status = f"unavailable: {type(exc).__name__} at {host or 'unset host'}"
        print(f"ClickHouse {status}; retaining candidate-pool metrics.", file=sys.stderr)
        return {}, {}, status
    watch: dict[int, int] = defaultdict(int)
    openrank: dict[int, dict[str, float]] = defaultdict(dict)
    for offset in range(0, len(repo_ids), 400):
        chunk = repo_ids[offset : offset + 400]
        ids = ",".join(str(repo_id) for repo_id in chunk)
        watch_rows = client.query(
            f"""
            SELECT repo_id, count()
            FROM opensource.events
            WHERE platform = 'GitHub'
              AND type = 'WatchEvent'
              AND created_at >= '2026-05-01'
              AND created_at < '2026-07-29'
              AND repo_id IN ({ids})
            GROUP BY repo_id
            """
        ).result_rows
        for repo_id, count in watch_rows:
            watch[int(repo_id)] = int(count)

        openrank_rows = client.query(
            f"""
            SELECT repo_id, toYYYYMM(created_at), round(openrank, 2)
            FROM opensource.global_openrank
            WHERE platform = 'GitHub'
              AND type = 'Repo'
              AND created_at >= '2026-04-01'
              AND created_at < '2026-07-01'
              AND repo_id IN ({ids})
            """
        ).result_rows
        for repo_id, month, value in openrank_rows:
            openrank[int(repo_id)][str(month)] = float(value)
    return dict(watch), dict(openrank), "available"


def as_float(value: Any) -> float:
    try:
        return float(value or 0)
    except (TypeError, ValueError):
        return 0.0


def relevance(record: dict[str, Any]) -> tuple[bool, bool]:
    text = " ".join(
        [
            str(record.get("repo_name") or record.get("full_name") or ""),
            str(record.get("description") or ""),
            str(record.get("topics") or ""),
        ]
    ).lower()
    is_infra = record.get("candidate_layer") in {
        "Agent Infra",
        "Model Infra",
        "Large Models",
    } or any(term in text for term in INFRA_TERMS)
    is_collection = any(term in text for term in COLLECTION_TERMS)
    return is_infra, is_collection


def priority(record: dict[str, Any]) -> float:
    stars = as_float(record.get("stars_observed"))
    watch = as_float(record.get("watch_events_visible"))
    apr = as_float(record.get("openrank_202604"))
    jun = as_float(record.get("openrank_202606"))
    created = record.get("created_at", "") >= RECENT_START.isoformat()
    return round(
        math.log10(stars + 1)
        + 1.8 * math.log10(watch + 1)
        + 1.2 * math.log10(max(jun - apr, 0) + 1)
        + (1.5 if created else 0),
        4,
    )


def main() -> None:
    main_rows = load_rows(MAIN_CSV)
    pool_rows = load_rows(POOL_CSV)
    known_ids = {int(row["repo_id"]) for row in main_rows if row.get("repo_id", "").isdigit()}
    known_names = {row["repo_name"].lower() for row in main_rows}

    records: dict[int, dict[str, Any]] = {}
    for row in pool_rows:
        repo_id = int(row["repo_id"])
        if repo_id in known_ids or row["repo_name"].lower() in known_names:
            continue
        records[repo_id] = {
            "repo_id": repo_id,
            "repo_name": row["repo_name"],
            "candidate_layer": row["suggested_layer"],
            "description": row["description"],
            "topics": row["topics"],
            "created_at": row["created_at"],
            "pushed_at": row["pushed_at"],
            "stars_observed": int(as_float(row["stars_current"])),
            "stars_observed_at": "2026-07-28",
            "watch_events_visible": int(as_float(row["watch_events_visible"])),
            "openrank_202604": as_float(row["openrank_202604"]),
            "openrank_202605": as_float(row["openrank_202605"]),
            "openrank_202606": as_float(row["openrank_202606"]),
            "language": row["language"],
            "license": row["license"],
            "sources": {"original_candidate_pool"},
        }

    search_matches = 0
    for query in SEARCH_QUERIES:
        for item in gh_search(query):
            repo_id = int(item["id"])
            name = item["full_name"]
            if repo_id in known_ids or name.lower() in known_names:
                continue
            search_matches += 1
            record = records.setdefault(
                repo_id,
                {
                    "repo_id": repo_id,
                    "repo_name": name,
                    "candidate_layer": "",
                    "description": item.get("description") or "",
                    "topics": ",".join(item.get("topics") or []),
                    "created_at": (item.get("created_at") or "")[:10],
                    "pushed_at": item.get("pushed_at") or "",
                    "stars_observed": int(item.get("stargazers_count") or 0),
                    "stars_observed_at": OBSERVED_AT,
                    "watch_events_visible": 0,
                    "openrank_202604": 0,
                    "openrank_202605": 0,
                    "openrank_202606": 0,
                    "language": item.get("language") or "",
                    "license": (item.get("license") or {}).get("spdx_id") or "",
                    "sources": set(),
                },
            )
            record["sources"].add("recent_created_github_search")

    watch, openrank, clickhouse_status = query_clickhouse(sorted(records))
    output: list[dict[str, Any]] = []
    for repo_id, record in records.items():
        record["watch_events_visible"] = max(
            int(record.get("watch_events_visible") or 0), watch.get(repo_id, 0)
        )
        months = openrank.get(repo_id, {})
        for month in ("202604", "202605", "202606"):
            key = f"openrank_{month}"
            record[key] = max(as_float(record.get(key)), months.get(month, 0))

        is_infra, is_collection = relevance(record)
        apr = as_float(record["openrank_202604"])
        jun = as_float(record["openrank_202606"])
        created_recently = record["created_at"] >= RECENT_START.isoformat()
        openrank_rising = jun >= 10 and (jun - apr >= 10 or jun >= max(apr, 1) * 1.5)
        attention_rising = record["watch_events_visible"] >= 300
        include = is_infra and (created_recently or openrank_rising or attention_rising)
        if not include:
            continue

        record["recent_created"] = created_recently
        record["openrank_rising"] = openrank_rising
        record["attention_rising"] = attention_rising
        record["collection_like"] = is_collection
        record["priority"] = priority(record)
        record["sources"] = ",".join(sorted(record["sources"]))
        output.append(record)

    output.sort(key=lambda row: row["priority"], reverse=True)
    fields = [
        "repo_id",
        "repo_name",
        "candidate_layer",
        "description",
        "topics",
        "created_at",
        "pushed_at",
        "stars_observed",
        "stars_observed_at",
        "watch_events_visible",
        "openrank_202604",
        "openrank_202605",
        "openrank_202606",
        "recent_created",
        "openrank_rising",
        "attention_rising",
        "collection_like",
        "language",
        "license",
        "sources",
        "priority",
    ]
    with OUTPUT_CSV.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(output)

    summary = {
        "generated_at": OBSERVED_AT,
        "talk_cutoff": CUTOFF.isoformat(),
        "recent_created_window": [RECENT_START.isoformat(), CUTOFF.isoformat()],
        "original_pool_rows_reconsidered": len(pool_rows),
        "github_search_matches_before_dedup": search_matches,
        "candidate_records_before_velocity_filter": len(records),
        "high_recall_velocity_rows": len(output),
        "clickhouse_status": clickhouse_status,
        "post_cutoff_rule": (
            "GitHub stars observed after 2026-07-28 are discovery-only and must "
            "not replace the keynote snapshot without an archived cutoff value."
        ),
    }
    OUTPUT_JSON.write_text(json.dumps(summary, ensure_ascii=False, indent=2))
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(OUTPUT_CSV)


if __name__ == "__main__":
    main()
