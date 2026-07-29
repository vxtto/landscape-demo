#!/usr/bin/env python3
"""Build an open-weight model candidate table from platform usage signals.

The output grain is one OpenRouter model endpoint/release. Free and paid routing
variants are merged. A model is retained only when OpenRouter links it to a
public Hugging Face model repository that can be resolved through the Hub API.

ZenMux usage is optional because its platform-wide leaderboard requires a
Management API key. Set ZENMUX_MANAGEMENT_API_KEY to include that signal.
"""

from __future__ import annotations

import csv
import json
import math
import os
import re
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import UTC, date, datetime, timedelta
from difflib import SequenceMatcher
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests
from dotenv import load_dotenv


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
RAW_DIR = DATA_DIR / "raw"
TOP50_PATH = DATA_DIR / "open_weight_models_top50.csv"
ALL_PATH = DATA_DIR / "open_weight_models_all_candidates.csv"
QUALITY_PATH = DATA_DIR / "data_quality_checks.csv"
SOURCE_PATH = DATA_DIR / "source_summary.json"

OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models"
OPENROUTER_DAILY_URL = "https://openrouter.ai/api/v1/datasets/rankings-daily"
OPENROUTER_PUBLIC_RANKINGS_URL = (
    "https://openrouter.ai/api/frontend/v1/rankings/models"
)
ZENMUX_MODELS_URL = "https://zenmux.ai/api/v1/models"
ZENMUX_LEADERBOARD_URL = (
    "https://zenmux.ai/api/v1/management/statistics/leaderboard"
)
HF_MODEL_URL = "https://huggingface.co/api/models/{model_id}"

HTTP_TIMEOUT = 45
HF_WORKERS = 8
BASE_WEIGHTS = {
    "openrouter_usage_score": 0.45,
    "zenmux_usage_score": 0.35,
    "hf_downloads_30d_score": 0.15,
    "hf_likes_score": 0.05,
}

OSI_LICENSES = {
    "apache-2.0",
    "mit",
    "bsd",
    "bsd-2-clause",
    "bsd-3-clause",
    "isc",
    "mpl-2.0",
    "gpl-2.0",
    "gpl-3.0",
    "lgpl-2.1",
    "lgpl-3.0",
    "agpl-3.0",
}

VENDOR_ALIASES = {
    "alibaba": "qwen",
    "qwen": "qwen",
    "deepseek-ai": "deepseek",
    "deepseek": "deepseek",
    "google": "google",
    "google-deepmind": "google",
    "inclusionai": "inclusionai",
    "meta-llama": "meta",
    "meta": "meta",
    "mistralai": "mistral",
    "mistral": "mistral",
    "moonshotai": "moonshotai",
    "moonshot-ai": "moonshotai",
    "nvidia": "nvidia",
    "openai": "openai",
    "stepfun-ai": "stepfun",
    "stepfun": "stepfun",
    "tencent": "tencent",
    "z-ai": "z-ai",
    "zai-org": "z-ai",
}

HF_ID_OVERRIDES = {
    "hexgrad/kokoro-82m": "hexgrad/Kokoro-82M",
    "inclusionai/ling-2.6-1t": "inclusionAI/Ling-2.6-1T",
    "inclusionai/ling-2.6-flash": "inclusionAI/Ling-2.6-flash",
    "inclusionai/ring-2.6-1t": "inclusionAI/Ring-2.6-1T",
}


class SourceError(RuntimeError):
    """Raised when a required source cannot be read."""


def request_json(
    url: str,
    *,
    params: Any = None,
    headers: dict[str, str] | None = None,
    required: bool = True,
) -> dict[str, Any]:
    try:
        response = requests.get(
            url,
            params=params,
            headers=headers,
            timeout=HTTP_TIMEOUT,
        )
        response.raise_for_status()
        payload = response.json()
        if not isinstance(payload, dict):
            raise SourceError(f"Expected an object from {url}")
        return payload
    except (requests.RequestException, ValueError, SourceError) as exc:
        if required:
            raise SourceError(f"Could not read {url}: {exc}") from exc
        return {"_error": str(exc)}


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(value, ensure_ascii=False, indent=2, sort_keys=True),
        encoding="utf-8",
    )


