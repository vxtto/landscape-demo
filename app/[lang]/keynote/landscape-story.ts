import type { Locale } from "../dictionaries";
import { type Localized, pick } from "./i18n";

export type LandscapeKey = "agent" | "model" | "large" | "awesome";

export type LandscapeMetric = {
  value: string;
  label: string;
  note: string;
};

export type LandscapeInsight = {
  signal: string;
  title: string;
  body: string;
  evidence: string;
};

export type MethodStep = {
  number: string;
  title: string;
  body: string;
};

export type SourceLink = {
  label: string;
  href: string;
  note: string;
};

export type LandscapeView = {
  label: string;
  perspective: string;
  question: string;
  htmlSrc: string;
  sourceHref?: string;
  caption: string;
  snapshot: string;
  base: [number, number];
  metrics: LandscapeMetric[];
  insight: LandscapeInsight;
  methodIntro: string;
  methodSteps: MethodStep[];
  caveats: string[];
  sources: SourceLink[];
  speakerTime: string;
  speakerScript: string[];
  fullNoteHref: string;
};

type LocalizedMetric = { value: string; label: Localized<string>; note: Localized<string> };
type LocalizedInsight = {
  signal: Localized<string>;
  title: Localized<string>;
  body: Localized<string>;
  evidence: string;
};
type LocalizedMethodStep = { number: string; title: Localized<string>; body: Localized<string> };
type LocalizedSourceLink = { label: Localized<string>; href: string; note: Localized<string> };

type LocalizedLandscapeView = {
  label: string;
  perspective: Localized<string>;
  question: Localized<string>;
  htmlSrc: string;
  sourceHref?: string;
  caption: Localized<string>;
  snapshot: string;
  base: [number, number];
  metrics: LocalizedMetric[];
  insight: LocalizedInsight;
  methodIntro: Localized<string>;
  methodSteps: LocalizedMethodStep[];
  caveats: Localized<string>[];
  sources: LocalizedSourceLink[];
  speakerTime: Localized<string>;
  speakerScript: Localized<string>[];
  fullNoteHref: string;
};

const repoBase =
  "https://github.com/xiaoya-yaya/landscape-demo/blob/main/insights/260807-CoC-KN";

const sharedInfraMethod: LocalizedMethodStep[] = [
  {
    number: "01",
    title: { en: "Establish the old map's baseline", zh: "先建立旧图基线" },
    body: {
      en: "Read 227 unique repos from the previous version's reference source, using a stable repo ID as the dedup key. A rename does not create a \"new project,\" and a project already on the old map does not re-enter the candidate pool.",
      zh: "从上一版 reference source 读取 227 个唯一仓库，以稳定 repo ID 作为去重键。改名不会产生一个“新项目”，旧图已有项目也不会再次进入候选池。",
    },
  },
  {
    number: "02",
    title: { en: "Cast a wide net through three channels", zh: "三个入口把网撒开" },
    body: {
      en: "OpenDigger WatchEvent supplies the top 2,500 by recent attention; combined 2026 Apr–Jun Repo OpenRank supplies the top 4,000; and 12 targeted GitHub searches add up to 100 results each. The three channels are merged, deduplicated by repo ID, and filtered against the baseline, yielding 6,118 candidates.",
      zh: "OpenDigger WatchEvent 取近期关注度前 2,500；2026 年 4—6 月 Repo OpenRank 合计取前 4,000；再执行 12 组 GitHub 定向搜索，每组最多 100 条。三个入口合并、按 repo ID 去重并排除基线，得到 6,118 个候选。",
    },
  },
  {
    number: "03",
    title: { en: "High-recall filtering on project text", zh: "用项目文本做高召回过滤" },
    body: {
      en: "Read the repo name, description, topics, and the first 8,000 characters of the README. Agent-related terms score ×4, Model Infra and model terms score ×2; tutorial, course, and collection terms deduct ×3. That narrows 6,118 candidates to 878.",
      zh: "读取仓库名、description、topics 和 README 前 8,000 字符。Agent 词命中 ×4，Model Infra 与模型词命中 ×2；教程、课程和合集词命中 ×3 扣分。6,118 个候选缩到 878 个。",
    },
  },
  {
    number: "04",
    title: { en: "Go back to GitHub to verify the current state", zh: "回到 GitHub 复核现在的项目" },
    body: {
      en: "Take the top 100 by WatchEvent, top 100 by OpenRank, and top 80 by GitHub search, then union them. The GitHub API refreshes names, stars, license, last push, fork, and archive status; the latest README gets a second technical-fit pass, leaving 222 machine-shortlisted candidates. The OmniRoute retrospective exposed a blind spot in strict absolute top-N cuts, so human review adds a separate high-growth-rate channel.",
      zh: "分别取 WatchEvent 前 100、OpenRank 前 100、GitHub 搜索前 80，再取并集。GitHub API 刷新名称、stars、许可证、最近 push、fork 和 archive 状态；最新 README 再做一次技术定位，留下 222 个机器候选。OmniRoute 复盘暴露了绝对 Top-N 的盲区，因此人工复核又增加一条高增速通道。",
    },
  },
  {
    number: "05",
    title: { en: "Editorial judgment decides the final layout", zh: "最后由编辑判断决定版面" },
    body: {
      en: "A human checks whether a project fills a structural gap, represents a general capability, or duplicates an existing logo. New or fast-growing projects get a separate look at the last three months of evidence; being added to the main map and being tagged NEW / RISING are two different decisions. The master table records the editorial action and the trend signal separately.",
      zh: "人工检查它是否补上结构缺口、是不是通用能力、是否和现有 logo 重复。新项目或高增长项目单独看近三个月证据；加入主图和标成 NEW / RISING 是两件事。主表分别记录编辑动作与趋势信号。",
    },
  },
];

