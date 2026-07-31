#!/usr/bin/env python3
"""Apply the 2026-07 landscape editorial decisions to the canonical CSV."""

from __future__ import annotations

import csv
import json
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


ROOT = Path(__file__).resolve().parents[4]
CSV_PATH = ROOT / "data" / "agentic-ai-projects.csv"
REFERENCE_PATH = (
    ROOT
    / "presentations"
    / "260807-CoC-KN"
    / "landscape-refresh"
    / "data"
    / "current_landscape_reference.csv"
)
SUMMARY_PATH = (
    ROOT
    / "presentations"
    / "260807-CoC-KN"
    / "landscape-refresh"
    / "data"
    / "landscape_editorial_summary.json"
)
REPORT_PATH = (
    ROOT
    / "presentations"
    / "260807-CoC-KN"
    / "landscape-refresh"
    / "landscape_editorial_decisions.md"
)


def decision(
    layer: str,
    section: str,
    reason: str,
    caveat: str,
) -> dict[str, str]:
    return {
        "landscape_layer": layer,
        "landscape_section": section,
        "selection_reason": reason,
        "selection_caveat": caveat,
    }


HISTORICAL_KEEP = {
    "lobehub/lobehub": decision(
        "Agent Infra",
        "Personal AI assistants",
        "80k+ stars、最近可用 OpenRank 仍在 60 左右，已经成为个人 agent 工作空间和长期运行入口的代表项目。",
        "产品同时覆盖聊天、知识库和多 agent 管理；主图只放在 Personal AI assistants，避免重复出现在 framework 或 chatbot。",
    ),
}


