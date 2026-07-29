#!/usr/bin/env python3
"""Build the human-reviewed landscape refresh shortlist and decision memo."""

from __future__ import annotations

import json
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT / "data"
POOL_PATH = DATA_DIR / "candidate_pool.csv"
SHORTLIST_PATH = DATA_DIR / "human_review_shortlist.csv"
REPORT_PATH = ROOT / "landscape_project_refresh_report.md"
CHART_PATH = ROOT / "landscape_a_tier_stars_snapshot.png"
NOTEBOOK_PATH = ROOT / "landscape_candidate_review.ipynb"


DECISIONS = [
    {
        "repo_name": "volcengine/OpenViking",
        "decision": "A-建议补入",
        "target_layer": "Agent Infra",
        "target_box": "Memory, Knowledge & Context",
        "why": "context database 是当前图上的结构缺口；OpenRank 在不完整的 4–6 月数据中仍连续上升，且当前关注度高。",
        "caveat": "主项目为 AGPL-3.0，需在图例或许可证分析中明确；不能只写成普通向量数据库。",
    },
    {
        "repo_name": "microsoft/agent-framework",
        "decision": "A-建议补入",
        "target_layer": "Agent Infra",
        "target_box": "Agent Framework",
        "why": "统一 Python 与 .NET 的 agent / multi-agent framework，补足企业开发栈与跨语言框架代表。",
        "caveat": "与 AutoGen、Semantic Kernel 有谱系关系，制图时避免三个 Microsoft logo 重复表达同一层。",
    },
    {
        "repo_name": "JetBrains/koog",
        "decision": "A-建议补入",
        "target_layer": "Agent Infra",
        "target_box": "Agent Framework",
        "why": "当前框架区以 Python/TypeScript 为主；Koog 提供 JVM、Android、iOS 和浏览器覆盖，对 Apache 中文受众也更有代表性。",
        "caveat": "star 不是最高，但结构代表性强；应作为语言生态补位而非热度冠军。",
    },
    {
        "repo_name": "trycua/cua",
        "decision": "A-建议补入",
        "target_layer": "Agent Infra",
        "target_box": "Tool Use / Computer Use",
        "why": "把 computer-use 从单一 browser agent 扩展到跨 OS driver、fleet、benchmark、训练与评估数据。",
        "caveat": "OpenRank 绝对值不高；推荐理由主要是技术类别变化和当前 attention signal。",
    },
    {
        "repo_name": "agentgateway/agentgateway",
        "decision": "A-建议补入",
        "target_layer": "Agent Infra",
        "target_box": "Protocols & Tool Interoperability",
        "why": "代表 MCP/agent 流量从简单 API proxy 走向 agentic proxy、策略和控制平面。",
        "caveat": "应与 LiteLLM 的 model API proxy 区分，避免都放在 Model API Proxy。",
    },
    {
        "repo_name": "ag-ui-protocol/ag-ui",
        "decision": "A-建议补入",
        "target_layer": "Agent Infra",
        "target_box": "Protocols & Tool Interoperability",
        "why": "补上 agent 到前端应用之间的事件与交互协议，当前图只覆盖 MCP/A2A，协议栈不完整。",
        "caveat": "与 A2UI 不是二选一：AG-UI 更偏 agent-user interaction transport/event layer。",
    },
    {
        "repo_name": "a2ui-project/a2ui",
        "decision": "A-建议补入",
        "target_layer": "Agent Infra",
        "target_box": "Protocols & Tool Interoperability",
        "why": "代表 agent-generated UI 的声明式开放标准，与 MCP、A2A、AG-UI 形成新的交互协议层。",
        "caveat": "官方仍标注 early-stage public preview；图上建议加 preview 标识。",
    },
    {
        "repo_name": "kubernetes-sigs/agent-sandbox",
        "decision": "A-建议补入",
        "target_layer": "Agent Infra",
        "target_box": "Dev Environment & Sandbox",
        "why": "由 Kubernetes SIG Apps 承载，提供声明式 Sandbox CRD、稳定身份、持久存储和 warm pool，代表 sandbox 走向标准化编排。",
        "caveat": "它是 sandbox orchestrator，不是底层隔离 runtime；需与 gVisor/Kata/OpenSandbox 区分。",
    },
    {
        "repo_name": "vllm-project/vllm-omni",
        "decision": "A-建议补入",
        "target_layer": "Model Infra",
        "target_box": "Serving",
        "why": "把 vLLM 的 serving 范围扩展到文本、图像、音频、视频和 action output，4–6 月 OpenRank 信号强。",
        "caveat": "与 vLLM 主项目并列时要标注 omni-modality，不能只增加一个相似 logo。",
    },
    {
        "repo_name": "LMCache/LMCache",
        "decision": "A-建议补入",
        "target_layer": "Model Infra",
        "target_box": "Inference",
        "why": "KV cache 已从引擎内部优化变成可持久化、跨引擎复用和可观测的独立层，尤其匹配长上下文和多轮 agent workload。",
        "caveat": "建议新增 KV Cache / State Reuse 小类，而不是继续塞进通用 inference。",
    },
    {
        "repo_name": "vllm-project/vllm-ascend",
        "decision": "A-建议补入",
        "target_layer": "Model Infra",
        "target_box": "Serving / Hardware",
        "why": "4–6 月 OpenRank 信号很强，补足当前图过度集中于 CUDA/GPU 的硬件与社区多样性。",
        "caveat": "它是 vLLM hardware plugin；版面紧张时可作为 vLLM 的子标识而非独立大 logo。",
    },
    {
        "repo_name": "huggingface/trl",
        "decision": "A-建议补入",
        "target_layer": "Model Infra",
        "target_box": "Post-Train",
        "why": "SFT、GRPO、DPO 等 post-training 的基础库，在 Hugging Face 生态中的通用性和持续活动都足以成为基线项目。",
        "caveat": "项目并非 2026 新出现；这是旧图漏项修正，不要叙述成新晋爆发项目。",
    },
    {
        "repo_name": "NVIDIA/OpenShell",
        "decision": "B-候补观察",
        "target_layer": "Agent Infra",
        "target_box": "Dev Environment & Sandbox",
        "why": "安全、私有的 autonomous-agent runtime，5–6 月 OpenRank 信号保持在较高位置。",
        "caveat": "与 NemoClaw 构成同一产品栈，图上最多选一个主 logo；优先观察社区独立性。",
    },
    {
        "repo_name": "topoteretes/cognee",
        "decision": "B-候补观察",
        "target_layer": "Agent Infra",
        "target_box": "Memory, Knowledge & Context",
        "why": "长期记忆与 knowledge graph 结合，当前 star 与可见 WatchEvent 信号都高。",
        "caveat": "memory 区已有 Mem0、Hindsight、MemU 等，需用外部贡献/采用证据决定是否替换而非无限加 logo。",
    },
    {
        "repo_name": "googleapis/mcp-toolbox",
        "decision": "B-候补观察",
        "target_layer": "Agent Infra",
        "target_box": "Protocols & Tool Interoperability",
        "why": "数据库 MCP server 的代表实现，连接 agent 与生产数据系统。",
        "caveat": "更像具体工具集成；若协议区只保留标准和通用 runtime，可不单列。",
    },
    {
        "repo_name": "coze-dev/coze-loop",
        "decision": "B-候补观察",
        "target_layer": "Agent Infra",
        "target_box": "Observability & Evaluation",
        "why": "覆盖开发、调试、评测与监控的 agent optimization lifecycle，4–6 月 OpenRank 相对稳定。",
        "caveat": "需要进一步核验外部采用和贡献者结构，再决定是否替换现有 eval/observability logo。",
    },
    {
        "repo_name": "microsoft/agent-lightning",
        "decision": "B-候补观察",
        "target_layer": "Model Infra",
        "target_box": "Post-Train",
        "why": "直接面向 agent training/optimization，当前 star 快照高。",
        "caveat": "OpenDigger 最近三个月没有可靠 OpenRank记录；不能仅凭 star 进入 A 档。",
    },
    {
        "repo_name": "NVIDIA/Model-Optimizer",
        "decision": "B-候补观察",
        "target_layer": "Model Infra",
        "target_box": "Inference Optimization",
        "why": "把量化、蒸馏、剪枝、投机解码等部署优化统一到一套库中，OpenRank 信号持续。",
        "caveat": "厂商工具属性较强，需与 TensorRT-LLM/TransformerEngine 的重复度一起取舍。",
    },
    {
        "repo_name": "NVIDIA-NeMo/RL",
        "decision": "B-候补观察",
        "target_layer": "Model Infra",
        "target_box": "Post-Train",
        "why": "可扩展 reinforcement learning toolkit，5–6 月 OpenRank 信号稳定。",
        "caveat": "Post-Train 已有 verl、AReaL、Slime、Miles；应以生态代表性而不是 logo 数量决定。",
    },
    {
        "repo_name": "jundot/omlx",
        "decision": "B-候补观察",
        "target_layer": "Model Infra",
        "target_box": "Inference / Edge",
        "why": "Apple Silicon 上的 continuous batching 与 SSD caching，当前 star 和可见 WatchEvent 信号突出。",
        "caveat": "较新且偏单平台；建议先放观察区，避免用短期 star 替代成熟度。",
    },
    {
        "repo_name": "stacklok/toolhive",
        "decision": "B-候补观察",
        "target_layer": "Agent Infra",
        "target_box": "Protocols & Tool Interoperability",
        "why": "MCP server 的运行、管理与安全平台，代表 MCP 从 server catalog 走向运维层。",
        "caveat": "当前 star 规模较小，且与 agentgateway 部分重叠。",
    },
    {
        "repo_name": "OpenHands/software-agent-sdk",
        "decision": "B-候补观察",
        "target_layer": "Agent Infra",
        "target_box": "Agent Framework",
        "why": "6 月 OpenRank 信号相对 4–5 月明显增强，显示 OpenHands 正把产品能力模块化为 SDK。",
        "caveat": "OpenHands 主 logo 已在图中；更适合作为谱系变化注释而不是新增 logo。",
    },
    {
        "repo_name": "microsoft/fara",
        "decision": "B-候补观察",
        "target_layer": "Large Models",
        "target_box": "Computer-use Model",
        "why": "明确面向 computer use agent 的模型家族，能把 tool-use 趋势连接到模型层。",
        "caveat": "Large Models 图的更新应以模型发布、权重与评测为主，不能直接沿用 GitHub 项目排名方法。",
    },
    {
        "repo_name": "NVIDIA/Isaac-GR00T",
        "decision": "B-候补观察",
        "target_layer": "Large Models",
        "target_box": "Robotics / Action Model",
        "why": "通用机器人 foundation model，代表输出从 token 扩展到 action。",
        "caveat": "需要和 Model Infra 图中的 robotics infra 分开；模型开放度也需单独复核。",
    },
]


