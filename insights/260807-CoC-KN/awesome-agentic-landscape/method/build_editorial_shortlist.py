#!/usr/bin/env python3
"""Apply the first editorial pass to the awesome-agentic candidate scan."""

from __future__ import annotations

import csv
from pathlib import Path


ROOT = Path(__file__).resolve().parents[3]
DATA_DIR = ROOT / "outputs" / "awesome-agentic-landscape-260729" / "data"
INPUT_PATH = DATA_DIR / "awesome_agentic_candidates.csv"
OUTPUT_PATH = DATA_DIR / "editorial_shortlist.csv"


EDITORIAL_DECISIONS = {
    "github/awesome-copilot": {
        "editorial_tier": "core",
        "landscape_section": "Curated coding-agent ecosystems",
        "agent_consumability": "direct",
        "editorial_reason": "Instructions, agents, skills, and configurations are already packaged in the forms a coding agent can consume.",
    },
    "hesreallyhim/awesome-claude-code": {
        "editorial_tier": "core",
        "landscape_section": "Curated coding-agent ecosystems",
        "agent_consumability": "hybrid",
        "editorial_reason": "Broad Claude Code ecosystem map with sustained collaboration across all three observed months.",
    },
    "ComposioHQ/awesome-claude-skills": {
        "editorial_tier": "core",
        "landscape_section": "Curated coding-agent ecosystems",
        "agent_consumability": "direct",
        "editorial_reason": "A fast-growing skills-focused list that is narrower and more executable than a general tools directory.",
    },
    "composio-community/awesome-codex-skills": {
        "editorial_tier": "core",
        "landscape_section": "Curated coding-agent ecosystems",
        "agent_consumability": "direct",
        "editorial_reason": "Codex-specific workflow skills are an early but strong example of an awesome list becoming an agent input.",
    },
    "VoltAgent/awesome-agent-skills": {
        "editorial_tier": "core",
        "landscape_section": "Cross-agent skill catalogs",
        "agent_consumability": "direct",
        "editorial_reason": "Cross-harness catalog covering Claude Code, Codex, Gemini CLI, Cursor, and other agents.",
    },
    "punkpeye/awesome-mcp-servers": {
        "editorial_tier": "core",
        "landscape_section": "Tool and protocol catalogs",
        "agent_consumability": "hybrid",
        "editorial_reason": "The strongest collaboration signal in the classic-awesome group and a practical map of agent tool access.",
    },
    "anthropics/skills": {
        "editorial_tier": "core",
        "landscape_section": "Native skill catalogs",
        "agent_consumability": "direct",
        "editorial_reason": "Official public Agent Skills repository; useful as a canonical reference for the skill-native successor to awesome lists.",
    },
    "openai/skills": {
        "editorial_tier": "core",
        "landscape_section": "Native skill catalogs",
        "agent_consumability": "direct",
        "editorial_reason": "Codex Skills catalog with unusually broad three-month participant activity for this repository form.",
    },
    "vercel-labs/skills": {
        "editorial_tier": "core",
        "landscape_section": "Native skill catalogs",
        "agent_consumability": "direct",
        "editorial_reason": "Combines a skill catalog with an installation tool, turning discovery into a machine-actionable workflow.",
    },
    "addyosmani/agent-skills": {
        "editorial_tier": "core",
        "landscape_section": "Native skill catalogs",
        "agent_consumability": "direct",
        "editorial_reason": "Production-oriented engineering skills with one of the strongest visible growth signals in the skill-native group.",
    },
    "affaan-m/ECC": {
        "editorial_tier": "core",
        "landscape_section": "Agent operating practice",
        "agent_consumability": "direct",
        "editorial_reason": "Packages coding-agent practice as a working harness with skills, memory, security, and research conventions.",
    },
    "obra/superpowers": {
        "editorial_tier": "core",
        "landscape_section": "Agent operating practice",
        "agent_consumability": "direct",
        "editorial_reason": "A software-development methodology distributed as an agent skills framework; it directly tests the code-is-cheap hypothesis.",
    },
    "github/spec-kit": {
        "editorial_tier": "core",
        "landscape_section": "Agent operating practice",
        "agent_consumability": "direct",
        "editorial_reason": "Spec-driven development gives coding agents durable intent and acceptance criteria instead of only prompt snippets.",
    },
    "garrytan/gstack": {
        "editorial_tier": "core",
        "landscape_section": "Agent operating practice",
        "agent_consumability": "direct",
        "editorial_reason": "An opinionated operating stack that packages role-specific tools and workflows around Claude Code.",
    },
    "shanraisshan/claude-code-best-practice": {
        "editorial_tier": "core",
        "landscape_section": "Agent operating practice",
        "agent_consumability": "hybrid",
        "editorial_reason": "A focused practice repository whose positioning explicitly moves from ad hoc generation toward agentic engineering.",
    },
    "VoltAgent/awesome-design-md": {
        "editorial_tier": "core",
        "landscape_section": "Domain playbooks as code",
        "agent_consumability": "direct",
        "editorial_reason": "A concrete example of curated design-system knowledge becoming a drop-in DESIGN.md for coding agents.",
    },
    "sickn33/agentic-awesome-skills": {
        "editorial_tier": "watch",
        "landscape_section": "Cross-agent skill catalogs",
        "agent_consumability": "direct",
        "editorial_reason": "Interesting agent-first catalog and local MCP control plane; recent rename makes name-based activity misleading, so repo-ID tracking matters.",
    },
    "rohitg00/awesome-claude-code-toolkit": {
        "editorial_tier": "watch",
        "landscape_section": "Curated coding-agent ecosystems",
        "agent_consumability": "direct",
        "editorial_reason": "Dense toolkit with agents, skills, commands, hooks, rules, and MCP configs, but its shorter activity history needs another window.",
    },
    "google/skills": {
        "editorial_tier": "watch",
        "landscape_section": "Native skill catalogs",
        "agent_consumability": "direct",
        "editorial_reason": "Official product skills with strong visible star momentum, though current contributor breadth is still narrow.",
    },
    "anthropics/claude-plugins-official": {
        "editorial_tier": "watch",
        "landscape_section": "Native skill catalogs",
        "agent_consumability": "direct",
        "editorial_reason": "A curated official plugin directory with strong collaboration; useful for testing whether plugins and skills converge.",
    },
    "wshobson/agents": {
        "editorial_tier": "watch",
        "landscape_section": "Cross-agent skill catalogs",
        "agent_consumability": "direct",
        "editorial_reason": "A multi-harness plugin marketplace spanning Claude Code, Codex, Cursor, OpenCode, Copilot, and Gemini CLI.",
    },
    "freestylefly/awesome-gpt-image-2": {
        "editorial_tier": "watch",
        "landscape_section": "Domain playbooks as code",
        "agent_consumability": "direct",
        "editorial_reason": "Prompt-as-code image templates distilled into skills; a clean bridge from the older prompt-gallery form to executable agent assets.",
    },
    "enescingoz/awesome-n8n-templates": {
        "editorial_tier": "watch",
        "landscape_section": "Domain playbooks as code",
        "agent_consumability": "hybrid",
        "editorial_reason": "Ready-to-use automation templates show how an awesome list can move from reference links toward runnable workflows.",
    },
    "Shubhamsaboo/awesome-llm-apps": {
        "editorial_tier": "watch",
        "landscape_section": "Agent project examples",
        "agent_consumability": "hybrid",
        "editorial_reason": "Large example collection connecting agents, skills, and RAG apps; valuable for patterns, though less focused on reusable operating practice.",
    },
    "e2b-dev/awesome-ai-agents": {
        "editorial_tier": "benchmark",
        "landscape_section": "Historical comparators",
        "agent_consumability": "indirect",
        "editorial_reason": "A useful older-style directory of autonomous-agent projects against which skill-native repositories can be compared.",
    },
    "sindresorhus/awesome": {
        "editorial_tier": "benchmark",
        "landscape_section": "Historical comparators",
        "agent_consumability": "indirect",
        "editorial_reason": "The canonical meta-list anchors the earlier human-curated awesome form and helps show what has changed.",
    },
}