ADD = {
    "volcengine/openviking": decision(
        "Agent Infra",
        "Memory, knowledge & context",
        "把 memory、RAG 和 skills 收敛为 context database，补上当前图缺少的 agent-native context 数据层。",
        "主仓库使用 AGPL-3.0；图例或许可证分析中需要明确标注。",
    ),
    "milvus-io/milvus": decision(
        "Agent Infra",
        "Memory, knowledge & context",
        "成熟向量数据库仍是 agent context 的重要底座；当前 45k+ stars、最近可用 OpenRank 68.34，社区信号稳定。",
        "它是通用向量数据库，不应被描述成 agent memory framework；在图中承担底层检索基础设施的位置。",
    ),
    "topoteretes/cognee": decision(
        "Agent Infra",
        "Memory, knowledge & context",
        "长期记忆与 knowledge graph 结合，补足当前 memory 区对图结构和持久知识表达的覆盖。",
        "与 RAGFlow、Mem0 有部分功能重叠；保留重点是 graph-based memory，不再额外增加同类项目。",
    ),
    "microsoft/agent-framework": decision(
        "Agent Infra",
        "Code-first frameworks",
        "统一 Python 与 .NET 的 agent 和 multi-agent 开发路径，补足企业开发栈与跨语言框架代表。",
        "与 AutoGen、Semantic Kernel 有谱系关系；主图只保留当前统一框架，不并列堆放三个 Microsoft 项目。",
    ),
    "jetbrains/koog": decision(
        "Agent Infra",
        "Code-first frameworks",
        "为 Kotlin/JVM、Android 和 iOS 提供 agent framework，修正当前框架区过度集中在 Python、TypeScript 的问题。",
        "社区规模仍小于 LangChain、Pydantic AI；入图理由是语言生态代表性，不是热度排名。",
    ),
    "flowiseai/flowise": decision(
        "Agent Infra",
        "Workflow & agent builders",
        "54k+ stars 的可视化 agent builder，结构定位比 ComfyUI 更贴合通用 agent workflow。",
        "与 Dify、Langflow 功能接近；该区维持五个 logo，不继续扩容。",
    ),
    "ag-ui-protocol/ag-ui": decision(
        "Agent Infra",
        "Protocols & interoperability",
        "补上 agent 到前端应用之间的事件与交互协议，当前协议区不再只围绕 MCP 和 A2A。",
        "AG-UI 更偏交互事件和传输层；不要与 A2UI 合并成同一个概念。",
    ),
    "a2ui-project/a2ui": decision(
        "Agent Infra",
        "Protocols & interoperability",
        "代表声明式 agent-generated UI，与 MCP、A2A、AG-UI 共同构成更完整的 agent interface 协议面。",
        "官方仍标注 early-stage public preview，主图应加 preview 标识。",
    ),
    "trycua/cua": decision(
        "Agent Infra",
        "Tool & browser use",
        "把 computer use 扩展到跨 OS driver、fleet、benchmark 和数据生成，结构价值高于再增加一个 browser agent。",
        "最近可用 OpenRank 绝对值不高；保留依据主要是类别变化和当前关注度。",
    ),
    "kubernetes-sigs/agent-sandbox": decision(
        "Agent Infra",
        "Development sandboxes",
        "Kubernetes SIG Apps 承载的声明式 sandbox orchestration，补上稳定身份、持久存储和 warm pool 这一层。",
        "它是 sandbox orchestrator，不是底层隔离 runtime；与 OpenSandbox、Coder、Daytona 的角色需要区分。",
    ),
    "agentgateway/agentgateway": decision(
        "Agent Infra",
        "Model API gateways",
        "Rust 实现的 agentic proxy，覆盖 MCP 与 agent 流量策略，能代表 gateway 从模型 API 代理扩展到 agent 控制面。",
        "与 LiteLLM 的 model API gateway 定位不同，图中应直接标成 agentic proxy。",
    ),
    "ibm/mcp-context-forge": decision(
        "Agent Infra",
        "Model API gateways",
        "提供 MCP gateway、registry 与可观测能力，补足协议落地后的企业运维和治理入口。",
        "与 AgentGateway 有交叉；保留两个是为了区分流量代理和 MCP 管理平台，不再继续增加同类 gateway。",
    ),
    "vllm-project/vllm-omni": decision(
        "Model Infra",
        "Serving · Inference",
        "把 vLLM serving 扩展到文本、图像、音频、视频和 action output，直接对应多模态 agent workload。",
        "它与 vLLM 主项目同属一个生态；版面上应做子项目关系提示，避免看成两个无关引擎。",
    ),
    "lmcache/lmcache": decision(
        "Model Infra",
        "Serving · Inference",
        "KV cache 已成为长上下文和多轮 agent workload 的独立复用层；LMCache 的社区信号和采用度足以进入主图。",
        "与 Mooncake 的位置高度重叠，本版采用替换而不是并列增加。",
    ),
    "microsoft/onnxruntime": decision(
        "Model Infra",
        "Serving · Inference",
        "跨平台推理 runtime 仍是 CPU、GPU 和边缘部署的重要基线，当前 21k+ stars、最近可用 OpenRank 64.52。",
        "项目覆盖广泛 ML workload，不专属于 LLM；在图中只表达通用 inference runtime。",
    ),
    "huggingface/trl": decision(
        "Model Infra",
        "Post-Train · Reinforcement learning",
        "SFT、DPO、GRPO 等 post-training 的通用基础库，在 Hugging Face 生态中具有长期代表性。",
        "项目不是 2026 新晋热点；这是旧图漏项修正，并替换社区信号较弱的 OpenRLHF。",
    ),
    "tensorflow/tensorflow": decision(
        "Model Infra",
        "Pre-Train · Framework & parallel",
        "通用训练框架的历史基线仍应保留，尤其在 NeMo 仓库改名为 Speech 后，原位置已经不再准确。",
        "近期 OpenRank 明显低于 PyTorch、JAX；入图表示生态基线，不解释成增长项目。",
    ),
    "openxla/xla": decision(
        "Model Infra",
        "Pre-Train · Compiler & accelerator",
        "Apache-2.0 的跨 GPU、CPU 和专用加速器编译基础设施，补足当前编译器层只展示 kernel 与算子库的问题。",
        "star 规模不大；保留依据是结构代表性和开放编译栈位置。",
    ),
    "nvidia/model-optimizer": decision(
        "Model Infra",
        "Pre-Train · Compiler & accelerator",
        "统一量化、蒸馏、剪枝和投机解码等部署优化能力，最近可用 OpenRank 56.14。",
        "厂商主导且与 TensorRT-LLM 有交叉；主图只表达模型优化层，不扩展 NVIDIA 同栈项目数量。",
    ),
    "docling-project/docling": decision(
        "Model Infra",
        "Data · Integration",
        "文档解析和结构化已经成为 RAG 与 agent 数据准备的常见入口，当前 63k+ stars、最近可用 OpenRank 66.74。",
        "它代表文档数据准备，不是通用 ETL；Data · Integration 区控制在三个项目。",
    ),
}