EXTRA_ROWS = {
    "vllm-project/vllm-omni": {
        "repo_id": 1054512829,
        "description": "A framework for efficient model inference with omni-modality models",
        "stars_current": 5719,
        "watch_events_visible": 62,
        "openrank_202604": 137.40,
        "openrank_202605": 131.19,
        "openrank_202606": 105.73,
        "license": "Apache-2.0",
        "created_at": "2025-09-11",
        "pushed_at": "2026-07-28T13:00:50Z",
        "html_url": "https://github.com/vllm-project/vllm-omni",
    },
    "LMCache/LMCache": {
        "repo_id": 807305060,
        "description": "KV cache management layer for LLM inference",
        "stars_current": 10920,
        "watch_events_visible": 88,
        "openrank_202604": 53.66,
        "openrank_202605": 49.91,
        "openrank_202606": 42.86,
        "license": "Apache-2.0",
        "created_at": "2024-05-28",
        "pushed_at": "2026-07-28T10:28:27Z",
        "html_url": "https://github.com/LMCache/LMCache",
    },
    "microsoft/fara": {
        "repo_id": 1085876386,
        "description": "Fara1.5 – A family of frontier computer use agent models",
        "stars_current": 6079,
        "watch_events_visible": 45,
        "openrank_202604": 3.45,
        "openrank_202605": None,
        "openrank_202606": None,
        "license": "MIT",
        "created_at": "2025-10-29",
        "pushed_at": "2026-07-22T17:03:30Z",
        "html_url": "https://github.com/microsoft/fara",
    },
    "NVIDIA/Isaac-GR00T": {
        "repo_id": 946829547,
        "description": "A foundation model for generalist robots",
        "stars_current": 7697,
        "watch_events_visible": 36,
        "openrank_202604": 3.57,
        "openrank_202605": 1.31,
        "openrank_202606": None,
        "license": "Apache-2.0",
        "created_at": "2025-03-11",
        "pushed_at": "2026-07-22T15:10:14Z",
        "html_url": "https://github.com/NVIDIA/Isaac-GR00T",
    },
}