def main() -> None:
    with INPUT_PATH.open(newline="", encoding="utf-8") as handle:
        candidates = {
            row["repo_name"].lower(): row
            for row in csv.DictReader(handle)
        }

    selected = []
    for repo_name, decision in EDITORIAL_DECISIONS.items():
        row = candidates.get(repo_name.lower())
        if row is None:
            raise KeyError(f"Missing candidate: {repo_name}")
        output = dict(row)
        output.update(decision)
        selected.append(output)

    tier_order = {"core": 0, "watch": 1, "benchmark": 2}
    selected.sort(
        key=lambda row: (
            tier_order[row["editorial_tier"]],
            -float(row["awesome_value_score"]),
        )
    )
    for rank, row in enumerate(selected, 1):
        row["editorial_rank"] = rank

    fieldnames = [
        "editorial_rank",
        "editorial_tier",
        "repo_id",
        "repo_name",
        "html_url",
        "description",
        "landscape_section",
        "agent_consumability",
        "editorial_reason",
        "awesome_value_score",
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
        "created_at",
        "language",
        "license",
        "github_snapshot_date",
    ]
    with OUTPUT_PATH.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(handle, fieldnames=fieldnames, extrasaction="ignore")
        writer.writeheader()
        writer.writerows(selected)

    for row in selected:
        print(
            f"{row['editorial_rank']:>2}. {row['editorial_tier']:<9} "
            f"{row['repo_name']:<50} score={float(row['awesome_value_score']):>5.1f}"
        )


if __name__ == "__main__":
    main()
