#!/usr/bin/env python3
"""Build a dated license snapshot for popular text-generation model repos."""

from __future__ import annotations

import argparse
import json
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen


SNAPSHOT_DATE = "2026-07-31"
API_ENDPOINT = "https://huggingface.co/api/models"
API_PARAMS = {
    "pipeline_tag": "text-generation",
    "sort": "downloads",
    "direction": "-1",
    "limit": "100",
    "full": "true",
}


def model_license(model: dict[str, object]) -> str:
    for tag in model.get("tags") or []:
        if isinstance(tag, str) and tag.startswith("license:"):
            return tag.split(":", 1)[1]
    return "UNSPECIFIED"


def percentage(count: int, total: int) -> float:
    return round(count / total * 100, 1) if total else 0.0


def load_models(input_path: Path | None) -> list[dict[str, object]]:
    if input_path:
        return json.loads(input_path.read_text(encoding="utf-8"))

    url = f"{API_ENDPOINT}?{urlencode(API_PARAMS)}"
    request = Request(
        url,
        headers={"User-Agent": "agentic-ai-landscape-license-research/1.0"},
    )
    with urlopen(request, timeout=30) as response:
        return json.load(response)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--input",
        type=Path,
        help="Optional saved response from the Hugging Face models API.",
    )
    parser.add_argument(
        "--output",
        type=Path,
        default=Path(
            "insights/260807-CoC-KN/license-and-openness/data/"
            f"hf_top100_text_generation_licenses_{SNAPSHOT_DATE}.json"
        ),
    )
    args = parser.parse_args()

    models = load_models(args.input)
    if len(models) != 100:
        raise ValueError(f"Expected 100 model repositories, got {len(models)}")

    counts = Counter(model_license(model) for model in models)
    distribution = [
        {
            "license": license_id,
            "repositories": count,
            "share": percentage(count, len(models)),
        }
        for license_id, count in sorted(
            counts.items(),
            key=lambda item: (-item[1], item[0]),
        )
    ]
    permissive_count = counts["apache-2.0"] + counts["mit"]
    custom_count = sum(
        count
        for license_id, count in counts.items()
        if license_id not in {"apache-2.0", "mit", "UNSPECIFIED"}
    )

    snapshot = {
        "generated_at": datetime.now(UTC).isoformat(),
        "snapshot_date": SNAPSHOT_DATE,
        "source": API_ENDPOINT,
        "query": API_PARAMS,
        "scope": (
            "Top 100 Hugging Face repositories tagged text-generation, "
            "ranked by the Hub downloads field at collection time."
        ),
        "repositories": len(models),
        "distribution": distribution,
        "groups": [
            {
                "group": "Apache-2.0 or MIT",
                "repositories": permissive_count,
                "share": percentage(permissive_count, len(models)),
            },
            {
                "group": "Model-specific or other terms",
                "repositories": custom_count,
                "share": percentage(custom_count, len(models)),
            },
            {
                "group": "No license tag",
                "repositories": counts["UNSPECIFIED"],
                "share": percentage(counts["UNSPECIFIED"], len(models)),
            },
        ],
        "records": [
            {
                "id": model.get("id"),
                "downloads": model.get("downloads"),
                "license": model_license(model),
            }
            for model in models
        ],
        "data_quality": [
            "The unit is a model repository, not a unique base-model family.",
            "Fine-tunes, quantizations, test artifacts, and duplicate families may appear.",
            "License values come from model-card metadata tags and are not a legal review.",
            "A license tag does not prove that training data, code, or other modification materials were released.",
        ],
    }

    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(
        json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )


if __name__ == "__main__":
    main()