def build_shortlist() -> pd.DataFrame:
    pool = pd.read_csv(POOL_PATH)
    pool = pool.set_index("repo_name", drop=False)
    records = []
    for decision in DECISIONS:
        repo = decision["repo_name"]
        if repo in pool.index:
            source = pool.loc[repo].to_dict()
        else:
            source = {"repo_name": repo, **EXTRA_ROWS[repo]}
        records.append({**source, **decision})
    frame = pd.DataFrame(records)
    columns = [
        "decision",
        "repo_id",
        "repo_name",
        "target_layer",
        "target_box",
        "stars_current",
        "watch_events_visible",
        "openrank_202604",
        "openrank_202605",
        "openrank_202606",
        "license",
        "created_at",
        "pushed_at",
        "why",
        "caveat",
        "description",
        "html_url",
    ]
    frame = frame[columns]
    frame.to_csv(SHORTLIST_PATH, index=False)
    return frame


def render_chart(frame: pd.DataFrame) -> None:
    plt.rcParams["font.sans-serif"] = ["PingFang SC", "Arial Unicode MS", "DejaVu Sans"]
    plt.rcParams["axes.unicode_minus"] = False
    a = frame[frame["decision"].str.startswith("A-")].copy()
    a = a.sort_values("stars_current", ascending=True)
    colors = ["#3777B7" if x == "Agent Infra" else "#B87819" for x in a["target_layer"]]
    fig, ax = plt.subplots(figsize=(11, 7.4))
    bars = ax.barh(a["repo_name"], a["stars_current"], color=colors, edgecolor="#27313A")
    ax.bar_label(bars, labels=[f"{int(x):,}" for x in a["stars_current"]], padding=4, fontsize=9)
    fig.suptitle(
        "A 档候选项目的 GitHub stars 快照",
        x=0.125,
        y=0.975,
        ha="left",
        fontsize=17,
        weight="bold",
    )
    fig.text(
        0.125,
        0.935,
        "2026-07-28；蓝色为 Agent Infra，金色为 Model Infra。stars 仅表示关注度，不代表社区健康。",
        fontsize=10,
        color="#59636E",
    )
    ax.set_xlabel("GitHub stars")
    ax.set_ylabel("")
    ax.grid(axis="x", color="#D9DEE3", linewidth=0.7)
    ax.set_axisbelow(True)
    ax.spines[["top", "right"]].set_visible(False)
    ax.set_xlim(0, a["stars_current"].max() * 1.18)
    fig.tight_layout(rect=(0, 0, 1, 0.90))
    fig.savefig(CHART_PATH, dpi=180, bbox_inches="tight")
    plt.close(fig)


