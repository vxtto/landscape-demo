#!/usr/bin/env python3
"""Render refreshed Agent Infra and Model Infra landscape prototypes."""

from __future__ import annotations

import csv
import html
import json
import re
import time
from collections import Counter
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import UTC, datetime
from pathlib import Path
from typing import Any
from urllib.parse import quote

import requests


REPO_ROOT = Path(__file__).resolve().parents[4]
ROOT = Path(__file__).resolve().parents[1]
SOURCE_PATH = REPO_ROOT / "data" / "agentic-ai-projects.csv"
ASSET_DIR = ROOT / "assets" / "github-avatars"
DATA_DIR = ROOT / "data"

AGENT_HTML_PATH = ROOT / "agent_infra_landscape_2026.html"
MODEL_HTML_PATH = ROOT / "model_infra_landscape_2026.html"
AGENT_DATA_PATH = DATA_DIR / "agent_infra_landscape_projects.csv"
MODEL_DATA_PATH = DATA_DIR / "model_infra_landscape_projects.csv"
SUMMARY_PATH = DATA_DIR / "infra_landscape_source_summary.json"

DISPLAY_OVERRIDES = {
    "ai": "Vercel AI SDK",
    "servers": "MCP",
    "skills": "Agent Skills",
    "adk-python": "Google ADK",
    "agent-framework": "Agent Framework",
    "agent-sandbox": "Agent Sandbox",
    "Model-Optimizer": "Model Optimizer",
    "TransformerEngine": "Transformer Engine",
    "flash-attention": "FlashAttention",
    "onnxruntime": "ONNX Runtime",
    "label-studio": "Label Studio",
    "LlamaFactory": "LLaMA Factory",
    "mcp-context-forge": "ContextForge",
}

AGENT_GROUPS = [
    {
        "name": "Agentic Applications",
        "color": "#f48ac6",
        "weight": "1.00fr",
        "sections": [
            ("Agentic coding", "1.9fr", 3),
            ("Personal AI assistants", "1.15fr", 2),
            ("Chatbot workspaces", "0.75fr", 1),
            ("Coding harnesses", "0.80fr", 1),
        ],
    },
    {
        "name": "Agent Frameworks",
        "color": "#d99be7",
        "weight": "0.82fr",
        "sections": [
            ("Code-first frameworks", "1.8fr", 3),
            ("Workflow & agent builders", "1.05fr", 2),
            ("Multi-agent orchestration", "0.80fr", 1),
        ],
    },
    {
        "name": "Agent Runtime Infrastructure",
        "color": "#ee86bd",
        "weight": "1.18fr",
        "sections": [
            ("Memory, knowledge & context", "1.35fr", 2),
            ("Protocols & interoperability", "0.95fr", 1),
            ("Tool & browser use", "0.85fr", 1),
            ("Observability & evaluation", "0.85fr", 1),
            ("Development sandboxes", "0.90fr", 1),
        ],
    },
]

MODEL_GROUPS = [
    {
        "name": "Serving",
        "color": "#75b7eb",
        "sections": [
            ("Serving · Deploy", "0.75fr", 1),
            ("Serving · Inference", "1.65fr", 3),
            ("Model API gateways", "1.05fr", 2),
        ],
    },
    {
        "name": "Post-Train",
        "color": "#75b7eb",
        "sections": [
            ("Post-Train · Reinforcement learning", "1fr", 2),
            ("Post-Train · Supervised fine-tuning", "0.85fr", 1),
        ],
    },
    {
        "name": "Pre-Train",
        "color": "#75b7eb",
        "sections": [
            ("Pre-Train · Framework & parallel", "1.30fr", 3),
            ("Pre-Train · Compiler & accelerator", "1.65fr", 4),
            ("Pre-Train · Evaluation & observability", "0.72fr", 1),
            ("Pre-Train · Robotics infra", "0.70fr", 1),
        ],
    },
    {
        "name": "Data",
        "color": "#75b7eb",
        "sections": [
            ("Data · Labeling", "0.70fr", 1),
            ("Data · Integration", "0.95fr", 1),
            ("Data · Governance", "1.85fr", 3),
        ],
    },
    {
        "name": "Compute & Scheduling",
        "color": "#75b7eb",
        "sections": [
            ("Compute & scheduling", "1fr", 4),
        ],
    },
]