REMOVE = {
    "gitlawb/openclaude": (
        "项目定位和描述过于模糊，难以在已经拥挤的 coding agent 区解释其独立代表性。",
        "若后续形成稳定产品边界和独立社区，再重新评估。",
    ),
    "continuedev/continue": (
        "coding agent 区需要压缩；当前 OpenRank 信号明显低于同区头部项目，结构上也没有新增能力层。",
        "Continue 具有历史影响力，本次下架是版面取舍，不等于项目失去价值。",
    ),
    "charmbracelet/crush": (
        "终端 coding agent 已有足够代表项目，Crush 的功能增量不足以支撑第十三个 logo。",
        "项目仍活跃；若未来形成独特交互或协作模式，可再进入候选池。",
    ),
    "yeachan-heo/oh-my-codex": (
        "与 ECC、Superpowers、oh-my-openagent 同属 coding harness 增强层，当前版面无需四个相似配置栈。",
        "保留在项目池中观察其独立社区和跨 agent 支持。",
    ),
    "comfy-org/comfyui": (
        "核心定位是图像和视频生成工作流，不适合作为通用 Workflow & agent builder 代表。",
        "它仍应出现在生成式媒体生态图，而不是本版 Agent Infra 主图。",
    ),
    "rightnow-ai/openfang": (
        "Agent OS 定位较宽，与现有 code-first framework 和 personal assistant 项目重叠，最近可用 OpenRank 也偏低。",
        "若形成清晰 runtime 边界，可在后续版本重新考虑。",
    ),
    "supabase/supabase": (
        "通用后端平台不能直接代表 agent memory；当前 memory 区需要让位给 agent-native context 项目。",
        "Supabase 仍是重要基础设施，但不在本图的有限 logo 预算内。",
    ),
    "mempalace/mempalace": (
        "短期关注度很高，但与 Mem0、Hindsight 的长期记忆定位重叠，独立采用证据仍需观察。",
        "保留为观察项目；若持续贡献和外部采用站稳，可替换当前 memory 代表。",
    ),
    "nevamind-ai/memu": (
        "个人 memory 定位与 Mem0、Hindsight 重叠，最近可用 OpenRank 只有 2.40。",
        "不因短期 stars 单独增加 logo。",
    ),
    "rtk-ai/rtk": (
        "项目是开发命令 token 压缩 CLI，并非 Model API gateway；现有位置属于误分类。",
        "它可以继续作为 coding workflow 工具观察，但暂不占主图位置。",
    ),
    "songquanpeng/one-api": (
        "与 New API、LiteLLM 高度重叠，最近可用 OpenRank 只有 0.64。",
        "保留 New API 作为该产品谱系的当前代表。",
    ),
    "browser-use/browser-harness": (
        "与同组织 browser-use 主项目重叠，Tool & browser use 区只保留一个主 logo。",
        "其 self-healing harness 能力可以作为 browser-use 的项目演化注释。",
    ),
    "xorbitsai/inference": (
        "Serving · Deploy 已有 Ollama、Dynamo 和 llm-d，Xorbits Inference 的近期社区信号相对较弱。",
        "项目仍有部署价值；本次下架主要是控制 serving 区密度。",
    ),
    "kvcache-ai/mooncake": (
        "KV cache 位置与 LMCache 重叠，本版选择社区信号更强、定位更直接的 LMCache。",
        "Mooncake 继续保留在项目池，后续按跨引擎采用情况复核。",
    ),
    "openrlhf/openrlhf": (
        "Post-Train 区加入 TRL 后需要一进一出；OpenRLHF 最近窗口缺少可靠 OpenRank。",
        "项目仍是 RLHF 工程实践的重要参考，本次只是不再占主图 logo。",
    ),
    "nvidia-nemo/speech": (
        "原 NeMo 仓库已经改名为 Speech，继续放在通用 Pre-Train framework 会造成事实错误。",
        "Speech 项目可在语音模型或多模态工具图中单独评估。",
    ),
    "rapidsai/cudf": (
        "cuDF 是 GPU dataframe library，放在 Compiler & accelerator 区的解释成本过高。",
        "它仍是 GPU 数据处理基础设施，但不属于本图的模型编译主线。",
    ),
}