const landscapeViewsSource: Record<LandscapeKey, LocalizedLandscapeView> = {
  agent: {
    label: "Agent Infra",
    perspective: {
      en: "Read the ecosystem along the path an agent takes to complete a task",
      zh: "沿着 Agent 完成一次任务所经过的路径看生态",
    },
    question: {
      en: "What does Agent actually lack right now — another framework, or connections, context, and a reliable place to run?",
      zh: "Agent 现在最缺的，是又一个框架，还是连接、上下文和可靠运行环境？",
    },
    htmlSrc: "/embed/agent-infra",
    sourceHref: "/embed/agent-infra",
    caption: {
      en: "Reuses the site's own Agent Infra map component directly — no iframe, no bar chart, no site navigation.",
      zh: "直接复用站内 Agent Infra 原图组件；不经过 iframe，也不包含柱状图和站点导航。",
    },
    snapshot: "GitHub 2026-07-28 · OpenRank 2026-06",
    base: [1440, 810],
    metrics: [
      {
        value: "74",
        label: { en: "In Agent Infra", zh: "进入 Agent Infra" },
        note: { en: "59 retained, 15 added", zh: "59 个保留，15 个新增" },
      },
      {
        value: "3 → 5",
        label: { en: "Protocols & interoperability", zh: "协议与互操作项目" },
        note: { en: "AG-UI and A2UI join A2A and MCP", zh: "A2A、MCP 之外补入 AG-UI 与 A2UI" },
      },
      {
        value: "15 → 12",
        label: { en: "Agentic coding", zh: "Agentic coding" },
        note: {
          en: "Trimmed overlap to make room for new structure",
          zh: "收紧重复表达，把版面让给新结构",
        },
      },
    ],
    insight: {
      signal: { en: "The change most worth discussing", zh: "最值得讲的变化" },
      title: {
        en: "Context is turning into its own data layer",
        zh: "上下文开始长成独立的数据层",
      },
      body: {
        en: "OpenViking folds memory, RAG, and skills into a context database. Its OpenRank rose from 35.96 to 140.23 between March and June 2026 — worth more attention than one more agent framework: context is moving from being a feature inside a framework to infrastructure that evolves on its own.",
        zh: "OpenViking 把 memory、RAG 和 skills 收进 context database。它在 2026 年 3—6 月的 OpenRank 从 35.96 升至 140.23；这比再多一个 agent framework 更值得关注：上下文正在从框架里的一个功能，变成可以单独演进的基础设施。",
      },
      evidence: "OpenViking · OpenRank 35.96 → 140.23",
    },
    methodIntro: {
      en: "Agent Infra and Model Infra share one discovery pipeline. The 6,118 figure is a high-recall candidate pool that still contains many tutorials, applications, and loosely related repos that will eventually be excluded — it should not be read as 6,118 Agentic AI infrastructure projects.",
      zh: "Agent Infra 与 Model Infra 共用一套候选发现管线。6,118 是高召回候选池，里面包含大量最终会被排除的教程、应用与弱相关仓库，不能解读成 6,118 个 Agentic AI 基础设施项目。",
    },
    methodSteps: sharedInfraMethod,
    caveats: [
      {
        en: "WatchEvent is used only for candidate discovery, not as full star growth; GitHub tightened public stargazer detail in July 2026.",
        zh: "WatchEvent 只用于发现候选，不是完整 star 增长；GitHub 的公开 stargazer 明细在 2026 年 7 月收紧。",
      },
      {
        en: "May and June 2026 OpenRank may still backfill; a recent dip in totals should not be read directly as declining project activity.",
        zh: "2026 年 5、6 月 OpenRank 仍可能回填，近期总量下降不能直接解释为项目活跃度下降。",
      },
      {
        en: "Being on the main map is a call about ecosystem structure, not a quality ranking; near-duplicate repos from the same vendor are actively deduplicated.",
        zh: "进入主图是生态结构判断，不是项目质量排名；同一厂商的相近仓库会主动去重。",
      },
    ],
    sources: [
      {
        label: { en: "Full scanning methodology", zh: "扫描方法全文" },
        href: `${repoBase}/landscape-refresh/landscape_scanning_methodology.md`,
        note: {
          en: "The complete 6,118 → 878 → 222 walkthrough",
          zh: "6,118 → 878 → 222 的完整解释",
        },
      },
      {
        label: { en: "Scan summary", zh: "扫描结果摘要" },
        href: `${repoBase}/landscape-refresh/data/scan_summary.json`,
        note: { en: "Candidate counts, windows, and limits", zh: "候选数、窗口和限制" },
      },
      {
        label: { en: "Agent Infra master table", zh: "Agent Infra 主表" },
        href: `${repoBase}/landscape-refresh/data/agent_infra_landscape_projects.csv`,
        note: {
          en: "74 projects with a per-item selection rationale",
          zh: "74 个项目及逐项选择理由",
        },
      },
      {
        label: { en: "Human review shortlist", zh: "人工复核池" },
        href: `${repoBase}/landscape-refresh/data/human_review_shortlist.csv`,
        note: { en: "Tier A/B evidence and caveats", zh: "A/B 档证据与 caveat" },
      },
    ],
    speakerTime: { en: "~2 min", zh: "约 2 分钟" },
    speakerScript: [
      {
        en: "Start with the current structure. Of 74 projects, Agentic coding has 12 and code-first frameworks have 10 — the two largest sections both center on coding. Code is still the densest entry point into the agent ecosystem.",
        zh: "先看现在的结构。74 个项目里，Agentic coding 有 12 个，Code-first frameworks 有 10 个，最大的两个 section 都围绕 coding。代码仍是 Agent 生态最密集的入口。",
      },
      {
        en: "Second angle: context. OpenViking folds memory, RAG, and skills into a context database, and its OpenRank climbed from 35.96 to 140.23 between March and June. Context is starting to move from an in-framework feature to an independent data layer.",
        zh: "第二个视角看上下文。OpenViking 把 memory、RAG 和 skills 放进 context database，3 月到 6 月 OpenRank 从 35.96 升到 140.23。上下文开始从框架内部功能变成独立数据层。",
      },
      {
        en: "Third angle: public interfaces. Beyond MCP and A2A, AG-UI and A2UI bring event streams and interfaces into the protocol layer. Fourth angle: how improvement happens — SkillOpt treats skill documentation as trainable state, updated through rollouts, evaluation, and validation gates.",
        zh: "第三个视角看公共接口：MCP、A2A 之外，AG-UI 与 A2UI 把事件流和界面带进协议层。第四个视角看改进方式：SkillOpt 把 skill 文档当作可训练状态，用 rollout、评估和验证门更新。",
      },
      {
        en: "The NEW and RISING tags on the map only describe a signal over the last 90 days — they don't mean the project just joined this version's map. Next, we follow the same execution chain into Model Infra.",
        zh: "图上的 NEW 和 RISING 只表达最近 90 天的新生或加速信号，不再等同于这版刚加入主图。下一张继续沿执行链路看 Model Infra。",
      },
    ],
    fullNoteHref: `${repoBase}/landscape-notes/agent-infra.md`,
  },
  model: {
    label: "Model Infra",
    perspective: {
      en: "Read the ecosystem along the path a token takes through training, routing, generation, and reuse",
      zh: "沿着一个 token 被训练、路由、生成和复用的路径看生态",
    },
    question: {
      en: "When an agent stretches one request into a long chain of calls, where does model infrastructure hit its bottleneck?",
      zh: "当 Agent 把一次请求拉成长链路，模型基础设施的瓶颈会落在哪里？",
    },
    htmlSrc: "/embed/model-infra",
    sourceHref: "/embed/model-infra",
    caption: {
      en: "Reuses the site's own Model Infra map component directly — no iframe, no bar chart, no site navigation.",
      zh: "直接复用站内 Model Infra 原图组件；不经过 iframe，也不包含柱状图和站点导航。",
    },
    snapshot: "GitHub 2026-07-28 · OpenRank 2026-06",
    base: [1440, 810],
    metrics: [
      {
        value: "58",
        label: { en: "In Model Infra", zh: "进入 Model Infra" },
        note: { en: "47 retained, 11 added", zh: "47 个保留，11 个新增" },
      },
      {
        value: "6 → 8",
        label: { en: "Serving · Inference", zh: "Serving · Inference" },
        note: {
          en: "KV cache, hardware plug-ins, and multimodal serving thicken the section",
          zh: "KV cache、硬件插件与多模态 serving 增厚",
        },
      },
      {
        value: "6",
        label: { en: "Model API gateways", zh: "Model API gateways" },
        note: {
          en: "OmniRoute added back on a recent high-growth signal",
          zh: "OmniRoute 补入近期高增长信号",
        },
      },
    ],
    insight: {
      signal: { en: "The change most worth discussing", zh: "最值得讲的变化" },
      title: {
        en: "Gateways are hot again, but their job has split",
        zh: "Gateway 又热了，但职责已经分叉",
      },
      body: {
        en: "OmniRoute had 32,706 stars as of July 28, with OpenRank rising from 4.07 to 39.04 between February and June. It clearly overlaps with LiteLLM and AgentGateway, but that also shows gateways now doing model routing, quota fallback, and agent-protocol traffic all at once — the right way to categorize them is by responsibility, not by name.",
        zh: "OmniRoute 截至 7 月 28 日有 32,706 stars，2—6 月 OpenRank 从 4.07 升至 39.04。它和 LiteLLM、AgentGateway 的重叠很明显，但也说明 gateway 正同时承担模型路由、配额 fallback 与 agent 协议流量；分类必须按职责，而不是按名字。",
      },
      evidence: "OmniRoute · OpenRank 4.07 → 39.04",
    },
    methodIntro: {
      en: "The candidate pool is shared with Agent Infra, but the final pass confirms whether a project genuinely touches model training, data, compute, inference, or access — apps that merely call a model API don't make it into Model Infra on that basis alone.",
      zh: "候选池与 Agent Infra 共用，但最后一轮会确认项目是否真正影响模型训练、数据、计算、推理或访问；只调用模型 API 的应用不会因此进入 Model Infra。",
    },
    methodSteps: [
      ...sharedInfraMethod.slice(0, 4),
      {
        number: "05",
        title: {
          en: "Re-sort by where a project sits in the model lifecycle",
          zh: "按模型生命周期重新归类",
        },
        body: {
          en: "Each candidate is checked against training, data, compute, serving, gateway, and post-training roles. Model API gateways move from Agent Infra into Model Infra; general inference and hardware plug-ins are shown separately; application-layer projects don't enter this map just for using a GPU or a model API.",
          zh: "逐项检查训练、数据、计算、serving、gateway 与 post-training 的职责。Model API gateway 从 Agent Infra 移入 Model Infra；通用推理与硬件插件分开表达；应用层项目不会因为使用 GPU 或模型 API 就进入本图。",
        },
      },
    ],
    caveats: [
      {
        en: "OpenRank measures collaborative activity — it does not substitute for performance benchmarks, deployment share, or actual token usage.",
        zh: "OpenRank 衡量协作活跃度，不能替代性能 benchmark、部署份额或实际 token 使用。",
      },
      {
        en: "Main repos, plug-ins, and hardware adapters from the same stack tend to duplicate logos; the layout keeps only the entries that mark a structural change.",
        zh: "同一技术栈的主仓库、插件与硬件适配仓库会产生 logo 重复，版面中只保留能说明结构变化的代表。",
      },
      {
        en: "Large Models cannot reuse this GitHub-repo ranking method, so it draws separately on model releases, weights, licenses, and real usage data.",
        zh: "Large Models 不能沿用这套 GitHub 仓库排名方法，因此单独使用模型发布、权重、许可证和真实使用数据。",
      },
    ],
    sources: [
      {
        label: { en: "Scan script", zh: "扫描脚本" },
        href: `${repoBase}/landscape-refresh/analysis/scan_landscape_candidates.py`,
        note: {
          en: "OpenDigger, GitHub, and README filtering logic",
          zh: "OpenDigger、GitHub 与 README 过滤逻辑",
        },
      },
      {
        label: { en: "Model Infra master table", zh: "Model Infra 主表" },
        href: `${repoBase}/landscape-refresh/data/model_infra_landscape_projects.csv`,
        note: {
          en: "57 projects, metrics, and editorial rationale",
          zh: "57 个项目、指标与编辑理由",
        },
      },
      {
        label: { en: "Layout decision summary", zh: "版面决策摘要" },
        href: `${repoBase}/landscape-refresh/data/infra_landscape_source_summary.json`,
        note: {
          en: "Section counts, old version vs. new",
          zh: "旧版与新版 section counts",
        },
      },
      {
        label: { en: "Data quality checks", zh: "数据质量检查" },
        href: `${repoBase}/landscape-refresh/data/data_quality_checks.csv`,
        note: {
          en: "OpenRank and WatchEvent coverage",
          zh: "OpenRank 与 WatchEvent 覆盖情况",
        },
      },
    ],
    speakerTime: { en: "~2 min", zh: "约 2 分钟" },
    speakerScript: [
      {
        en: "Model Infra now has 58 projects. Serving · Inference and Compiler & accelerator are still the two biggest execution zones, but this slide covers one recent signal: gateways are hot again.",
        zh: "Model Infra 现在有 58 个项目。Serving · Inference 与 Compiler & accelerator 仍是两个最大的执行区，但这张图只讲一个近期信号：gateway 又热了。",
      },
      {
        en: "OmniRoute had 32,706 stars as of July 28, and its OpenRank climbed from 4.07 to 39.04 between February and June. It actually made the 222-item machine shortlist earlier, but a strict absolute top-N cutoff let it slip out of human review. This time it's back on the map — and it also added a high-growth-rate review channel.",
        zh: "OmniRoute 截至 7 月 28 日有 32,706 stars，2 月到 6 月 OpenRank 从 4.07 升到 39.04。它其实进过 222 个机器候选，但被绝对 Top-N 门槛漏出了人工短名单。这次补回主图，也补了一条高增速复核通道。",
      },
      {
        en: "It overlaps with LiteLLM, New API, and AgentGateway. We're not treating heat as uniqueness here — we're using it to show that a gateway's job is expanding from model-API proxying to quota fallback and MCP/A2A traffic.",
        zh: "它与 LiteLLM、New API、AgentGateway 都有交叉。这里不把热度等同于独特性；我们用它说明 gateway 的职责正在从模型 API 代理扩展到配额 fallback、MCP 和 A2A 流量。",
      },
      {
        en: "OpenRank can only describe collaborative activity — it cannot prove which inference system performs best. Next we switch to a full month of real usage data to look at the model side.",
        zh: "OpenRank 只能描述协作活跃度，不能证明哪个推理系统性能最好。接下来换一套口径，用完整月份的真实使用数据看模型端。",
      },
    ],
    fullNoteHref: `${repoBase}/landscape-notes/model-infra.md`,
  },
  large: {
    label: "Large Models",
    perspective: {
      en: "Read the model ecosystem along two axes: real usage and weight availability",
      zh: "从真实使用与权重可得性两个维度看模型生态",
    },
    question: {
      en: "Is a model that tops the leaderboards the same thing as a model the community can study, modify, and republish?",
      zh: "一个模型在排行榜上很强，和它能否被社区研究、修改、再发布，是同一件事吗？",
    },
    htmlSrc: "/keynote/large-models/index.html",
    caption: {
      en: "Compares 50 model endpoints within the same complete calendar month, using one shared usage score for both open-weight and closed models.",
      zh: "同一个完整自然月内比较 50 个模型 endpoint；开放权重与闭源模型使用同一套使用分数。",
    },
    snapshot: "OpenRouter + ZenMux · 2026-06-01—06-30",
    base: [3840, 2160],
    metrics: [
      {
        value: "24 / 26",
        label: {
          en: "Open-weight / no public weights",
          zh: "开放权重 / 无公开权重",
        },
        note: { en: "Nearly an even split in the Top 50", zh: "Top 50 几乎对半" },
      },
      {
        value: "5 / 5",
        label: { en: "Both types in the Top 10", zh: "Top 10 中的两类模型" },
        note: {
          en: "Real usage isn't dominated by one side",
          zh: "真实使用没有形成单边格局",
        },
      },
      {
        value: "37 / 50",
        label: { en: "Visible on both platforms", zh: "两平台同时可见" },
        note: {
          en: "74% of the Top 50 has cross-platform evidence",
          zh: "74% 的 Top 50 有跨平台证据",
        },
      },
    ],
    insight: {
      signal: { en: "The change most worth discussing", zh: "最值得讲的变化" },
      title: {
        en: "Open-weight models have entered mainstream usage",
        zh: "开放权重模型已经进入主流使用区",
      },
      body: {
        en: "In the Top 10 for June 2026, open-weight and no-public-weight models split 5 and 5, with DeepSeek V4 Flash ranking first overall. That shows open weights have reached mainstream usage — it does not show that open models have won.",
        zh: "2026 年 6 月的 Top 10 中，开放权重与无公开权重模型各 5 个，综合第一是 DeepSeek V4 Flash。这个结果能说明开放权重已经进入主流使用，不能说明开放模型已经赢了。",
      },
      evidence: "Top 10 · open 5 / closed 5",
    },
    methodIntro: {
      en: "Large Models does not reuse GitHub repo popularity. The master table treats each hosted model endpoint/release as one row, merges free and paid aliases of the same endpoint, and compares real token usage within the last complete calendar month.",
      zh: "Large Models 没有沿用 GitHub 仓库热度。主表把“一个托管模型 endpoint / release”作为一行，合并同一 endpoint 的免费与付费别名，在上一完整自然月内比较真实 token 使用。",
    },
    methodSteps: [
      {
        number: "01",
        title: { en: "Lock in the last complete calendar month", zh: "锁定上一完整自然月" },
        body: {
          en: "The script ran in July 2026, so the window automatically rolls back to 2026-06-01—06-30. The current, incomplete month never enters the main comparison, avoiding a mix of partial and full months.",
          zh: "脚本在 2026 年 7 月运行，因此窗口自动回退到 2026-06-01—06-30。当前月不会进入主比较，避免拿不完整月份和完整月份混在一起。",
        },
      },
      {
        number: "02",
        title: { en: "Aggregate OpenRouter's 30 daily leaderboards", zh: "OpenRouter 汇总 30 天日榜" },
        body: {
          en: "The verified-usage dataset publishes a daily Top 50 plus one \"other\" rollup. Across 30 days that's 1,530 records; 78 named models made at least one daily leaderboard that month, together covering 93.5989% of visible tokens.",
          zh: "认证数据集每天公开 Top 50 与一个 other 汇总项。30 天共返回 1,530 条记录，月内 78 个具名模型至少进入过一次日榜；具名模型覆盖 93.5989% 的可见 token。",
        },
      },
      {
        number: "03",
        title: { en: "Query ZenMux's monthly leaderboard for the same window", zh: "ZenMux 查询同窗月榜" },
        body: {
          en: "The management leaderboard uses the tokens metric, the same date range, and limit=50, returning 50 named models plus one __others__ bucket; named models cover 99.5243% of tokens.",
          zh: "management leaderboard 使用 tokens 指标、相同起止日期与 limit=50，返回 50 个具名模型和一个 __others__；具名模型覆盖 99.5243% 的 token。",
        },
      },
      {
        number: "04",
        title: { en: "Compute within-platform percentiles first, then combine", zh: "先做平台内分位，再合成" },
        body: {
          en: "Raw token counts from the two platforms are never added together directly. Each platform's monthly token percentile is computed independently and contributes 50% to the composite score; free/paid aliases of the same endpoint are merged.",
          zh: "两家原始 token 数不直接相加。每个平台独立计算月度 token 百分位，各占综合分 50%；相同 endpoint 的 free / paid alias 合并。",
        },
      },
      {
        number: "05",
        title: { en: "Cross-check weights and licenses with Hugging Face", zh: "用 Hugging Face 核验权重与许可证" },
        body: {
          en: "Resolve the official weight repo, license, gated status, 30-day downloads, likes, architecture, and parameter count. HF adoption only describes the open-weight ecosystem — it does not feed into the open-vs-closed composite score.",
          zh: "解析官方权重仓库、license、gated 状态、30 天下载、likes、架构和参数量。HF adoption 只用于描述开放权重生态，不进入开放与闭源共同比较分。",
        },
      },
    ],
    caveats: [
      {
        en: "OpenRouter only exposes a daily Top 50; a model below that bar for the whole month falls into \"other\" and gets no named token count.",
        zh: "OpenRouter 每天只暴露 Top 50；一个模型整月都低于日榜门槛时，会落进 other，无法得到具名 token。",
      },
      {
        en: "ZenMux's monthly leaderboard also lists only the Top 50; being off the list does not mean zero usage.",
        zh: "ZenMux 月榜只单列 Top 50；榜外不代表零使用。",
      },
      {
        en: "\"No public weights\" means no official public HF weight repo was resolved — it is not proof about internal code or legal status.",
        zh: "“无公开权重”表示没有解析到官方公开 HF 权重仓库，不是对内部代码或法律状态的证明。",
      },
    ],
    sources: [
      {
        label: { en: "Monthly source summary", zh: "月度 source summary" },
        href: `${repoBase}/large-models-refresh/data/monthly_source_summary.json`,
        note: {
          en: "Window, coverage, and Top 50 structure",
          zh: "窗口、覆盖率与 Top 50 结构",
        },
      },
      {
        label: { en: "Top 50 master table", zh: "Top 50 主表" },
        href: `${repoBase}/large-models-refresh/data/monthly_models_top50_open_closed.csv`,
        note: {
          en: "Monthly tokens and open status on both platforms",
          zh: "两平台月度 token 与开放状态",
        },
      },
      {
        label: { en: "Monthly build script", zh: "月度构建脚本" },
        href: `${repoBase}/large-models-refresh/analysis/build_monthly_open_closed_model_table.py`,
        note: {
          en: "API parameters, matching, and scoring logic",
          zh: "API 参数、匹配与计分逻辑",
        },
      },
      {
        label: { en: "Data quality checks", zh: "数据质量检查" },
        href: `${repoBase}/large-models-refresh/data/monthly_data_quality_checks.csv`,
        note: {
          en: "Cross-platform coverage and license verification",
          zh: "跨平台覆盖与许可证核验",
        },
      },
    ],
    speakerTime: { en: "~2 min", zh: "约 2 分钟" },
    speakerScript: [
      {
        en: "This slide starts with the data window. We use June 1 to 30, 2026 — one complete calendar month. OpenRouter's and ZenMux's raw token counts can't be added directly, so each is converted to a within-platform percentile first, each contributing 50%.",
        zh: "这张图先讲数据口径。我们取的是 2026 年 6 月 1 日到 30 日，一个完整自然月。OpenRouter 和 ZenMux 的原始 token 数不能直接相加，所以先在各自平台内部换成百分位，再各占 50%。",
      },
      {
        en: "Open-weight and no-public-weight models split 5 and 5 in the Top 10. On these two platforms, this month, both types reached mainstream usage. Coverage is limited, so the conclusion is scoped to this sample.",
        zh: "Top 10 里开放权重与无公开权重各有 5 个。这个月、这两个平台上，两类模型都进入了主流使用区。数据覆盖有限，所以结论只落在这份样本上。",
      },
      {
        en: "Break the Top 50 down by model type and the difference shows up: 12 of 13 Reasoning models are open-weight; 22 of 30 Multimodal/VLM models have no public weights. Openness clearly correlates with model type.",
        zh: "把 Top 50 按模型类型拆开，差异就出来了：13 个 Reasoning 模型中有 12 个开放权重；30 个 Multimodal / VLM 中有 22 个没有公开权重。开放程度和模型类型明显相关。",
      },
      {
        en: "Public AAI scores match 8 samples. The #1 model by usage has an AAI of 40.3; the model with the highest AAI ranks #25 by usage. Real usage is also shaped by price, latency, channel, and product fit — capability leaderboards are just one variable.",
        zh: "公开 AAI 能匹配到 8 个样本。使用排名第 1 的模型 AAI 为 40.3；AAI 最高的模型使用排名第 25。真实使用还受价格、延迟、渠道与产品适配影响，能力榜只是其中一个变量。",
      },
      {
        en: "Even within \"open-weight,\" release materials still vary a lot. Some ship only weights; others ship training code, data notes, and evaluations too — we'll pick that thread back up in the licensing section.",
        zh: "同样叫开放权重，发布材料仍有很大差别。有的只有权重，有的还有训练代码、数据说明和评测；这一层差异留到许可证部分继续讲。",
      },
    ],
    fullNoteHref: `${repoBase}/landscape-notes/large-models.md`,
  },
  awesome: {
    label: "Awesome",
    perspective: {
      en: "Read the ecosystem through how people and agents consume open-source knowledge",
      zh: "从人和 Agent 如何消费开源知识的方式看生态",
    },
    question: {
      en: "Is a README still a link list for humans to read, or has it become an interface an agent can execute directly?",
      zh: "README 还是一张给人看的链接表，还是已经变成 Agent 可以直接执行的接口？",
    },
    htmlSrc: "/keynote/awesome/awesome_agentic_landscape_2026.html",
    caption: {
      en: "Arranges Awesome-style repos across Discover, Reuse, Install, and Operate to see how knowledge enters an agent's workflow.",
      zh: "把 Awesome 类仓库按 Discover、Reuse、Install、Operate 排列，观察知识怎样进入 Agent 工作流。",
    },
    snapshot: "GitHub 2026-07-29 · OpenRank 2026-04—06",
    base: [3840, 2160],
    metrics: [
      {
        value: "460 → 26",
        label: { en: "Candidates to editorial shortlist", zh: "候选到编辑短名单" },
        note: {
          en: "Candidate discovery is kept separate from map inclusion",
          zh: "候选发现与主图选入分开",
        },
      },
      {
        value: "19 / 26",
        label: { en: "Directly consumable by an agent", zh: "可被 Agent 直接消费" },
        note: {
          en: "Skills, instructions, hooks, or workflows",
          zh: "skills、instructions、hooks 或 workflows",
        },
      },
      {
        value: "5 · 7 · 7 · 7",
        label: { en: "Four usage stages", zh: "四个使用阶段" },
        note: { en: "Discover · Reuse · Install · Operate", zh: "Discover · Reuse · Install · Operate" },
      },
    ],
    insight: {
      signal: { en: "The change most worth discussing", zh: "最值得讲的变化" },
      title: { en: "READMEs are picking up executable semantics", zh: "README 开始带有执行语义" },
      body: {
        en: "Of the 26 repos on the shortlist, 19 are flagged for direct consumability. They ship skills, instructions, hooks, MCP configuration, or a repeatable workflow, so an agent can pull the repo's content straight into a task.",
        zh: "短名单 26 个仓库里，有 19 个被标记为 direct consumability。它们提供 skills、instructions、hooks、MCP 配置或可重复 workflow，Agent 可以直接把仓库内容带进任务。",
      },
      evidence: "19 direct · 5 hybrid · 2 indirect",
    },
    methodIntro: {
      en: "The Awesome map has its own 460-item candidate pool. It merges collection-shaped repos surfaced by the general landscape scan, 10 targeted GitHub searches, and 13 hand-picked seeds, then checks whether each README contains structure an agent can consume.",
      zh: "Awesome 图有自己的 460 项候选池。它把通用 landscape 扫描结果里符合 collection 形态的仓库、10 组 GitHub 定向搜索和 13 个手工种子合并，再看 README 是否包含可供 Agent 消费的结构。",
    },
    methodSteps: [
      {
        number: "01",
        title: { en: "Merge three seed sources", zh: "合并三个种子入口" },
        body: {
          en: "Pull awesome/skills/prompts-shaped repos from the general 6,118-item candidate pool; run 10 targeted GitHub searches; add 13 known seeds. Deduplicating by repo ID yields 460 candidates.",
          zh: "从通用 6,118 扫描的 candidate pool 中找 awesome、skills、prompts 类仓库；执行 10 组 GitHub 搜索；加入 13 个已知种子。按 repo ID 去重后得到 460 个候选。",
        },
      },
      {
        number: "02",
        title: { en: "Read the current repo and README", zh: "读取当前仓库与 README" },
        body: {
          en: "The GitHub API refreshes stars, forks, license, and last push; high-signal repos get their README read for headings, Markdown links, GitHub links, agent-file mentions, contribution notes, and taxonomy signals.",
          zh: "GitHub API 刷新 stars、forks、许可证、最近 push；对高信号仓库读取 README，统计标题、Markdown 链接、GitHub 链接、agent 文件提及、贡献说明与 taxonomy 信号。",
        },
      },
      {
        number: "03",
        title: { en: "Layer in collaboration and attention signals", zh: "叠加协作与关注信号" },
        body: {
          en: "Uses visible WatchEvent since May 2026, distinct issue/PR/review participants, and Repo OpenRank for Apr–Jun 2026. These metrics are only ranking evidence — they don't replace README-level semantic judgment.",
          zh: "使用 2026 年 5 月以来可见 WatchEvent、issue / PR / review 的独立参与者，以及 2026 年 4—6 月 Repo OpenRank。指标只做排序证据，不替代 README 语义判断。",
        },
      },
      {
        number: "04",
        title: { en: "Judge agent consumability", zh: "判断 Agent consumability" },
        body: {
          en: "A README that clearly ships a skill, instruction, prompt, hook, workflow, playbook, or MCP config is marked direct; one that mixes a traditional directory with executable material is hybrid; a list meant only for human browsing is indirect.",
          zh: "README 明确提供 skill、instruction、prompt、hook、workflow、playbook 或 MCP 配置时标记为 direct；兼有传统目录与可执行材料时为 hybrid；只供人浏览的列表为 indirect。",
        },
      },
      {
        number: "05",
        title: { en: "Edit down to a tellable 26-item view", zh: "编辑成可讲的 26 项视图" },
        body: {
          en: "Machine candidates first produce a 24-item provisional shortlist; a human adds two historical benchmarks, arriving at 16 core, 8 watch, and 2 benchmark entries, arranged across Discover, Reuse, Install, and Operate.",
          zh: "机器候选先产生 24 项 provisional shortlist，人工加入两个历史 benchmark，最终得到 16 core、8 watch、2 benchmark，并按 Discover、Reuse、Install、Operate 排列。",
        },
      },
    ],
    caveats: [
      {
        en: "The 460 candidates come from a candidate-first scan, not a full census; the final 26 items are an editorial seed set meant to illustrate a trend.",
        zh: "460 个候选是 candidate-first 扫描，不是完整 census；最终 26 项是用于解释趋势的编辑种子集。",
      },
      {
        en: "WatchEvent is not precise star growth, and recent OpenRank is sensitive to coverage and backfill.",
        zh: "WatchEvent 不是精确 star 增长，近期 OpenRank 对覆盖与回填敏感。",
      },
      {
        en: "Direct/hybrid/indirect comes from a README-consumability judgment and will shift as repo structure changes.",
        zh: "Direct / hybrid / indirect 来自 README 可消费性判断，会随着仓库结构变化而变化。",
      },
    ],
    sources: [
      {
        label: { en: "460-item candidate pool", zh: "460 项候选池" },
        href: `${repoBase}/awesome-agentic-landscape/method/awesome_agentic_candidates.csv`,
        note: {
          en: "README, collaboration, and attention signals",
          zh: "README、协作与关注信号",
        },
      },
      {
        label: { en: "Candidate scan script", zh: "候选扫描脚本" },
        href: `${repoBase}/awesome-agentic-landscape/method/scan_awesome_agentic_projects.py`,
        note: {
          en: "Search, README, and OpenDigger logic",
          zh: "搜索、README 与 OpenDigger 逻辑",
        },
      },
      {
        label: { en: "Scan and verification summary", zh: "扫描与验证摘要" },
        href: `${repoBase}/awesome-agentic-landscape/method/scan_summary.json`,
        note: { en: "460 → 26 and the data window", zh: "460 → 26 与数据窗口" },
      },
      {
        label: { en: "Final project table", zh: "最终项目表" },
        href: `${repoBase}/awesome-agentic-landscape/interactive/awesome_agentic_landscape_projects.csv`,
        note: {
          en: "26 items, tiers, and README judgments",
          zh: "26 项、分层与 README 判断",
        },
      },
    ],
    speakerTime: { en: "~2 min", zh: "约 2 分钟" },
    speakerScript: [
      {
        en: "This slide takes a different angle from the previous three. It doesn't look at frameworks or models, but at how open-source knowledge gets used. Traditional awesome lists mainly help humans discover links; now some repos are packaging their content into a form an agent can load directly.",
        zh: "这张图和前面三张的视角不一样。它不看框架或模型，而是看开源知识怎样被使用。传统 awesome list 主要帮人发现链接；现在有一批仓库开始把内容整理成 Agent 能直接加载的形式。",
      },
      {
        en: "Of the 26 projects picked from 460 candidates, 19 reach direct consumability. The basis is that the repo genuinely provides a skill, instruction, hook, workflow, or MCP config the agent can read or execute directly.",
        zh: "从 460 个候选里选出的 26 个项目中，19 个达到 direct consumability。判断依据是仓库里确实提供 skill、instruction、hook、workflow 或 MCP 配置，Agent 可以直接读取或执行。",
      },
      {
        en: "Along the usage path, all 7 Install-stage projects are direct; Operate is also 6 of 7. By the time you reach installation and daily operation, knowledge shows up more and more as configuration, tool entry points, and fixed procedures.",
        zh: "沿使用路径看，Install 阶段的 7 个项目全部是 direct；Operate 也有 6 / 7。到了安装和日常运行环节，知识已经更多地以配置、工具入口和固定流程出现。",
      },
      {
        en: "This cohort skews young: 22 of the 26 were created after 2025. That ratio describes only the editorial shortlist, not all of GitHub — but it signals that agent-native knowledge assets are still forming fast.",
        zh: "这批项目很年轻，26 个里有 22 个创建于 2025 年以后。这个比例只描述编辑短名单，不代表整个 GitHub；它提示我们，Agent-native 的知识资产仍在快速成形。",
      },
      {
        en: "READMEs still explain projects — but part of that content now also shapes what the agent does next directly. Beyond code, instructions and workflows have entered the range of reusable assets too.",
        zh: "README 依然负责解释项目，只是其中一部分内容现在还会直接影响 Agent 下一步怎么做。代码之外，instructions 和 workflow 也进入了可复用资产的范围。",
      },
    ],
    fullNoteHref: `${repoBase}/landscape-notes/awesome-agentic.md`,
  },
};