def write_csv(path: Path, rows: list[dict[str, Any]]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if not rows:
        path.write_text("", encoding="utf-8")
        return
    fieldnames: list[str] = []
    seen: set[str] = set()
    for row in rows:
        for field in row:
            if field not in seen:
                seen.add(field)
                fieldnames.append(field)
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def as_number(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def as_int(value: Any) -> int | None:
    number = as_number(value)
    return int(number) if number is not None else None


def date_only(value: Any) -> str:
    if not value:
        return ""
    return str(value)[:10]


def vendor_key(value: str) -> str:
    normalized = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return VENDOR_ALIASES.get(normalized, normalized)


def model_key(value: str) -> str:
    value = value.lower()
    value = re.sub(r":free$", "", value)
    value = re.sub(r"-free$", "", value)
    value = re.sub(r"-20\d{6}$", "", value)
    value = re.sub(r"[^a-z0-9]+", "", value)
    return value


def display_model_name(catalog_row: dict[str, Any]) -> str:
    name = str(catalog_row.get("name") or catalog_row.get("id") or "")
    if ": " in name:
        return name.split(": ", 1)[1]
    return name


def resolved_hf_id(catalog_row: dict[str, Any]) -> str:
    model_id = str(catalog_row.get("id") or "")
    return str(
        catalog_row.get("hugging_face_id")
        or HF_ID_OVERRIDES.get(re.sub(r":free$", "", model_id))
        or ""
    )


def vendor_name(catalog_row: dict[str, Any]) -> str:
    name = str(catalog_row.get("name") or "")
    if ": " in name:
        return name.split(": ", 1)[0]
    slug = str(catalog_row.get("id") or "").split("/", 1)[0]
    return slug.replace("-", " ").title()


def fetch_openrouter_catalog() -> list[dict[str, Any]]:
    payload = request_json(
        OPENROUTER_MODELS_URL,
        params={"output_modalities": "all"},
    )
    rows = payload.get("data")
    if not isinstance(rows, list):
        raise SourceError("OpenRouter model catalog has no data array")
    return [row for row in rows if isinstance(row, dict)]


def aggregate_usage_rows(
    rows: list[dict[str, Any]],
    *,
    token_field: str,
    request_field: str | None = None,
) -> dict[str, dict[str, Any]]:
    output: dict[str, dict[str, Any]] = {}
    for row in rows:
        slug = str(row.get("model_permaslug") or row.get("model") or "")
        if not slug or slug in {"other", "__others__"}:
            continue
        record = output.setdefault(
            slug,
            {
                "tokens": 0,
                "requests": 0,
                "variants": set(),
                "change": None,
            },
        )
        record["tokens"] += as_int(row.get(token_field)) or 0
        if request_field:
            record["requests"] += as_int(row.get(request_field)) or 0
        variant = row.get("variant_permaslug") or row.get("variant")
        if variant:
            record["variants"].add(str(variant))
        if row.get("change") is not None:
            record["change"] = as_number(row.get("change"))
    for record in output.values():
        record["variants"] = "|".join(sorted(record["variants"]))
    return output


def fetch_openrouter_usage(
    api_key: str,
) -> tuple[dict[str, dict[str, Any]], dict[str, Any], dict[str, Any]]:
    public_payload = request_json(OPENROUTER_PUBLIC_RANKINGS_URL)
    public_rows = public_payload.get("data")
    if not isinstance(public_rows, list) or not public_rows:
        raise SourceError("OpenRouter public ranking endpoint has no data")
    dates = [
        str(row.get("date") or "") for row in public_rows if row.get("date")
    ]
    latest = max(dates)
    latest_rows = [
        row for row in public_rows if str(row.get("date") or "") == latest
    ]
    for row in latest_rows:
        row["total_tokens"] = (
            (as_int(row.get("total_prompt_tokens")) or 0)
            + (as_int(row.get("total_completion_tokens")) or 0)
        )
    aggregate = aggregate_usage_rows(
        latest_rows,
        token_field="total_tokens",
        request_field="count",
    )

    end = date.fromisoformat(latest[:10])
    start = end - timedelta(days=6)
    authenticated_rows: list[dict[str, Any]] = []
    authenticated_status = "credential_required"
    authenticated_caveat = ""
    if api_key:
        payload = request_json(
            OPENROUTER_DAILY_URL,
            params={"start_date": start.isoformat(), "end_date": end.isoformat()},
            headers={"Authorization": f"Bearer {api_key}"},
            required=False,
        )
        if "_error" not in payload and isinstance(payload.get("data"), list):
            authenticated_rows = payload["data"]
            authenticated_usage = aggregate_usage_rows(
                authenticated_rows,
                token_field="total_tokens",
            )
            authenticated_by_key = {
                model_key(slug): values
                for slug, values in authenticated_usage.items()
            }
            for slug, record in aggregate.items():
                authenticated = authenticated_usage.get(
                    slug
                ) or authenticated_by_key.get(model_key(slug))
                record["documented_daily_tokens"] = (
                    as_int((authenticated or {}).get("tokens")) or 0
                )
            authenticated_status = "complete"
            authenticated_caveat = (
                "The documented dataset retains only each day's public Top 50, "
                "so it is used as a cross-check rather than the candidate universe."
            )
        else:
            authenticated_status = "error"
            authenticated_caveat = str(
                payload.get("_error") or payload.get("message") or "unknown error"
            )
    for record in aggregate.values():
        record.setdefault("documented_daily_tokens", 0)

    summary = {
        "status": "complete",
        "source_type": "public_weekly_rankings_with_daily_crosscheck",
        "source_url": OPENROUTER_PUBLIC_RANKINGS_URL,
        "window_start": start.isoformat(),
        "window_end": latest[:10],
        "as_of": datetime.now(UTC).isoformat(),
        "metric": "weekly prompt + completion tokens; requests retained separately",
        "caveat": (
            "The complete weekly rankings page is the primary signal. "
            "Cross-provider tokenizers differ."
        ),
        "authenticated_daily_dataset": {
            "status": authenticated_status,
            "source_url": OPENROUTER_DAILY_URL,
            "window_start": start.isoformat(),
            "window_end": end.isoformat(),
            "caveat": authenticated_caveat,
        },
    }
    return aggregate, summary, {
        "public_weekly": latest_rows,
        "authenticated_daily": authenticated_rows,
    }


def fetch_zenmux_catalog() -> list[dict[str, Any]]:
    payload = request_json(ZENMUX_MODELS_URL)
    rows = payload.get("data")
    if not isinstance(rows, list):
        raise SourceError("ZenMux model catalog has no data array")
    return [row for row in rows if isinstance(row, dict)]


def fetch_zenmux_usage(
    management_key: str,
) -> tuple[dict[str, dict[str, Any]], dict[str, Any], list[dict[str, Any]]]:
    end = date.today() - timedelta(days=1)
    start = end - timedelta(days=6)
    if not management_key:
        return {}, {
            "status": "credential_required",
            "source_url": ZENMUX_LEADERBOARD_URL,
            "window_start": start.isoformat(),
            "window_end": end.isoformat(),
            "metric": "tokens",
            "caveat": (
                "Set ZENMUX_MANAGEMENT_API_KEY. A standard inference API key "
                "cannot read platform-wide statistics."
            ),
        }, []

    payload = request_json(
        ZENMUX_LEADERBOARD_URL,
        params={
            "metric": "tokens",
            "starting_at": start.isoformat(),
            "ending_at": end.isoformat(),
            "limit": 50,
        },
        headers={"Authorization": f"Bearer {management_key}"},
        required=False,
    )
    if "_error" in payload or not payload.get("success"):
        message = payload.get("_error") or payload.get("message") or "unknown error"
        return {}, {
            "status": "error",
            "source_url": ZENMUX_LEADERBOARD_URL,
            "window_start": start.isoformat(),
            "window_end": end.isoformat(),
            "metric": "tokens",
            "caveat": str(message),
        }, []

    data = payload.get("data") or {}
    entries = data.get("entries") or []
    usage: dict[str, dict[str, Any]] = {}
    for entry in entries:
        slug = str(entry.get("model") or "")
        if not slug or slug == "__others__":
            continue
        usage[slug] = {
            "tokens": as_int(entry.get("value")) or 0,
            "rank": as_int(entry.get("rank")),
            "label": entry.get("label") or "",
            "author": entry.get("author") or "",
        }
    summary = {
        "status": "complete",
        "source_url": ZENMUX_LEADERBOARD_URL,
        "window_start": data.get("starting_at") or start.isoformat(),
        "window_end": data.get("ending_at") or end.isoformat(),
        "as_of": datetime.now(UTC).isoformat(),
        "metric": "prompt + completion tokens",
        "caveat": "Platform-wide data is aggregated daily and fresh through T-1.",
    }
    return usage, summary, entries


HF_EXPAND_FIELDS = [
    "author",
    "cardData",
    "config",
    "createdAt",
    "downloads",
    "downloadsAllTime",
    "gated",
    "lastModified",
    "likes",
    "pipeline_tag",
    "private",
    "safetensors",
    "tags",
]


def fetch_hf_model(model_id: str, hf_token: str) -> dict[str, Any]:
    headers = {"Authorization": f"Bearer {hf_token}"} if hf_token else None
    params = [("expand[]", field) for field in HF_EXPAND_FIELDS]
    payload = request_json(
        HF_MODEL_URL.format(model_id=quote(model_id, safe="/")),
        params=params,
        headers=headers,
        required=False,
    )
    payload["_requested_id"] = model_id
    return payload


def fetch_hf_models(
    model_ids: list[str],
    hf_token: str,
) -> dict[str, dict[str, Any]]:
    output: dict[str, dict[str, Any]] = {}
    with ThreadPoolExecutor(max_workers=HF_WORKERS) as executor:
        futures = {
            executor.submit(fetch_hf_model, model_id, hf_token): model_id
            for model_id in model_ids
        }
        for future in as_completed(futures):
            model_id = futures[future]
            try:
                output[model_id] = future.result()
            except Exception as exc:  # pragma: no cover - defensive boundary
                output[model_id] = {
                    "_requested_id": model_id,
                    "_error": str(exc),
                }
    return output


def extract_license(hf: dict[str, Any]) -> str:
    card_data = hf.get("cardData") or {}
    license_value = card_data.get("license")
    if isinstance(license_value, list):
        return "|".join(str(item) for item in license_value)
    if license_value:
        return str(license_value)
    for tag in hf.get("tags") or []:
        if str(tag).startswith("license:"):
            return str(tag).split(":", 1)[1]
    return ""


def license_class(license_name: str) -> str:
    value = license_name.lower()
    if value in OSI_LICENSES:
        return "open_source_license"
    if any(token in value for token in ("non-commercial", "-nc", "_nc")):
        return "open_weight_noncommercial"
    if value:
        return "open_weight_custom_or_other_license"
    return "open_weight_license_unverified"


def price_per_million(pricing: dict[str, Any], field: str) -> float | None:
    value = as_number(pricing.get(field))
    if value is None:
        return None
    return value * 1_000_000


def primary_category(
    model_id: str,
    name: str,
    architecture: dict[str, Any],
    hf: dict[str, Any],
    supported_parameters: list[str],
) -> str:
    haystack = " ".join(
        [
            model_id.lower(),
            name.lower(),
            str(hf.get("pipeline_tag") or "").lower(),
        ]
    )
    pipeline_tag = str(hf.get("pipeline_tag") or "").lower()
    output_modalities = set(architecture.get("output_modalities") or [])
    input_modalities = set(architecture.get("input_modalities") or [])
    if "image" in output_modalities:
        return "Image Generation"
    if "video" in output_modalities:
        return "Video Generation"
    if "audio" in output_modalities:
        return "Audio / Speech"
    if (
        any(token in haystack for token in ("embed", "embedding", "rerank"))
        or pipeline_tag
        in {
            "feature-extraction",
            "sentence-similarity",
            "text-ranking",
        }
    ):
        return "Embedding / Rerank"
    if any(token in haystack for token in ("coder", "code", "math")):
        return "Code & Math"
    if len(input_modalities - {"text", "file"}) > 0:
        return "Multimodal / VLM"
    if (
        any(token in haystack for token in ("reasoning", "-r1", "ring"))
        or "reasoning" in supported_parameters
    ):
        return "Reasoning"
    return "General Language"


def capability_tags(
    architecture: dict[str, Any],
    supported_parameters: list[str],
    description: str,
) -> str:
    tags: list[str] = []
    inputs = architecture.get("input_modalities") or []
    outputs = architecture.get("output_modalities") or []
    text = description.lower()
    for modality in inputs:
        tags.append(f"{modality}_input")
    for modality in outputs:
        tags.append(f"{modality}_output")
    if "reasoning" in supported_parameters or "reasoning" in text:
        tags.append("reasoning")
    if "tools" in supported_parameters:
        tags.append("tool_use")
    if "structured_outputs" in supported_parameters:
        tags.append("structured_output")
    if "code" in text or "coding" in text:
        tags.append("coding")
    if "agent" in text:
        tags.append("agentic")
    return "|".join(dict.fromkeys(tags))


def model_structure(hf: dict[str, Any], description: str) -> str:
    config = hf.get("config") or {}
    if config.get("num_experts_per_tok") or re.search(
        r"\bmixture[- ]of[- ]experts\b|\bmoe\b",
        description,
        re.IGNORECASE,
    ):
        return "Mixture-of-Experts"
    if (hf.get("safetensors") or {}).get("total"):
        return "Dense or unspecified"
    return "Unknown"


def match_zenmux_model(
    openrouter_row: dict[str, Any],
    zenmux_catalog: list[dict[str, Any]],
) -> tuple[str, str, float]:
    candidate_ids = {
        model_key(str(openrouter_row.get("id") or "")),
        model_key(str(openrouter_row.get("canonical_slug") or "")),
    }
    for model in zenmux_catalog:
        if model_key(str(model.get("id") or "")) in candidate_ids:
            return str(model.get("id") or ""), "exact_slug", 1.0

    or_vendor = vendor_key(str(openrouter_row.get("id") or "").split("/", 1)[0])
    or_name = display_model_name(openrouter_row)
    best: tuple[float, dict[str, Any] | None] = (0.0, None)
    for model in zenmux_catalog:
        zen_vendor = vendor_key(
            str(model.get("owned_by") or model.get("id") or "").split("/", 1)[0]
        )
        if zen_vendor != or_vendor:
            continue
        zen_name = str(model.get("display_name") or model.get("id") or "")
        score = SequenceMatcher(
            None,
            model_key(or_name),
            model_key(zen_name),
        ).ratio()
        if score > best[0]:
            best = (score, model)
    if best[1] is not None and best[0] >= 0.84:
        return str(best[1].get("id") or ""), "fuzzy_same_vendor", round(best[0], 3)
    return "", "unmatched", round(best[0], 3)


def percentile_scores(
    rows: list[dict[str, Any]],
    value_field: str,
) -> dict[str, float]:
    values = sorted(
        {
            float(row[value_field])
            for row in rows
            if as_number(row.get(value_field)) is not None
            and float(row[value_field]) > 0
        }
    )
    if not values:
        return {}
    if len(values) == 1:
        return {str(values[0]): 100.0}
    return {
        str(value): round(100.0 * index / (len(values) - 1), 4)
        for index, value in enumerate(values)
    }


def add_scores(
    rows: list[dict[str, Any]],
    zenmux_available: bool,
) -> dict[str, float]:
    metric_fields = {
        "openrouter_usage_score": "openrouter_tokens",
        "zenmux_usage_score": "zenmux_tokens",
        "hf_downloads_30d_score": "hf_downloads_30d",
        "hf_likes_score": "hf_likes",
    }
    for score_field, value_field in metric_fields.items():
        score_map = percentile_scores(rows, value_field)
        for row in rows:
            value = as_number(row.get(value_field))
            row[score_field] = (
                score_map.get(str(float(value)), 0.0) if value and value > 0 else 0.0
            )

    enabled = {
        key: value
        for key, value in BASE_WEIGHTS.items()
        if zenmux_available or key != "zenmux_usage_score"
    }
    weight_total = sum(enabled.values())
    effective = {key: value / weight_total for key, value in enabled.items()}
    for row in rows:
        row["composite_score"] = round(
            sum(row[key] * weight for key, weight in effective.items()),
            4,
        )
        row["score_status"] = (
            "complete_three_sources"
            if zenmux_available
            else "provisional_without_zenmux_usage"
        )
    rows.sort(
        key=lambda row: (
            row["composite_score"],
            as_number(row.get("openrouter_tokens")) or 0,
            as_number(row.get("hf_downloads_30d")) or 0,
        ),
        reverse=True,
    )
    for index, row in enumerate(rows, start=1):
        row["composite_rank"] = index
    return {key: round(value, 6) for key, value in effective.items()}


def build_rows(
    catalog: list[dict[str, Any]],
    openrouter_usage: dict[str, dict[str, Any]],
    zenmux_catalog: list[dict[str, Any]],
    zenmux_usage: dict[str, dict[str, Any]],
    hf_models: dict[str, dict[str, Any]],
) -> list[dict[str, Any]]:
    usage_by_key = {model_key(key): value for key, value in openrouter_usage.items()}
    zen_usage_by_key = {model_key(key): value for key, value in zenmux_usage.items()}
    rows: list[dict[str, Any]] = []
    for model in catalog:
        hf_id = resolved_hf_id(model)
        if not hf_id:
            continue
        usage = (
            openrouter_usage.get(str(model.get("canonical_slug") or ""))
            or openrouter_usage.get(str(model.get("id") or ""))
            or usage_by_key.get(model_key(str(model.get("canonical_slug") or "")))
            or usage_by_key.get(model_key(str(model.get("id") or "")))
        )
        if not usage or not usage.get("tokens"):
            continue
        hf = hf_models.get(hf_id) or {}
        if hf.get("_error") or not hf.get("id") or hf.get("private"):
            continue

        zen_id, zen_match_method, zen_match_confidence = match_zenmux_model(
            model,
            zenmux_catalog,
        )
        zen_usage = (
            zenmux_usage.get(zen_id)
            or zen_usage_by_key.get(model_key(zen_id))
            or {}
        )
        architecture = model.get("architecture") or {}
        supported_parameters = model.get("supported_parameters") or []
        pricing = model.get("pricing") or {}
        top_provider = model.get("top_provider") or {}
        config = hf.get("config") or {}
        safetensors = hf.get("safetensors") or {}
        description = str(model.get("description") or "")
        license_name = extract_license(hf)
        total_parameters = as_int(safetensors.get("total"))
        created = as_int(model.get("created"))
        openrouter_added = (
            datetime.fromtimestamp(created, UTC).date().isoformat()
            if created
            else ""
        )
        row = {
            "composite_rank": "",
            "composite_score": "",
            "score_status": "",
            "model_name": display_model_name(model),
            "vendor": vendor_name(model),
            "vendor_slug": str(model.get("id") or "").split("/", 1)[0],
            "primary_category": primary_category(
                str(model.get("id") or ""),
                display_model_name(model),
                architecture,
                hf,
                supported_parameters,
            ),
            "capability_tags": capability_tags(
                architecture,
                supported_parameters,
                description,
            ),
            "is_open_weight": True,
            "open_weight_evidence": f"https://huggingface.co/{hf_id}",
            "license": license_name,
            "license_class": license_class(license_name),
            "hf_gated": hf.get("gated") or False,
            "openrouter_model_id": model.get("id") or "",
            "openrouter_canonical_slug": model.get("canonical_slug") or "",
            "zenmux_model_id": zen_id,
            "zenmux_match_method": zen_match_method,
            "zenmux_match_confidence": zen_match_confidence,
            "huggingface_model_id": hf_id,
            "openrouter_tokens": as_int(usage.get("tokens")) or 0,
            "openrouter_requests": as_int(usage.get("requests")) or 0,
            "openrouter_documented_top50_tokens": (
                as_int(usage.get("documented_daily_tokens")) or 0
            ),
            "openrouter_usage_change": usage.get("change"),
            "openrouter_variants_merged": usage.get("variants") or "",
            "zenmux_tokens": as_int(zen_usage.get("tokens")) or 0,
            "zenmux_rank": as_int(zen_usage.get("rank")) or "",
            "hf_downloads_30d": as_int(hf.get("downloads")) or 0,
            "hf_downloads_all_time": as_int(hf.get("downloadsAllTime")) or 0,
            "hf_likes": as_int(hf.get("likes")) or 0,
            "openrouter_usage_score": "",
            "zenmux_usage_score": "",
            "hf_downloads_30d_score": "",
            "hf_likes_score": "",
            "release_date_hf": date_only(hf.get("createdAt")),
            "openrouter_added_date": openrouter_added,
            "hf_last_modified": date_only(hf.get("lastModified")),
            "input_modalities": "|".join(architecture.get("input_modalities") or []),
            "output_modalities": "|".join(
                architecture.get("output_modalities") or []
            ),
            "hf_pipeline_tag": hf.get("pipeline_tag") or "",
            "context_length": as_int(model.get("context_length"))
            or as_int(top_provider.get("context_length"))
            or "",
            "max_completion_tokens": as_int(
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
            "model_structure": model_structure(hf, description),
            "experts_per_token": config.get("num_experts_per_tok") or "",
            "quantization_method": (
                (config.get("quantization_config") or {}).get("quant_method") or ""
            ),
            "supports_reasoning": "reasoning" in supported_parameters,
            "supports_tools": "tools" in supported_parameters,
            "supports_structured_output": (
                "structured_outputs" in supported_parameters
            ),
            "prompt_price_usd_per_million": price_per_million(pricing, "prompt")
            or "",
            "completion_price_usd_per_million": price_per_million(
                pricing,
                "completion",
            )
            or "",
            "knowledge_cutoff": model.get("knowledge_cutoff") or "",
            "openrouter_url": (
                f"https://openrouter.ai/{model.get('id')}"
                if model.get("id")
                else ""
            ),
            "zenmux_url": (
                f"https://zenmux.ai/models/{zen_id}" if zen_id else ""
            ),
            "huggingface_url": f"https://huggingface.co/{hf_id}",
            "source_presence": "|".join(
                [
                    "OpenRouter",
                    *(["ZenMux_catalog"] if zen_id else []),
                    *(["ZenMux_usage"] if zen_usage else []),
                    "HuggingFace",
                ]
            ),
        }
        rows.append(row)

    deduplicated: dict[str, dict[str, Any]] = {}
    for row in rows:
        key = str(row["huggingface_model_id"]).lower()
        existing = deduplicated.get(key)
        if existing is None:
            row["openrouter_model_ids_merged"] = row["openrouter_model_id"]
            deduplicated[key] = row
            continue

        existing_ids = set(
            str(existing.get("openrouter_model_ids_merged") or "").split("|")
        )
        existing_ids.add(str(row["openrouter_model_id"]))
        preferred, secondary = existing, row
        if (
            "(free)" in str(existing["model_name"]).lower()
            and "(free)" not in str(row["model_name"]).lower()
        ):
            preferred, secondary = row, existing
        preferred["openrouter_model_ids_merged"] = "|".join(sorted(existing_ids))
        for field in (
            "openrouter_tokens",
            "openrouter_requests",
            "openrouter_documented_top50_tokens",
            "zenmux_tokens",
        ):
            preferred[field] = max(
                as_int(preferred.get(field)) or 0,
                as_int(secondary.get(field)) or 0,
            )
        if not preferred.get("zenmux_model_id") and secondary.get("zenmux_model_id"):
            for field in (
                "zenmux_model_id",
                "zenmux_match_method",
                "zenmux_match_confidence",
                "zenmux_rank",
                "zenmux_url",
            ):
                preferred[field] = secondary.get(field) or ""
        sources = set(
            filter(
                None,
                (
                    str(preferred.get("source_presence") or "")
                    + "|"
                    + str(secondary.get("source_presence") or "")
                ).split("|"),
            )
        )
        preferred["source_presence"] = "|".join(
            source
            for source in (
                "OpenRouter",
                "ZenMux_catalog",
                "ZenMux_usage",
                "HuggingFace",
            )
            if source in sources
        )
        deduplicated[key] = preferred
    return list(deduplicated.values())


def quality_checks(
    rows: list[dict[str, Any]],
    top50: list[dict[str, Any]],
    source_summary: dict[str, Any],
    openrouter_catalog_count: int,
    hf_requested_count: int,
    hf_resolved_count: int,
) -> list[dict[str, Any]]:
    def pct(count: int, total: int) -> str:
        return f"{count / total:.1%}" if total else ""

    duplicate_ids = len(top50) - len(
        {str(row["huggingface_model_id"]).lower() for row in top50}
    )
    missing_license = sum(not row["license"] for row in top50)
    missing_parameters = sum(row["parameter_count_b"] == "" for row in top50)
    zen_catalog_matches = sum(bool(row["zenmux_model_id"]) for row in top50)
    custom_licenses = sum(
        row["license_class"] != "open_source_license" for row in top50
    )
    zen_status = source_summary["zenmux_usage"]["status"]
    return [
        {
            "check": "openrouter_catalog_rows",
            "value": openrouter_catalog_count,
            "rate": "",
            "severity": "info",
            "interpretation": "All model endpoints returned by OpenRouter.",
        },
        {
            "check": "hf_metadata_resolution",
            "value": f"{hf_resolved_count}/{hf_requested_count}",
            "rate": pct(hf_resolved_count, hf_requested_count),
            "severity": "high" if hf_resolved_count < hf_requested_count else "info",
            "interpretation": (
                "OpenRouter-linked Hugging Face repositories resolved through "
                "the official Hub API."
            ),
        },
        {
            "check": "eligible_open_weight_candidates",
            "value": len(rows),
            "rate": "",
            "severity": "info",
            "interpretation": (
                "Models with OpenRouter usage and a resolved public Hugging "
                "Face weight repository."
            ),
        },
        {
            "check": "top50_duplicate_huggingface_ids",
            "value": duplicate_ids,
            "rate": pct(duplicate_ids, len(top50)),
            "severity": "critical" if duplicate_ids else "info",
            "interpretation": "Free and paid variants should be merged.",
        },
        {
            "check": "top50_missing_license",
            "value": missing_license,
            "rate": pct(missing_license, len(top50)),
            "severity": "high" if missing_license else "info",
            "interpretation": (
                "Missing license does not prove closed weights, but requires "
                "manual verification before publication."
            ),
        },
        {
            "check": "top50_custom_or_restricted_license",
            "value": custom_licenses,
            "rate": pct(custom_licenses, len(top50)),
            "severity": "medium" if custom_licenses else "info",
            "interpretation": (
                "Open-weight is broader than OSI-approved open source. Keep "
                "this distinction visible in the final landscape."
            ),
        },
        {
            "check": "top50_missing_parameter_count",
            "value": missing_parameters,
            "rate": pct(missing_parameters, len(top50)),
            "severity": "medium" if missing_parameters else "info",
            "interpretation": "Parameter metadata is not complete on every Hub repo.",
        },
        {
            "check": "top50_zenmux_catalog_match",
            "value": zen_catalog_matches,
            "rate": pct(zen_catalog_matches, len(top50)),
            "severity": "medium",
            "interpretation": (
                "Catalog matching is exact first, then fuzzy within the same "
                "vendor. Fuzzy matches need review."
            ),
        },
        {
            "check": "zenmux_usage_status",
            "value": zen_status,
            "rate": "",
            "severity": "high" if zen_status != "complete" else "info",
            "interpretation": (
                "Platform-wide ZenMux usage is included."
                if zen_status == "complete"
                else "The composite rank is provisional until platform-wide "
                "ZenMux usage is available."
            ),
        },
    ]


def compact_hf_snapshot(
    hf_models: dict[str, dict[str, Any]],
) -> dict[str, dict[str, Any]]:
    output: dict[str, dict[str, Any]] = {}
    for requested_id, model in hf_models.items():
        config = model.get("config") or {}
        card_data = model.get("cardData") or {}
        output[requested_id] = {
            "id": model.get("id") or "",
            "author": model.get("author") or "",
            "createdAt": model.get("createdAt") or "",
            "lastModified": model.get("lastModified") or "",
            "downloads": model.get("downloads"),
            "downloadsAllTime": model.get("downloadsAllTime"),
            "likes": model.get("likes"),
            "pipeline_tag": model.get("pipeline_tag") or "",
            "private": model.get("private"),
            "gated": model.get("gated"),
            "tags": model.get("tags") or [],
            "safetensors": model.get("safetensors") or {},
            "cardData": {
                "license": card_data.get("license"),
                "pipeline_tag": card_data.get("pipeline_tag"),
                "library_name": card_data.get("library_name"),
            },
            "config": {
                "architectures": config.get("architectures") or [],
                "model_type": config.get("model_type") or "",
                "num_experts_per_tok": config.get("num_experts_per_tok"),
                "quantization_config": config.get("quantization_config") or {},
            },
            "_error": model.get("_error") or "",
        }
    return output


def main() -> None:
    repo_root = Path(__file__).resolve().parents[4]
    load_dotenv(repo_root / ".env")
    load_dotenv(repo_root / "scripts" / ".env", override=False)
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    RAW_DIR.mkdir(parents=True, exist_ok=True)

    openrouter_key = (
        os.getenv("OPENROUTER_API_KEY")
        or os.getenv("OPENROUTER_MANAGEMENT_API_KEY")
        or os.getenv("OpenRouter_MANAGEMENT_KEY")
        or ""
    ).strip()
    zenmux_management_key = (
        os.getenv("ZENMUX_MANAGEMENT_API_KEY")
        or os.getenv("ZenMux_MANAGEMENT_KEY")
        or ""
    ).strip()
    hf_token = os.getenv("HF_TOKEN", "").strip()

    openrouter_catalog = fetch_openrouter_catalog()
    (
        openrouter_usage,
        openrouter_summary,
        openrouter_raw,
    ) = fetch_openrouter_usage(openrouter_key)
    zenmux_catalog = fetch_zenmux_catalog()
    zenmux_usage, zenmux_summary, zenmux_raw = fetch_zenmux_usage(
        zenmux_management_key
    )

    hf_ids = sorted(
        {
            resolved_hf_id(model)
            for model in openrouter_catalog
            if resolved_hf_id(model)
            and (
                str(model.get("canonical_slug") or "") in openrouter_usage
                or str(model.get("id") or "") in openrouter_usage
                or model_key(str(model.get("canonical_slug") or ""))
                in {model_key(key) for key in openrouter_usage}
            )
        }
    )
    hf_models = fetch_hf_models(hf_ids, hf_token)
    hf_resolved = sum(
        bool(model.get("id")) and not model.get("_error")
        for model in hf_models.values()
    )

    rows = build_rows(
        openrouter_catalog,
        openrouter_usage,
        zenmux_catalog,
        zenmux_usage,
        hf_models,
    )
    zenmux_available = zenmux_summary.get("status") == "complete"
    effective_weights = add_scores(rows, zenmux_available)
    top50 = rows[:50]

    source_summary = {
        "generated_at": datetime.now(UTC).isoformat(),
        "table_grain": (
            "One OpenRouter model endpoint/release; free and paid variants merged."
        ),
        "eligibility_rule": (
            "Observed OpenRouter usage plus a resolved, non-private Hugging Face "
            "weight repository linked by OpenRouter."
        ),
        "openrouter_usage": openrouter_summary,
        "zenmux_usage": zenmux_summary,
        "huggingface": {
            "status": "complete" if hf_resolved == len(hf_ids) else "partial",
            "source_url": "https://huggingface.co/api/models/{model_id}",
            "requested_models": len(hf_ids),
            "resolved_models": hf_resolved,
            "metrics": "30-day downloads, all-time downloads, cumulative likes",
            "caveat": (
                "Downloads are repository downloads, not API calls or unique users."
            ),
        },
        "effective_composite_weights": effective_weights,
        "ranking_status": (
            "complete_three_sources"
            if zenmux_available
            else "provisional_without_zenmux_usage"
        ),
        "open_weight_caveat": (
            "Open-weight means weights are obtainable from a public Hugging Face "
            "repository. License class must still be checked for commercial, "
            "redistribution, and use restrictions."
        ),
    }

    write_csv(ALL_PATH, rows)
    write_csv(TOP50_PATH, top50)
    write_csv(
        QUALITY_PATH,
        quality_checks(
            rows,
            top50,
            source_summary,
            len(openrouter_catalog),
            len(hf_ids),
            hf_resolved,
        ),
    )
    write_json(SOURCE_PATH, source_summary)
    write_json(RAW_DIR / "openrouter_usage_snapshot.json", openrouter_raw)
    write_json(RAW_DIR / "zenmux_usage_snapshot.json", zenmux_raw)
    write_json(
        RAW_DIR / "zenmux_model_catalog.json",
        {"data": zenmux_catalog},
    )
    write_json(
        RAW_DIR / "huggingface_metadata.json",
        compact_hf_snapshot(hf_models),
    )

    print(
        json.dumps(
            {
                "ranking_status": source_summary["ranking_status"],
                "openrouter_catalog_models": len(openrouter_catalog),
                "hf_models_requested": len(hf_ids),
                "hf_models_resolved": hf_resolved,
                "eligible_open_weight_candidates": len(rows),
                "top50_path": str(TOP50_PATH.relative_to(ROOT)),
                "all_candidates_path": str(ALL_PATH.relative_to(ROOT)),
                "zenmux_usage_status": zenmux_summary.get("status"),
            },
            ensure_ascii=False,
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