MOVE = {
    "farion1231/cc-switch": decision(
        "Agent Infra",
        "Coding harnesses",
        "cc-switch 管理 Claude Code、Codex、OpenCode 等 coding agent 的配置和切换，更接近 harness，而不是模型 API gateway。",
        "项目关注度很高，但产品属性较强；保留一个 logo，不在 gateway 区重复出现。",
    ),
}


OMIT_OVERRIDES = {
    "langchain-ai/deepagents": (
        "Deep Agents 是 LangChain 谱系内的子项目；主图已经保留 LangChain，不重复增加 logo。",
        "可以在 LangChain 的项目演化说明中出现。",
    ),
    "vllm-project/vllm-ascend": (
        "它是 vLLM 的 Ascend hardware plugin，适合做 vLLM 的硬件生态注释，不作为独立大 logo。",
        "如果后续单独制作国产硬件适配图，再提升为主项目。",
    ),
    "nvidia/openshell": (
        "Sandbox 区加入 agent-sandbox 后已经有四个互补代表，OpenShell 与 NVIDIA agent runtime 产品栈重叠。",
        "继续观察其外部贡献和独立社区结构。",
    ),
    "googleapis/mcp-toolbox": (
        "数据库 MCP server 是重要集成案例，但不足以代表通用协议或 runtime。",
        "适合作为 MCP 应用示例，不占协议主图 logo。",
    ),
    "coze-dev/coze-loop": (
        "Observability 区已有 Opik、Langfuse、Phoenix 和 Promptfoo，当前无需增加第五个相似平台。",
        "若外部采用和独立贡献者继续上升，可进入替换候选。",
    ),
    "microsoft/agent-lightning": (
        "面向 agent training 的方向值得跟踪，但最近可用 OpenRank 仅 0.62，暂不足以进入 Post-Train 主图。",
        "等持续协作信号稳定后再复核。",
    ),
    "nvidia-nemo/rl": (
        "RL section 已由 verl、AReaL、RLinf 和 TRL 覆盖，继续增加同类 toolkit 会让版面过密。",
        "作为 NVIDIA 训练栈注释保留。",
    ),
    "jundot/omlx": (
        "Apple Silicon inference 很有关注度，但单平台项目暂不挤占已经扩容的 Serving · Inference 区。",
        "观察其持续贡献和非 macOS 扩展情况。",
    ),
    "stacklok/toolhive": (
        "MCP server 运维能力与 MCP Context Forge、AgentGateway 有交叉，当前 gateway 预算已满。",
        "安全和运维能力可作为后续 gateway 专题的候选。",
    ),
    "openhands/software-agent-sdk": (
        "它是 OpenHands 的拆分 SDK；主图已经保留 OpenHands，不重复增加同一项目谱系 logo。",
        "在 OpenHands 项目演化说明中标注即可。",
    ),
    "microsoft/fara": (
        "Fara 属于 computer-use model 候选，Large Models 需要按模型发布、开放权重和评测单独筛选。",
        "不能直接沿用 GitHub repo 的 OpenRank 规则决定入图。",
    ),
    "nvidia/isaac-gr00t": (
        "Isaac GR00T 属于 robotics foundation model，Large Models 使用独立发布与开放度口径。",
        "本 CSV 保留项目数据，但不把它直接塞入 Agent Infra 或 Model Infra。",
    ),
    "modular/modular": (
        "编译与 runtime 信号很强，但 GitHub API 未识别标准 SPDX 许可证，本版暂不进入开放生态主图。",
        "完成代码范围和许可证复核后再决定是否替换 compiler 区项目。",
    ),
    "spring-projects/spring-ai": (
        "JVM 生态本版优先加入 Koog；Code-first frameworks 已达到十个项目。",
        "Spring AI 保留为下一轮替换候选。",
    ),
    "agno-agi/agno": (
        "框架区已经覆盖主流 Python、TypeScript、JVM 和 .NET 代表，Agno 的结构增量有限。",
        "若社区活跃度持续高于现有框架，可进入替换候选。",
    ),
    "microsoft/autogen": (
        "Microsoft Agent Framework 已成为统一入口，本版不再同时保留 AutoGen。",
        "AutoGen 的历史影响力可在框架谱系说明中呈现。",
    ),
    "microsoft/semantic-kernel": (
        "Microsoft Agent Framework 已覆盖其主要 agent framework 位置，避免同一厂商同一谱系重复占位。",
        "Semantic Kernel 继续作为历史和企业集成参考。",
    ),
}


