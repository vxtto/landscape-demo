#!/usr/bin/env python3
"""Build the license distribution used by the CommunityOverCode keynote."""

from __future__ import annotations

import argparse
import csv
import json
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path


def percentage(count: int, total: int) -> float:
    return round(count / total * 100, 1) if total else 0.0


def distribution(rows: list[dict[str, str]]) -> list[dict[str, int | float | str]]:
    counts = Counter((row.get("license") or "NOASSERTION").strip() for row in rows)
    return [
        {
            "license": license_id,
            "projects": count,
            "share": percentage(count, len(rows)),
        }
        for license_id, count in sorted(
            counts.items(),
            key=lambda item: (-item[1], item[0]),
        )
    ]


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--source",
        type=Path,
        default=Path("data/agentic-ai-projects.csv"),
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(
            "insights/260807-CoC-KN/license-and-openness/data/"
            "license_distribution_2026-07-28.json"
        ),
    )
    args = parser.parse_args()

    with args.source.open(encoding="utf-8-sig", newline="") as source_file:
        all_rows = list(csv.DictReader(source_file))

    selected = [
        row
        for row in all_rows
        if row.get("landscape_action", "").strip().lower() in {"keep", "add"}
    ]
    repositories = [row["repo_name"].strip().lower() for row in selected]
    duplicate_repositories = sorted(
        repo for repo, count in Counter(repositories).items() if count > 1
    )
    if duplicate_repositories:
        raise ValueError(
            "Duplicate selected repositories: " + ", ".join(duplicate_repositories)
        )

    layers = {
        layer: [row for row in selected if row["landscape_layer"] == layer]
        for layer in ("Agent Infra", "Model Infra")
    }
    asserted = [
        row
        for row in selected
        if (row.get("license") or "").strip() not in {"", "NOASSERTION"}
    ]
    permissive = [
        row
        for row in selected
        if (row.get("license") or "").strip() in {"Apache-2.0", "MIT"}
    ]

    snapshot = {
        "generated_at": datetime.now(UTC).isoformat(),
        "source": str(args.source),
        "selection_rule": "landscape_action in {keep, add}",
        "snapshot_date": "2026-07-28",
        "projects": len(selected),
        "unique_repositories": len(set(repositories)),
        "identified_spdx": {
            "projects": len(asserted),
            "share": percentage(len(asserted), len(selected)),
        },
        "noassertion": {
            "projects": len(selected) - len(asserted),
            "share": percentage(len(selected) - len(asserted), len(selected)),
            "meaning": (
                "GitHub/SPDX did not provide a concluded SPDX identifier. "
                "This does not mean that the repository has no license."
            ),
        },
        "apache_or_mit": {
            "projects": len(permissive),
            "share_of_all_projects": percentage(len(permissive), len(selected)),
            "share_of_identified_spdx": percentage(len(permissive), len(asserted)),
        },
        "all_projects": distribution(selected),
        "layers": {
            layer: {
                "projects": len(rows),
                "distribution": distribution(rows),
            }
            for layer, rows in layers.items()
        },
        "data_quality": [
            "The value is GitHub repository metadata (license.spdx_id), not a legal review.",
            "NOASSERTION is retained as an unknown state and is not treated as unlicensed.",
            "A repository-level software license does not describe the license or availability of model weights, data, or other separately distributed artifacts.",
        ],
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