def md_table(frame: pd.DataFrame) -> str:
    view = frame[
        [
            "repo_name",
            "target_box",
            "stars_current",
            "openrank_202604",
            "openrank_202605",
            "openrank_202606",
            "why",
            "caveat",
        ]
    ].copy()
    view["repo_name"] = [
        f"[{name}]({url})" for name, url in zip(frame["repo_name"], frame["html_url"])
    ]
    view["stars_current"] = view["stars_current"].map(lambda x: f"{int(x):,}")
    for col in ["openrank_202604", "openrank_202605", "openrank_202606"]:
        view[col] = view[col].map(lambda x: "—" if pd.isna(x) else f"{x:.2f}")
    view.columns = ["项目", "建议位置", "stars 快照", "OR 4月", "OR 5月", "OR 6月", "为什么", "注意"]
    headers = list(view.columns)
    lines = [
        "| " + " | ".join(headers) + " |",
        "| " + " | ".join(["---"] * len(headers)) + " |",
    ]
    for row in view.itertuples(index=False, name=None):
        clean = [str(value).replace("|", "\\|").replace("\n", " ") for value in row]
        lines.append("| " + " | ".join(clean) + " |")
    return "\n".join(lines)


def build_report(frame: pd.DataFrame) -> None:
    summary = json.loads((DATA_DIR / "scan_summary.json").read_text())
    a = frame[frame["decision"].str.startswith("A-")]
    b = frame[frame["decision"].str.startswith("B-")]
    report = f"""# Agentic AI 全景图项目增补扫描

> 截止口径：GitHub 仓库元数据快照为 2026-07-28；OpenRank 使用 2026-04、05、06 三个已结束月份，但近期分区存在显著回填缺口。本文是全景图项目取舍工作稿，不是生态排行榜。

## tl;dr

从当前 227 个仓库基线出发，扫描得到 {summary['raw_candidate_ids']:,} 个原始 repo id，经关键词、仓库状态、GitHub 元数据和人工结构复核后，建议 **A 档立即补入 {len(a)} 个项目**、**B 档候补观察 {len(b)} 个项目**。

数据表已在 2026-07-28 完成刷新：24 个扫描短名单项目都已写入 `data/agentic-ai-projects.csv`，当前共 251 个项目。A/B 档只保留在这份扫描工作稿中；主表使用 `landscape_action` 记录最终的 keep、add、remove 和 omit 判断。

这轮补项最有价值的，是五个结构性缺口终于有了清晰的代表项目：

1. Context database 正从 RAG/vector store 中独立出来：OpenViking。
2. Agent framework 开始补齐 JVM/.NET 等企业开发栈：Koog、Microsoft Agent Framework。
3. MCP/A2A 之外出现 agent-to-user / agent-to-UI 协议：AG-UI、A2UI。
4. Sandbox 从单机执行环境走向 Kubernetes 声明式编排与安全 runtime：agent-sandbox。
5. Model Infra 针对 agent workload 增加 multimodal serving 与可复用 KV state：vLLM-Omni、LMCache。

## A 档建议补入

{md_table(a)}

## B 档候补观察

{md_table(b)}

## 不建议因短期热度直接补入

- `awesome-*`、课程、prompt/skill 合集：能反映学习与传播热度，不是生态基础设施。
- 垂直应用或个人效率工具：除非它开创了一个新类别，否则不应挤占框架、协议、runtime 的版面。
- 只有短期 star 信号、缺少 OpenRank/持续协作证据的新仓库：进入观察区，不直接进入主图。
- 同一厂商同一产品栈的多个仓库：例如 OpenShell/NemoClaw，应选一个主 logo，其他用谱系说明。
- 已在图中的项目拆分仓库：例如 OpenHands software-agent-sdk，优先作为项目演化注释，而不是重复 logo。

## 数据与方法

- 基线：`data/agentic-ai-projects.csv`，227 个唯一仓库。
- 候选发现：OpenDigger `opensource.events` 中 2026-05-01 至 2026-07-28 可见的 GitHub WatchEvent；只用于发现，不解释为完整 star 增量。
- 活跃信号：OpenDigger `opensource.global_openrank` 的 2026-04、05、06 月 Repo OpenRank。
- 当前快照：GitHub API / 官方仓库页的 stars、license、archive/fork 状态、描述与最近 push。
- 人工判断：是否补足全景图结构、是否是通用基础设施/开放协议、是否与现有 logo 重复、许可证与成熟度是否需要显式标注。

## 数据质量结论

**Share with caveats。** 这份名单足以支持“该看哪些项目”和“全景图缺了哪些结构层”的编辑决策，但不支持精确的近三个月 star 增长排行榜，也不支持把 4–6 月 OpenRank 总量变化解释为生态升降。

- GitHub 在 2026 年 7 月限制了公开 stargazer 列表接口；没有仓库协作者权限时，无法稳定重建准确的逐日新增 star。
- OpenDigger 最近月份存在明显覆盖下降：Repo OpenRank 行数从 2026-04 的 648,328 降至 2026-06 的 246,364。
- 因此，本文把当前 stars 当关注度快照，把可见 WatchEvent/OpenRank 当候选发现和交叉验证信号。
- Large Models 层不能直接复用 repo 排名：下一步应按模型发布、开放权重、许可证、评测与真实使用单独更新。

## 制图建议

- 主图不要把 A 档 12 个 logo 全部等权塞入；按“新增小类”和“替换旧代表”处理。
- 建议新增三个小类：`Agent–User / Agent–UI Protocols`、`Sandbox Orchestration`、`KV Cache / State Reuse`。
- OpenViking 的 AGPL-3.0、A2UI 的 preview 状态、以及 vLLM-Ascend 的 plugin 身份应显式标注。
- 演讲只点名 5–6 个项目，其余留在完整全景图和附录。
"""
    REPORT_PATH.write_text(report)