SECTION_CAVEATS = {
    "Agentic coding": "该区变化最快，logo 数量控制在 12 个，后续按持续协作和产品独立性替换。",
    "Coding harnesses": "harness 热度容易受短期传播影响，需要持续检查外部贡献和真实复用。",
    "Personal AI assistants": "产品边界普遍较宽，只在这一分区出现，避免与 chatbot 和 framework 重复。",
    "Chatbot workspaces": "该区维持三个成熟代表，避免把普通聊天客户端扩张成主图主体。",
    "Multi-agent orchestration": "多 agent 概念变化快，保留项目需要持续显示独立编排能力。",
    "Workflow & agent builders": "与通用低代码平台有交叉，主图只保留明确支持 agent workflow 的项目。",
    "Code-first frameworks": "该区按语言和 runtime 多样性取样，不追求把所有 framework 都放进来。",
    "Memory, knowledge & context": "数据库、RAG 和 memory 边界容易混淆，图中要标清每个项目承担的层次。",
    "Protocols & interoperability": "协议成熟度差异较大，preview 或规范状态需要在图上明确。",
    "Tool & browser use": "browser/computer-use 项目迭代很快，需要按可复现能力和维护状态复核。",
    "Observability & evaluation": "商业产品和 open-core 较多，后续要持续检查许可证与开放治理。",
    "Model API gateways": "需要区分 model API、MCP gateway 和 agentic proxy，避免把所有代理工具放在一起。",
    "Development sandboxes": "编排层和隔离 runtime 不是一回事，主图说明中要保留这一区别。",
    "Serving · Deploy": "该区只保留部署入口和 serving control plane，不与底层 inference engine 重复。",
    "Serving · Inference": "项目数量已经较多，子项目和硬件 plugin 优先作为注释而不是独立 logo。",
    "Post-Train · Reinforcement learning": "框架功能重叠明显，按通用性和持续协作控制在四个项目。",
    "Post-Train · Supervised fine-tuning": "当前三个代表已经覆盖主流易用训练工具，不继续扩容。",
    "Pre-Train · Framework & parallel": "保留通用框架和并行训练基线，不按短期 stars 排名。",
    "Pre-Train · Evaluation & observability": "该区同时包含实验追踪和模型生命周期管理，需避免与 Agent observability 混用。",
    "Pre-Train · Robotics infra": "只放 robotics infra，不把机器人 foundation model 混进来。",
    "Pre-Train · Compiler & accelerator": "该区强调编译、kernel 和模型优化的结构覆盖，不追求完整 CUDA 工具清单。",
    "Data · Labeling": "保留通用标注平台，垂直数据工具进入专题而不是主图。",
    "Data · Integration": "只放与 AI 数据准备直接相关的代表项目，避免扩张成通用数据工程图。",
    "Data · Governance": "Apache 和开放数据格式是该区重点，当前七个项目已经较为饱满。",
    "Compute & scheduling": "保留通用计算和 Kubernetes AI 调度代表，不增加相似控制器。",
}


