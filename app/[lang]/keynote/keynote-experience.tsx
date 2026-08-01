"use client";

import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CircleHelpIcon,
  ExpandIcon,
  MonitorPlayIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { LandscapeProject } from "@/lib/landscape-types";

import styles from "./page.module.css";
import { type Localized, pick } from "./i18n";
import { type LandscapeKey, getLandscapeViews } from "./landscape-story";
import {
  type ApacheDomainKey,
  getApacheBackbone,
} from "./apache-ecosystem";
import ApacheProjectAtlas from "./apache-project-atlas";
import {
  getApacheOpenMdwComparison,
  buildLicenseDistribution,
  getLicenseLayerLabels,
  getMaterialChecks,
  licenseColors,
  licenseDisplayNames,
  type LicenseLayer,
  licenseReferences,
  projectsForLicenseLayer,
} from "./license-research";
import LandscapeExplorer from "@/app/components/landscape-explorer";
import LandscapeLogo from "@/app/components/landscape-logo";
import LocaleSwitch from "../locale-switch";
import type { Locale } from "../dictionaries";

const KEYNOTE_LOCALES: Locale[] = ["en", "zh"];

export type StackKey = "models" | "embodied" | "infra" | "industry";
export type CommunityKey = "discover" | "propose" | "review" | "ship" | "trust";
type LicenseFilter = "all" | "license" | "framework" | "definition";

type InclusionProject = {
  name: string;
  role: string;
  description: string;
  href: string;
  logo: string;
};

type LocalizedInclusionProject = {
  name: string;
  role: Localized<string>;
  description: Localized<string>;
  href: string;
  logo: string;
};

const chaptersSource: readonly [string, Localized<string>][] = [
  ["landscape", { en: "Landscape refresh", zh: "生态图更新" }],
  ["apache", { en: "Apache's place in it", zh: "Apache 的位置" }],
  ["inclusion", { en: "InclusionAI's stack", zh: "InclusionAI 技术栈" }],
  ["licenses", { en: "Open models & licenses", zh: "模型开放与许可证" }],
  ["community", { en: "Community >>> Code", zh: "Community >>> Code" }],
];

const stackDataSource: Record<
  StackKey,
  {
    label: Localized<string>;
    kicker: string;
    title: Localized<string>;
    projects: LocalizedInclusionProject[];
    body: Localized<string>;
    ask: Localized<string>;
  }
