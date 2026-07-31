#!/usr/bin/env python3
"""Render a data-backed Large Models landscape prototype."""

from __future__ import annotations

import csv
import html
import json
import math
import os
import re
from collections import Counter
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import requests


ROOT = Path(__file__).resolve().parents[1]
DATA_PATH = ROOT / "data" / "monthly_models_top50_open_closed.csv"
OUTPUT_DATA_PATH = ROOT / "data" / "large_models_landscape_top50.csv"
BENCHMARK_PATH = ROOT / "data" / "artificial_analysis_public_snapshot.json"
HTML_PATH = ROOT / "large_models_landscape_prototype.html"
INTERACTIVE_CSS_PATH = ROOT / "large_models_interactive.css"
INTERACTIVE_JS_PATH = ROOT / "large_models_interactive.js"
PUBLIC_HTML_PATH = ROOT.parents[2] / "public" / "keynote" / "large-models" / "index.html"

AA_MODELS_URL = "https://artificialanalysis.ai/models"

DOMAIN_ORDER = [
    "Frontier Generalist",
    "Reasoning, Math & Science",
    "Coding & Agentic",
    "Multimodal & Realtime",
    "Efficient, Edge & Specialized",
]

DOMAIN_COLORS = {
    "Frontier Generalist": "#f48ac6",
    "Reasoning, Math & Science": "#75b7eb",
    "Coding & Agentic": "#55c99a",
    "Multimodal & Realtime": "#a98bea",
    "Efficient, Edge & Specialized": "#f0ad5b",
}

DOMAIN_MODELS = {
    "Frontier Generalist": [
        "Claude Opus 4.8",
        "Claude Opus 4.7",
        "GPT-5.5",
        "Claude Opus 4.6",
        "GPT-5.4",
        "Gemini 3.1 Pro Preview",
        "Claude Fable 5",
        "Qwen3.7 Max",
        "GPT-5.2",
        "owl-alpha",
    ],
    "Reasoning, Math & Science": [
        "DeepSeek V4 Flash",
        "DeepSeek V4 Pro",
        "GLM 5.2",
        "GLM 5.1",
        "DeepSeek V3.2",
        "MiMo-V2.5-Pro",
        "Hy3 preview",
        "GLM 5",
        "MiniMax M2.7",
        "GLM 4.7",
    ],
    "Coding & Agentic": [
        "Claude Sonnet 4.6",
        "Kimi K2.7 Code",
        "Kimi K2.6",
        "Claude Sonnet 4.5",
        "GPT-5.3-Codex",
        "laguna-m.1-20260312:free",
        "Kimi K2.5",
        "Nex-N2-Pro",
    ],
    "Multimodal & Realtime": [
        "Step 3.7 Flash",
        "MiniMax M3",
        "Gemini 3 Flash Preview",
        "Gemini 3.5 Flash",
        "MiMo-V2.5",
        "Gemini 2.5 Flash",
        "Qwen3.7 Plus",
        "Gemma 4 26B A4B",
        "Gemma 4 31B",
        "Claude Opus 4.5",
    ],
    "Efficient, Edge & Specialized": [
        "Gemini 2.5 Flash Lite",
        "Claude Haiku 4.5",
        "Gemini 3.1 Flash Lite",
        "GPT-5.4 Mini",
        "GPT-4o-mini",
        "Gemini 3.1 Flash Lite Preview",
        "gpt-oss-120b",
        "Nemotron 3 Super",
        "Mistral Nemo",
        "GPT-5 Mini",
        "Qwen3 235B A22B Instruct 2507",
        "Qwen3 Embedding 8B",
    ],
}

VENDOR_LOGOS = {
    "Anthropic": "anthropic-text.svg",
    "DeepSeek": "deepseek-text.svg",
    "Google": "gemini-text.svg",
    "MiniMax": "minimax-text.svg",
    "Mistral": "mistral-text.svg",
    "MoonshotAI": "kimi-text.svg",
    "Nex AGI": "nexagi-text.svg",
    "NVIDIA": "nvidia-text.svg",
    "OpenAI": "openai-text.svg",
    "Openrouter": "openrouter-text.svg",
    "Poolside": "poolside-text.svg",
    "Qwen": "qwen-text.svg",
    "StepFun": "stepfun-text.svg",
    "Tencent": "tencent-text.svg",
    "Xiaomi": "xiaomimimo-text.svg",
    "Z.ai": "zai-text.svg",
}