def normalize_repo(name: str) -> str:
    return name.strip().lower()


def read_csv(path: Path) -> tuple[list[str], list[dict[str, str]]]:
    with path.open(newline="", encoding="utf-8") as handle:
        reader = csv.DictReader(handle)
        return list(reader.fieldnames or []), list(reader)


def latest_metric_fields(fieldnames: list[str]) -> tuple[str, str, str]:
    openrank_fields = sorted(
        field
        for field in fieldnames
        if field.startswith("openrank_") and not field.startswith("openrank_trend_")
    )
    trend_fields = sorted(
        field for field in fieldnames if field.startswith("openrank_trend_")
    )
    participant_fields = sorted(
        field for field in fieldnames if field.startswith("participants_")
    )
    if len(openrank_fields) != 1 or len(trend_fields) != 1 or len(participant_fields) != 1:
        raise ValueError(
            "Expected exactly one OpenRank, trend, and participant field: "
            f"{openrank_fields}, {trend_fields}, {participant_fields}"
        )
    return openrank_fields[0], trend_fields[0], participant_fields[0]


def metric_reason(row: dict[str, str], openrank_field: str) -> str:
    stars = int(float(row.get("stars") or 0))
    openrank = row.get(openrank_field, "").strip()
    signal = f"{stars:,} stars"
    if openrank:
        signal += f"，最近可用 OpenRank {float(openrank):.2f}"
    else:
        signal += "，最近窗口暂未产出 OpenRank"
    return signal


def generic_omit(
    row: dict[str, str],
    openrank_field: str,
) -> tuple[str, str]:
    if row.get("archived") == "true":
        return (
            "仓库当前已归档，不进入下一版 landscape。",
            "历史影响力仍可在报告正文中保留。",
        )
    prior_reason = row.get("selection_reason", "").strip()
    prior_caveat = row.get("selection_caveat", "").strip()
    if prior_reason:
        return (
            f"候选项目已复核，但在当前版面预算下暂不入图：{prior_reason}",
            prior_caveat
            or "保留在项目池；若形成独立类别或持续社区信号，再重新评估。",
        )
    return (
        f"未进入本版主图；{metric_reason(row, openrank_field)}，但与已选项目功能重叠，或没有形成新的结构位置。",
        "继续保留在项目池，后续按持续协作、独立采用和分类缺口复核。",
    )


def write_atomic(
    path: Path,
    rows: list[dict[str, Any]],
    fieldnames: list[str],
) -> None:
    temporary = path.with_suffix(path.suffix + ".tmp")
    with temporary.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.DictWriter(
            handle,
            fieldnames=fieldnames,
            extrasaction="ignore",
            lineterminator="\n",
        )
        writer.writeheader()
        writer.writerows(rows)
    temporary.replace(path)


def markdown_table(rows: list[dict[str, str]]) -> str:
    header = "| 项目 | Layer | Section | 判断 | 注意 |\n|---|---|---|---|---|"
    body = [
        "| "
        + " | ".join(
            [
                f"`{row['repo_name']}`",
                row["landscape_layer"],
                row["landscape_section"],
                row["selection_reason"].replace("|", "/"),
                row["selection_caveat"].replace("|", "/"),
            ]
        )
        + " |"
        for row in rows
    ]
    return "\n".join([header, *body])


def density_table(
    current_counts: Counter[str],
    recommended_counts: Counter[str],
) -> str:
    rows = []
    for key in sorted(set(current_counts) | set(recommended_counts)):
        before = current_counts[key]
        after = recommended_counts[key]
        if before == after:
            continue
        layer, section = key.split(" / ", 1)
        delta = after - before
        rows.append(
            f"| {layer} | {section} | {before} | {after} | {delta:+d} |"
        )
    return "\n".join(
        [
            "| Layer | Section | 当前 | 建议 | 变化 |",
            "|---|---|---:|---:|---:|",
            *rows,
        ]
    )