def as_number(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        number = float(value)
    except (TypeError, ValueError):
        return None
    return number if number == number else None


def read_selected_rows() -> list[dict[str, Any]]:
    with SOURCE_PATH.open(encoding="utf-8-sig", newline="") as handle:
        rows = list(csv.DictReader(handle))
    selected = []
    for row in rows:
        if str(row.get("landscape_action") or "").strip() not in {"keep", "add"}:
            continue
        normalized = {
            key: str(value or "").strip()
            for key, value in row.items()
        }
        normalized["openrank_value"] = as_number(row.get("openrank_2606"))
        normalized["stars_value"] = as_number(row.get("stars"))
        selected.append(normalized)
    return selected


def owner_name(repo_name: str) -> str:
    return repo_name.split("/", 1)[0]


def project_name(repo_name: str) -> str:
    tail = repo_name.split("/", 1)[-1]
    return DISPLAY_OVERRIDES.get(tail, tail)


def avatar_filename(owner: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", owner.lower()).strip("-") + ".png"


def download_avatar(owner: str) -> tuple[str, str]:
    ASSET_DIR.mkdir(parents=True, exist_ok=True)
    destination = ASSET_DIR / avatar_filename(owner)
    if destination.exists() and destination.stat().st_size > 100:
        return owner, "cached"
    url = f"https://github.com/{quote(owner)}.png?size=128"
    last_error = ""
    for attempt in range(3):
        try:
            response = requests.get(
                url,
                timeout=25,
                headers={"User-Agent": "agentic-ai-landscape/1.0"},
            )
            response.raise_for_status()
            if not response.headers.get("content-type", "").startswith("image/"):
                raise ValueError("response was not an image")
            destination.write_bytes(response.content)
            return owner, "downloaded"
        except Exception as exc:  # noqa: BLE001
            last_error = str(exc)
            time.sleep(0.5 * (attempt + 1))
    return owner, f"failed: {last_error}"


def download_avatars(rows: list[dict[str, Any]]) -> dict[str, str]:
    owners = sorted({owner_name(str(row["repo_name"])) for row in rows})
    results: dict[str, str] = {}
    with ThreadPoolExecutor(max_workers=10) as executor:
        futures = {
            executor.submit(download_avatar, owner): owner
            for owner in owners
        }
        for future in as_completed(futures):
            owner, status = future.result()
            results[owner] = status
    return results


def openrank_label(value: float | None) -> str:
    if value is None:
        return "OR -"
    if value >= 100:
        return f"OR {value:.0f}"
    if value >= 10:
        return f"OR {value:.1f}"
    return f"OR {value:.2f}"


def project_card(row: dict[str, Any]) -> str:
    repo = str(row["repo_name"])
    owner = owner_name(repo)
    avatar = f"assets/github-avatars/{avatar_filename(owner)}"
    is_new = row["landscape_action"] == "add"
    new_badge = '<span class="new-badge">NEW</span>' if is_new else ""
    return f"""
      <article class="project-card{' new-project' if is_new else ''}">
        <img class="avatar" src="{html.escape(avatar)}" alt="">
        <div class="project-copy">
          <strong>{html.escape(project_name(repo))}</strong>
          <span>{html.escape(owner)}</span>
        </div>
        <div class="project-signals">
          {new_badge}
          <span class="openrank">{html.escape(openrank_label(row['openrank_value']))}</span>
        </div>
      </article>
    """


def section_html(
    section_name: str,
    section_rows: list[dict[str, Any]],
    width: str,
    columns: int,
) -> str:
    section_rows.sort(
        key=lambda row: (
            -(row["openrank_value"] if row["openrank_value"] is not None else -1),
            str(row["repo_name"]).lower(),
        )
    )
    added = sum(row["landscape_action"] == "add" for row in section_rows)
    cards = "".join(project_card(row) for row in section_rows)
    display_name = section_name.split(" · ", 1)[-1]
    return f"""
      <section class="subsection" style="--card-columns:{columns}">
        <div class="subsection-title">
          <h3>{html.escape(display_name)}</h3>
          <span>{len(section_rows)} projects{f' / {added} new' if added else ''}</span>
        </div>
        <div class="project-grid">{cards}</div>
      </section>
    """


def major_group_html(
    group: dict[str, Any],
    rows: list[dict[str, Any]],
) -> str:
    subsections = []
    section_names = {str(section[0]) for section in group["sections"]}
    for section_name, width, columns in group["sections"]:
        section_rows = [
            row for row in rows if row["landscape_section"] == section_name
        ]
        if not section_rows:
            raise ValueError(f"Empty section in rendering map: {section_name}")
        subsections.append(
            section_html(section_name, section_rows, width, columns)
        )
    group_count = sum(
        row["landscape_section"] in section_names
        for row in rows
    )
    return f"""
      <section class="major-group" style="--accent:{group['color']}">
        <div class="major-heading">
          <h2>{html.escape(str(group['name']))}</h2>
          <span>{group_count} projects</span>
        </div>
        <div class="subsections" style="grid-template-columns:{' '.join(section[1] for section in group['sections'])}">
          {''.join(subsections)}
        </div>
      </section>
    """


def common_styles(accent: str) -> str:
    return f"""
    * {{ box-sizing: border-box; }}
    html, body {{
      width: 3840px;
      height: 2160px;
      margin: 0;
      overflow: hidden;
      background: #ffffff;
      color: #111318;
      font-family: Inter, "Helvetica Neue", Arial, sans-serif;
      letter-spacing: 0;
    }}
    .canvas {{
      position: relative;
      width: 3840px;
      height: 2160px;
      padding: 40px 58px 34px 172px;
      display: grid;
      grid-template-rows: 148px 106px 1fr 48px;
      gap: 18px;
    }}
    .side-label {{
      position: absolute;
      left: 54px;
      top: 280px;
      bottom: 88px;
      width: 88px;
      border: 4px solid #111318;
      border-radius: 28px;
      background: {accent};
      display: flex;
      align-items: center;
      justify-content: center;
      writing-mode: vertical-rl;
      transform: rotate(180deg);
      font-size: 38px;
      font-weight: 900;
    }}
    header {{
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      border-bottom: 3px solid #111318;
    }}
    h1 {{
      margin: 0;
      font-size: 76px;
      line-height: 1;
      font-weight: 900;
    }}
    .subtitle {{
      margin-top: 12px;
      color: #505660;
      font-size: 23px;
      font-weight: 650;
    }}
    .brands {{
      display: flex;
      gap: 28px;
      font-size: 23px;
      font-weight: 900;
    }}
    .brands .ant {{ color: #126ed0; }}
    .brands .inclusion {{ color: #4867df; }}
    .summary {{
      display: grid;
      grid-template-columns: 1.2fr .9fr .9fr 1.25fr;
      gap: 16px;
    }}
    .summary-item {{
      min-width: 0;
      padding: 14px 20px;
      border: 3px solid #111318;
      border-radius: 8px;
      display: flex;
      align-items: center;
      gap: 15px;
      background: #ffffff;
    }}
    .summary-item.primary {{
      background: #111318;
      color: white;
    }}
    .summary-item strong {{
      font-size: 32px;
      line-height: 1;
      white-space: nowrap;
    }}
    .summary-item span {{
      color: #555b64;
      font-size: 18px;
      line-height: 1.2;
      font-weight: 650;
    }}
    .summary-item.primary span {{ color: #d7dae0; }}
    .content {{
      min-height: 0;
      display: grid;
      gap: 18px;
    }}
    .major-group {{
      position: relative;
      min-width: 0;
      min-height: 0;
      padding: 62px 16px 15px;
      border: 4px solid #111318;
      border-radius: 10px;
      background: #ffffff;
      overflow: hidden;
    }}
    .major-heading {{
      position: absolute;
      left: 22px;
      right: 22px;
      top: -2px;
      height: 52px;
      display: flex;
      align-items: center;
      gap: 16px;
    }}
    .major-heading h2 {{
      margin: 0;
      padding: 7px 17px 8px;
      border: 3px solid #111318;
      border-top: 0;
      border-radius: 0 0 8px 8px;
      background: var(--accent);
      font-size: 28px;
      line-height: 1;
      font-weight: 900;
    }}
    .major-heading span {{
      color: #555b64;
      font-size: 16px;
      font-weight: 800;
    }}
    .subsections {{
      height: 100%;
      display: grid;
      gap: 12px;
    }}
    .subsection {{
      min-width: 0;
      min-height: 0;
      padding: 47px 10px 10px;
      border: 2px solid #727780;
      border-radius: 7px;
      background: #fbfbfc;
      position: relative;
      overflow: hidden;
    }}
    .subsection-title {{
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 39px;
      padding: 0 10px;
      border-bottom: 2px solid #b2b6bd;
      background: #f0f1f3;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
    }}
    .subsection-title h3 {{
      margin: 0;
      font-size: 18px;
      line-height: 1;
      font-weight: 900;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }}
    .subsection-title span {{
      color: #5f6570;
      font-size: 12px;
      font-weight: 750;
      white-space: nowrap;
    }}
    .project-grid {{
      display: grid;
      grid-template-columns: repeat(var(--card-columns), minmax(0, 1fr));
      grid-auto-rows: 68px;
      gap: 8px;
      align-content: start;
    }}
    .project-card {{
      min-width: 0;
      min-height: 0;
      padding: 7px 8px;
      border: 2px solid #2a2e34;
      border-radius: 7px;
      background: #ffffff;
      display: grid;
      grid-template-columns: 48px minmax(0, 1fr) auto;
      align-items: center;
      gap: 8px;
    }}
    .project-card.new-project {{
      border-color: #168a55;
      background: #e9f8ef;
    }}
    .avatar {{
      width: 44px;
      height: 44px;
      border: 1px solid #c7cbd1;
      border-radius: 7px;
      background: #ffffff;
      object-fit: contain;
    }}
    .project-copy {{
      min-width: 0;
      display: grid;
      gap: 3px;
    }}
    .project-copy strong {{
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      font-size: 16px;
      line-height: 1;
    }}
    .project-copy span {{
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      color: #676d77;
      font-size: 11px;
      font-weight: 650;
    }}
    .project-signals {{
      display: grid;
      justify-items: end;
      gap: 4px;
    }}
    .new-badge {{
      padding: 3px 5px;
      border-radius: 3px;
      background: #168a55;
      color: white;
      font-size: 9px;
      line-height: 1;
      font-weight: 900;
    }}
    .openrank {{
      padding: 4px 6px;
      border-radius: 4px;
      background: #24282e;
      color: white;
      font-size: 10px;
      line-height: 1;
      font-weight: 900;
      white-space: nowrap;
    }}
    footer {{
      display: grid;
      grid-template-columns: 1fr auto;
      align-items: center;
      gap: 24px;
      color: #5a606a;
      font-size: 16px;
      font-weight: 650;
    }}
    .legend {{
      display: flex;
      align-items: center;
      gap: 18px;
      white-space: nowrap;
    }}
    .legend i {{
      display: inline-block;
      width: 27px;
      height: 17px;
      margin-right: 6px;
      border: 2px solid #2a2e34;
      border-radius: 4px;
      vertical-align: middle;
      background: #ffffff;
    }}
    .legend i.new {{
      border-color: #168a55;
      background: #e9f8ef;
    }}
    """


def page_shell(
    *,
    title: str,
    layer: str,
    rows: list[dict[str, Any]],
    content: str,
    content_class: str,
    accent: str,
) -> str:
    sections = len({str(row["landscape_section"]) for row in rows})
    added = sum(row["landscape_action"] == "add" for row in rows)
    with_openrank = sum(row["openrank_value"] is not None for row in rows)
    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=3840, initial-scale=1">
  <title>{html.escape(title)}</title>
  <style>
    {common_styles(accent)}
    {content_class}
  </style>
</head>
<body>
  <main class="canvas">
    <div class="side-label">{html.escape(layer)}</div>
    <header>
      <div>
        <h1>{html.escape(title)}</h1>
        <div class="subtitle">Selected from the refreshed 2026 Agentic AI project inventory</div>
      </div>
      <div class="brands">
        <span class="ant">ANT OPEN SOURCE</span>
        <span class="inclusion">INCLUSION AI</span>
      </div>
    </header>
    <section class="summary">
      <div class="summary-item primary">
        <strong>JULY 2026</strong>
        <span>editorial selection snapshot</span>
      </div>
      <div class="summary-item">
        <strong>{len(rows)} PROJECTS</strong>
        <span>kept or newly added</span>
      </div>
      <div class="summary-item">
        <strong>{sections} SECTIONS</strong>
        <span>ecosystem capability areas</span>
      </div>
      <div class="summary-item">
        <strong>{added} NEW</strong>
        <span>{with_openrank}/{len(rows)} projects have June OpenRank</span>
      </div>
    </section>
    <section class="content">{content}</section>
    <footer>
      <div>
        Source: data/agentic-ai-projects.csv. OR = OpenRank for 2026-06; a missing value is shown as "-".
      </div>
      <div class="legend">
        <span><i class="new"></i>New in this refresh</span>
        <span><i></i>Retained project</span>
      </div>
    </footer>
  </main>
</body>
</html>
"""


def build_agent_html(rows: list[dict[str, Any]]) -> str:
    groups = [major_group_html(group, rows) for group in AGENT_GROUPS]
    row_weights = " ".join(str(group["weight"]) for group in AGENT_GROUPS)
    return page_shell(
        title="Agent Infra Landscape 2026",
        layer="Agent Infra",
        rows=rows,
        content="".join(groups),
        content_class=f".content {{ grid-template-rows: {row_weights}; }}",
        accent="#f5a2d6",
    )


def build_model_html(rows: list[dict[str, Any]]) -> str:
    serving = major_group_html(MODEL_GROUPS[0], rows)
    post_train = major_group_html(MODEL_GROUPS[1], rows)
    pre_train = major_group_html(MODEL_GROUPS[2], rows)
    data = major_group_html(MODEL_GROUPS[3], rows)
    compute = major_group_html(MODEL_GROUPS[4], rows)
    content = f"""
      <div class="model-top">{serving}{post_train}</div>
      {pre_train}
      {data}
      {compute}
    """
    extra_css = """
      .content {
        grid-template-rows: 1.05fr 1.10fr .80fr .43fr;
      }
      .model-top {
        min-height: 0;
        display: grid;
        grid-template-columns: 1.75fr 1fr;
        gap: 18px;
      }
    """
    return page_shell(
        title="Model Infra Landscape 2026",
        layer="Model Infra",
        rows=rows,
        content=content,
        content_class=extra_css,
        accent="#8ac3ed",
    )


def write_rows(path: Path, rows: list[dict[str, Any]]) -> None:
    fields = [
        "repo_name",
        "landscape_action",
        "landscape_layer",
        "landscape_section",
        "openrank_2606",
        "stars",
        "license",
        "description",
        "selection_reason",
        "selection_caveat",
    ]
    with path.open("w", encoding="utf-8-sig", newline="") as handle:
        writer = csv.DictWriter(handle, fieldnames=fields)
        writer.writeheader()
        writer.writerows(
            {field: row.get(field, "") for field in fields}
            for row in rows
        )


def expected_sections(groups: list[dict[str, Any]]) -> set[str]:
    return {
        str(section[0])
        for group in groups
        for section in group["sections"]
    }


def validate_layer(
    rows: list[dict[str, Any]],
    groups: list[dict[str, Any]],
    expected_count: int,
) -> None:
    if len(rows) != expected_count:
        raise ValueError(f"Expected {expected_count} rows, got {len(rows)}")
    actual = {str(row["landscape_section"]) for row in rows}
    expected = expected_sections(groups)
    if actual != expected:
        raise ValueError(
            f"Section map mismatch; missing={sorted(actual - expected)}, "
            f"stale={sorted(expected - actual)}"
        )
    repos = [str(row["repo_name"]).lower() for row in rows]
    if len(repos) != len(set(repos)):
        raise ValueError("Duplicate selected repositories")


def main() -> None:
    rows = read_selected_rows()
    agent_rows = [row for row in rows if row["landscape_layer"] == "Agent Infra"]
    model_rows = [row for row in rows if row["landscape_layer"] == "Model Infra"]
    validate_layer(agent_rows, AGENT_GROUPS, 69)
    validate_layer(model_rows, MODEL_GROUPS, 57)

    DATA_DIR.mkdir(parents=True, exist_ok=True)
    avatar_status = download_avatars(rows)
    failed_avatars = sorted(
        owner for owner, status in avatar_status.items()
        if status.startswith("failed:")
    )
    if failed_avatars:
        raise RuntimeError(f"Could not download avatars: {failed_avatars}")

    write_rows(AGENT_DATA_PATH, agent_rows)
    write_rows(MODEL_DATA_PATH, model_rows)
    AGENT_HTML_PATH.write_text(build_agent_html(agent_rows), encoding="utf-8")
    MODEL_HTML_PATH.write_text(build_model_html(model_rows), encoding="utf-8")

    summary = {
        "generated_at": datetime.now(UTC).isoformat(),
        "source": str(SOURCE_PATH.relative_to(REPO_ROOT)),
        "selection_rule": "landscape_action in {keep, add}",
        "total_projects": len(rows),
        "layer_counts": dict(Counter(row["landscape_layer"] for row in rows)),
        "action_counts": dict(Counter(row["landscape_action"] for row in rows)),
        "agent_section_counts": dict(
            Counter(row["landscape_section"] for row in agent_rows)
        ),
        "model_section_counts": dict(
            Counter(row["landscape_section"] for row in model_rows)
        ),
        "avatar_source": "https://github.com/{owner}.png?size=128",
        "avatar_status_counts": dict(Counter(avatar_status.values())),
        "openrank_window": "2026-06",
    }
    SUMMARY_PATH.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )
    print(
        json.dumps(
            {
                "agent_projects": len(agent_rows),
                "model_projects": len(model_rows),
                "avatars": len(avatar_status),
                "agent_html": str(AGENT_HTML_PATH.relative_to(ROOT)),
                "model_html": str(MODEL_HTML_PATH.relative_to(ROOT)),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