> = {
  models: {
    label: { en: "Foundation models", zh: "基础模型" },
    kicker: "FOUNDATION MODELS",
    title: { en: "Four model lines, advancing in parallel", zh: "四条模型路线并行推进" },
    projects: [
      {
        name: "Ling",
        role: { en: "Language · efficient MoE", zh: "语言 · 高效 MoE" },
        description: {
          en: "From lightweight activation to trillion-parameter scale, keeping general capability and training efficiency on one model line.",
          zh: "从轻量激活到万亿参数，把通用能力与训练效率放在同一条模型线上。",
        },
        href: "https://github.com/inclusionAI/Ling-V2.5",
        logo: "/keynote/inclusionai/ling.png",
      },
      {
        name: "Ring",
        role: { en: "Reasoning · agentic", zh: "推理 · Agentic" },
        description: {
          en: "A thinking-model series built for deep reasoning and long task chains.",
          zh: "面向深度推理与长链路任务的 thinking model 系列。",
        },
        href: "https://github.com/inclusionAI/Ring-V2.5",
        logo: "/keynote/inclusionai/ling.png",
      },
      {
        name: "LLaDA",
        role: { en: "Diffusion language model", zh: "扩散语言模型" },
        description: {
          en: "Scales discrete diffusion up to the 100B range, with open inference and fine-tuning tooling alongside it.",
          zh: "把离散扩散路线扩展到 100B 级，并配套开放推理与微调工具。",
        },
        href: "https://github.com/inclusionAI/LLaDA2.X",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
      {
        name: "Ming",
        role: { en: "Omni-modal", zh: "全模态" },
        description: {
          en: "Connects understanding and generation across text, image, speech, and music.",
          zh: "连接文本、图像、语音、音乐等理解与生成能力。",
        },
        href: "https://github.com/inclusionAI/Ming",
        logo: "/keynote/inclusionai/ming.png",
      },
    ],
    body: {
      en: "Ling, Ring, LLaDA, and Ming focus on language, reasoning, diffusion, and omni-modality respectively. Beyond weights, each project ships model cards, staged checkpoints, an inference implementation, and evaluation material.",
      zh: "Ling、Ring、LLaDA、Ming 分别关注语言、推理、扩散和全模态。除了权重，项目还提供模型卡、阶段性 checkpoint、推理实现和评测材料。",
    },
    ask: {
      en: "Ways in: evaluation review, domain adaptation, inference optimization, quantized deployment, and studying model behavior.",
      zh: "参与入口：复核评测、领域适配、推理优化、量化部署与模型行为研究。",
    },
  },
  embodied: {
    label: { en: "Embodied intelligence", zh: "具身大脑" },
    kicker: "EMBODIED INTELLIGENCE",
    title: { en: "Intelligence starts entering the physical world", zh: "智能开始进入物理世界" },
    projects: [
      {
        name: "LingBot-Map",
        role: { en: "Spatial intelligence", zh: "空间智能" },
        description: {
          en: "A feed-forward 3D foundation model built for streaming scene reconstruction.",
          zh: "面向流式场景重建的前馈 3D foundation model。",
        },
        href: "https://github.com/Robbyant/lingbot-map",
        logo: "/keynote/inclusionai/robbyant.png",
      },
      {
        name: "LingBot-World",
        role: { en: "World model", zh: "世界模型" },
        description: {
          en: "An open world model supporting understanding and generation of interactive environments.",
          zh: "以开放 world model 支撑可交互环境的理解与生成。",
        },
        href: "https://github.com/Robbyant/lingbot-world",
        logo: "/keynote/inclusionai/robbyant.png",
      },
      {
        name: "LingBot-VLA",
        role: { en: "Perception to action", zh: "感知到行动" },
        description: {
          en: "A VLA foundation model connecting vision, language, and robot actions.",
          zh: "连接视觉、语言与机器人动作的 VLA foundation model。",
        },
        href: "https://github.com/Robbyant/lingbot-vla",
        logo: "/keynote/inclusionai/robbyant.png",
      },
      {
        name: "LingBot-Depth",
        role: { en: "Spatial perception", zh: "空间感知" },
        description: {
          en: "Builds a general spatial-perception representation through masked depth modeling.",
          zh: "以 masked depth modeling 建立通用空间感知表征。",
        },
        href: "https://github.com/Robbyant/lingbot-depth",
        logo: "/keynote/inclusionai/robbyant.png",
      },
    ],
    body: {
      en: "Robbyant's LingBot series connects mapping, depth, world models, and action models. Contributors can also join through robotics data, simulation, evaluation, and real-world engineering.",
      zh: "Robbyant 的 LingBot 系列把地图、深度、世界模型和动作模型连起来。参与者也可以从机器人数据、仿真、评测和真实环境工程进入。",
    },
    ask: {
      en: "Ways in: spatial data, simulation environments, robot adaptation, real-world evaluation, and deployment.",
      zh: "参与入口：空间数据、仿真环境、机器人适配、真实世界评测与部署。",
    },
  },
  infra: {
    label: { en: "Model Infra", zh: "Model Infra" },
    kicker: "AI LIBRARY · PRE-TRAIN · POST-TRAIN · INFERENCE",
    title: {
      en: "Turning foundation models into running systems, from training to inference",
      zh: "从训练到推理，把基础模型变成可运行系统",
    },
    projects: [
      {
        name: "cuLA",
        role: { en: "AI Library", zh: "AI Library" },
        description: {
          en: "Linear-attention CUDA kernels implemented with the CuTe DSL and CUTLASS.",
          zh: "以 CuTe DSL 与 CUTLASS 实现线性注意力 CUDA kernels。",
        },
        href: "https://github.com/inclusionAI/cuLA",
        logo: "/keynote/inclusionai/cula.png",
      },
      {
        name: "Humming",
        role: { en: "AI Library", zh: "AI Library" },
        description: {
          en: "High-performance operators and system components for model training and inference.",
          zh: "面向模型训练和推理的高性能算子与系统组件。",
        },
        href: "https://github.com/inclusionAI/humming",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
      {
        name: "DLRover",
        role: { en: "Pre-train", zh: "Pre-train" },
        description: {
          en: "Fault tolerance, elastic scheduling, and checkpointing for large-scale distributed training.",
          zh: "支撑大规模分布式训练的容错、弹性调度与 checkpoint。",
        },
        href: "https://github.com/intelligent-machine-learning/dlrover",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
      {
        name: "ATorch",
        role: { en: "Pre-train", zh: "Pre-train" },
        description: {
          en: "Automatic parallelism and performance optimization for large-model training.",
          zh: "为大模型训练提供自动并行与性能优化能力。",
        },
        href: "https://github.com/intelligent-machine-learning/atorch",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
      {
        name: "AReaL",
        role: { en: "Post-train · RL", zh: "Post-train · RL" },
        description: {
          en: "A reinforcement-learning system that connects foundation-model training with agentic applications.",
          zh: "连接 foundation model 训练与 agentic applications 的强化学习系统。",
        },
        href: "https://github.com/areal-project/AReaL",
        logo: "/keynote/inclusionai/areal.png",
      },
      {
        name: "AReno",
        role: { en: "Post-train · RL", zh: "Post-train · RL" },
        description: {
          en: "Lowers the barrier to scaling RL post-training on a single node.",
          zh: "降低单节点规模化 RL post-training 的使用门槛。",
        },
        href: "https://github.com/inclusionAI/AReno",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
      {
        name: "dInfer",
        role: { en: "Inference", zh: "Inference" },
        description: {
          en: "An efficient, scalable inference framework for diffusion language models.",
          zh: "面向扩散语言模型的高效、可扩展推理框架。",
        },
        href: "https://github.com/inclusionAI/dInfer",
        logo: "/keynote/inclusionai/dinfer.svg",
      },
      {
        name: "dFactory",
        role: { en: "dLLM Fine-tuning", zh: "dLLM Fine-tuning" },
        description: {
          en: "An efficient, reusable fine-tuning pipeline for diffusion language models.",
          zh: "为扩散语言模型提供高效、可复用的微调工程链路。",
        },
        href: "https://github.com/inclusionAI/dFactory",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
    ],
    body: {
      en: "This layer maps to the AI Library, Pre-Train, Post-Train, and dLLM boxes in InclusionAI's architecture diagram: cuLA, Humming, DLRover, ATorch, AReaL, AReno, dInfer, dFactory.",
      zh: "这一层对应 InclusionAI 架构图里的 AI Library、Pre Train、Post Train 和 DLLM：cuLA、Humming、DLRover、ATorch、AReaL、AReno、dInfer、dFactory。",
    },
    ask: {
      en: "Ways in: operator kernels, distributed training, reinforcement learning, fine-tuning, inference, and systems efficiency.",
      zh: "参与入口：算子、分布式训练、强化学习、微调、推理与系统效率。",
    },
  },
  industry: {
    label: { en: "Agent Infra", zh: "Agent Infra" },
    kicker: "AGENT RUNTIME · ENVIRONMENT · SEARCH · COORDINATION",
    title: {
      en: "Wiring model capability into environments, tools, and tasks",
      zh: "把模型能力接入环境、工具和任务",
    },
    projects: [
      {
        name: "AWorld",
        role: { en: "Agent Harness", zh: "Agent Harness" },
        description: {
          en: "Organizes tools, memory, context, execution, and self-evolution into an agent runtime.",
          zh: "把工具、记忆、上下文、执行与自我进化组织成 agent runtime。",
        },
        href: "https://github.com/inclusionAI/AWorld",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
      {
        name: "AEnvironment",
        role: { en: "Everything as Environment", zh: "Everything as Environment" },
        description: {
          en: "A unified environment interface for agentic RL, benchmarks, and service deployment.",
          zh: "为 Agentic RL、benchmark 和服务部署提供统一环境接口。",
        },
        href: "https://github.com/inclusionAI/AEnvironment",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
      {
        name: "Avernet",
        role: { en: "Multi-agent coordination", zh: "多 Agent 协同" },
        description: {
          en: "Lets agents connect, coordinate, execute, and keep evolving.",
          zh: "让 agents 连接、协调、执行并持续演进。",
        },
        href: "https://github.com/inclusionAI/Avernet",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
      {
        name: "ASearcher",
        role: { en: "Search agent", zh: "搜索 Agent" },
        description: {
          en: "An open reinforcement-learning project for large-scale search agents.",
          zh: "面向大规模 search agent 的开放强化学习项目。",
        },
        href: "https://github.com/inclusionAI/ASearcher",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
    ],
    body: {
      en: "AWorld, AEnvironment, Avernet, and ASearcher map to the Agent Infra concerns the landscape tracks: runtime, environment, coordination, and search.",
      zh: "AWorld、AEnvironment、Avernet 和 ASearcher 对应 Landscape 关注的 Agent Infra：运行时、环境、协作与搜索。",
    },
    ask: {
      en: "Ways in: tool protocols, runtime environments, task definitions, coordination, evaluation, and reliability.",
      zh: "参与入口：工具协议、运行环境、任务定义、协同、评测与可靠性。",
    },
  },
};

const inclusionServicesSource: {
  domain: Localized<string>;
  name: string;
  description: Localized<string>;
  logo: string;
}[] = [
  {
    domain: { en: "General service", zh: "通用服务" },
    name: "LingGuang",
    description: { en: "An omni-modal AI assistant", zh: "全模态 AI 助手" },
    logo: "/keynote/inclusionai/lingguang.png",
  },
  {
    domain: { en: "Financial service", zh: "金融服务" },
    name: "MA XIAO CAI",
    description: { en: "AI Financial Steward", zh: "AI Financial Steward" },
    logo: "/keynote/inclusionai/ma-xiao-cai.svg",
  },
  {
    domain: { en: "Healthcare service", zh: "医疗服务" },
    name: "AQ",
    description: { en: "A trusted assistant for health and medicine", zh: "面向健康与医疗的可信助手" },
    logo: "/keynote/inclusionai/aq-medai.png",
  },
  {
    domain: { en: "Everyday service", zh: "生活服务" },
    name: "Life Services",
    description: { en: "Real-world scenarios: payments, travel, home", zh: "支付、出行、家庭等真实场景" },
    logo: "/keynote/apache/assets/ant-group.png",
  },
];

const communityDataSource: Record<CommunityKey, [Localized<string>, Localized<string>]> = {
  discover: [
    { en: "Make the front door visible first", zh: "先让入口可见" },
    {
      en: "A public roadmap, model cards, and clearly written tasks let a stranger see where the current problems are and how to start.",
      zh: "公开 roadmap、模型卡和清楚的任务说明，会让陌生贡献者知道当前问题在哪里，以及怎样开始。",
    },
  ],
  propose: [
    { en: "Put the idea into a shared record", zh: "把想法放进共同记录" },
    {
      en: "A proposal, an issue, or a reproducible experiment gives a technical claim context. A contribution doesn't have to start as code, but it has to be findable by others.",
      zh: "proposal、issue 或可复现实验为技术主张提供上下文。贡献不必一开始就写成代码，但要能被其他人找到。",
    },
  ],
  review: [
    { en: "Make decisions worth revisiting", zh: "让选择经得起回看" },
    {
      en: "Open review leaves behind the trade-offs, risks, and alternatives considered. Whoever comes later doesn't have to rely on one company's or one maintainer's private memory.",
      zh: "公开审查留下取舍、风险和替代方案。后来者不必依赖某家公司或某位维护者的内部记忆。",
    },
  ],
  ship: [
    { en: "Own the outcome together", zh: "一起承担交付结果" },
    {
      en: "Merging, releasing, compatibility, and regression checks turn individual work into a shared asset. A steady collaborative rhythm matters more than chasing release counts.",
      zh: "合并、发布、兼容性和回归验证把个人工作变成公共资产。稳定的协作节奏比单纯追求发布次数更有价值。",
    },
  ],
  trust: [
    { en: "Let permissions follow contribution", zh: "权限跟着贡献增长" },
    {
      en: "Maintenance, responsiveness, and technical judgment accumulate into trust over time. Being a committer or a member is a governance responsibility, not a badge for staying active.",
      zh: "维护、回应和技术判断会逐步累积成信任。committer 或 member 是治理责任，不是一枚活跃度徽章。",
    },
  ],
};

const communityStepLabels: Localized<string>[] = [
  { en: "Find the entry point", zh: "发现入口" },
  { en: "Propose a change", zh: "提出变更" },
  { en: "Review in the open", zh: "公开审查" },
  { en: "Ship together", zh: "共同交付" },
  { en: "Earn trust", zh: "积累信任" },
];

const uiText = {
  en: {
    backToLandscape: "Back to Agentic AI Landscape",
    eventLabel: "CommunityOverCode Asia",
    eventDate: "2026 keynote · Aug 7",
    playSlides: "Slide deck",
    backToMap: "Back to the map",
    dateAria: "August 7, 2026",
    dateCity: "2026 · Beijing",
    eyebrow: "30 min · English keynote working draft",
    titlePrefix: "Old rules for an open ecosystem, ",
    titleEm: "under new Agentic AI trends",
    heroIntro:
      "Agents are changing how software is entered, produced, and run. The names on the landscape shift fast, but how a project gets discovered, how techniques get reused, and how rights get spelled out — that still decides whether a technology can become public infrastructure.",
    dataWindowAria: "Data time windows",
    chapterNavAria: "Keynote chapters",
    section01: "01 · ECOSYSTEM REFRESH",
    section01Heading: "Every refresh of the landscape answers one question: ",
    section01HeadingEm: "what's starting to matter?",
    section01Body:
      "This update didn't just pick a few new names off a star leaderboard. The candidate pool expands first, then narrows through semantics, activity, and ecosystem role — layout comes last. The numbers surface change; deciding what belongs on the landscape is still an editorial call.",
    funnelAria: "Project filtering funnel",
    statStripCards: [
      ["105", { en: "Kept", zh: "保留" }, { en: "Ecosystem role still clear", zh: "生态角色仍然清晰" }],
      ["21", { en: "Added", zh: "新增" }, { en: "Fills gaps in protocols, inference, and context", zh: "补足协议、推理与上下文" }],
      ["17", { en: "Removed", zh: "移出" }, { en: "Deduped, loosely related, or a layout call", zh: "去重、弱相关或版面取舍" }],
      ["251", { en: "reference sources", zh: "reference source" }, { en: "Full CSV keeps every judgment call", zh: "CSV 保留完整判断" }],
    ],
    layoutChangeLabel: "版面变化 label",
    editorial1Label: "Layout changes",
    editorial1Heading: "The taxonomy wasn't torn down and rebuilt",
    editorial2Label: "Metric boundaries",
    editorial2Heading: "Each of the three signals only answers part of the question",
    metricRows2: [
      ["OpenRank", { en: "Collaborative activity", zh: "协作活跃度" }],
      ["Stars / WatchEvent", { en: "Change in attention", zh: "关注变化" }],
      ["README & project role", { en: "Whether it can be adopted", zh: "能否被采用" }],
    ],
    explorerToggleAria: "Switch landscape",
    searchAria: "Search Agent Infra and Model Infra",
    clearSearchAria: "Clear Infra search",
    openStandalone: "Open standalone",
    fullscreen: "Fullscreen",
    loadingHd: "Loading high-resolution landscape…",
    howToRead: "How to read this view",
    speakerNoteLabel: "Speaker notes",
    howWeMadeThis: "How we made this?",
    howWeMadeThisSub: "Data, filtering, and talking points for",
    methodNote: "METHOD NOTE",
    howBuiltHeading: "How this was built",
    caveatsLabel: "Read these limits alongside the numbers",
    sourceMaterialLabel: "Source material",
    fullNoteTitle: "Open the full write-up",
    fullNoteSub: "Best read before the talk and for Q&A prep",
    section02: "02 · APACHE IN THE STACK",
    section02Heading1: "Apache projects cluster around the agent's ",
    section02HeadingEm: "data and runtime foundation.",
    agentRuntimeLabel: "Agent runtime",
    agentRuntimeValue: "Tool calls · data access · continuous execution",
    apacheAccumLabel: "Apache's depth",
    apacheAccumValue: "Workflow · compute · data governance · transactions",
    apacheScaleCards: [
      ["305", { en: "non-retired project records", zh: "非 retired 项目记录" }],
      ["259", { en: "with a DOAP technical category", zh: "有 DOAP 技术分类" }],
      ["2,473", { en: "non-fork, non-archived repos", zh: "非 fork、非归档仓库" }],
      ["6 / 57", { en: "selected into Model Infra", zh: "入选 Model Infra" }],
    ],
    apacheDataNote:
      "Projects Directory 2026-07-27 · GitHub apache org 2026-07-30. The ASF homepage separately shows 290+ projects, 1,300+ releases, 10,000+ committers, and 1,190+ members — these figures describe different objects and aren't interchangeable.",
    apacheBridgeLandscape: "LANDSCAPE",
    apacheBridgeLandscapeStrong: "6 Apache projects",
    apacheBridgeShared: "Together cover one runtime chain",
    apacheBridgeStages: [
      { en: "Orchestrate", zh: "编排" },
      { en: "Compute", zh: "计算" },
      { en: "Data", zh: "数据" },
      { en: "State", zh: "状态" },
      { en: "Recover", zh: "恢复" },
    ],
    apacheBridgeAnt: "ANT PARTICIPATION",
    apacheBridgeAntStrong: "4 Apache projects",
    apacheQuote:
      "Agents in production have to handle cross-language state, relational context, failure recovery, and large-scale compute. The Apache projects on the landscape, plus the four with deep Ant participation, cover this runtime chain.",
    apacheSpeakerNote: "Speaker notes · ~6 min",
    apacheSpeakerBody:
      "This section works at two scales. The Projects Directory shows Apache spanning data, networking, libraries, cloud, web, security, and edge; the 6 ASF projects in the current Model Infra cluster around data, orchestration, and compute. Then walk the projects in system-execution order: Airflow organizes tasks, Spark and Celeborn handle compute; Iceberg, Hudi, Paimon, and Gravitino manage the open data plane, Fory carries cross-language state; GeaFlow maintains relational context, and Seata handles commit, compensation, and failure recovery. Once an agent reaches production, these long-standing systems problems all show up at once.",
    section03: "03 · INCLUSIONAI",
    section03Tag: "InclusionAI value proposition",
    inclusionHeroBody:
      "InclusionAI open-sources both the models and the engineering systems behind them. Some people train models, some build environments and tooling, and others carry these capabilities into robotics and healthcare.",
    platformRepos: "public repos",
    platformModels: "public models",
    platformDownloads30d: "downloads, last 30 days",
    serviceBandTag: "AI SERVICE",
    serviceBandHeading: "Where models and infrastructure end up: these services",
    stackTabsAria: "InclusionAI tech stack",
    dataScopeSummary: "Data scope and three organizations",
    dataScopeBody1:
      "GitHub totals cover every public repo across the inclusionAI, AQ-MedAI, and Robbyant organizations; inclusionAI includes 3 forks. Hugging Face and ModelScope each list public models under the three like-named publishers. A model released on both hubs is counted on each — the totals aren't deduplicated across platforms.",
    dataScopeBody2:
      "Hugging Face's API downloads field reflects the last 30 days. ModelScope's OpenAPI only returns a downloads figure without declaring a window in the response, so the page shows it exactly as the platform reports it.",
    githubLinkText: "GitHub ↗",
    hfLinkText: "Hugging Face ↗",
    modelscopeLinkText: "ModelScope ↗",
    fullSnapshotLink: "Full snapshot ↗",
    previousMapSummary: "See the previous InclusionAI technical map",
    previousMapAlt: "Previous InclusionAI technical map",
    inclusionSpeakerNote: "Speaker notes · ~5 min",
    inclusionSpeakerP1:
      'Start by pointing at the logo and title: InclusionAI\'s own line is "AI Built By Everyone, For Everyone." Everyone describes how you can take part. Some people train models, some build environments, tools, and evaluations, and others carry the technology into robotics, healthcare, and everyday services. Fairness, transparency, and collaboration become engineering facts here: materials are obtainable, boundaries are legible, experiments are reproducible, and whoever comes next can keep building.',
    inclusionSpeakerP2:
      "Then sweep quickly across the three platform cards. GitHub is for software and collaboration; Hugging Face and ModelScope are for model publishing and distribution. Read only three headlines: 92 public repos, 197 public models on HF, 188 public models on ModelScope. Don't add the model counts across platforms, and don't call HF downloads a cumulative total — it's a rolling 30-day window. Don't merge stars and likes into one 'approval' figure either, since the user action and the platform denominator differ. If you need to talk about change, stick to comparable parts: versus the July 11 snapshot, GitHub gained 6 public repos, 7,999 stars, and 803 forks; HF downloads is a rolling window, so don't describe the delta as 'new downloads.'",
    inclusionSpeakerP3:
      "From there, work down from AI Service. LingGuang, and the financial, healthcare, and everyday-life services, are already in real use. Problems users hit flow back into the stack as data, environments, rewards, evaluation, and reliability requirements. No need to unpack product features here — one line connecting 'open research' to 'daily life' is enough.",
    inclusionSpeakerP4:
      "You don't have to name every project across the four tabs. On the models tab, hit four lines: Ling for language and efficiency, Ring for reasoning and long task chains, LLaDA for diffusion language modeling, Ming for omni-modality. On embodied intelligence, hit one loop: Map/Depth solve spatial perception, World builds the environment model, VLA turns understanding into action. On the industry-applications tab, name only AQ-MedAI and UI-Venus to show that real industries redraw the boundary of what 'open materials' means.",
    inclusionSpeakerP5:
      "Make sure to land on Infra at the end. Keep the same three-layer path for participation: AReaL, AReno, and TwinFlow are training and alignment; AWorld and AEnvironment are the agent runtime and environment; dInfer turns a new model line into runnable software. A good closing line: even without the resources to train a foundation model, you can still contribute through environments, tools, benchmarks, inference optimization, and reliability. AReaL's main repo lives under areal-project, so it isn't counted in the three GitHub orgs shown on the page — but it's still part of this collaborative stack.",
    section04: "04 · LICENSE AND OPENNESS",
    section04Heading1: "In the age of open models, one license can only tell ",
    section04HeadingEm: "part of the story.",
    section04Body:
      "A software license answers questions about rights, obligations, and liability. A model release also has to say how far the weights, training code, data documentation, and evaluation materials actually go.",
    licenseRepoTag: "LANDSCAPE REPOSITORY LICENSES",
    licenseRepoProjects: "projects",
    licenseRepoSub: "SPDX identifiers from GitHub repos · data snapshot 2026-07-28",
    licenseFootP1: "Across all 132 projects, 61 use Apache-2.0 and 37 use MIT — together, 74.2%.",
    licenseFootP2:
      "NOASSERTION means GitHub / SPDX couldn't confirm an SPDX identifier — it should not be read as \"no license.\"",
    licenseBandCards: [
      ["26", { en: "in the Top 50 with no public weights", zh: "Top 50 中没有公开权重" }],
      ["24", { en: "ship public weights", zh: "提供公开权重" }],
      ["70.8%", { en: "of public-weight models use MIT or Apache-2.0", zh: "公开权重中采用 MIT 或 Apache-2.0" }],
    ],
    licenseFilterAll: "All",
    licenseFilterLicense: "License",
    licenseFilterFramework: "Open framework",
    licenseFilterDefinition: "Definition",
    comparisonHeaders: [
      { en: "Approach", zh: "方案" },
      { en: "Type", zh: "类型" },
      { en: "Main subject", zh: "主要对象" },
      { en: "What it clarifies", zh: "它说清楚什么" },
      { en: "Still needs checking", zh: "仍需另行检查" },
    ],
    comparisonRows: [
      [
        "license",
        "Apache License 2.0",
        { en: "Software license", zh: "软件许可证" },
        { en: "Software, documentation", zh: "软件、文档" },
        { en: "Copyright license, patent grant, NOTICE, and liability boundary", zh: "版权许可、专利授权、NOTICE 与责任边界" },
        { en: "Whether the model materials are complete", zh: "模型材料是否完整" },
      ],
      [
        "license",
        "OpenMDW 1.1",
        { en: "Model materials license", zh: "模型材料许可证" },
        { en: "Model Materials", zh: "Model Materials" },
        { en: "Rights to use and distribute model materials", zh: "模型材料的使用和分发权利" },
        { en: "Doesn't require the publisher to ship complete materials", zh: "不强制发布者提供完整材料" },
      ],
      [
        "license",
        "ModelGo",
        { en: "Composable license family", zh: "可组合许可证家族" },
        { en: "Models", zh: "模型" },
        { en: "8 variants combining BY, SA, RAI, NC, ND, and similar conditions", zh: "8 个变体组合 BY、SA、RAI、NC、ND 等条件" },
        { en: "Not the same as an openness-completeness grade", zh: "不等同于开放完整度分级" },
      ],
      [
        "framework",
        "Model Openness Framework",
        { en: "Openness-completeness framework", zh: "开放完整度框架" },
        { en: "Models and related materials", zh: "模型及相关材料" },
        { en: "Grades openness by code, data, and documentation", zh: "按代码、数据和文档判断开放层级" },
        { en: "It is not a legal license text", zh: "它不是法律许可证" },
      ],
      [
        "definition",
        "OSAID 1.0",
        { en: "Open AI definition", zh: "开放 AI 定义" },
        { en: "AI systems", zh: "AI 系统" },
        { en: "Use, Study, Modify, Share, and the preferred form", zh: "Use、Study、Modify、Share 及 preferred form" },
        { en: "It is not a single license text", zh: "它不是单一许可证文本" },
      ],
    ] as const,
    clauseHeading: "Apache-2.0 vs. OpenMDW-1.1 — what do the clauses actually govern?",
    clauseSub:
      "This compares the license texts themselves. Which materials a project actually released still has to be checked repo by repo and model page by model page.",
    clauseTableHeaders: [
      { en: "Comparison", zh: "比较项" },
      "Apache License 2.0",
      "OpenMDW 1.1",
    ],
    opennessLabTag: "Interactive release check",
    opennessLabHeading: "What's still missing from a \"modifiable\" model release?",
    opennessLabBody:
      "Six materials, weighted equally at 1/6 each. The score only expresses this checklist's material coverage — it isn't a legal judgment and doesn't correspond to an official MOF or OSAID rating.",
    checksBasisLabel: "Basis for the checklist",
    referencesTag: "PRIMARY REFERENCES",
    licenseQuote:
      "Apache 2.0 is still a good fit for software and documentation. A model release also has to spell out the boundaries of its weights, data, code, evaluation, and outputs.",
    licenseSpeakerNote: "Speaker notes · ~7 min",
    licenseSpeakerP1:
      "Start with the repo licenses across the 132 projects. Apache-2.0 and MIT together account for 98 — 74.2%. The 25 marked NOASSERTION simply means GitHub couldn't confirm an SPDX identifier. It isn't a synonym for \"no license,\" and it hasn't been through a repo-by-repo legal review.",
    licensePrompt1Title: "Start with what's being licensed.",
    licensePrompt1Body:
      "Apache-2.0's language is built around Work, Source, Object, and Derivative Works. OpenMDW groups architecture, parameters, and whatever data, code, and documentation actually ship alongside them under one term: Model Materials. A model license has to address parameters, data, and documentation that can fall under different rights regimes at once.",
    licensePrompt2Title: "Then look at the scope of rights.",
    licensePrompt2Body:
      "Apache-2.0 explicitly grants copyright and patent licenses; OpenMDW also writes in database rights and trade-secret rights. OpenMDW's language tries to cover the range of rights bases that model materials commonly touch — it doesn't mean the publisher has already cleared every third-party right involved.",
    licensePrompt3Title: "Redistribution duties get concrete.",
    licensePrompt3Body:
      "Apache-2.0 requires attaching the license, marking changed files, retaining notices, and handling NOTICE under certain conditions. OpenMDW requires attaching the license and retaining copyright and provenance notices. Both are permissive grants, but compliance can't be summarized as just \"you can use it commercially.\"",
    licensePrompt4Title: "Litigation termination differs in scope.",
    licensePrompt4Body:
      "Apache-2.0's defensive termination hits the patent license. OpenMDW covers both patent and copyright suits, and terminates the entire grant, with an exception for defensive counterclaims.",
    licensePrompt5Title: "Output is a new question models raise.",
    licensePrompt5Body:
      "Apache-2.0 has no concept of model output. OpenMDW explicitly does not extend license restrictions or obligations to generated output, but copyright, privacy, data-compliance, and other applicable law can still apply.",
    licensePrompt6Title: "A license doesn't automatically fill in the materials.",
    licensePrompt6Body:
      "OpenMDW only governs the Model Materials the publisher actually provides and places under it — it doesn't force them to hand over training code or data. Checking the six boxes live shows that the same license field can still correspond to very different levels of researchability and reproducibility.",
    licenseSpeakerClose:
      "Finally, come back to 26/50 and 24/50: public weights need to be observed separately. The comparison table mixes licenses, frameworks, and definitions — don't present it as a spectrum from permissive to strict. MOF checks materials against a license; OSAID spells out the preferred form needed for Use, Study, Modify, and Share. They do different jobs than a license text does.",
    section05: "05 · COMMUNITY OVER CODE",
    section05Heading1: "Community >>> Code isn't ",
    section05HeadingEm: "a warm slogan.",
    section05Body:
      "It describes a mechanism for turning a stranger's contribution into long-term trust. The front door has to be findable, discussion has to hold up on review, and permissions have to grow with visible contribution.",
    communityPathAria: "Open-community contribution path",
    signalGridDiscoverable: "DISCOVERABLE",
    signalGridDiscoverableTitle: { en: "The contribution surface has to be clear", zh: "贡献表面要清楚" },
    signalGridDiscoverableBody: {
      en: "A good-first-issue label, a public roadmap, model cards, and evaluation tasks let a potential contributor know where to start.",
      zh: "Good first issue、公开 roadmap、模型卡和评测任务，让潜在贡献者知道怎样开始。",
    },
    signalGridReviewable: "REVIEWABLE",
    signalGridReviewableTitle: { en: "Decisions leave a reason behind", zh: "决定要留下理由" },
    signalGridReviewableBody: {
      en: "Public proposals, issue/PR review, and reproducible experiments mean technical choices don't depend on private context.",
      zh: "公开 proposal、issue / PR 审查和可复现实验，让技术选择不依赖内部上下文。",
    },
    signalGridEarned: "EARNED",
    signalGridEarnedTitle: { en: "Permission follows contribution", zh: "权限跟随贡献" },
    signalGridEarnedBody: {
      en: "Committer and member status comes from sustained, visible work the community itself can verify.",
      zh: "committer 和 member 的权限来自持续、可见、能被社区检验的工作。",
    },
    communityQuote:
      "What's worth keeping from the old rules is a transparent front door, a public process, and gradually earned trust — and now that has to cover models, data, and evaluation too.",
    resourceLandscape: "LANDSCAPE",
    resourceLandscapeTitle: "Agentic AI Landscape",
    resourceLandscapeDesc: { en: "Project list, screening method, and the landscape map", zh: "项目表、筛选方法与生态图" },
    resourceStack: "STACK",
    resourceStackDesc: { en: "Models, training, and agent infrastructure", zh: "模型、训练与 agent 基础设施" },
    resourceGovernance: "GOVERNANCE",
    resourceGovernanceDesc: { en: "Practices for open, cross-organization collaboration", zh: "跨组织开放协作的实践" },
    communitySpeakerNote: "Speaker notes · ~3 min",
    communitySpeakerBody:
      "Click through the contribution path one step at a time, but don't turn the ending into a list of values. Use one concrete example: for a model release to keep being trained by the community, it needs more than a download button — it needs materials, reproducible experiments, public issues, and a visible change process. End on the three resource links.",
    footerEvent: "CommunityOverCode Asia 2026",
  },
  zh: {
    backToLandscape: "返回 Agentic AI Landscape",
    eventLabel: "CommunityOverCode China",
    eventDate: "2026 keynote · 08.07",
    playSlides: "演讲播放",
    backToMap: "返回生态图",
    dateAria: "2026 年 8 月 7 日",
    dateCity: "2026 · Beijing",
    eyebrow: "30 min · 中文 keynote 工作稿",
    titlePrefix: "Agentic AI 新趋势下，",
    titleEm: "开放生态的那些老规矩",
    heroIntro:
      "Agent 正在改变软件的入口、生产方式和运行边界。生态图上的名字变化很快，但项目怎样被发现、技术怎样被复用、权利怎样说清楚，仍然决定一项技术能不能成为公共基础设施。",
    dataWindowAria: "数据时间口径",
    chapterNavAria: "Keynote 章节",
    section01: "01 · ECOSYSTEM REFRESH",
    section01Heading: "生态图每次刷新，都在回答：",
    section01HeadingEm: "什么开始变得重要？",
    section01Body:
      "这次更新没有从 star 榜单里挑几个新名字。候选集先扩张，再用语义、活跃度和生态角色逐层收窄，最后才处理版面。数字负责发现变化，进入 landscape 仍然是一项编辑判断。",
    funnelAria: "项目筛选漏斗",
    statStripCards: [
      ["105", { en: "Kept", zh: "保留" }, { en: "Ecosystem role still clear", zh: "生态角色仍然清晰" }],
      ["21", { en: "Added", zh: "新增" }, { en: "Fills gaps in protocols, inference, and context", zh: "补足协议、推理与上下文" }],
      ["17", { en: "Removed", zh: "移出" }, { en: "Deduped, loosely related, or a layout call", zh: "去重、弱相关或版面取舍" }],
      ["251", { en: "reference sources", zh: "reference source" }, { en: "Full CSV keeps every judgment call", zh: "CSV 保留完整判断" }],
    ],
    layoutChangeLabel: "版面变化 label",
    editorial1Label: "版面变化",
    editorial1Heading: "分类没有推倒重来",
    editorial2Label: "指标边界",
    editorial2Heading: "三个信号各自只回答一部分问题",
    metricRows2: [
      ["OpenRank", { en: "Collaborative activity", zh: "协作活跃度" }],
      ["Stars / WatchEvent", { en: "Change in attention", zh: "关注变化" }],
      ["README & project role", { en: "Whether it can be adopted", zh: "能否被采用" }],
    ],
    explorerToggleAria: "生态图切换",
    searchAria: "搜索 Agent Infra 和 Model Infra",
    clearSearchAria: "清除 Infra 搜索",
    openStandalone: "单独打开",
    fullscreen: "全屏",
    loadingHd: "正在加载高清生态图…",
    howToRead: "这张图怎么看",
    speakerNoteLabel: "给演讲者的讲法",
    howWeMadeThis: "How we made this?",
    howWeMadeThisSub: "的数据、筛选与讲法",
    methodNote: "METHOD NOTE",
    howBuiltHeading: "是怎样做出来的",
    caveatsLabel: "读数字时要带上的限制",
    sourceMaterialLabel: "原始材料",
    fullNoteTitle: "打开完整说明文档",
    fullNoteSub: "适合演讲前通读与答疑准备",
    section02: "02 · APACHE IN THE STACK",
    section02Heading1: "Apache 项目集中在 Agent 的",
    section02HeadingEm: "数据与运行底座。",
    agentRuntimeLabel: "Agent 运行",
    agentRuntimeValue: "工具调用 · 数据访问 · 持续执行",
    apacheAccumLabel: "Apache 积累",
    apacheAccumValue: "工作流 · 计算 · 数据治理 · 事务",
    apacheScaleCards: [
      ["305", { en: "non-retired project records", zh: "非 retired 项目记录" }],
      ["259", { en: "with a DOAP technical category", zh: "有 DOAP 技术分类" }],
      ["2,473", { en: "non-fork, non-archived repos", zh: "非 fork、非归档仓库" }],
      ["6 / 57", { en: "selected into Model Infra", zh: "入选 Model Infra" }],
    ],
    apacheDataNote:
      "Projects Directory 2026-07-27 · GitHub apache org 2026-07-30。ASF 官网另展示 290+ projects、1,300+ releases、10,000+ committers 与 1,190+ members；这些对象不能互相替代。",
    apacheBridgeLandscape: "LANDSCAPE",
    apacheBridgeLandscapeStrong: "6 个 Apache 项目",
    apacheBridgeShared: "共同覆盖一条运行链",
    apacheBridgeStages: [
      { en: "Orchestrate", zh: "编排" },
      { en: "Compute", zh: "计算" },
      { en: "Data", zh: "数据" },
      { en: "State", zh: "状态" },
      { en: "Recover", zh: "恢复" },
    ],
    apacheBridgeAnt: "ANT PARTICIPATION",
    apacheBridgeAntStrong: "4 个 Apache 项目",
    apacheQuote:
      "Agent 在生产环境里要处理跨语言状态、关系上下文、失败恢复和大规模计算。Landscape 中的 Apache 项目与蚂蚁参与的四个项目覆盖了这条运行链。",
    apacheSpeakerNote: "给演讲者的讲法 · 约 6 分钟",
    apacheSpeakerBody:
      "这一节按两个尺度展开。Projects Directory 展示 Apache 横跨数据、网络、库、云、Web、安全和边缘领域；当前 Model Infra 中的 6 个 ASF 项目集中在数据、编排与计算。接下来沿系统运行顺序讲项目：Airflow 组织任务，Spark 与 Celeborn 支撑计算；Iceberg、Hudi、Paimon、Gravitino 管理开放数据平面，Fory 传递跨语言状态；GeaFlow 维护关系上下文，Seata 处理提交、补偿和失败恢复。Agent 进入生产后，这些长期存在的系统问题会同时出现。",
    section03: "03 · INCLUSIONAI",
    section03Tag: "InclusionAI 价值主张",
    inclusionHeroBody:
      "InclusionAI 同时开放模型和背后的工程系统。有人做训练，有人接环境，也有人把这些能力带进机器人和医疗场景。",
    platformRepos: "公开仓库",
    platformModels: "公开模型",
    platformDownloads30d: "近 30 天下载",
    serviceBandTag: "AI SERVICE",
    serviceBandHeading: "模型和基础设施最后落到这些服务里",
    stackTabsAria: "InclusionAI 技术栈",
    dataScopeSummary: "数据口径与三个组织",
    dataScopeBody1:
      "GitHub 统计 inclusionAI、AQ-MedAI、Robbyant 三个组织的全部公开仓库；其中 inclusionAI 有 3 个 fork。Hugging Face 与 ModelScope 按同名三个发布者分别取公开模型列表。模型在两个 Hub 同时发布时分别保留，不做跨平台去重后总计。",
    dataScopeBody2:
      "Hugging Face API 的 downloads 对应近 30 天下载。ModelScope OpenAPI 只返回 downloads 数值，没有在响应中声明窗口，因此页面只按平台字段原样展示。",
    githubLinkText: "GitHub ↗",
    hfLinkText: "Hugging Face ↗",
    modelscopeLinkText: "ModelScope ↗",
    fullSnapshotLink: "完整快照 ↗",
    previousMapSummary: "查看上一版 InclusionAI 技术大图",
    previousMapAlt: "上一版 InclusionAI 技术地图",
    inclusionSpeakerNote: "给演讲者的讲法 · 约 5 分钟",
    inclusionSpeakerP1:
      "先指着 Logo 和标题说：InclusionAI 的原话是 “AI Built By Everyone, For Everyone”。Everyone 说的是参与方式。有人训练模型，有人做环境、工具和评测，也有人把技术带进机器人、医疗和日常服务。公平、透明和协作落到工程上，就是材料能拿到、边界能看懂、实验能复现，后来者还能接着做。",
    inclusionSpeakerP2:
      "然后快速扫三张平台卡。GitHub 看软件与协作，Hugging Face 和 ModelScope 看模型发布与分发。只念三个 headline：92 个公开仓库、HF 197 个公开模型、ModelScope 188 个公开模型。不要把三个平台的模型数相加，也不要把 HF downloads 说成累计下载；它是近 30 天窗口。Stars 和 Likes 也不要合成一个“认可度”，因为用户动作和平台分母不同。若需要讲变化，只讲可比部分：相较 7 月 11 日快照，GitHub 多了 6 个公开仓库、7,999 Stars 和 803 Forks；HF downloads 是滚动窗口，不把差值说成“新增下载”。",
    inclusionSpeakerP3:
      "接着从 AI Service 往下讲。LingGuang、金融、医疗和生活服务已经进入真实使用。用户碰到的问题会再传回技术栈，变成数据、环境、奖励、评测和可靠性要求。这里不用展开产品功能，一句话把“开放研究”接到“日常生活”就够了。",
    inclusionSpeakerP4:
      "四个 Tab 不必全部逐项目念。模型页抓住四条路线：Ling 是语言与效率，Ring 是推理和长链路任务，LLaDA 是扩散语言模型，Ming 是全模态。具身页抓住一个闭环：Map / Depth 解决空间感知，World 建环境模型，VLA 把理解变成动作。行业应用页只举 AQ-MedAI 和 UI-Venus，说明真实行业会重新定义开放材料的边界。",
    inclusionSpeakerP5:
      "最后一定点到 Infra。沿用原来三层参与路径：AReaL、AReno、TwinFlow 是训练与对齐；AWorld、AEnvironment 是 Agent 运行时与环境；dInfer 把新模型路线变成可运行的软件。收束句可以是：即使你没有资源训练基础模型，也可以从环境、工具、benchmark、推理优化和可靠性进入。AReaL 主仓库在 areal-project，因此没有计入页面上三个 GitHub 组织的仓库数，但它属于这套协作技术栈。",
    section04: "04 · LICENSE AND OPENNESS",
    section04Heading1: "开放模型时代，一份许可证只能说明",
    section04HeadingEm: "一部分事实。",
    section04Body: "软件许可证回答权利、义务和责任边界。模型发布还要说明权重、训练代码、数据说明和评测材料究竟提供到了什么程度。",
    licenseRepoTag: "LANDSCAPE REPOSITORY LICENSES",
    licenseRepoProjects: "个项目",
    licenseRepoSub: "GitHub 仓库的 SPDX 标识 · 数据快照 2026-07-28",
    licenseFootP1: "全部 132 个项目中，Apache-2.0 为 61 个，MIT 为 37 个，两者合计 74.2%。",
    licenseFootP2: "NOASSERTION 表示 GitHub / SPDX 没有给出可确认的 SPDX 标识，不能据此判断“没有许可证”。",
    licenseBandCards: [
      ["26", { en: "in the Top 50 with no public weights", zh: "Top 50 中没有公开权重" }],
      ["24", { en: "ship public weights", zh: "提供公开权重" }],
      ["70.8%", { en: "of public-weight models use MIT or Apache-2.0", zh: "公开权重中采用 MIT 或 Apache-2.0" }],
    ],
    licenseFilterAll: "全部",
    licenseFilterLicense: "许可证",
    licenseFilterFramework: "开放框架",
    licenseFilterDefinition: "定义",
    comparisonHeaders: [
      { en: "Approach", zh: "方案" },
      { en: "Type", zh: "类型" },
      { en: "Main subject", zh: "主要对象" },
      { en: "What it clarifies", zh: "它说清楚什么" },
      { en: "Still needs checking", zh: "仍需另行检查" },
    ],
    comparisonRows: [
      [
        "license",
        "Apache License 2.0",
        { en: "Software license", zh: "软件许可证" },
        { en: "Software, documentation", zh: "软件、文档" },
        { en: "Copyright license, patent grant, NOTICE, and liability boundary", zh: "版权许可、专利授权、NOTICE 与责任边界" },
        { en: "Whether the model materials are complete", zh: "模型材料是否完整" },
      ],
      [
        "license",
        "OpenMDW 1.1",
        { en: "Model materials license", zh: "模型材料许可证" },
        { en: "Model Materials", zh: "Model Materials" },
        { en: "Rights to use and distribute model materials", zh: "模型材料的使用和分发权利" },
        { en: "Doesn't require the publisher to ship complete materials", zh: "不强制发布者提供完整材料" },
      ],
      [
        "license",
        "ModelGo",
        { en: "Composable license family", zh: "可组合许可证家族" },
        { en: "Models", zh: "模型" },
        { en: "8 variants combining BY, SA, RAI, NC, ND, and similar conditions", zh: "8 个变体组合 BY、SA、RAI、NC、ND 等条件" },
        { en: "Not the same as an openness-completeness grade", zh: "不等同于开放完整度分级" },
      ],
      [
        "framework",
        "Model Openness Framework",
        { en: "Openness-completeness framework", zh: "开放完整度框架" },
        { en: "Models and related materials", zh: "模型及相关材料" },
        { en: "Grades openness by code, data, and documentation", zh: "按代码、数据和文档判断开放层级" },
        { en: "It is not a legal license text", zh: "它不是法律许可证" },
      ],
      [
        "definition",
        "OSAID 1.0",
        { en: "Open AI definition", zh: "开放 AI 定义" },
        { en: "AI systems", zh: "AI 系统" },
        { en: "Use, Study, Modify, Share, and the preferred form", zh: "Use、Study、Modify、Share 及 preferred form" },
        { en: "It is not a single license text", zh: "它不是单一许可证文本" },
      ],
    ] as const,
    clauseHeading: "Apache-2.0 与 OpenMDW-1.1，条款在管什么？",
    clauseSub: "这里比较许可证文本本身。项目实际发布了哪些材料，要回到仓库和模型页逐项检查。",
    clauseTableHeaders: [
      { en: "Comparison", zh: "比较项" },
      "Apache License 2.0",
      "OpenMDW 1.1",
    ],
    opennessLabTag: "Interactive release check",
    opennessLabHeading: "一份“可修改”的模型发布，还缺哪些材料？",
    opennessLabBody:
      "六项材料等权，每项占 1/6。分数只表达这张检查表的材料覆盖率，不构成法律判断，也不对应 MOF 或 OSAID 的正式评级。",
    checksBasisLabel: "检查项依据",
    referencesTag: "PRIMARY REFERENCES",
    licenseQuote: "Apache 2.0 仍然适合软件与文档。模型发布还要交代权重、数据、代码、评测和输出的边界。",
    licenseSpeakerNote: "给演讲者的讲法 · 约 7 分钟",
    licenseSpeakerP1:
      "先讲 132 个项目的仓库许可证。Apache-2.0 与 MIT 合计 98 个，占 74.2%；25 个 NOASSERTION 只表示 GitHub 没有给出可确认的 SPDX 标识。它不是“无许可证”的同义词，也没有经过逐仓法律审查。",
    licensePrompt1Title: "从授权对象讲起。",
    licensePrompt1Body:
      "Apache-2.0 的语言围绕 Work、Source、Object 和 Derivative Works 展开。OpenMDW 把架构、参数以及实际随附的数据、代码和文档合称 Model Materials。模型许可证需要同时面对参数、数据和文档可能落入的不同权利体系。",
    licensePrompt2Title: "再看权利范围。",
    licensePrompt2Body:
      "Apache-2.0 明示授予版权和专利许可；OpenMDW 还写入数据库权利与商业秘密权利。OpenMDW 的写法试图覆盖模型材料常见的多种权利基础，不代表发布者已经解决其中所有第三方权利。",
    licensePrompt3Title: "再分发义务很具体。",
    licensePrompt3Body:
      "Apache-2.0 要求附许可证、标记修改、保留相关声明，并按条件处理 NOTICE。OpenMDW 要求附许可证并保留版权与来源声明。两者都属于宽松授权，但合规动作不能只概括为“可以商用”。",
    licensePrompt4Title: "诉讼终止的范围不同。",
    licensePrompt4Body: "Apache-2.0 的防御性终止落在专利许可；OpenMDW 覆盖专利与版权诉讼，并让全部授权终止，防御性反诉除外。",
    licensePrompt5Title: "输出是模型场景新增的问题。",
    licensePrompt5Body:
      "Apache-2.0 没有模型输出这一对象。OpenMDW 明确不把许可限制或义务传递到生成输出，但著作权、隐私、数据合规等适用法律仍需另行判断。",
    licensePrompt6Title: "许可证不会自动补齐材料。",
    licensePrompt6Body:
      "OpenMDW 只管发布者实际提供并置于该许可证下的 Model Materials，不强制交出训练代码和数据。现场勾选六项材料，展示相同的许可证字段仍可能对应不同的可研究、可复现程度。",
    licenseSpeakerClose:
      "最后回到 26/50 与 24/50：公开权重需要单独观察。方案总表里混有许可证、框架和定义，不要按“宽松到严格”排序讲。MOF 检查材料与许可证，OSAID 说明 Use、Study、Modify、Share 所需的 preferred form；它们承担的任务和许可证文本不同。",
    section05: "05 · COMMUNITY OVER CODE",
    section05Heading1: "Community >>> Code，",
    section05HeadingEm: "不是一句温情口号。",
    section05Body: "它描述了一套把陌生贡献变成长期信任的机制。入口要能被找到，讨论要经得起回看，权限要跟着可见贡献增长。",
    communityPathAria: "开放社区贡献路径",
    signalGridDiscoverable: "DISCOVERABLE",
    signalGridDiscoverableTitle: { en: "The contribution surface has to be clear", zh: "贡献表面要清楚" },
    signalGridDiscoverableBody: {
      en: "A good-first-issue label, a public roadmap, model cards, and evaluation tasks let a potential contributor know where to start.",
      zh: "Good first issue、公开 roadmap、模型卡和评测任务，让潜在贡献者知道怎样开始。",
    },
    signalGridReviewable: "REVIEWABLE",
    signalGridReviewableTitle: { en: "Decisions leave a reason behind", zh: "决定要留下理由" },
    signalGridReviewableBody: {
      en: "Public proposals, issue/PR review, and reproducible experiments mean technical choices don't depend on private context.",
      zh: "公开 proposal、issue / PR 审查和可复现实验，让技术选择不依赖内部上下文。",
    },
    signalGridEarned: "EARNED",
    signalGridEarnedTitle: { en: "Permission follows contribution", zh: "权限跟随贡献" },
    signalGridEarnedBody: {
      en: "Committer and member status comes from sustained, visible work the community itself can verify.",
      zh: "committer 和 member 的权限来自持续、可见、能被社区检验的工作。",
    },
    communityQuote:
      "老规矩要保留的是透明入口、公开过程和渐进式信任；现在，它们还要覆盖模型、数据和评测。",
    resourceLandscape: "LANDSCAPE",
    resourceLandscapeTitle: "Agentic AI Landscape",
    resourceLandscapeDesc: { en: "Project list, screening method, and the landscape map", zh: "项目表、筛选方法与生态图" },
    resourceStack: "STACK",
    resourceStackDesc: { en: "Models, training, and agent infrastructure", zh: "模型、训练与 agent 基础设施" },
    resourceGovernance: "GOVERNANCE",
    resourceGovernanceDesc: { en: "Practices for open, cross-organization collaboration", zh: "跨组织开放协作的实践" },
    communitySpeakerNote: "给演讲者的讲法 · 约 3 分钟",
    communitySpeakerBody:
      "逐个点击贡献路径，但不要把结尾讲成价值观清单。举一个具体动作：一个模型发布如果能被社区继续训练，需要的不只是下载按钮，还要有材料、复现实验、公开问题和变更过程。最后停在三个资源入口。",
    footerEvent: "CommunityOverCode China 2026",
  },
} as const;

export function getStackData(lang: Locale) {
  const entries = Object.entries(stackDataSource) as [
    StackKey,
    (typeof stackDataSource)[StackKey],
  ][];
  return Object.fromEntries(
    entries.map(([key, stack]) => [
      key,
      {
        label: pick(lang, stack.label),
        kicker: stack.kicker,
        title: pick(lang, stack.title),
        body: pick(lang, stack.body),
        ask: pick(lang, stack.ask),
        projects: stack.projects.map((project) => ({
          name: project.name,
          role: pick(lang, project.role),
          description: pick(lang, project.description),
          href: project.href,
          logo: project.logo,
        })) as InclusionProject[],
      },
    ]),
  ) as Record<
    StackKey,
    {
      label: string;
      kicker: string;
      title: string;
      body: string;
      ask: string;
      projects: InclusionProject[];
    }
  >;
}

export function getInclusionServices(lang: Locale) {
  return inclusionServicesSource.map((service) => ({
    domain: pick(lang, service.domain),
    name: service.name,
    description: pick(lang, service.description),
    logo: service.logo,
  }));
}

export function getCommunityData(lang: Locale): Record<CommunityKey, [string, string]> {
  const entries = Object.entries(communityDataSource) as [
    CommunityKey,
    [Localized<string>, Localized<string>],
  ][];
  return Object.fromEntries(
    entries.map(([key, [title, body]]) => [key, [pick(lang, title), pick(lang, body)]]),
  ) as Record<CommunityKey, [string, string]>;
}

export default function KeynoteExperience({
  projects,
  lang,
}: {
  projects: LandscapeProject[];
  lang: Locale;
}) {
  const t = uiText[lang];
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [activeChapter, setActiveChapter] = useState("landscape");
  const [landscape, setLandscape] = useState<LandscapeKey>("agent");
  const [infraQuery, setInfraQuery] = useState("");
  const [frameScale, setFrameScale] = useState(1);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [apacheDomain, setApacheDomain] =
    useState<ApacheDomainKey>("data");
  const [stack, setStack] = useState<StackKey>("models");
  const [licenseFilter, setLicenseFilter] = useState<LicenseFilter>("all");
  const [licenseLayer, setLicenseLayer] = useState<LicenseLayer>("all");
  const [materials, setMaterials] = useState([true, false, false, false, false, false]);
  const [community, setCommunity] = useState<CommunityKey>("discover");

  const chapters = useMemo(
    () => chaptersSource.map(([id, label]) => [id, pick(lang, label)] as const),
    [lang],
  );
  const landscapeViews = useMemo(() => getLandscapeViews(lang), [lang]);
  const localStackData = useMemo(() => getStackData(lang), [lang]);
  const localInclusionServices = useMemo(() => getInclusionServices(lang), [lang]);
  const localCommunityData = useMemo(() => getCommunityData(lang), [lang]);
  const localApacheBackbone = useMemo(() => getApacheBackbone(lang), [lang]);
  const licenseLayerLabels = useMemo(() => getLicenseLayerLabels(lang), [lang]);
  const materialChecks = useMemo(() => getMaterialChecks(lang), [lang]);
  const apacheOpenMdwComparison = useMemo(() => getApacheOpenMdwComparison(lang), [lang]);

  const currentLandscape = landscapeViews[landscape];
  const visibleLicenseProjects = useMemo(
    () => projectsForLicenseLayer(projects, licenseLayer),
    [licenseLayer, projects],
  );
  const licenseDistribution = useMemo(
    () => buildLicenseDistribution(visibleLicenseProjects),
    [visibleLicenseProjects],
  );
  const maxLicenseCount = licenseDistribution[0]?.count ?? 1;
  const materialScore = Math.round(
    (materials.filter(Boolean).length / materials.length) * 100,
  );
  const materialLabels =
    lang === "en"
      ? [
          "No modifiable material",
          "Weights only",
          "Materials still thin",
          "Basic modification path exists",
          "Close to a reproducible release",
          "Materials fairly complete",
          "All six materials provided",
        ]
      : [
          "没有可修改材料",
          "只有权重可得",
          "材料仍然很薄",
          "已有基本修改线索",
          "接近可复现发布",
          "材料较为完整",
          "六类材料均提供",
        ];
  const materialLabel = materialLabels[materials.filter(Boolean).length];

  const gaugeStyle = {
    "--score": `${materialScore}%`,
  } as CSSProperties;

  const frameStyle = useMemo(() => {
    if (!currentLandscape.base) return undefined;
    return {
      width: `${currentLandscape.base[0]}px`,
      height: `${currentLandscape.base[1]}px`,
      transform: `scale(${frameScale})`,
      left: `calc(50% - ${(currentLandscape.base[0] * frameScale) / 2}px)`,
      top: `calc(50% - ${(currentLandscape.base[1] * frameScale) / 2}px)`,
    } as CSSProperties;
  }, [currentLandscape, frameScale]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sections = chapters
      .map(([id]) => root.querySelector<HTMLElement>(`#${id}`))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveChapter(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [chapters]);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !currentLandscape.base) {
      setFrameScale(1);
      return;
    }

    const resize = () => {
      const [width, height] = currentLandscape.base!;
      setFrameScale(
        Math.min(stage.clientWidth / width, stage.clientHeight / height),
      );
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    resize();
    return () => observer.disconnect();
  }, [currentLandscape]);

  function chooseLandscape(key: LandscapeKey) {
    setFrameLoaded(false);
    setLandscape(key);
  }

  return (
    <main ref={rootRef} lang={lang === "zh" ? "zh-CN" : "en"} className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link className={styles.brand} href={`/${lang}`} aria-label={t.backToLandscape}>
            <LandscapeLogo className={styles.brandMark} />
            <strong>Agentic AI Landscape</strong>
          </Link>
          <p className={styles.eventLabel}>
            {t.eventLabel}
            <span>{t.eventDate}</span>
          </p>
          <div className={styles.headerActions}>
            <LocaleSwitch
              locales={KEYNOTE_LOCALES}
              current={lang}
              label="Change language"
              names={{ en: "English", zh: "中文" }}
            />
            <Link className={styles.stageLink} href={`/${lang}/keynote/present`}>
              <MonitorPlayIcon aria-hidden="true" />
              {t.playSlides}
            </Link>
            <Link className={styles.backLink} href={`/${lang}`}>
              <ArrowLeftIcon aria-hidden="true" />
              {t.backToMap}
            </Link>
          </div>
        </header>

        <section className={styles.hero} aria-labelledby="keynote-title">
          <div className={styles.dateBlock} aria-label={t.dateAria}>
            <span>CommunityOverCode</span>
            <strong>
              08<span aria-hidden="true">.</span>07
            </strong>
            <small>{t.dateCity}</small>
          </div>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>{t.eyebrow}</p>
            <h1 id="keynote-title">
              {t.titlePrefix}
              <em>{t.titleEm}</em>
            </h1>
            <p className={styles.heroIntro}>{t.heroIntro}</p>
          </div>
        </section>

        <div className={styles.dataWindow} aria-label={t.dataWindowAria}>
          <div><span>GitHub snapshot</span><strong>2026-07-28</strong></div>
          <div><span>OpenRank window</span><strong>2025-07—2026-06</strong></div>
          <div><span>OpenRouter / ZenMux</span><strong>2026-06-01—30</strong></div>
          <div><span>ASF homepage</span><strong>2026-07-29</strong></div>
        </div>

        <nav className={styles.chapterNav} aria-label={t.chapterNavAria}>
          <div className={styles.chapterLinks}>
            {chapters.map(([id, label], index) => (
              <a
                key={id}
                className={activeChapter === id ? styles.activeChapter : ""}
                href={`#${id}`}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {label}
              </a>
            ))}
          </div>
        </nav>

        <section className={styles.storySection} id="landscape">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionIndex}>{t.section01}</p>
            <h2>{t.section01Heading}<em>{t.section01HeadingEm}</em></h2>
            <p>{t.section01Body}</p>
          </div>

          <div className={`${styles.funnel} ${styles.deepDive}`} aria-label={t.funnelAria}>
            {(lang === "en"
              ? [
                  ["Raw candidate pool", "6,118", "multi-source repo IDs", 100],
                  ["Semantically relevant", "878", "README / topic / description filter", 14.35],
                  ["Human review pool", "222", "after refreshing GitHub info", 3.63],
                  ["Current overview", "132", "live overview", 2.06],
                ]
              : [
                  ["原始候选集合", "6,118", "多源仓库 ID", 100],
                  ["语义相关", "878", "README / topic / 描述筛选", 14.35],
                  ["人工复核池", "222", "GitHub 信息刷新后", 3.63],
                  ["当前总览", "132", "live overview", 2.06],
                ]
            ).map(([label, value, note, width]) => (
              <div className={styles.funnelRow} key={label as string}>
                <span>{label}</span>
                <i><b style={{ width: `${width}%` }} /></i>
                <strong>{value}</strong>
                <small>{note}</small>
              </div>
            ))}
          </div>

          <div className={styles.statStrip}>
            {t.statStripCards.map(([value, label, note]) => (
              <div key={pick(lang, label as Localized<string>)}>
                <strong>{value}</strong>
                <span>{pick(lang, label as Localized<string>)}</span>
                <small>{pick(lang, note as Localized<string>)}</small>
              </div>
            ))}
          </div>

          <div className={`${styles.editorialGrid} ${styles.deepDive}`}>
            <article>
              <p className={styles.utilityLabel}>{t.editorial1Label}</p>
              <h3>{t.editorial1Heading}</h3>
              <dl>
                <div><dt>Agentic coding</dt><dd>15 → 12</dd></div>
                <div><dt>Protocols & interoperability</dt><dd>3 → 5</dd></div>
                <div><dt>Serving · Inference</dt><dd>6 → 8</dd></div>
              </dl>
            </article>
            <article>
              <p className={styles.utilityLabel}>{t.editorial2Label}</p>
              <h3>{t.editorial2Heading}</h3>
              <dl>
                {t.metricRows2.map(([term, desc]) => (
                  <div key={term}><dt>{term}</dt><dd>{pick(lang, desc as Localized<string>)}</dd></div>
                ))}
              </dl>
            </article>
          </div>

          <div className={styles.explorer}>
            <div className={styles.explorerToolbar}>
              <div role="tablist" aria-label={t.explorerToggleAria}>
                {(Object.keys(landscapeViews) as LandscapeKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={landscape === key}
                    className={landscape === key ? styles.activeTab : ""}
                    onClick={() => chooseLandscape(key)}
                  >
                    {landscapeViews[key].label}
                  </button>
                ))}
              </div>
              {landscape === "agent" || landscape === "model" ? (
                <label className={styles.explorerSearch}>
                  <SearchIcon aria-hidden="true" />
                  <span className={styles.srOnly}>{t.searchAria}</span>
                  <input
                    type="search"
                    value={infraQuery}
                    onChange={(event) => setInfraQuery(event.target.value)}
                    placeholder="Search Agent & Model Infra"
                  />
                  {infraQuery ? (
                    <button
                      type="button"
                      onClick={() => setInfraQuery("")}
                      aria-label={t.clearSearchAria}
                    >
                      <XIcon aria-hidden="true" />
                    </button>
                  ) : null}
                </label>
              ) : null}
              <div className={styles.explorerActions}>
                <a
                  href={
                    currentLandscape.sourceHref ?? currentLandscape.htmlSrc
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  {t.openStandalone} <ArrowUpRightIcon aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => stageRef.current?.requestFullscreen()}
                >
                  <ExpandIcon aria-hidden="true" />
                  {t.fullscreen}
                </button>
              </div>
            </div>
            <div className={styles.explorerStage} ref={stageRef}>
              {landscape === "agent" || landscape === "model" ? (
                <div
                  className={styles.inlineLandscape}
                  style={frameStyle}
                >
                  <LandscapeExplorer
                    projects={projects}
                    embedOnly={landscape}
                    filterQuery={infraQuery}
                  />
                </div>
              ) : (
                <>
                  {!frameLoaded ? (
                    <p className={styles.loading}>{t.loadingHd}</p>
                  ) : null}
                  <iframe
                    key={`${landscape}-html`}
                    className={styles.fixedFrame}
                    style={frameStyle}
                    src={currentLandscape.htmlSrc}
                    title={`${currentLandscape.label} landscape`}
                    onLoad={() => setFrameLoaded(true)}
                  />
                </>
              )}
            </div>
            <div className={styles.explorerCaption}>
              <span>{currentLandscape.caption}</span>
              <strong>{currentLandscape.snapshot}</strong>
            </div>
          </div>

          <div className={styles.landscapeReadout} aria-live="polite">
            <div className={styles.perspectiveLead}>
              <p className={styles.utilityLabel}>{t.howToRead}</p>
              <span>{currentLandscape.perspective}</span>
              <h3>{currentLandscape.question}</h3>
            </div>

            <div className={styles.landscapeMetrics}>
              {currentLandscape.metrics.map((metric) => (
                <div key={metric.label}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                  <small>{metric.note}</small>
                </div>
              ))}
            </div>

            <div className={styles.landscapeInsights}>
              <article>
                <div>
                  <span>ONE SIGNAL</span>
                  <small>{currentLandscape.insight.signal}</small>
                </div>
                <h3>{currentLandscape.insight.title}</h3>
                <p>{currentLandscape.insight.body}</p>
                <strong>{currentLandscape.insight.evidence}</strong>
              </article>
            </div>
          </div>

          <details className={styles.landscapeSpeakerNote}>
            <summary>
              <span>{t.speakerNoteLabel}</span>
              <small>
                {currentLandscape.label} · {currentLandscape.speakerTime}
              </small>
            </summary>
            <div>
              {currentLandscape.speakerScript.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </details>

          <details className={styles.howPanel}>
            <summary>
              <CircleHelpIcon aria-hidden="true" />
              <span>{t.howWeMadeThis}</span>
              <small>{currentLandscape.label} {t.howWeMadeThisSub}</small>
            </summary>
            <div className={styles.howDrawer}>
              <div className={styles.methodIntro}>
                <p className={styles.utilityLabel}>{t.methodNote}</p>
                <h3>{currentLandscape.label} {t.howBuiltHeading}</h3>
                <p>{currentLandscape.methodIntro}</p>
              </div>

              <ol className={styles.methodSteps}>
                {currentLandscape.methodSteps.map((step) => (
                  <li key={step.number}>
                    <span>{step.number}</span>
                    <div>
                      <h4>{step.title}</h4>
                      <p>{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className={styles.methodFooter}>
                <div className={styles.methodCaveats}>
                  <p className={styles.utilityLabel}>{t.caveatsLabel}</p>
                  <ul>
                    {currentLandscape.caveats.map((caveat) => (
                      <li key={caveat}>{caveat}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.sourceList}>
                  <p className={styles.utilityLabel}>{t.sourceMaterialLabel}</p>
                  {currentLandscape.sources.map((source) => (
                    <a
                      href={source.href}
                      key={source.label}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>
                        <strong>{source.label}</strong>
                        <small>{source.note}</small>
                      </span>
                      <ArrowUpRightIcon aria-hidden="true" />
                    </a>
                  ))}
                  <a
                    className={styles.fullNoteLink}
                    href={currentLandscape.fullNoteHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>
                      <strong>{t.fullNoteTitle}</strong>
                      <small>{t.fullNoteSub}</small>
                    </span>
                    <ArrowUpRightIcon aria-hidden="true" />
                  </a>
                </div>
              </div>

            </div>
          </details>
        </section>

        <section className={styles.storySection} id="apache">
          <div className={styles.apacheOpening}>
            <div>
              <p className={styles.sectionIndex}>{t.section02}</p>
              <h2>{t.section02Heading1}<em>{t.section02HeadingEm}</em></h2>
            </div>
            <dl>
              <div>
                <dt>{t.agentRuntimeLabel}</dt>
                <dd>{t.agentRuntimeValue}</dd>
              </div>
              <div>
                <dt>{t.apacheAccumLabel}</dt>
                <dd>{t.apacheAccumValue}</dd>
              </div>
            </dl>
          </div>

          <div className={styles.apacheScale}>
            {t.apacheScaleCards.map(([value, label]) => (
              <div key={value as string}><strong>{value}</strong><span>{pick(lang, label as Localized<string>)}</span></div>
            ))}
          </div>
          <p className={styles.dataNote}>{t.apacheDataNote}</p>

          <ApacheProjectAtlas
            activeDomain={apacheDomain}
            onDomainChange={setApacheDomain}
            lang={lang}
          />

          <div className={styles.apacheBridgeLead} id="apache-backbone">
            <div className={styles.apacheBridgeSource}>
              <Image
                src="/project-logos/apache.png"
                alt="Apache"
                width={44}
                height={44}
              />
              <span>{t.apacheBridgeLandscape}</span>
              <strong>{t.apacheBridgeLandscapeStrong}</strong>
            </div>
            <div className={styles.apacheBridgeAxis}>
              <span>{t.apacheBridgeShared}</span>
              <div>
                {t.apacheBridgeStages.map((stage) => (
                  <b key={pick(lang, stage as Localized<string>)}>{pick(lang, stage as Localized<string>)}</b>
                ))}
              </div>
            </div>
            <div className={styles.apacheBridgeSource}>
              <Image
                src="/keynote/apache/assets/ant-group.png"
                alt="Ant Group"
                width={44}
                height={44}
              />
              <span>{t.apacheBridgeAnt}</span>
              <strong>{t.apacheBridgeAntStrong}</strong>
            </div>
          </div>

          <div className={styles.apacheBackbone}>
            {localApacheBackbone.map((stage) => (
              <article key={stage.label}>
                <header>
                  <p>{stage.label}</p>
                  <h3>{stage.title}</h3>
                </header>
                <div className={styles.apacheBackboneProjects}>
                  {stage.projects.map((project) => (
                    <a
                      href={`https://github.com/${project.repo}`}
                      key={project.name}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div className={styles.apacheProjectLogo}>
                        <Image
                          src={project.logo}
                          alt={`${project.name} logo`}
                          width={150}
                          height={54}
                        />
                      </div>
                      <div className={styles.apacheProjectIdentity}>
                        <strong>{project.name}</strong>
                        <div className={styles.apacheProjectMarks}>
                          <span>
                            <Image
                              src="/project-logos/apache.png"
                              alt=""
                              width={18}
                              height={18}
                            />
                            ASF
                          </span>
                          {project.source === "ant" ? (
                            <span className={styles.antMark}>
                              <Image
                                src="/keynote/apache/assets/ant-group.png"
                                alt=""
                                width={18}
                                height={18}
                              />
                              ANT
                            </span>
                          ) : (
                            <span className={styles.landscapeMark}>
                              LANDSCAPE
                            </span>
                          )}
                        </div>
                      </div>
                      <dl className={styles.apacheProjectFacts}>
                        <div><dt>ROLE</dt><dd>{project.role}</dd></div>
                        <div><dt>POSITION</dt><dd>{project.signal}</dd></div>
                      </dl>
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <blockquote>{t.apacheQuote}</blockquote>
          <details className={`${styles.speakerNote} ${styles.deepDive}`}>
            <summary>{t.apacheSpeakerNote}</summary>
            <p>{t.apacheSpeakerBody}</p>
          </details>
        </section>

        <section className={styles.storySection} id="inclusion">
          <div className={styles.inclusionHero}>
            <div className={styles.inclusionMark}>
              <Image
                src="/keynote/inclusionai/inclusionai.png"
                alt="InclusionAI logo"
                width={460}
                height={460}
              />
            </div>
            <div className={styles.sectionHeading}>
              <p className={styles.sectionIndex}>{t.section03}</p>
              <h2>AI Built By Everyone, <em>For Everyone.</em></h2>
              <p>{t.inclusionHeroBody}</p>
              <div className={styles.valueChips} aria-label={t.section03Tag}>
                <span>Fairness</span>
                <span>Transparency</span>
                <span>Collaboration</span>
              </div>
            </div>
          </div>

          <div className={styles.platformGrid}>
            <a href="https://github.com/inclusionAI" target="_blank" rel="noreferrer">
              <header>
                <span>GitHub · 3 orgs</span>
                <ArrowUpRightIcon aria-hidden="true" />
              </header>
              <strong>92</strong>
              <p>{t.platformRepos}</p>
              <div>
                <span><b>41,045</b> Stars</span>
                <span><b>3,820</b> Forks</span>
              </div>
            </a>
            <a href="https://huggingface.co/inclusionAI" target="_blank" rel="noreferrer">
              <header>
                <span>Hugging Face · 3 orgs</span>
                <ArrowUpRightIcon aria-hidden="true" />
              </header>
              <strong>197</strong>
              <p>{t.platformModels}</p>
              <div>
                <span><b>531,025</b> {t.platformDownloads30d}</span>
                <span><b>8,757</b> Likes</span>
              </div>
            </a>
            <a href="https://modelscope.cn/organization/inclusionAI" target="_blank" rel="noreferrer">
              <header>
                <span>ModelScope · 3 orgs</span>
                <ArrowUpRightIcon aria-hidden="true" />
              </header>
              <strong>188</strong>
              <p>{t.platformModels}</p>
              <div>
                <span><b>204,942</b> Downloads</span>
                <span><b>634</b> Likes</span>
              </div>
            </a>
          </div>

          <div className={styles.serviceBand}>
            <header>
              <span>{t.serviceBandTag}</span>
              <strong>{t.serviceBandHeading}</strong>
            </header>
            <div>
              {localInclusionServices.map((service) => (
                <article key={service.domain}>
                  <Image
                    src={service.logo}
                    alt={`${service.name} logo`}
                    width={56}
                    height={56}
                  />
                  <span>{service.domain}</span>
                  <strong>{service.name}</strong>
                  <small>{service.description}</small>
                </article>
              ))}
            </div>
          </div>

          <div className={styles.inclusionAtlas}>
            <div className={styles.stackLayers} role="tablist" aria-label={t.stackTabsAria}>
              {(Object.keys(localStackData) as StackKey[]).map((key) => (
                <button key={key} type="button" role="tab" aria-selected={stack === key} className={stack === key ? styles.activeStack : ""} onClick={() => setStack(key)}>
                  <strong>{localStackData[key].label}</strong>
                  <span>{localStackData[key].projects.map((project) => project.name).join(" · ")}</span>
                </button>
              ))}
            </div>
            <article className={styles.stackDetail}>
              <p className={styles.utilityLabel}>{localStackData[stack].kicker}</p>
              <h3>{localStackData[stack].title}</h3>
              <p>{localStackData[stack].body}</p>
              <div className={styles.inclusionProjects}>
                {localStackData[stack].projects.map((project) => (
                  <a href={project.href} key={project.name} target="_blank" rel="noreferrer">
                    <span className={styles.inclusionProjectLogo}>
                      <Image
                        src={project.logo}
                        alt={`${project.name} logo`}
                        width={72}
                        height={72}
                      />
                    </span>
                    <span>
                      <strong>{project.name}</strong>
                      <small>{project.role}</small>
                    </span>
                    <p>{project.description}</p>
                    <ArrowUpRightIcon aria-hidden="true" />
                  </a>
                ))}
              </div>
              <small className={styles.participationCue}>{localStackData[stack].ask}</small>
            </article>
          </div>

          <div className={styles.inclusionDetails}>
            <details className={styles.deepDive}>
              <summary>{t.dataScopeSummary}</summary>
              <div>
                <p>{t.dataScopeBody1}</p>
                <p>{t.dataScopeBody2}</p>
                <div className={styles.sourceLinks}>
                  <a href="https://github.com/inclusionAI" target="_blank" rel="noreferrer">{t.githubLinkText}</a>
                  <a href="https://huggingface.co/inclusionAI" target="_blank" rel="noreferrer">{t.hfLinkText}</a>
                  <a href="https://modelscope.cn/organization/inclusionAI" target="_blank" rel="noreferrer">{t.modelscopeLinkText}</a>
                  <a href="/keynote/inclusionai/snapshot-2026-07-30.md" target="_blank" rel="noreferrer">{t.fullSnapshotLink}</a>
                </div>
              </div>
            </details>
            <details className={styles.deepDive}>
              <summary>{t.previousMapSummary}</summary>
              <div className={styles.previousMap}>
                <Image
                  src="/keynote/inclusionai/previous-technical-map.png"
                  alt={t.previousMapAlt}
                  width={2826}
                  height={1592}
                />
              </div>
            </details>
          </div>

          <details className={`${styles.speakerNote} ${styles.deepDive}`}>
            <summary>{t.inclusionSpeakerNote}</summary>
            <div>
              <p>{t.inclusionSpeakerP1}</p>
              <p>{t.inclusionSpeakerP2}</p>
              <p>{t.inclusionSpeakerP3}</p>
              <p>{t.inclusionSpeakerP4}</p>
              <p>{t.inclusionSpeakerP5}</p>
            </div>
          </details>
        </section>

        <section className={styles.storySection} id="licenses">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionIndex}>{t.section04}</p>
            <h2>{t.section04Heading1}<em>{t.section04HeadingEm}</em></h2>
            <p>{t.section04Body}</p>
          </div>

          <div className={`${styles.licenseDistribution} ${styles.deepDive}`}>
            <div className={styles.licenseDistributionHead}>
              <div>
                <span>{t.licenseRepoTag}</span>
                <strong>{visibleLicenseProjects.length} {t.licenseRepoProjects}</strong>
              </div>
              <p>{t.licenseRepoSub}</p>
            </div>
            <div className={styles.inlineTabs}>
              {licenseLayerLabels.map(([key, label]) => {
                const count = projectsForLicenseLayer(projects, key).length;
                return (
                  <button
                    key={key}
                    type="button"
                    className={licenseLayer === key ? styles.activeTab : ""}
                    onClick={() => setLicenseLayer(key)}
                  >
                    {label} · {count}
                  </button>
                );
              })}
            </div>
            <div className={styles.licenseBars}>
              {licenseDistribution.map((item) => (
                <div className={styles.licenseBarRow} key={item.licenseId}>
                  <strong>
                    {licenseDisplayNames[item.licenseId] ?? item.licenseId}
                  </strong>
                  <i>
                    <b
                      style={{
                        "--license-width": `${(item.count / maxLicenseCount) * 100}%`,
                        "--license-color":
                          licenseColors[item.licenseId] ?? "#6d50ff",
                      } as CSSProperties}
                    />
                  </i>
                  <span>{item.count}</span>
                  <small>{item.share.toFixed(1)}%</small>
                </div>
              ))}
            </div>
            <div className={styles.licenseDistributionFoot}>
              <p>{t.licenseFootP1}</p>
              <p>{t.licenseFootP2}</p>
            </div>
          </div>

          <div className={styles.licenseBand}>
            {t.licenseBandCards.map(([value, label]) => (
              <div key={value as string}><strong>{value}</strong><span>{pick(lang, label as Localized<string>)}</span></div>
            ))}
          </div>

          <div className={`${styles.inlineTabs} ${styles.deepDive}`}>
            {([
              ["all", t.licenseFilterAll],
              ["license", t.licenseFilterLicense],
              ["framework", t.licenseFilterFramework],
              ["definition", t.licenseFilterDefinition],
            ] as [LicenseFilter, string][]).map(([key, label]) => (
              <button key={key} type="button" className={licenseFilter === key ? styles.activeTab : ""} onClick={() => setLicenseFilter(key)}>{label}</button>
            ))}
          </div>
          <div className={styles.tableScroller}>
            <table className={styles.comparisonTable}>
              <thead>
                <tr>
                  {t.comparisonHeaders.map((header) => (
                    <th key={pick(lang, header as Localized<string>)}>{pick(lang, header as Localized<string>)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.comparisonRows
                  .filter((row) => licenseFilter === "all" || row[0] === licenseFilter)
                  .map((row) => (
                    <tr key={row[1] as string}>
                      {row.slice(1).map((cell, index) =>
                        typeof cell === "string" ? (
                          <td key={index}>{cell}</td>
                        ) : (
                          <td key={index}>{pick(lang, cell as Localized<string>)}</td>
                        ),
                      )}
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          <div className={`${styles.licenseClauseStudy} ${styles.deepDive}`}>
            <div className={styles.licenseClauseHead}>
              <h3>{t.clauseHeading}</h3>
              <p>{t.clauseSub}</p>
            </div>
            <div className={styles.tableScroller}>
              <table className={styles.clauseTable}>
                <thead>
                  <tr>
                    {t.clauseTableHeaders.map((header) => (
                      <th key={typeof header === "string" ? header : pick(lang, header as Localized<string>)}>
                        {typeof header === "string" ? header : pick(lang, header as Localized<string>)}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {apacheOpenMdwComparison.map((row) => (
                    <tr key={row.topic}>
                      <td>{row.topic}</td>
                      <td>{row.apache}</td>
                      <td>{row.openMdw}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`${styles.opennessLab} ${styles.deepDive}`}>
            <div>
              <p className={styles.utilityLabel}>{t.opennessLabTag}</p>
              <h3>{t.opennessLabHeading}</h3>
              <p>{t.opennessLabBody}</p>
              <div className={styles.checks}>
                {materialChecks.map((item, index) => (
                  <label key={item.label}>
                    <input
                      type="checkbox"
                      checked={materials[index]}
                      onChange={(event) =>
                        setMaterials((current) =>
                          current.map((value, itemIndex) =>
                            itemIndex === index ? event.target.checked : value,
                          ),
                        )
                      }
                    />
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.reference}</small>
                    </span>
                  </label>
                ))}
              </div>
              <div className={styles.materialReferences}>
                <span>{t.checksBasisLabel}</span>
                <a
                  href="https://lfaidata.foundation/wp-content/uploads/sites/3/2025/01/05_White_paper_MOF_Specification.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  MOF 1.0
                </a>
                <a
                  href="https://opensource.org/ai/open-source-ai-definition"
                  target="_blank"
                  rel="noreferrer"
                >
                  OSAID 1.0
                </a>
              </div>
            </div>
            <div className={styles.gauge}>
              <div style={gaugeStyle}>
                <span><strong>{materialScore}%</strong><small>{materialLabel}</small></span>
              </div>
            </div>
          </div>

          <div className={`${styles.licenseReferenceRail} ${styles.deepDive}`}>
            <span>{t.referencesTag}</span>
            {licenseReferences.map((reference) => (
              <a
                key={reference.href}
                href={reference.href}
                target="_blank"
                rel="noreferrer"
              >
                {reference.label}
                <ArrowUpRightIcon aria-hidden="true" />
              </a>
            ))}
          </div>

          <blockquote>{t.licenseQuote}</blockquote>
          <details className={`${styles.speakerNote} ${styles.deepDive}`}>
            <summary>{t.licenseSpeakerNote}</summary>
            <p>{t.licenseSpeakerP1}</p>
            <ol className={styles.speakerPrompts}>
              <li>
                <strong>{t.licensePrompt1Title}</strong>
                {t.licensePrompt1Body}
              </li>
              <li>
                <strong>{t.licensePrompt2Title}</strong>
                {t.licensePrompt2Body}
              </li>
              <li>
                <strong>{t.licensePrompt3Title}</strong>
                {t.licensePrompt3Body}
              </li>
              <li>
                <strong>{t.licensePrompt4Title}</strong>
                {t.licensePrompt4Body}
              </li>
              <li>
                <strong>{t.licensePrompt5Title}</strong>
                {t.licensePrompt5Body}
              </li>
              <li>
                <strong>{t.licensePrompt6Title}</strong>
                {t.licensePrompt6Body}
              </li>
            </ol>
            <p>{t.licenseSpeakerClose}</p>
          </details>
        </section>

        <section className={styles.storySection} id="community">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionIndex}>{t.section05}</p>
            <h2>{t.section05Heading1}<br /><em>{t.section05HeadingEm}</em></h2>
            <p>{t.section05Body}</p>
          </div>

          <div className={styles.communityPath} role="tablist" aria-label={t.communityPathAria}>
            {(Object.keys(localCommunityData) as CommunityKey[]).map((key, index) => (
              <button key={key} type="button" role="tab" aria-selected={community === key} className={community === key ? styles.activeCommunity : ""} onClick={() => setCommunity(key)}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{pick(lang, communityStepLabels[index])}</strong>
              </button>
            ))}
          </div>
          <article className={styles.communityDetail}>
            <h3>{localCommunityData[community][0]}</h3>
            <p>{localCommunityData[community][1]}</p>
          </article>

          <div className={`${styles.signalGrid} ${styles.deepDive}`}>
            <article><span>{t.signalGridDiscoverable}</span><h3>{pick(lang, t.signalGridDiscoverableTitle)}</h3><p>{pick(lang, t.signalGridDiscoverableBody)}</p></article>
            <article><span>{t.signalGridReviewable}</span><h3>{pick(lang, t.signalGridReviewableTitle)}</h3><p>{pick(lang, t.signalGridReviewableBody)}</p></article>
            <article><span>{t.signalGridEarned}</span><h3>{pick(lang, t.signalGridEarnedTitle)}</h3><p>{pick(lang, t.signalGridEarnedBody)}</p></article>
          </div>

          <blockquote>{t.communityQuote}</blockquote>

          <div className={styles.resourceGrid}>
            <a href="https://github.com/antgroup/agentic-ai-landscape" target="_blank" rel="noreferrer"><span>{t.resourceLandscape}</span><strong>{t.resourceLandscapeTitle}</strong><small>{pick(lang, t.resourceLandscapeDesc)}</small><ArrowUpRightIcon aria-hidden="true" /></a>
            <a href="https://github.com/inclusionAI" target="_blank" rel="noreferrer"><span>{t.resourceStack}</span><strong>InclusionAI</strong><small>{pick(lang, t.resourceStackDesc)}</small><ArrowUpRightIcon aria-hidden="true" /></a>
            <a href="https://www.apache.org/theapacheway/" target="_blank" rel="noreferrer"><span>{t.resourceGovernance}</span><strong>The Apache Way</strong><small>{pick(lang, t.resourceGovernanceDesc)}</small><ArrowUpRightIcon aria-hidden="true" /></a>
          </div>

          <details className={`${styles.speakerNote} ${styles.deepDive}`}>
            <summary>{t.communitySpeakerNote}</summary>
            <p>{t.communitySpeakerBody}</p>
          </details>
        </section>

        <footer className={styles.footer}>
          <p>{t.footerEvent} <span>·</span> August 7</p>
          <div>
            <a href="https://openmdw.ai/faq/" target="_blank" rel="noreferrer">OpenMDW</a>
            <a href="https://www.modelgo.li/" target="_blank" rel="noreferrer">ModelGo</a>
            <a href="https://opensource.org/ai/open-source-ai-definition" target="_blank" rel="noreferrer">OSAID</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