def main() -> None:
    fieldnames, rows = read_csv(CSV_PATH)
    _, references = read_csv(REFERENCE_PATH)
    openrank_field, trend_field, participant_field = latest_metric_fields(fieldnames)
    forbidden = {
        "categories",
        "review_tier",
        "snapshot_date",
        "metrics_month",
        "metrics_status",
        "openrank_trend",
    }
    present_forbidden = forbidden.intersection(fieldnames)
    if present_forbidden:
        raise ValueError(f"Run the compact refresh first; found {present_forbidden}")

    reference_by_id = {row["repo_id"]: row for row in references}
    if len(reference_by_id) != 122:
        raise ValueError("Current landscape reference must contain 122 projects")

    output: list[dict[str, str]] = []
    for source in rows:
        row = dict(source)
        repo_key = normalize_repo(row["repo_name"])
        current = reference_by_id.get(row["repo_id"])

        if repo_key in HISTORICAL_KEEP:
            # LobeHub already appeared in earlier landscapes as
            # lobehub/lobe-chat. The stable GitHub repo_id is unchanged, so a
            # repository rename or a temporary omission must not produce NEW.
            row.update(HISTORICAL_KEEP[repo_key])
            row["landscape_action"] = "keep"
        elif repo_key in ADD:
            row.update(ADD[repo_key])
            row["landscape_action"] = "add"
        elif repo_key in REMOVE:
            if not current:
                raise ValueError(f"Remove decision is not in current landscape: {row['repo_name']}")
            reason, caveat = REMOVE[repo_key]
            row.update(
                {
                    "landscape_action": "remove",
                    "landscape_layer": current["current_landscape_layer"],
                    "landscape_section": current["current_landscape_section"],
                    "selection_reason": reason,
                    "selection_caveat": caveat,
                }
            )
        elif repo_key in MOVE:
            if not current:
                raise ValueError(f"Move decision is not in current landscape: {row['repo_name']}")
            row.update(MOVE[repo_key])
            row["landscape_action"] = "keep"
        elif current:
            layer = current["current_landscape_layer"]
            section = current["current_landscape_section"]
            row.update(
                {
                    "landscape_action": "keep",
                    "landscape_layer": layer,
                    "landscape_section": section,
                    "selection_reason": (
                        f"当前图中的 {section} 代表项目；仓库仍在维护，"
                        f"{metric_reason(row, openrank_field)}。"
                    ),
                    "selection_caveat": SECTION_CAVEATS[section],
                }
            )
        else:
            reason, caveat = OMIT_OVERRIDES.get(
                repo_key,
                generic_omit(row, openrank_field),
            )
            row.update(
                {
                    "landscape_action": "omit",
                    "landscape_layer": "",
                    "landscape_section": "",
                    "selection_reason": reason,
                    "selection_caveat": caveat,
                }
            )
        output.append(row)

    action_counts = Counter(row["landscape_action"] for row in output)
    selected = [
        row for row in output if row["landscape_action"] in {"keep", "add"}
    ]
    layer_counts = Counter(row["landscape_layer"] for row in selected)
    section_counts = Counter(
        f"{row['landscape_layer']} / {row['landscape_section']}"
        for row in selected
    )
    current_section_counts = Counter(
        f"{row['current_landscape_layer']} / {row['current_landscape_section']}"
        for row in references
    )
    failures = []
    if action_counts != Counter({"keep": 105, "omit": 108, "add": 21, "remove": 17}):
        failures.append(f"unexpected action counts: {dict(action_counts)}")
    if layer_counts != Counter({"Agent Infra": 74, "Model Infra": 52}):
        failures.append(f"unexpected selected layer counts: {dict(layer_counts)}")
    if any(
        not row[field].strip()
        for row in selected
        for field in (
            "landscape_layer",
            "landscape_section",
            "selection_reason",
            "selection_caveat",
        )
    ):
        failures.append("selected rows contain blank editorial fields")
    if any(
        not row["selection_reason"].strip()
        or not row["selection_caveat"].strip()
        for row in output
    ):
        failures.append("rows contain blank reason or caveat")
    if failures:
        raise ValueError("; ".join(failures))

    write_atomic(CSV_PATH, output, fieldnames)
    summary = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "source_landscape_url": "https://landscape-demo-omega.vercel.app/",
        "current_landscape_projects": len(references),
        "current_layer_counts": {"Agent Infra": 73, "Model Infra": 49},
        "recommended_layer_counts": dict(sorted(layer_counts.items())),
        "action_counts": dict(sorted(action_counts.items())),
        "metric_fields": {
            "openrank": openrank_field,
            "trend": trend_field,
            "participants": participant_field,
        },
        "current_section_counts": dict(sorted(current_section_counts.items())),
        "section_counts": dict(sorted(section_counts.items())),
        "add_projects": [
            row["repo_name"] for row in output if row["landscape_action"] == "add"
        ],
        "remove_projects": [
            row["repo_name"]
            for row in output
            if row["landscape_action"] == "remove"
        ],
        "category_adjustments": {
            "farion1231/cc-switch": {
                "from": "Model API gateways",
                "to": "Coding harnesses",
            }
        },
        "validation": {
            "passed": True,
            "failures": [],
            "rows": len(output),
            "unique_repo_ids": len({row["repo_id"] for row in output}),
            "unique_repo_names": len(
                {normalize_repo(row["repo_name"]) for row in output}
            ),
        },
    }
    SUMMARY_PATH.write_text(
        json.dumps(summary, ensure_ascii=False, indent=2),
        encoding="utf-8",
    )

    additions = [
        row for row in output if row["landscape_action"] == "add"
    ]
    removals = [
        row for row in output if row["landscape_action"] == "remove"
    ]
    report = f"""# 2026-07 Landscape 项目取舍

当前 Vercel 版本有 122 个项目：Agent Infra 73 个，Model Infra 49 个。

这轮建议落在 126 个：Agent Infra 74 个，Model Infra 52 个。分类结构继续沿用现有 25 个 section，没有新增大类。变化主要靠替换完成：新增 {len(additions)} 个，拿下 {len(removals)} 个。

## 版面密度变化

只列项目数发生变化的 section。最大的拥挤区 Agentic coding 从 15 个压到 12 个；其余扩容都控制在 1–2 个 logo。

{density_table(current_section_counts, section_counts)}

## 建议补入

{markdown_table(additions)}

## 建议拿下

{markdown_table(removals)}

## 分类调整

- `farion1231/cc-switch` 从 Model API gateways 移到 Coding harnesses。它管理 coding agent 的配置和切换，并不是模型 API gateway。
- Protocols & interoperability 继续保留原 section，补入 AG-UI 和 A2UI，不另建协议大类。
- Memory, knowledge & context 维持七个项目，通过一进一出提高结构覆盖，不扩大版面。
- Serving · Inference 增加多模态 serving、KV cache 和通用 runtime，但硬件 plugin 仍作为主项目注释。

## 数据口径

- GitHub 仓库信息与 stars：2026-07-28。
- 最近可用 Repo OpenRank：`{openrank_field}`。
- 12 个月趋势：`{trend_field}`，覆盖 2025-08 至 2026-07；7 月尚未产出 OpenRank，因此最后一个点为 `null`。
- 当月参与者：`{participant_field}`。
- OpenRank 只作为持续协作信号，最终取舍还考虑结构代表性、项目重复度、许可证和版面预算。
"""
    REPORT_PATH.write_text(report, encoding="utf-8")
    print(json.dumps(summary, ensure_ascii=False, indent=2))
    print(f"updated={CSV_PATH}")
    print(f"report={REPORT_PATH}")


if __name__ == "__main__":
    main()
