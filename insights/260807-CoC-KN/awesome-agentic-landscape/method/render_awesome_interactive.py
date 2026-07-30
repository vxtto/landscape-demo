#!/usr/bin/env python3
"""Build the checked-in Awesome × Agentic interactive artifact.

The editorial shortlist is the data source. The hand-tuned HTML, CSS, and
interaction source live in ``interactive/`` and are copied to the public
keynote route after the compact project-data bundle is regenerated.
"""

from __future__ import annotations

import csv
import json
import shutil
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
INTERACTIVE_DIR = ROOT / "interactive"
CSV_PATH = INTERACTIVE_DIR / "awesome_agentic_landscape_projects.csv"
PUBLIC_DIR = ROOT.parents[2] / "public" / "keynote" / "awesome"

HTML_NAME = "awesome_agentic_landscape_2026.html"
CSS_NAME = "awesome_interactive.css"
JS_NAME = "awesome_interactive.js"
DATA_NAME = "awesome_project_data.js"

INTEGER_FIELDS = {
    "editorial_rank",
    "repo_id",
    "stars_current",
    "watch_events_visible_3m",
    "participants_3m",
    "activity_months",
    "stage_order",
}
FLOAT_FIELDS = {
    "awesome_value_score",
    "openrank_202604",
    "openrank_202605",
    "openrank_202606",
    "openrank_3m",
}


def parse_value(field: str, value: str) -> object:
    if value == "":
        return None
    if field in INTEGER_FIELDS:
        return int(float(value))
    if field in FLOAT_FIELDS:
        return float(value)
    return value


def load_projects() -> dict[str, dict[str, object]]:
    with CSV_PATH.open(newline="", encoding="utf-8") as handle:
        rows = csv.DictReader(handle)
        return {
            row["repo_name"]: {
                field: parse_value(field, value)
                for field, value in row.items()
                if field not in {"repo_id", "repo_name", "html_url", "description"}
            }
            for row in rows
        }


def write_data_bundle(projects: dict[str, dict[str, object]]) -> None:
    payload = json.dumps(
        projects,
        ensure_ascii=False,
        separators=(",", ":"),
        sort_keys=True,
    )
    output = f"window.AWESOME_PROJECTS = {payload};\n"
    (INTERACTIVE_DIR / DATA_NAME).write_text(output, encoding="utf-8")


def sync_public_artifact() -> None:
    PUBLIC_DIR.mkdir(parents=True, exist_ok=True)
    for name in (HTML_NAME, CSS_NAME, JS_NAME, DATA_NAME):
        shutil.copyfile(INTERACTIVE_DIR / name, PUBLIC_DIR / name)


def main() -> None:
    projects = load_projects()
    write_data_bundle(projects)
    sync_public_artifact()
    print(f"Built Awesome interactive artifact with {len(projects)} projects")
    print(f"Public route source: {PUBLIC_DIR / HTML_NAME}")


if __name__ == "__main__":
    main()
