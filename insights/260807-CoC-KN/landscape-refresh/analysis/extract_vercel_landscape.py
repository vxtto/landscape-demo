#!/usr/bin/env python3
"""Extract the current landscape mapping embedded in the Vercel demo HTML."""

from __future__ import annotations

import argparse
import csv
import json
import re
from pathlib import Path


ROOT = Path(__file__).resolve().parents[4]
DEFAULT_HTML = Path("/tmp/landscape-demo.html")
DEFAULT_OUTPUT = (
    ROOT
    / "presentations"
    / "260807-CoC-KN"
    / "landscape-refresh"
    / "data"
    / "current_landscape_reference.csv"
)
SOURCE_URL = "https://landscape-demo-omega.vercel.app/"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser()
    parser.add_argument("--html", type=Path, default=DEFAULT_HTML)
    parser.add_argument("--output", type=Path, default=DEFAULT_OUTPUT)
    return parser.parse_args()


def extract_objects(html_text: str) -> list[dict[str, object]]:
    matches = re.findall(
        r'\{\\"id\\":\\".*?\\"stage\\":\\".*?\\",\\"zone\\":\\".*?\\"\}',
        html_text,
    )
    projects: list[dict[str, object]] = []
    for escaped_object in matches:
        json_text = bytes(escaped_object, "utf-8").decode("unicode_escape")
        projects.append(json.loads(json_text))
    return projects


def landscape_layer(stage: str) -> str:
    if stage in {"application", "framework", "runtime"}:
        return "Agent Infra"
    if stage == "model":
        return "Model Infra"
    raise ValueError(f"Unknown landscape stage: {stage}")


def repair_utf8_text(value: object) -> str:
    text = str(value)
    try:
        return text.encode("latin-1").decode("utf-8")
    except (UnicodeEncodeError, UnicodeDecodeError):
        return text


def main() -> None:
    args = parse_args()
    projects = extract_objects(args.html.read_text(encoding="utf-8"))
    if len(projects) != 122:
        raise ValueError(f"Expected 122 mapped projects, extracted {len(projects)}")

    rows = [
        {
            "repo_id": project["id"],
            "repo_name": repair_utf8_text(project["repo"]),
            "display_name": repair_utf8_text(project["name"]),
            "current_landscape_layer": landscape_layer(str(project["stage"])),
            "current_landscape_stage": project["stage"],
            "current_landscape_section": repair_utf8_text(project["zone"]),
            "current_openrank": project["openrank"],
            "source_url": SOURCE_URL,
        }
        for project in projects
    ]
    ids = [str(row["repo_id"]) for row in rows]
    names = [str(row["repo_name"]).lower() for row in rows]
    if len(ids) != len(set(ids)) or len(names) != len(set(names)):
        raise ValueError("Duplicate repository in current landscape reference")

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with args.output.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=list(rows[0]))
        writer.writeheader()
        writer.writerows(rows)

    layer_counts: dict[str, int] = {}
    section_counts: dict[str, int] = {}
    for row in rows:
        layer = str(row["current_landscape_layer"])
        section = f"{layer} / {row['current_landscape_section']}"
        layer_counts[layer] = layer_counts.get(layer, 0) + 1
        section_counts[section] = section_counts.get(section, 0) + 1
    print(f"output={args.output}")
    print(json.dumps(layer_counts, ensure_ascii=False, sort_keys=True))
    print(json.dumps(section_counts, ensure_ascii=False, sort_keys=True))


if __name__ == "__main__":
    main()
