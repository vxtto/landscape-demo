#!/usr/bin/env python3
"""Build a monthly open-weight versus closed-weight model comparison table."""

from __future__ import annotations

import csv
import json
import os
import re
from datetime import UTC, date, datetime, timedelta
from pathlib import Path
from typing import Any

from dotenv import load_dotenv

import build_open_weight_model_table as base


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
TOP50_PATH = DATA_DIR / "monthly_models_top50_open_closed.csv"
ALL_PATH = DATA_DIR / "monthly_models_all_candidates.csv"
QUALITY_PATH = DATA_DIR / "monthly_data_quality_checks.csv"
SOURCE_PATH = DATA_DIR / "monthly_source_summary.json"

USAGE_WEIGHTS = {
    "openrouter_monthly_score": 0.50,
    "zenmux_monthly_score": 0.50,
}
HF_ADOPTION_WEIGHTS = {
    "hf_downloads_30d_score": 0.75,
    "hf_likes_score": 0.25,
}


def previous_complete_month(today: date) -> tuple[date, date]:
    first_this_month = today.replace(day=1)
    end = first_this_month - timedelta(days=1)
    return end.replace(day=1), end


def load_keys() -> tuple[str, str, str]:
    repo_root = Path(__file__).resolve().parents[4]
    load_dotenv(repo_root / ".env")
    load_dotenv(repo_root / "scripts" / ".env", override=False)
    openrouter_key = (
        os.getenv("OPENROUTER_API_KEY")
        or os.getenv("OPENROUTER_MANAGEMENT_API_KEY")
        or os.getenv("OpenRouter_MANAGEMENT_KEY")
        or ""
    ).strip()
    zenmux_key = (
        os.getenv("ZENMUX_MANAGEMENT_API_KEY")
        or os.getenv("ZenMux_MANAGEMENT_KEY")
        or ""
    ).strip()
    hf_token = (os.getenv("HF_TOKEN") or "").strip()
    if not openrouter_key:
        raise base.SourceError("OpenRouter API key is required for monthly data")
    if not zenmux_key:
        raise base.SourceError("ZenMux Management API key is required for monthly data")
    return openrouter_key, zenmux_key, hf_token


def fetch_openrouter_month(
    api_key: str,
    start: date,
    end: date,
) -> tuple[dict[str, dict[str, Any]], dict[str, Any], dict[str, Any]]:
    payload = base.request_json(
        base.OPENROUTER_DAILY_URL,
        params={"start_date": start.isoformat(), "end_date": end.isoformat()},
        headers={"Authorization": f"Bearer {api_key}"},
    )
    rows = payload.get("data")
    if not isinstance(rows, list):
        raise base.SourceError("OpenRouter monthly dataset has no data array")

    usage: dict[str, dict[str, Any]] = {}
    other_tokens = 0
    observed_tokens = 0
    dates: set[str] = set()
    for row in rows:
        row_date = str(row.get("date") or "")
        if row_date:
            dates.add(row_date)
        slug = str(row.get("model_permaslug") or "")
        tokens = base.as_int(row.get("total_tokens")) or 0
        if slug == "other":
            other_tokens += tokens
            continue
        if not slug:
            continue
        record = usage.setdefault(
            slug,
            {
                "tokens": 0,
                "active_days": 0,
                "daily_top50_appearances": 0,
            },
        )
        record["tokens"] += tokens
        record["active_days"] += int(tokens > 0)
        record["daily_top50_appearances"] += 1
        observed_tokens += tokens

    ranked = sorted(
        usage.items(),
        key=lambda item: item[1]["tokens"],
        reverse=True,
    )
    for rank, (_, values) in enumerate(ranked, start=1):
        values["rank"] = rank

    total_tokens = observed_tokens + other_tokens
    summary = {
        "status": "complete",
        "source_url": base.OPENROUTER_DAILY_URL,
        "window_start": start.isoformat(),
        "window_end": end.isoformat(),
        "days_returned": len(dates),
        "individual_model_rows": len(usage),
        "metric": "sum of daily prompt + completion tokens",
        "top50_observed_tokens": observed_tokens,
        "other_tokens": other_tokens,
        "top50_traffic_coverage": (
            round(observed_tokens / total_tokens, 6) if total_tokens else None
        ),
        "caveat": (
            "Each day exposes only the public Top 50 models plus an aggregated "
            "other row. The monthly candidate universe is the union of daily "
            "Top 50 models; models always below the daily cutoff are censored."
        ),
    }
    return usage, summary, payload