AA_LABELS = {
    "Claude Opus 4.8": "Claude Opus 4.8 (max)",
    "Claude Fable 5": "Claude Fable 5 (with fallback)",
    "GLM 5.2": "GLM-5.2 (max)",
    "Qwen3.7 Max": "Qwen3.7 Max",
    "MiniMax M3": "MiniMax-M3",
    "DeepSeek V4 Pro": "DeepSeek V4 Pro (max)",
    "MiMo-V2.5-Pro": "MiMo-V2.5-Pro",
    "DeepSeek V4 Flash": "DeepSeek V4 Flash (max)",
}

DISPLAY_NAMES = {
    "laguna-m.1-20260312:free": "Laguna M.1",
    "Qwen3 235B A22B Instruct 2507": "Qwen3 235B A22B",
    "Hy3 preview": "HY 3 Preview",
}


def read_rows() -> list[dict[str, Any]]:
    with DATA_PATH.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    for row in rows:
        for field in (
            "model_name",
            "vendor",
            "license",
            "license_class",
            "weight_access_status",
            "primary_category",
            "capability_tags",
        ):
            row[field] = str(row.get(field) or "").strip()
        row["usage_composite_rank"] = int(row["usage_composite_rank"])
        row["usage_composite_score"] = float(row["usage_composite_score"])
        row["is_open_weight"] = row["is_open_weight"].lower() == "true"
        row["parameter_count_b"] = (
            float(row["parameter_count_b"])
            if row.get("parameter_count_b")
            else None
        )
    return rows


def domain_map() -> dict[str, str]:
    mapping: dict[str, str] = {}
    for domain, models in DOMAIN_MODELS.items():
        for model in models:
            if model in mapping:
                raise ValueError(f"Duplicate editorial domain mapping: {model}")
            mapping[model] = domain
    return mapping