def build_notebook() -> None:
    def md(source: str) -> dict:
        return {"cell_type": "markdown", "metadata": {}, "source": source.splitlines(True)}

    def code(source: str) -> dict:
        return {
            "cell_type": "code",
            "execution_count": None,
            "metadata": {},
            "outputs": [],
            "source": source.splitlines(True),
        }

    notebook = {
        "cells": [
            md(
                "# Agentic AI Landscape Candidate Review\n\n"
                "Reproducible review notebook for the CommunityOverCode China keynote."
            ),
            md(
                "## tl;dr\n\n"
                "The shortlist prioritizes structural gaps in the landscape rather than raw star rank."
            ),
            md(
                "## Context & Methods\n\n"
                "- GitHub snapshot: 2026-07-28\n"
                "- OpenRank: completed months 2026-04 to 2026-06, with material backfill caveats\n"
                "- Visible WatchEvents: discovery signal only, not exact star growth"
            ),
            code(
                "from pathlib import Path\n"
                "import pandas as pd\n"
                "import matplotlib.pyplot as plt\n\n"
                "ROOT = Path.cwd()\n"
                "if ROOT.name != 'landscape-refresh':\n"
                "    ROOT = Path('presentations/260807-CoC-KN/landscape-refresh')\n"
                "shortlist = pd.read_csv(ROOT / 'data/human_review_shortlist.csv')\n"
                "quality = pd.read_csv(ROOT / 'data/data_quality_checks.csv')\n"
                "shortlist.shape, quality.shape"
            ),
            md("## Data"),
            code(
                "shortlist[['decision','repo_name','target_layer','target_box','stars_current',"
                "'openrank_202604','openrank_202605','openrank_202606']].head(20)"
            ),
            md("## Results"),
            code(
                "a = shortlist[shortlist.decision.str.startswith('A-')].sort_values('stars_current')\n"
                "colors = ['#3777B7' if x == 'Agent Infra' else '#B87819' for x in a.target_layer]\n"
                "ax = a.plot.barh(x='repo_name', y='stars_current', color=colors, edgecolor='#27313A', "
                "legend=False, figsize=(11, 7))\n"
                "ax.set_title('A-tier candidate GitHub stars snapshot — 2026-07-28')\n"
                "ax.set_xlabel('GitHub stars (attention snapshot, not community health)')\n"
                "ax.set_ylabel('')\n"
                "ax.grid(axis='x', color='#D9DEE3', linewidth=.7)\n"
                "plt.tight_layout();"
            ),
            md(
                "## Takeaways\n\n"
                "1. The strongest omissions are context, protocol, sandbox orchestration, and state reuse.\n"
                "2. Current stars are useful for attention, not maturity.\n"
                "3. The Large Models layer needs a separate model-release and openness review."
            ),
        ],
        "metadata": {
            "kernelspec": {
                "display_name": "Python 3",
                "language": "python",
                "name": "python3",
            },
            "language_info": {"name": "python", "version": "3.12"},
        },
        "nbformat": 4,
        "nbformat_minor": 5,
    }
    NOTEBOOK_PATH.write_text(json.dumps(notebook, ensure_ascii=False, indent=1))


def main() -> None:
    frame = build_shortlist()
    render_chart(frame)
    build_report(frame)
    build_notebook()
    print(f"shortlist={SHORTLIST_PATH}")
    print(f"report={REPORT_PATH}")
    print(f"chart={CHART_PATH}")
    print(f"notebook={NOTEBOOK_PATH}")


if __name__ == "__main__":
    main()