def fetch_zenmux_month(
    management_key: str,
    start: date,
    end: date,
) -> tuple[dict[str, dict[str, Any]], dict[str, Any], dict[str, Any]]:
    payload = base.request_json(
        base.ZENMUX_LEADERBOARD_URL,
        params={
            "metric": "tokens",
            "starting_at": start.isoformat(),
            "ending_at": end.isoformat(),
            "limit": 50,
        },
        headers={"Authorization": f"Bearer {management_key}"},
    )
    if not payload.get("success"):
        raise base.SourceError(
            f"ZenMux monthly leaderboard failed: {payload.get('message')}"
        )
    data = payload.get("data") or {}
    entries = data.get("entries") or []
    usage: dict[str, dict[str, Any]] = {}
    other_tokens = 0
    for entry in entries:
        slug = str(entry.get("model") or "")
        tokens = base.as_int(entry.get("value")) or 0
        if slug == "__others__":
            other_tokens = tokens
            continue
        if not slug:
            continue
        usage[slug] = {
            "tokens": tokens,
            "rank": base.as_int(entry.get("rank")),
            "label": entry.get("label") or "",
            "author": entry.get("author") or "",
            "author_label": entry.get("author_label") or "",
        }
    observed_tokens = sum(values["tokens"] for values in usage.values())
    total_tokens = observed_tokens + other_tokens
    summary = {
        "status": "complete",
        "source_url": base.ZENMUX_LEADERBOARD_URL,
        "window_start": data.get("starting_at") or start.isoformat(),
        "window_end": data.get("ending_at") or end.isoformat(),
        "individual_model_rows": len(usage),
        "metric": "monthly prompt + completion tokens",
        "top50_observed_tokens": observed_tokens,
        "other_tokens": other_tokens,
        "top50_traffic_coverage": (
            round(observed_tokens / total_tokens, 6) if total_tokens else None
        ),
        "caveat": (
            "Only the monthly Top 50 models are individually visible. Models "
            "outside the cutoff are combined into __others__."
        ),
    }
    return usage, summary, payload


def lookup_usage(
    model: dict[str, Any],
    usage: dict[str, dict[str, Any]],
) -> dict[str, Any]:
    by_key = {base.model_key(slug): values for slug, values in usage.items()}
    return (
        usage.get(str(model.get("canonical_slug") or ""))
        or usage.get(str(model.get("id") or ""))
        or by_key.get(base.model_key(str(model.get("canonical_slug") or "")))
        or by_key.get(base.model_key(str(model.get("id") or "")))
        or {}
    )


def find_openrouter_model_for_zenmux(
    entry: dict[str, Any],
    catalog: list[dict[str, Any]],
) -> tuple[dict[str, Any] | None, str, float]:
    zen_slug = str(entry.get("model") or "")
    zen_key = base.model_key(zen_slug)
    for model in catalog:
        if zen_key in {
            base.model_key(str(model.get("id") or "")),
            base.model_key(str(model.get("canonical_slug") or "")),
        }:
            return model, "exact_slug", 1.0

    zen_vendor = base.vendor_key(
        str(entry.get("author") or zen_slug.split("/", 1)[0])
    )
    zen_name = str(entry.get("label") or zen_slug)
    best_score = 0.0
    best_model: dict[str, Any] | None = None
    for model in catalog:
        model_vendor = base.vendor_key(
            str(model.get("id") or "").split("/", 1)[0]
        )
        if model_vendor != zen_vendor:
            continue
        score = base.SequenceMatcher(
            None,
            base.model_key(zen_name),
            base.model_key(base.display_model_name(model)),
        ).ratio()
        if score > best_score:
            best_score = score
            best_model = model
    if best_model is not None and best_score >= 0.84:
        return best_model, "fuzzy_same_vendor", round(best_score, 3)
    return None, "unmatched", round(best_score, 3)