def fetch_public_benchmarks() -> dict[str, Any]:
    response = requests.get(
        AA_MODELS_URL,
        timeout=30,
        headers={"User-Agent": "agentic-ai-landscape/1.0"},
    )
    response.raise_for_status()
    scripts = re.findall(
        r'<script[^>]+type="application/ld\+json"[^>]*>(.*?)</script>',
        response.text,
        re.DOTALL,
    )
    datasets = [json.loads(script) for script in scripts]
    intelligence = next(
        dataset
        for dataset in datasets
        if dataset.get("name") == "Artificial Analysis Intelligence Index"
    )
    snapshot = {
        "source_url": AA_MODELS_URL,
        "retrieved_at": datetime.now(UTC).isoformat(),
        "dataset_name": intelligence["name"],
        "description": intelligence.get("description") or "",
        "coverage_note": (
            "Public page JSON-LD exposes the currently displayed leaderboard "
            "rows, not the full commercial data API."
        ),
        "data": intelligence.get("data") or [],
    }
    BENCHMARK_PATH.write_text(
        json.dumps(snapshot, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    return snapshot


def benchmark_scores(snapshot: dict[str, Any]) -> dict[str, float]:
    return {
        str(row["label"]): round(float(row["intelligenceIndex"]), 1)
        for row in snapshot.get("data") or []
        if row.get("label") and row.get("intelligenceIndex") is not None
    }


def parameter_label(value: float | None) -> str:
    if value is None:
        return "Params undisclosed"
    if value >= 1000:
        return f"{value / 1000:.2f}T params"
    if value >= 100:
        return f"{value:.0f}B params"
    if value >= 10:
        return f"{value:.1f}B params"
    return f"{value:.2f}B params"


def license_label(row: dict[str, Any]) -> str:
    if not row["is_open_weight"]:
        return "API-only"
    license_name = str(row.get("license") or "custom").upper()
    if license_name == "APACHE-2.0":
        return "APACHE 2.0"
    return license_name


def access_class(row: dict[str, Any]) -> str:
    if not row["is_open_weight"]:
        return "api-only"
    if row.get("license_class") == "open_source_license":
        return "open-osi"
    return "open-custom"


def capability_tags(row: dict[str, Any]) -> list[str]:
    raw = set(str(row.get("capability_tags") or "").split("|"))
    tags: list[str] = []
    for source, label in (
        ("reasoning", "REASON"),
        ("coding", "CODE"),
        ("image_input", "VISION"),
        ("video_input", "VIDEO"),
        ("audio_input", "AUDIO"),
        ("tool_use", "TOOLS"),
    ):
        if source in raw:
            tags.append(label)
    return tags[:3]


def all_capability_tags(row: dict[str, Any]) -> list[str]:
    raw = set(str(row.get("capability_tags") or "").split("|"))
    return [
        label
        for source, label in (
            ("reasoning", "Reasoning"),
            ("coding", "Coding"),
            ("image_input", "Vision input"),
            ("video_input", "Video input"),
            ("audio_input", "Audio input"),
            ("tool_use", "Tool use"),
            ("structured_output", "Structured output"),
            ("embeddings_output", "Embeddings"),
        )
        if source in raw
    ]


def optional_number(row: dict[str, Any], field: str) -> float | int | None:
    value = row.get(field)
    if value in (None, ""):
        return None
    number = float(value)
    return int(number) if number.is_integer() else number


def model_payload(row: dict[str, Any]) -> dict[str, Any]:
    model_name = str(row["model_name"])
    aai = row.get("aai_score")
    return {
        "name": model_name,
        "displayName": DISPLAY_NAMES.get(model_name, model_name),
        "vendor": str(row["vendor"]),
        "domain": str(row["landscape_domain"]),
        "rank": int(row["usage_composite_rank"]),
        "usage": float(row["usage_composite_score"]),
        "aai": float(aai) if aai not in (None, "") else None,
        "isOpen": bool(row["is_open_weight"]),
        "access": str(row["weight_access_status"]),
        "license": license_label(row),
        "licenseClass": str(row.get("license_class") or ""),
        "parameters": parameter_label(row["parameter_count_b"]),
        "category": str(row.get("primary_category") or ""),
        "capabilities": all_capability_tags(row),
        "sourcePresence": [
            source
            for source in str(row.get("source_presence") or "").split("|")
            if source
        ],
        "openrouter": {
            "rank": optional_number(row, "openrouter_monthly_rank"),
            "score": optional_number(row, "openrouter_monthly_score"),
            "days": optional_number(row, "openrouter_daily_top50_appearances"),
            "tokens": optional_number(row, "openrouter_monthly_tokens"),
            "url": str(row.get("openrouter_url") or ""),
        },
        "zenmux": {
            "rank": optional_number(row, "zenmux_monthly_rank"),
            "score": optional_number(row, "zenmux_monthly_score"),
            "tokens": optional_number(row, "zenmux_monthly_tokens"),
            "url": str(row.get("zenmux_url") or ""),
        },
        "huggingface": {
            "downloads30d": optional_number(row, "hf_downloads_30d"),
            "downloadsAll": optional_number(row, "hf_downloads_all_time"),
            "likes": optional_number(row, "hf_likes"),
            "score": optional_number(row, "hf_open_ecosystem_score"),
            "gated": str(row.get("hf_gated") or "").lower() == "true",
            "url": str(row.get("huggingface_url") or ""),
        },
        "contextLength": optional_number(row, "context_length"),
        "inputModalities": [
            item
            for item in str(row.get("input_modalities") or "").split("|")
            if item
        ],
        "outputModalities": [
            item
            for item in str(row.get("output_modalities") or "").split("|")
            if item
        ],
        "promptPrice": optional_number(row, "prompt_price_usd_per_million"),
        "completionPrice": optional_number(
            row, "completion_price_usd_per_million"
        ),
    }


def vendor_logo(row: dict[str, Any]) -> str:
    vendor = str(row["vendor"])
    filename = VENDOR_LOGOS.get(vendor)
    if filename:
        return (
            '<img class="vendor-logo" '
            f'src="assets/vendor-logos/{html.escape(filename)}" '
            f'alt="{html.escape(vendor)}">'
        )
    return f'<span class="vendor-fallback">{html.escape(vendor)}</span>'


def model_card(row: dict[str, Any]) -> str:
    aai = row.get("aai_score")
    benchmark = (
        f'<span class="metric benchmark">AAI {float(aai):.1f}</span>'
        if aai not in (None, "")
        else ""
    )
    tags = "".join(
        f'<span class="tag">{html.escape(tag)}</span>'
        for tag in capability_tags(row)
    )
    rank = int(row["usage_composite_rank"])
    rank_class = " top-rank" if rank <= 10 else ""
    payload = model_payload(row)
    payload_json = html.escape(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        quote=True,
    )
    model_name = html.escape(str(payload["displayName"]))
    vendor = html.escape(str(payload["vendor"]), quote=True)
    return f"""
      <article
        class="model-card {access_class(row)}"
        role="button"
        tabindex="0"
        aria-label="Open details for {model_name}"
        data-model-json="{payload_json}"
        data-model-name="{model_name}"
        data-vendor="{vendor}"
        data-access="{'open' if row['is_open_weight'] else 'api'}"
        data-rank="{rank}"
        data-has-aai="{'true' if aai not in (None, '') else 'false'}"
      >
        <div class="card-top">
          <span class="rank{rank_class}">#{rank}</span>
          {vendor_logo(row)}
          <span class="access">{'OPEN' if row['is_open_weight'] else 'API'}</span>
        </div>
        <div class="model-name">{model_name}</div>
        <div class="card-meta">
          <span>{html.escape(license_label(row))}</span>
          <span>{html.escape(parameter_label(row['parameter_count_b']))}</span>
        </div>
        <div class="card-bottom">
          <div class="tags">{tags}</div>
          <div class="metrics">
            <span class="metric">USE {float(row['usage_composite_score']):.1f}</span>
            {benchmark}
          </div>
        </div>
      </article>
    """


def panel_html(domain: str, rows: list[dict[str, Any]]) -> str:
    open_count = sum(row["is_open_weight"] for row in rows)
    api_count = len(rows) - open_count
    cards = "".join(model_card(row) for row in rows)
    color = DOMAIN_COLORS[domain]
    return f"""
      <section class="domain-panel" style="--accent:{color}" data-domain="{html.escape(domain, quote=True)}">
        <div class="domain-heading">
          <h2>{html.escape(domain)}</h2>
          <span class="domain-count">{len(rows)} models</span>
          <span class="mix">{open_count} open / {api_count} API</span>
        </div>
        <div class="model-grid">{cards}</div>
      </section>
    """


def benchmark_panel_html(rows: list[dict[str, Any]]) -> str:
    benchmark_rows = [
        row for row in rows if row.get("aai_score") not in (None, "")
    ]
    benchmark_rows.sort(key=lambda row: float(row["aai_score"]), reverse=True)
    items = []
    for index, row in enumerate(benchmark_rows, start=1):
        access = "OPEN" if row["is_open_weight"] else "API"
        items.append(
            f"""
            <div
              class="benchmark-row"
              role="button"
              tabindex="0"
              data-model-name="{html.escape(str(DISPLAY_NAMES.get(str(row['model_name']), str(row['model_name']))), quote=True)}"
            >
              <span class="benchmark-order">{index}</span>
              <div class="benchmark-model">
                <strong>{html.escape(DISPLAY_NAMES.get(str(row['model_name']), str(row['model_name'])))}</strong>
                <span>{html.escape(str(row['vendor']))} &middot; Usage #{int(row['usage_composite_rank'])}</span>
              </div>
              <span class="benchmark-access {'open' if row['is_open_weight'] else ''}">{access}</span>
              <strong class="benchmark-score">{float(row['aai_score']):.1f}</strong>
            </div>
            """
        )
    return f"""
      <section class="domain-panel benchmark-panel" style="--accent:#55c8c5">
        <div class="domain-heading">
          <h2>Benchmark Lens</h2>
          <span>Artificial Analysis Intelligence Index</span>
        </div>
        <div class="benchmark-list">
          {''.join(items)}
        </div>
        <div class="benchmark-note">
          <strong>USE is adoption. AAI is evaluated capability.</strong>
          <span>Only models visible in the public AAI leaderboard snapshot receive a badge; missing does not mean zero.</span>
        </div>
      </section>
    """


def build_html(rows: list[dict[str, Any]]) -> str:
    panels = []
    for domain in DOMAIN_ORDER:
        domain_rows = [row for row in rows if row["landscape_domain"] == domain]
        best_vendor_rank = {
            vendor: min(
                int(row["usage_composite_rank"])
                for row in domain_rows
                if row["vendor"] == vendor
            )
            for vendor in {str(row["vendor"]) for row in domain_rows}
        }
        domain_rows.sort(
            key=lambda row: (
                best_vendor_rank[str(row["vendor"])],
                str(row["vendor"]),
                int(row["usage_composite_rank"]),
            )
        )
        panels.append(panel_html(domain, domain_rows))
    panels.append(benchmark_panel_html(rows))

    open_count = sum(row["is_open_weight"] for row in rows)
    api_count = len(rows) - open_count
    top10_open = sum(row["is_open_weight"] for row in rows if row["usage_composite_rank"] <= 10)
    aai_count = sum(row.get("aai_score") not in (None, "") for row in rows)
    interactive_css = INTERACTIVE_CSS_PATH.read_text(encoding="utf-8")
    interactive_js = INTERACTIVE_JS_PATH.read_text(encoding="utf-8")

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=3840, initial-scale=1">
  <title>Large Models Landscape 2026</title>
  <style>
    * {{ box-sizing: border-box; }}
    html, body {{
      width: 3840px;
      height: 2160px;
      margin: 0;
      overflow: hidden;
      background: #f7f8fa;
      color: #111318;
      font-family: "Alibaba PuHuiTi", "阿里巴巴普惠体", sans-serif;
      letter-spacing: 0;
    }}
    body {{ position: relative; }}
    .canvas {{
      width: 3840px;
      height: 2160px;
      padding: 42px 58px 34px 172px;
      display: grid;
      grid-template-rows: 154px 118px 74px 1fr 54px;
      gap: 16px;
      background:
        linear-gradient(#ffffff, #ffffff) padding-box,
        #ffffff;
    }}
    .side-label {{
      position: absolute;
      left: 54px;
      top: 300px;
      bottom: 92px;
      width: 88px;
      border: 4px solid #111318;
      border-radius: 28px;
      background: #cbd5ff;
      display: flex;
      align-items: center;
      justify-content: center;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-size: 38px;
      font-weight: 850;
    }}
    header {{
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      border-bottom: 3px solid #111318;
    }}
    h1 {{
      margin: 0;
      font-size: 78px;
      line-height: 1;
      font-weight: 900;
    }}
    .subtitle {{
      margin-top: 13px;
      font-size: 24px;
      color: #4a4f58;
      font-weight: 600;
    }}
    .brands {{
      display: flex;
      align-items: center;
      gap: 28px;
      font-size: 24px;
      font-weight: 850;
      text-align: right;
    }}
    .brands .ant {{ color: #126ed0; }}
    .brands .inclusion {{ color: #4867df; }}
    .summary {{
      display: grid;
      grid-template-columns: 1.25fr 1fr 1fr 1.15fr;
      gap: 16px;
    }}
    .summary-item {{
      border: 3px solid #111318;
      border-radius: 8px;
      background: #ffffff;
      padding: 16px 22px;
      display: flex;
      align-items: center;
      gap: 18px;
      min-width: 0;
    }}
    .summary-item strong {{
      font-size: 36px;
      line-height: 1;
      white-space: nowrap;
    }}
    .summary-item span {{
      font-size: 20px;
      line-height: 1.2;
      color: #565b63;
      font-weight: 650;
    }}
    .summary-item.score {{
      background: #111318;
      color: white;
    }}
    .summary-item.score span {{ color: #d8dbe1; }}
    .summary-item.open strong {{ color: #176bb2; }}
    .summary-item.api strong {{ color: #222222; }}
    .panels {{
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-template-rows: repeat(2, minmax(0, 1fr));
      gap: 22px;
      min-height: 0;
    }}
    .domain-panel {{
      position: relative;
      min-width: 0;
      min-height: 0;
      padding: 72px 18px 18px;
      border: 4px solid #111318;
      border-radius: 10px;
      background: #ffffff;
      overflow: hidden;
    }}
    .domain-heading {{
      position: absolute;
      top: -2px;
      left: 24px;
      right: 24px;
      height: 58px;
      display: flex;
      align-items: center;
      gap: 18px;
    }}
    .domain-heading h2 {{
      margin: 0;
      padding: 8px 18px 9px;
      border: 3px solid #111318;
      border-top: 0;
      border-radius: 0 0 8px 8px;
      background: var(--accent);
      font-size: 30px;
      line-height: 1;
      font-weight: 900;
    }}
    .domain-heading span {{
      font-size: 17px;
      font-weight: 750;
      color: #555b64;
    }}
    .domain-heading .mix {{
      margin-left: auto;
      color: #272b31;
    }}
    .model-grid {{
      height: 100%;
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      grid-auto-rows: 154px;
      gap: 12px;
      align-content: start;
    }}
    .model-card {{
      min-width: 0;
      min-height: 0;
      padding: 10px 12px 9px;
      border: 2.5px solid #25282e;
      border-radius: 7px;
      background: #ffffff;
      display: grid;
      grid-template-rows: 28px minmax(42px, auto) 23px 1fr;
      gap: 5px;
      overflow: hidden;
    }}
    .model-card.open-osi {{
      border-color: #267cc2;
      background: #eaf4ff;
    }}
    .model-card.open-custom {{
      border-color: #c89118;
      background:
        repeating-linear-gradient(
          135deg,
          #fff7db 0,
          #fff7db 13px,
          #ffefba 13px,
          #ffefba 20px
        );
    }}
    .card-top {{
      display: flex;
      align-items: center;
      gap: 8px;
      min-width: 0;
    }}
    .rank {{
      width: 42px;
      height: 26px;
      border: 2px solid #30343a;
      border-radius: 13px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      background: #ffffff;
      font-size: 15px;
      font-weight: 850;
      flex: 0 0 auto;
    }}
    .rank.top-rank {{
      border-color: #1d8e58;
      color: #126a40;
      background: #dff6e9;
    }}
    .vendor-logo {{
      display: block;
      width: auto;
      max-width: 116px;
      height: 23px;
      object-fit: contain;
      object-position: left center;
      min-width: 0;
    }}
    .vendor-fallback {{
      font-size: 15px;
      font-weight: 900;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }}
    .access {{
      margin-left: auto;
      padding: 4px 7px;
      border-radius: 4px;
      background: #22262c;
      color: white;
      font-size: 12px;
      font-weight: 900;
      line-height: 1;
      flex: 0 0 auto;
    }}
    .open-osi .access {{ background: #267cc2; }}
    .open-custom .access {{ background: #b27b0e; }}
    .model-name {{
      align-self: center;
      font-size: 22px;
      line-height: 1.02;
      font-weight: 900;
      overflow-wrap: anywhere;
    }}
    .card-meta {{
      display: flex;
      justify-content: space-between;
      gap: 6px;
      font-size: 13px;
      color: #4e535c;
      font-weight: 750;
      white-space: nowrap;
    }}
    .card-bottom {{
      align-self: end;
      display: flex;
      align-items: flex-end;
      justify-content: space-between;
      gap: 8px;
      min-width: 0;
    }}
    .tags {{
      display: flex;
      flex-wrap: wrap;
      gap: 3px;
      min-width: 0;
    }}
    .tag {{
      padding: 3px 5px;
      border: 1px solid #8d939d;
      border-radius: 3px;
      background: rgba(255,255,255,.78);
      font-size: 10px;
      line-height: 1;
      font-weight: 850;
      color: #3d424a;
    }}
    .metrics {{
      display: flex;
      gap: 4px;
      flex: 0 0 auto;
    }}
    .metric {{
      padding: 4px 6px;
      border-radius: 4px;
      background: #22262c;
      color: #ffffff;
      font-size: 11px;
      line-height: 1;
      font-weight: 900;
    }}
    .metric.benchmark {{ background: #7846b9; }}
    .benchmark-panel {{
      padding: 76px 22px 20px;
      display: grid;
      grid-template-rows: 1fr auto;
      gap: 14px;
    }}
    .benchmark-list {{
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      grid-auto-rows: 112px;
      gap: 12px;
      align-content: start;
    }}
    .benchmark-row {{
      display: grid;
      grid-template-columns: 34px minmax(0, 1fr) auto 62px;
      align-items: center;
      gap: 9px;
      padding: 10px 12px;
      border: 2.5px solid #292d33;
      border-radius: 7px;
      background: #ffffff;
    }}
    .benchmark-order {{
      width: 30px;
      height: 30px;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      background: #dff5f3;
      color: #176c69;
      font-size: 15px;
      font-weight: 900;
    }}
    .benchmark-model {{
      min-width: 0;
      display: grid;
      gap: 6px;
    }}
    .benchmark-model strong {{
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 20px;
    }}
    .benchmark-model span {{
      color: #5a6069;
      font-size: 13px;
      font-weight: 700;
    }}
    .benchmark-access {{
      padding: 4px 7px;
      border-radius: 4px;
      background: #24282e;
      color: white;
      font-size: 11px;
      font-weight: 900;
    }}
    .benchmark-access.open {{ background: #267cc2; }}
    .benchmark-score {{
      color: #7846b9;
      font-size: 27px;
      text-align: right;
    }}
    .benchmark-note {{
      padding: 15px 18px;
      border: 2.5px solid #2b2f35;
      border-radius: 7px;
      background: #e9f7f6;
      display: grid;
      gap: 5px;
    }}
    .benchmark-note strong {{ font-size: 20px; }}
    .benchmark-note span {{
      color: #4f5660;
      font-size: 15px;
      font-weight: 650;
    }}
    footer {{
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: 24px;
      font-size: 17px;
      color: #555b63;
      font-weight: 650;
    }}
    .legend {{
      display: flex;
      align-items: center;
      gap: 22px;
      white-space: nowrap;
    }}
    .legend-item {{
      display: inline-flex;
      align-items: center;
      gap: 7px;
    }}
    .swatch {{
      width: 30px;
      height: 18px;
      border: 2px solid #22262c;
      border-radius: 4px;
      background: white;
    }}
    .swatch.osi {{ background: #eaf4ff; border-color: #267cc2; }}
    .swatch.custom {{
      border-color: #c89118;
      background: repeating-linear-gradient(
        135deg, #fff7db 0, #fff7db 6px, #ffefba 6px, #ffefba 10px
      );
    }}
    {interactive_css}
  </style>
</head>
<body>
  <main class="canvas">
    <div class="side-label">Large Models</div>
    <header>
      <div>
        <h1>Large Models Landscape 2026</h1>
        <div class="subtitle">Capability-first view of the 50 most-used hosted model releases</div>
      </div>
      <div class="brands">
        <span class="ant">ANT OPEN SOURCE</span>
        <span class="inclusion">INCLUSION AI</span>
      </div>
    </header>

    <section class="summary" aria-label="Landscape filters">
      <button class="summary-item score is-active" type="button" data-primary-filter="all" aria-pressed="true">
        <strong>June 2026</strong>
        <span>All 50 · OpenRouter + ZenMux complete month</span>
      </button>
      <button class="summary-item open" type="button" data-primary-filter="open" aria-pressed="false">
        <strong>{open_count} OPEN</strong>
        <span>show public model weights</span>
      </button>
      <button class="summary-item api" type="button" data-primary-filter="api" aria-pressed="false">
        <strong>{api_count} API</strong>
        <span>show closed or no public weights</span>
      </button>
      <button class="summary-item" type="button" data-primary-filter="top10" aria-pressed="false">
        <strong>TOP 10: {top10_open}:{10 - top10_open}</strong>
        <span>open vs API-only · inspect the leaders</span>
      </button>
    </section>

    <section class="explore-toolbar" aria-label="Explore model cards">
      <label class="model-search">
        <span>FIND</span>
        <input id="model-search" type="search" placeholder="Model or vendor" autocomplete="off">
      </label>
      <label class="vendor-filter">
        <span>VENDOR</span>
        <select id="vendor-filter">
          <option value="all">All model makers</option>
        </select>
      </label>
      <button class="aai-filter" id="aai-filter" type="button" aria-pressed="false">
        <span>AAI LENS</span>
        <strong>{aai_count} matched</strong>
      </button>
      <button class="reset-filter" id="reset-filter" type="button">RESET</button>
      <p class="explore-hint"><strong>Click a model</strong> for its evidence passport</p>
    </section>

    <section class="panels">
      {''.join(panels)}
    </section>

    <footer>
      <div>
        <strong id="result-count" aria-live="polite">50 models shown</strong>
        · Usage = 50% OpenRouter percentile + 50% ZenMux percentile. AAI appears only where publicly matched.
      </div>
      <div class="legend">
        <span class="legend-item"><i class="swatch osi"></i> Open weights + OSI license</span>
        <span class="legend-item"><i class="swatch custom"></i> Open weights + custom license</span>
        <span class="legend-item"><i class="swatch"></i> API-only / no public weights</span>
      </div>
    </footer>
  </main>
  <div class="passport-backdrop" id="passport-backdrop" hidden></div>
  <aside
    class="model-passport"
    id="model-passport"
    role="dialog"
    aria-modal="true"
    aria-labelledby="passport-model-name"
    aria-hidden="true"
  >
    <button class="passport-close" id="passport-close" type="button" aria-label="Close model details">CLOSE ×</button>
    <header class="passport-header">
      <div class="passport-logo" id="passport-logo"></div>
      <p id="passport-vendor"></p>
      <h2 id="passport-model-name"></h2>
      <div class="passport-badges">
        <span id="passport-rank"></span>
        <span id="passport-domain"></span>
      </div>
    </header>
    <p class="passport-thesis">Adoption, access and evaluated capability are three different questions. This card keeps their evidence separate.</p>
    <section class="passport-lanes">
      <article class="passport-lane usage-lane">
        <span>01 · ADOPTION</span>
        <strong id="passport-usage"></strong>
        <small>Usage composite</small>
        <i><b id="passport-usage-bar"></b></i>
        <p>Equal-weight average of each platform’s monthly token percentile. Raw tokens are not added across platforms.</p>
      </article>
      <article class="passport-lane access-lane">
        <span>02 · ACCESS</span>
        <strong id="passport-access"></strong>
        <small id="passport-license"></small>
        <p id="passport-access-note"></p>
      </article>
      <article class="passport-lane capability-lane">
        <span>03 · CAPABILITY</span>
        <strong id="passport-aai"></strong>
        <small>Public AAI match</small>
        <p id="passport-aai-note"></p>
      </article>
    </section>
    <section class="passport-evidence" aria-label="Source evidence">
      <article>
        <span>OPENROUTER · JUNE</span>
        <strong id="passport-openrouter-rank"></strong>
        <p id="passport-openrouter-note"></p>
      </article>
      <article>
        <span>ZENMUX · JUNE</span>
        <strong id="passport-zenmux-rank"></strong>
        <p id="passport-zenmux-note"></p>
      </article>
      <article>
        <span>HUGGING FACE · OPEN MODELS</span>
        <strong id="passport-hf-score"></strong>
        <p id="passport-hf-note"></p>
      </article>
    </section>
    <section class="passport-specs">
      <div><span>Parameters</span><strong id="passport-parameters"></strong></div>
      <div><span>Context</span><strong id="passport-context"></strong></div>
      <div><span>Price / 1M tokens</span><strong id="passport-price"></strong></div>
      <div><span>Source coverage</span><strong id="passport-sources"></strong></div>
    </section>
    <section class="passport-capabilities">
      <span>CAPABILITY SIGNALS</span>
      <div id="passport-capabilities"></div>
    </section>
    <details class="metric-glossary">
      <summary>What exactly do these metrics mean?</summary>
      <div>
        <p><strong>Usage composite</strong> averages the model’s percentile inside OpenRouter and ZenMux. Missing a platform Top 50 contributes zero; it does not prove zero usage.</p>
        <p><strong>AAI</strong> is the Artificial Analysis Intelligence Index for models matched to the public snapshot. No badge means “not publicly matched”, not a score of zero.</p>
        <p><strong>HF ecosystem score</strong> is only for open-weight models: 75% 30-day download percentile + 25% likes percentile. It is not compared with API-only models.</p>
        <p><strong>Open weights</strong> means an official public weight repository was resolved. It does not automatically mean open training data, unrestricted redistribution or OSI-defined Open Source AI.</p>
      </div>
    </details>
    <nav class="passport-links" aria-label="Model source links">
      <a id="passport-openrouter-link" target="_blank" rel="noreferrer">OpenRouter ↗</a>
      <a id="passport-zenmux-link" target="_blank" rel="noreferrer">ZenMux ↗</a>
      <a id="passport-hf-link" target="_blank" rel="noreferrer">Hugging Face ↗</a>
    </nav>
  </aside>
  <script>{interactive_js}</script>
</body>
</html>
"""


def write_landscape_data(rows: list[dict[str, Any]]) -> None:
    fields = [
        "usage_composite_rank",
        "model_name",
        "vendor",
        "landscape_domain",
        "weight_access_status",
        "license",
        "parameter_count_b",
        "usage_composite_score",
        "aai_score",
        "primary_category",
        "capability_tags",
    ]
    with OUTPUT_DATA_PATH.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows({field: row.get(field, "") for field in fields} for row in rows)


def main() -> None:
    rows = read_rows()
    mapping = domain_map()
    names = {str(row["model_name"]) for row in rows}
    mapped_names = set(mapping)
    if names != mapped_names:
        missing = sorted(names - mapped_names)
        stale = sorted(mapped_names - names)
        raise ValueError(f"Editorial mapping mismatch; missing={missing}, stale={stale}")

    if os.environ.get("REFRESH_AAI") == "1" or not BENCHMARK_PATH.exists():
        benchmark = fetch_public_benchmarks()
    else:
        benchmark = json.loads(BENCHMARK_PATH.read_text(encoding="utf-8"))
    scores = benchmark_scores(benchmark)
    for row in rows:
        model_name = str(row["model_name"])
        row["landscape_domain"] = mapping[model_name]
        aa_label = AA_LABELS.get(model_name)
        row["aai_score"] = scores.get(aa_label, "") if aa_label else ""

    domain_counts = Counter(row["landscape_domain"] for row in rows)
    if set(domain_counts) != set(DOMAIN_ORDER):
        raise ValueError(f"Missing landscape domain: {domain_counts}")
    if len(rows) != 50:
        raise ValueError(f"Expected 50 models, got {len(rows)}")

    write_landscape_data(rows)
    rendered_html = "\n".join(
        line.rstrip() for line in build_html(rows).splitlines()
    ) + "\n"
    HTML_PATH.write_text(rendered_html, encoding="utf-8")
    PUBLIC_HTML_PATH.parent.mkdir(parents=True, exist_ok=True)
    PUBLIC_HTML_PATH.write_text(rendered_html, encoding="utf-8")
    print(
        json.dumps(
            {
                "models": len(rows),
                "domains": dict(domain_counts),
                "benchmark_matches": sum(
                    row.get("aai_score") not in (None, "") for row in rows
                ),
                "html": str(HTML_PATH.relative_to(ROOT)),
                "public_html": str(PUBLIC_HTML_PATH),
                "classified_data": str(OUTPUT_DATA_PATH.relative_to(ROOT)),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