export function getLandscapeViews(lang: Locale): Record<LandscapeKey, LandscapeView> {
  const entries = Object.entries(landscapeViewsSource) as [
    LandscapeKey,
    LocalizedLandscapeView,
  ][];
  return Object.fromEntries(
    entries.map(([key, view]) => [
      key,
      {
        label: view.label,
        perspective: pick(lang, view.perspective),
        question: pick(lang, view.question),
        htmlSrc: view.htmlSrc,
        sourceHref: view.sourceHref,
        caption: pick(lang, view.caption),
        snapshot: view.snapshot,
        base: view.base,
        metrics: view.metrics.map((metric) => ({
          value: metric.value,
          label: pick(lang, metric.label),
          note: pick(lang, metric.note),
        })),
        insight: {
          signal: pick(lang, view.insight.signal),
          title: pick(lang, view.insight.title),
          body: pick(lang, view.insight.body),
          evidence: view.insight.evidence,
        },
        methodIntro: pick(lang, view.methodIntro),
        methodSteps: view.methodSteps.map((step) => ({
          number: step.number,
          title: pick(lang, step.title),
          body: pick(lang, step.body),
        })),
        caveats: view.caveats.map((caveat) => pick(lang, caveat)),
        sources: view.sources.map((source) => ({
          label: pick(lang, source.label),
          href: source.href,
          note: pick(lang, source.note),
        })),
        speakerTime: pick(lang, view.speakerTime),
        speakerScript: view.speakerScript.map((paragraph) => pick(lang, paragraph)),
        fullNoteHref: view.fullNoteHref,
      },
    ]),
  ) as Record<LandscapeKey, LandscapeView>;
}