def candidate_key(model: dict[str, Any], hf_id: str) -> str:
    if hf_id:
        return f"hf:{hf_id.lower()}"
    return "model:" + base.model_key(
        str(model.get("canonical_slug") or model.get("id") or "")
    )


def make_skeleton(
    model: dict[str, Any],
    or_usage: dict[str, Any],
    zen_id: str,
    zen_match_method: str,
    zen_match_confidence: float,
    zen_usage: dict[str, Any],
) -> dict[str, Any]:
    model_id = str(model.get("id") or "")
    canonical_slug = str(model.get("canonical_slug") or model_id)
    return {
        "_model": model,
        "_hf_id": base.resolved_hf_id(model),
        "model_name": base.display_model_name(model),
        "vendor": base.vendor_name(model),
        "vendor_slug": model_id.split("/", 1)[0],
        "openrouter_model_id": model_id,
        "openrouter_canonical_slug": canonical_slug,
        "zenmux_model_id": zen_id,
        "zenmux_match_method": zen_match_method,
        "zenmux_match_confidence": zen_match_confidence,
        "openrouter_monthly_tokens": base.as_int(or_usage.get("tokens")) or 0,
        "openrouter_monthly_rank": base.as_int(or_usage.get("rank")) or "",
        "openrouter_daily_top50_appearances": (
            base.as_int(or_usage.get("daily_top50_appearances")) or 0
        ),
        "zenmux_monthly_tokens": base.as_int(zen_usage.get("tokens")) or 0,
        "zenmux_monthly_rank": base.as_int(zen_usage.get("rank")) or "",
    }


def merge_skeleton(
    existing: dict[str, Any],
    current: dict[str, Any],
) -> dict[str, Any]:
    preferred, secondary = existing, current
    if (
        "(free)" in str(existing["model_name"]).lower()
        and "(free)" not in str(current["model_name"]).lower()
    ):
        preferred, secondary = current, existing
    for field in (
        "openrouter_monthly_tokens",
        "openrouter_daily_top50_appearances",
        "zenmux_monthly_tokens",
    ):
        preferred[field] = max(
            base.as_int(preferred.get(field)) or 0,
            base.as_int(secondary.get(field)) or 0,
        )
    for field in ("openrouter_monthly_rank", "zenmux_monthly_rank"):
        values = [
            base.as_int(preferred.get(field)),
            base.as_int(secondary.get(field)),
        ]
        values = [value for value in values if value]
        preferred[field] = min(values) if values else ""
    if not preferred.get("zenmux_model_id") and secondary.get("zenmux_model_id"):
        for field in (
            "zenmux_model_id",
            "zenmux_match_method",
            "zenmux_match_confidence",
        ):
            preferred[field] = secondary.get(field) or ""
    return preferred


def build_skeletons(
    openrouter_catalog: list[dict[str, Any]],
    openrouter_usage: dict[str, dict[str, Any]],
    zenmux_catalog: list[dict[str, Any]],
    zenmux_usage: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    zen_by_key = {
        base.model_key(slug): values for slug, values in zenmux_usage.items()
    }
    merged: dict[str, dict[str, Any]] = {}
    used_openrouter_usage: set[str] = set()
    used_zenmux_usage: set[str] = set()

    for model in openrouter_catalog:
        or_usage = lookup_usage(model, openrouter_usage)
        zen_id, zen_method, zen_confidence = base.match_zenmux_model(
            model,
            zenmux_catalog,
        )
        zen_usage = (
            zenmux_usage.get(zen_id)
            or zen_by_key.get(base.model_key(zen_id))
            or {}
        )
        if not or_usage and not zen_usage:
            continue
        hf_id = base.resolved_hf_id(model)
        key = candidate_key(model, hf_id)
        row = make_skeleton(
            model,
            or_usage,
            zen_id,
            zen_method,
            zen_confidence,
            zen_usage,
        )
        merged[key] = merge_skeleton(merged[key], row) if key in merged else row
        if or_usage:
            used_openrouter_usage.add(
                base.model_key(str(model.get("canonical_slug") or ""))
            )
            used_openrouter_usage.add(base.model_key(str(model.get("id") or "")))
        if zen_usage and zen_id:
            used_zenmux_usage.add(base.model_key(zen_id))

    for slug, or_usage in openrouter_usage.items():
        if base.model_key(slug) in used_openrouter_usage:
            continue
        model = {
            "id": re.sub(r"-20\d{6}$", "", slug),
            "canonical_slug": slug,
            "name": slug.split("/", 1)[-1],
            "description": "",
            "architecture": {},
            "pricing": {},
            "top_provider": {},
            "supported_parameters": [],
        }
        key = candidate_key(model, "")
        row = make_skeleton(model, or_usage, "", "unmatched", 0.0, {})
        merged[key] = merge_skeleton(merged[key], row) if key in merged else row

    for slug, zen_usage in zenmux_usage.items():
        if base.model_key(slug) in used_zenmux_usage:
            continue
        entry = {
            "model": slug,
            "label": zen_usage.get("label") or slug.split("/", 1)[-1],
            "author": zen_usage.get("author") or slug.split("/", 1)[0],
        }
        model, method, confidence = find_openrouter_model_for_zenmux(
            entry,
            openrouter_catalog,
        )
        if model is None:
            model = {
                "id": slug,
                "canonical_slug": slug,
                "name": (
                    f"{zen_usage.get('author_label')}: {zen_usage.get('label')}"
                    if zen_usage.get("author_label")
                    else zen_usage.get("label") or slug
                ),
                "description": "",
                "architecture": {},
                "pricing": {},
                "top_provider": {},
                "supported_parameters": [],
            }
        hf_id = base.resolved_hf_id(model)
        key = candidate_key(model, hf_id)
        row = make_skeleton(
            model,
            {},
            slug,
            method,
            confidence,
            zen_usage,
        )
        merged[key] = merge_skeleton(merged[key], row) if key in merged else row

    return list(merged.values())


def classify_weight_access(
    model: dict[str, Any],
    hf_id: str,
    hf: dict[str, Any],
) -> tuple[str, bool | str, bool | str, str, str]:
    if hf_id and hf.get("id") and not hf.get("private") and not hf.get("_error"):
        license_name = base.extract_license(hf)
        license_group = base.license_class(license_name)
        return (
            "Open weights",
            True,
            False,
            license_name,
            license_group,
        )

    description = str(model.get("description") or "")
    if re.search(
        r"\bopen[- ]weight\b|\bopen[- ]source\b|weights (?:are )?"
        r"(?:public|available|released)",
        description,
        re.IGNORECASE,
    ):
        return (
            "Open weights - repository unresolved",
            True,
            False,
            "",
            "open_weight_license_unverified",
        )

    return (
        "Closed or no public weights",
        False,
        True,
        "",
        "closed_or_no_public_weights",
    )


def enrich_rows(
    skeletons: list[dict[str, Any]],
    hf_models: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    rows: list[dict[str, Any]] = []
    for skeleton in skeletons:
        model = skeleton.pop("_model")
        hf_id = str(skeleton.pop("_hf_id") or "")
        hf = hf_models.get(hf_id) or {}
        architecture = model.get("architecture") or {}
        supported_parameters = model.get("supported_parameters") or []
        top_provider = model.get("top_provider") or {}
        pricing = model.get("pricing") or {}
        config = hf.get("config") or {}
        safetensors = hf.get("safetensors") or {}
        description = str(model.get("description") or "")
        total_parameters = base.as_int(safetensors.get("total"))
        (
            weight_status,
            is_open_weight,
            is_closed_weight,
            license_name,
            license_group,
        ) = classify_weight_access(model, hf_id, hf)
        created = base.as_int(model.get("created"))
        openrouter_added = (
            datetime.fromtimestamp(created, UTC).date().isoformat()
            if created
            else ""
        )
        row = {
            "usage_composite_rank": "",
            "usage_composite_score": "",
            "model_name": skeleton["model_name"],
            "vendor": skeleton["vendor"],
            "vendor_slug": skeleton["vendor_slug"],
            "weight_access_status": weight_status,
            "is_open_weight": is_open_weight,
            "is_closed_weight": is_closed_weight,
            "license": license_name,
            "license_class": license_group,
            "primary_category": base.primary_category(
                str(model.get("id") or ""),
                skeleton["model_name"],
                architecture,
                hf,
                supported_parameters,
            ),
            "capability_tags": base.capability_tags(
                architecture,
                supported_parameters,
                description,
            ),
            "openrouter_monthly_tokens": skeleton["openrouter_monthly_tokens"],
            "openrouter_monthly_rank": skeleton["openrouter_monthly_rank"],
            "openrouter_daily_top50_appearances": skeleton[
                "openrouter_daily_top50_appearances"
            ],
            "zenmux_monthly_tokens": skeleton["zenmux_monthly_tokens"],
            "zenmux_monthly_rank": skeleton["zenmux_monthly_rank"],
            "openrouter_monthly_score": "",
            "zenmux_monthly_score": "",
            "hf_downloads_30d": base.as_int(hf.get("downloads")) or 0,
            "hf_downloads_all_time": base.as_int(hf.get("downloadsAllTime")) or 0,
            "hf_likes": base.as_int(hf.get("likes")) or 0,
            "hf_open_ecosystem_score": "",
            "openrouter_model_id": skeleton["openrouter_model_id"],
            "openrouter_canonical_slug": skeleton[
                "openrouter_canonical_slug"
            ],
            "zenmux_model_id": skeleton["zenmux_model_id"],
            "zenmux_match_method": skeleton["zenmux_match_method"],
            "zenmux_match_confidence": skeleton["zenmux_match_confidence"],
            "huggingface_model_id": hf_id,
            "huggingface_url": (
                f"https://huggingface.co/{hf_id}" if hf_id else ""
            ),
            "hf_gated": hf.get("gated") or False,
            "release_date_hf": base.date_only(hf.get("createdAt")),
            "openrouter_added_date": openrouter_added,
            "hf_last_modified": base.date_only(hf.get("lastModified")),
            "input_modalities": "|".join(
                architecture.get("input_modalities") or []
            ),
            "output_modalities": "|".join(
                architecture.get("output_modalities") or []
            ),
            "hf_pipeline_tag": hf.get("pipeline_tag") or "",
            "context_length": base.as_int(model.get("context_length"))
            or base.as_int(top_provider.get("context_length"))
            or "",
            "max_completion_tokens": base.as_int(
                top_provider.get("max_completion_tokens")
            )
            or "",
            "parameter_count_b": (
                round(total_parameters / 1_000_000_000, 3)
                if total_parameters
                else ""
            ),
            "architecture": "|".join(config.get("architectures") or []),
            "model_type": config.get("model_type") or "",
            "model_structure": base.model_structure(hf, description),
            "experts_per_token": config.get("num_experts_per_tok") or "",
            "quantization_method": (
                (config.get("quantization_config") or {}).get("quant_method") or ""
            ),
            "supports_reasoning": "reasoning" in supported_parameters,
            "supports_tools": "tools" in supported_parameters,
            "supports_structured_output": (
                "structured_outputs" in supported_parameters
            ),
            "prompt_price_usd_per_million": (
                base.price_per_million(pricing, "prompt") or ""
            ),
            "completion_price_usd_per_million": (
                base.price_per_million(pricing, "completion") or ""
            ),
            "knowledge_cutoff": model.get("knowledge_cutoff") or "",
            "openrouter_url": (
                f"https://openrouter.ai/{model.get('id')}"
                if model.get("id")
                else ""
            ),
            "zenmux_url": (
                f"https://zenmux.ai/models/{skeleton['zenmux_model_id']}"
                if skeleton["zenmux_model_id"]
                else ""
            ),
            "source_presence": "|".join(
                [
                    *(["OpenRouter"] if skeleton["openrouter_monthly_tokens"] else []),
                    *(["ZenMux"] if skeleton["zenmux_monthly_tokens"] else []),
                    *(["HuggingFace"] if hf.get("id") else []),
                ]
            ),
        }
        rows.append(row)
    return rows


def add_percentile_field(
    rows: list[dict[str, Any]],
    value_field: str,
    score_field: str,
    *,
    eligible_only: bool = False,
) -> None:
    eligible_rows = [
        row
        for row in rows
        if (not eligible_only or row["is_open_weight"] is True)
    ]
    values = sorted(
        {
            float(row[value_field])
            for row in eligible_rows
            if base.as_number(row.get(value_field)) is not None
            and float(row[value_field]) > 0
        }
    )
    score_map = {
        str(value): round(100.0 * (index + 1) / len(values), 4)
        for index, value in enumerate(values)
    }
    for row in rows:
        value = base.as_number(row.get(value_field))
        row[score_field] = (
            score_map.get(str(float(value)), 0.0)
            if value and value > 0 and (not eligible_only or row["is_open_weight"] is True)
            else 0.0
        )


def score_rows(rows: list[dict[str, Any]]) -> None:
    add_percentile_field(
        rows,
        "openrouter_monthly_tokens",
        "openrouter_monthly_score",
    )
    add_percentile_field(
        rows,
        "zenmux_monthly_tokens",
        "zenmux_monthly_score",
    )
    add_percentile_field(
        rows,
        "hf_downloads_30d",
        "hf_downloads_30d_score",
        eligible_only=True,
    )
    add_percentile_field(
        rows,
        "hf_likes",
        "hf_likes_score",
        eligible_only=True,
    )
    for row in rows:
        row["usage_composite_score"] = round(
            row["openrouter_monthly_score"]
            * USAGE_WEIGHTS["openrouter_monthly_score"]
            + row["zenmux_monthly_score"]
            * USAGE_WEIGHTS["zenmux_monthly_score"],
            4,
        )
        row["hf_open_ecosystem_score"] = (
            round(
                row["hf_downloads_30d_score"]
                * HF_ADOPTION_WEIGHTS["hf_downloads_30d_score"]
                + row["hf_likes_score"]
                * HF_ADOPTION_WEIGHTS["hf_likes_score"],
                4,
            )
            if row["is_open_weight"] is True
            else ""
        )
        row.pop("hf_downloads_30d_score", None)
        row.pop("hf_likes_score", None)
    rows.sort(
        key=lambda row: (
            -row["usage_composite_score"],
            -min(
                row["openrouter_monthly_score"],
                row["zenmux_monthly_score"],
            ),
            -max(
                row["openrouter_monthly_score"],
                row["zenmux_monthly_score"],
            ),
            str(row["model_name"]).lower(),
        )
    )
    for rank, row in enumerate(rows, start=1):
        row["usage_composite_rank"] = rank


def quality_checks(
    rows: list[dict[str, Any]],
    top50: list[dict[str, Any]],
    source_summary: dict[str, Any],
) -> list[dict[str, Any]]:
    def pct(count: int, total: int) -> str:
        return f"{count / total:.1%}" if total else ""

    duplicate_keys = len(top50) - len(
        {
            (
                str(row["huggingface_model_id"]).lower()
                if row["huggingface_model_id"]
                else base.model_key(str(row["openrouter_canonical_slug"]))
            )
            for row in top50
        }
    )
    open_count = sum(row["is_open_weight"] is True for row in top50)
    closed_count = sum(row["is_closed_weight"] is True for row in top50)
    unverified_count = len(top50) - open_count - closed_count
    unresolved_open_repositories = sum(
        row["weight_access_status"] == "Open weights - repository unresolved"
        for row in top50
    )
    both_platforms = sum(
        row["openrouter_monthly_tokens"] > 0
        and row["zenmux_monthly_tokens"] > 0
        for row in top50
    )
    missing_license = sum(
        row["is_open_weight"] is True and not row["license"] for row in top50
    )
    return [
        {
            "check": "top50_rows",
            "value": len(top50),
            "rate": "",
            "severity": "info",
            "interpretation": "Requested monthly comparison table size.",
        },
        {
            "check": "top50_duplicate_model_keys",
            "value": duplicate_keys,
            "rate": pct(duplicate_keys, len(top50)),
            "severity": "critical" if duplicate_keys else "info",
            "interpretation": "Free and paid aliases must not occupy separate rows.",
        },
        {
            "check": "top50_open_weights",
            "value": open_count,
            "rate": pct(open_count, len(top50)),
            "severity": "info",
            "interpretation": "Models with a resolved public weight repository.",
        },
        {
            "check": "top50_closed_or_no_public_weights",
            "value": closed_count,
            "rate": pct(closed_count, len(top50)),
            "severity": "info",
            "interpretation": (
                "No official public weight repository was resolved. This is "
                "an access classification, not proof about internal source code."
            ),
        },
        {
            "check": "top50_unverified_weight_status",
            "value": unverified_count,
            "rate": pct(unverified_count, len(top50)),
            "severity": "high" if unverified_count else "info",
            "interpretation": "Weight status needs manual review before publication.",
        },
        {
            "check": "top50_open_repositories_unresolved",
            "value": unresolved_open_repositories,
            "rate": pct(unresolved_open_repositories, open_count),
            "severity": "high" if unresolved_open_repositories else "info",
            "interpretation": (
                "Description suggests public weights, but an official weight "
                "repository was not resolved."
            ),
        },
        {
            "check": "top50_both_platforms",
            "value": both_platforms,
            "rate": pct(both_platforms, len(top50)),
            "severity": "medium",
            "interpretation": (
                "Cross-platform overlap. A zero platform score means outside "
                "the visible Top 50, not necessarily zero usage."
            ),
        },
        {
            "check": "top50_open_models_missing_license",
            "value": missing_license,
            "rate": pct(missing_license, open_count),
            "severity": "high" if missing_license else "info",
            "interpretation": "Open-weight license must be verified for reuse limits.",
        },
        {
            "check": "openrouter_traffic_coverage",
            "value": source_summary["openrouter"]["top50_traffic_coverage"],
            "rate": "",
            "severity": "medium",
            "interpretation": "Share of monthly tokens visible as named models.",
        },
        {
            "check": "zenmux_traffic_coverage",
            "value": source_summary["zenmux"]["top50_traffic_coverage"],
            "rate": "",
            "severity": "medium",
            "interpretation": "Share of monthly tokens visible as named models.",
        },
    ]


def summarize_top50(top50: list[dict[str, Any]]) -> dict[str, Any]:
    open_rows = [row for row in top50 if row["is_open_weight"] is True]
    closed_rows = [row for row in top50 if row["is_closed_weight"] is True]
    return {
        "open_weight_count": len(open_rows),
        "closed_or_no_public_weights_count": len(closed_rows),
        "open_weight_top10_count": sum(
            row["is_open_weight"] is True for row in top50[:10]
        ),
        "closed_top10_count": sum(
            row["is_closed_weight"] is True for row in top50[:10]
        ),
        "best_open_weight_model": (
            {
                "rank": open_rows[0]["usage_composite_rank"],
                "model": open_rows[0]["model_name"],
                "vendor": open_rows[0]["vendor"],
                "score": open_rows[0]["usage_composite_score"],
            }
            if open_rows
            else None
        ),
        "best_closed_model": (
            {
                "rank": closed_rows[0]["usage_composite_rank"],
                "model": closed_rows[0]["model_name"],
                "vendor": closed_rows[0]["vendor"],
                "score": closed_rows[0]["usage_composite_score"],
            }
            if closed_rows
            else None
        ),
    }


def main() -> None:
    openrouter_key, zenmux_key, hf_token = load_keys()
    start, end = previous_complete_month(date.today())
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    openrouter_catalog = base.fetch_openrouter_catalog()
    zenmux_catalog = base.fetch_zenmux_catalog()
    (
        openrouter_usage,
        openrouter_summary,
        openrouter_raw,
    ) = fetch_openrouter_month(openrouter_key, start, end)
    zenmux_usage, zenmux_summary, zenmux_raw = fetch_zenmux_month(
        zenmux_key,
        start,
        end,
    )

    skeletons = build_skeletons(
        openrouter_catalog,
        openrouter_usage,
        zenmux_catalog,
        zenmux_usage,
    )
    hf_ids = sorted(
        {
            str(row.get("_hf_id") or "")
            for row in skeletons
            if row.get("_hf_id")
        }
    )
    hf_models = base.fetch_hf_models(hf_ids, hf_token)
    rows = enrich_rows(skeletons, hf_models)
    score_rows(rows)
    top50 = rows[:50]

    source_summary = {
        "generated_at": datetime.now(UTC).isoformat(),
        "window_type": "previous complete calendar month",
        "window_start": start.isoformat(),
        "window_end": end.isoformat(),
        "table_grain": (
            "One hosted model endpoint/release; free and paid aliases merged."
        ),
        "openrouter": openrouter_summary,
        "zenmux": zenmux_summary,
        "huggingface": {
            "status": "complete",
            "requested_models": len(hf_ids),
            "resolved_models": sum(
                bool(model.get("id")) and not model.get("_error")
                for model in hf_models.values()
            ),
            "role": (
                "Weight-access classification and open-ecosystem adoption "
                "metadata; excluded from the cross-model usage composite."
            ),
        },
        "usage_composite_weights": USAGE_WEIGHTS,
        "hf_open_ecosystem_weights": HF_ADOPTION_WEIGHTS,
        "scoring_note": (
            "Raw token counts are not added across platforms. Each platform is "
            "converted to an independent percentile; missing from a Top 50 "
            "receives zero for that platform. This rewards cross-platform use "
            "while avoiding platform-scale differences. Composite-score ties "
            "prefer the model with stronger coverage on its weaker platform."
        ),
        "weight_access_note": (
            "Closed or no public weights means no official public Hugging Face "
            "weight repository was resolved. It should not be read as a legal "
            "or source-code determination."
        ),
        "top50_summary": summarize_top50(top50),
    }

    base.write_csv(ALL_PATH, rows)
    base.write_csv(TOP50_PATH, top50)
    base.write_csv(
        QUALITY_PATH,
        quality_checks(rows, top50, source_summary),
    )
    base.write_json(SOURCE_PATH, source_summary)
    base.write_json(
        RAW_DIR / "openrouter_monthly_usage_snapshot.json",
        openrouter_raw,
    )
    base.write_json(
        RAW_DIR / "zenmux_monthly_usage_snapshot.json",
        zenmux_raw,
    )
    base.write_json(
        RAW_DIR / "huggingface_monthly_candidates.json",
        base.compact_hf_snapshot(hf_models),
    )
    base.write_json(
        RAW_DIR / "openrouter_monthly_model_catalog.json",
        {"data": openrouter_catalog},
    )
    base.write_json(
        RAW_DIR / "zenmux_monthly_model_catalog.json",
        {"data": zenmux_catalog},
    )

    print(
        json.dumps(
            {
                "window": f"{start.isoformat()} to {end.isoformat()}",
                "candidates": len(rows),
                "top50": len(top50),
                **source_summary["top50_summary"],
                "output": str(TOP50_PATH.relative_to(ROOT)),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
