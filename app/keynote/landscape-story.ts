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

const repoBase =
  "https://github.com/xiaoya-yaya/landscape-demo/blob/main/insights/260807-CoC-KN";

const sharedInfraMethod: MethodStep[] = [
  {
    number: "01",
    title: "先建立旧图基线",
    body: "从上一版 reference source 读取 227 个唯一仓库，以稳定 repo ID 作为去重键。改名不会产生一个“新项目”，旧图已有项目也不会再次进入候选池。",
  },
  {
    number: "02",
    title: "三个入口把网撒开",
    body: "OpenDigger WatchEvent 取近期关注度前 2,500；2026 年 4—6 月 Repo OpenRank 合计取前 4,000；再执行 12 组 GitHub 定向搜索，每组最多 100 条。三个入口合并、按 repo ID 去重并排除基线，得到 6,118 个候选。",
  },
  {
    number: "03",
    title: "用项目文本做高召回过滤",
    body: "读取仓库名、description、topics 和 README 前 8,000 字符。Agent 词命中 ×4，Model Infra 与模型词命中 ×2；教程、课程和合集词命中 ×3 扣分。6,118 个候选缩到 878 个。",
  },
  {
    number: "04",
    title: "回到 GitHub 复核现在的项目",
    body: "分别取 WatchEvent 前 100、OpenRank 前 100、GitHub 搜索前 80，再取并集。GitHub API 刷新名称、stars、许可证、最近 push、fork 和 archive 状态；最新 README 再做一次技术定位，留下 222 个机器候选。OmniRoute 复盘暴露了绝对 Top-N 的盲区，因此人工复核又增加一条高增速通道。",
  },
  {
    number: "05",
    title: "最后由编辑判断决定版面",
    body: "人工检查它是否补上结构缺口、是不是通用能力、是否和现有 logo 重复。新项目或高增长项目单独看近三个月证据；加入主图和标成 NEW / RISING 是两件事。主表分别记录编辑动作与趋势信号。",
  },
];

export const landscapeViews: Record<LandscapeKey, LandscapeView> = {
  agent: {
    label: "Agent Infra",
    perspective: "沿着 Agent 完成一次任务所经过的路径看生态",
    question: "Agent 现在最缺的，是又一个框架，还是连接、上下文和可靠运行环境？",
    htmlSrc: "/embed/agent-infra",
    sourceHref: "/embed/agent-infra",
    caption: "直接复用站内 Agent Infra 原图组件；不经过 iframe，也不包含柱状图和站点导航。",
    snapshot: "GitHub 2026-07-28 · OpenRank 2026-06",
    base: [1440, 810],
    metrics: [
      {
        value: "74",
        label: "进入 Agent Infra",
        note: "59 个保留，15 个新增",
      },
      {
        value: "3 → 5",
        label: "协议与互操作项目",
        note: "A2A、MCP 之外补入 AG-UI 与 A2UI",
      },
      {
        value: "15 → 12",
        label: "Agentic coding",
        note: "收紧重复表达，把版面让给新结构",
      },
    ],
    insight: {
      signal: "最值得讲的变化",
      title: "上下文开始长成独立的数据层",
      body: "OpenViking 把 memory、RAG 和 skills 收进 context database。它在 2026 年 3—6 月的 OpenRank 从 35.96 升至 140.23；这比再多一个 agent framework 更值得关注：上下文正在从框架里的一个功能，变成可以单独演进的基础设施。",
      evidence: "OpenViking · OpenRank 35.96 → 140.23",
    },
    methodIntro:
      "Agent Infra 与 Model Infra 共用一套候选发现管线。6,118 是高召回候选池，里面包含大量最终会被排除的教程、应用与弱相关仓库，不能解读成 6,118 个 Agentic AI 基础设施项目。",
    methodSteps: sharedInfraMethod,
    caveats: [
      "WatchEvent 只用于发现候选，不是完整 star 增长；GitHub 的公开 stargazer 明细在 2026 年 7 月收紧。",
      "2026 年 5、6 月 OpenRank 仍可能回填，近期总量下降不能直接解释为项目活跃度下降。",
      "进入主图是生态结构判断，不是项目质量排名；同一厂商的相近仓库会主动去重。",
    ],
    sources: [
      {
        label: "扫描方法全文",
        href: `${repoBase}/landscape-refresh/landscape_scanning_methodology.md`,
        note: "6,118 → 878 → 222 的完整解释",
      },
      {
        label: "扫描结果摘要",
        href: `${repoBase}/landscape-refresh/data/scan_summary.json`,
        note: "候选数、窗口和限制",
      },
      {
        label: "Agent Infra 主表",
        href: `${repoBase}/landscape-refresh/data/agent_infra_landscape_projects.csv`,
        note: "74 个项目及逐项选择理由",
      },
      {
        label: "人工复核池",
        href: `${repoBase}/landscape-refresh/data/human_review_shortlist.csv`,
        note: "A/B 档证据与 caveat",
      },
    ],
    speakerTime: "约 2 分钟",
    speakerScript: [
      "先看现在的结构。74 个项目里，Agentic coding 有 12 个，Code-first frameworks 有 10 个，最大的两个 section 都围绕 coding。代码仍是 Agent 生态最密集的入口。",
      "第二个视角看上下文。OpenViking 把 memory、RAG 和 skills 放进 context database，3 月到 6 月 OpenRank 从 35.96 升到 140.23。上下文开始从框架内部功能变成独立数据层。",
      "第三个视角看公共接口：MCP、A2A 之外，AG-UI 与 A2UI 把事件流和界面带进协议层。第四个视角看改进方式：SkillOpt 把 skill 文档当作可训练状态，用 rollout、评估和验证门更新。",
      "图上的 NEW 和 RISING 只表达最近 90 天的新生或加速信号，不再等同于这版刚加入主图。下一张继续沿执行链路看 Model Infra。",
    ],
    fullNoteHref: `${repoBase}/landscape-notes/agent-infra.md`,
  },
  model: {
    label: "Model Infra",
    perspective: "沿着一个 token 被训练、路由、生成和复用的路径看生态",
    question: "当 Agent 把一次请求拉成长链路，模型基础设施的瓶颈会落在哪里？",
    htmlSrc: "/embed/model-infra",
    sourceHref: "/embed/model-infra",
    caption: "直接复用站内 Model Infra 原图组件；不经过 iframe，也不包含柱状图和站点导航。",
    snapshot: "GitHub 2026-07-28 · OpenRank 2026-06",
    base: [1440, 810],
    metrics: [
      {
        value: "58",
        label: "进入 Model Infra",
        note: "47 个保留，11 个新增",
      },
      {
        value: "6 → 8",
        label: "Serving · Inference",
        note: "KV cache、硬件插件与多模态 serving 增厚",
      },
      {
        value: "6",
        label: "Model API gateways",
        note: "OmniRoute 补入近期高增长信号",
      },
    ],
    insight: {
      signal: "最值得讲的变化",
      title: "Gateway 又热了，但职责已经分叉",
      body: "OmniRoute 截至 7 月 28 日有 32,706 stars，2—6 月 OpenRank 从 4.07 升至 39.04。它和 LiteLLM、AgentGateway 的重叠很明显，但也说明 gateway 正同时承担模型路由、配额 fallback 与 agent 协议流量；分类必须按职责，而不是按名字。",
      evidence: "OmniRoute · OpenRank 4.07 → 39.04",
    },
    methodIntro:
      "候选池与 Agent Infra 共用，但最后一轮会确认项目是否真正影响模型训练、数据、计算、推理或访问；只调用模型 API 的应用不会因此进入 Model Infra。",
    methodSteps: [
      ...sharedInfraMethod.slice(0, 4),
      {
        number: "05",
        title: "按模型生命周期重新归类",
        body: "逐项检查训练、数据、计算、serving、gateway 与 post-training 的职责。Model API gateway 从 Agent Infra 移入 Model Infra；通用推理与硬件插件分开表达；应用层项目不会因为使用 GPU 或模型 API 就进入本图。",
      },
    ],
    caveats: [
      "OpenRank 衡量协作活跃度，不能替代性能 benchmark、部署份额或实际 token 使用。",
      "同一技术栈的主仓库、插件与硬件适配仓库会产生 logo 重复，版面中只保留能说明结构变化的代表。",
      "Large Models 不能沿用这套 GitHub 仓库排名方法，因此单独使用模型发布、权重、许可证和真实使用数据。",
    ],
    sources: [
      {
        label: "扫描脚本",
        href: `${repoBase}/landscape-refresh/analysis/scan_landscape_candidates.py`,
        note: "OpenDigger、GitHub 与 README 过滤逻辑",
      },
      {
        label: "Model Infra 主表",
        href: `${repoBase}/landscape-refresh/data/model_infra_landscape_projects.csv`,
        note: "57 个项目、指标与编辑理由",
      },
      {
        label: "版面决策摘要",
        href: `${repoBase}/landscape-refresh/data/infra_landscape_source_summary.json`,
        note: "旧版与新版 section counts",
      },
      {
        label: "数据质量检查",
        href: `${repoBase}/landscape-refresh/data/data_quality_checks.csv`,
        note: "OpenRank 与 WatchEvent 覆盖情况",
      },
    ],
    speakerTime: "约 2 分钟",
    speakerScript: [
      "Model Infra 现在有 58 个项目。Serving · Inference 与 Compiler & accelerator 仍是两个最大的执行区，但这张图只讲一个近期信号：gateway 又热了。",
      "OmniRoute 截至 7 月 28 日有 32,706 stars，2 月到 6 月 OpenRank 从 4.07 升到 39.04。它其实进过 222 个机器候选，但被绝对 Top-N 门槛漏出了人工短名单。这次补回主图，也补了一条高增速复核通道。",
      "它与 LiteLLM、New API、AgentGateway 都有交叉。这里不把热度等同于独特性；我们用它说明 gateway 的职责正在从模型 API 代理扩展到配额 fallback、MCP 和 A2A 流量。",
      "OpenRank 只能描述协作活跃度，不能证明哪个推理系统性能最好。接下来换一套口径，用完整月份的真实使用数据看模型端。",
    ],
    fullNoteHref: `${repoBase}/landscape-notes/model-infra.md`,
  },
  large: {
    label: "Large Models",
    perspective: "从真实使用与权重可得性两个维度看模型生态",
    question: "一个模型在排行榜上很强，和它能否被社区研究、修改、再发布，是同一件事吗？",
    htmlSrc: "/keynote/large-models/index.html",
    caption: "同一个完整自然月内比较 50 个模型 endpoint；开放权重与闭源模型使用同一套使用分数。",
    snapshot: "OpenRouter + ZenMux · 2026-06-01—06-30",
    base: [3840, 2160],
    metrics: [
      {
        value: "24 / 26",
        label: "开放权重 / 无公开权重",
        note: "Top 50 几乎对半",
      },
      {
        value: "5 / 5",
        label: "Top 10 中的两类模型",
        note: "真实使用没有形成单边格局",
      },
      {
        value: "37 / 50",
        label: "两平台同时可见",
        note: "74% 的 Top 50 有跨平台证据",
      },
    ],
    insight: {
      signal: "最值得讲的变化",
      title: "开放权重模型已经进入主流使用区",
      body: "2026 年 6 月的 Top 10 中，开放权重与无公开权重模型各 5 个，综合第一是 DeepSeek V4 Flash。这个结果能说明开放权重已经进入主流使用，不能说明开放模型已经赢了。",
      evidence: "Top 10 · open 5 / closed 5",
    },
    methodIntro:
      "Large Models 没有沿用 GitHub 仓库热度。主表把“一个托管模型 endpoint / release”作为一行，合并同一 endpoint 的免费与付费别名，在上一完整自然月内比较真实 token 使用。",
    methodSteps: [
      {
        number: "01",
        title: "锁定上一完整自然月",
        body: "脚本在 2026 年 7 月运行，因此窗口自动回退到 2026-06-01—06-30。当前月不会进入主比较，避免拿不完整月份和完整月份混在一起。",
      },
      {
        number: "02",
        title: "OpenRouter 汇总 30 天日榜",
        body: "认证数据集每天公开 Top 50 与一个 other 汇总项。30 天共返回 1,530 条记录，月内 78 个具名模型至少进入过一次日榜；具名模型覆盖 93.5989% 的可见 token。",
      },
      {
        number: "03",
        title: "ZenMux 查询同窗月榜",
        body: "management leaderboard 使用 tokens 指标、相同起止日期与 limit=50，返回 50 个具名模型和一个 __others__；具名模型覆盖 99.5243% 的 token。",
      },
      {
        number: "04",
        title: "先做平台内分位，再合成",
        body: "两家原始 token 数不直接相加。每个平台独立计算月度 token 百分位，各占综合分 50%；相同 endpoint 的 free / paid alias 合并。",
      },
      {
        number: "05",
        title: "用 Hugging Face 核验权重与许可证",
        body: "解析官方权重仓库、license、gated 状态、30 天下载、likes、架构和参数量。HF adoption 只用于描述开放权重生态，不进入开放与闭源共同比较分。",
      },
    ],
    caveats: [
      "OpenRouter 每天只暴露 Top 50；一个模型整月都低于日榜门槛时，会落进 other，无法得到具名 token。",
      "ZenMux 月榜只单列 Top 50；榜外不代表零使用。",
      "“无公开权重”表示没有解析到官方公开 HF 权重仓库，不是对内部代码或法律状态的证明。",
    ],
    sources: [
      {
        label: "月度 source summary",
        href: `${repoBase}/large-models-refresh/data/monthly_source_summary.json`,
        note: "窗口、覆盖率与 Top 50 结构",
      },
      {
        label: "Top 50 主表",
        href: `${repoBase}/large-models-refresh/data/monthly_models_top50_open_closed.csv`,
        note: "两平台月度 token 与开放状态",
      },
      {
        label: "月度构建脚本",
        href: `${repoBase}/large-models-refresh/analysis/build_monthly_open_closed_model_table.py`,
        note: "API 参数、匹配与计分逻辑",
      },
      {
        label: "数据质量检查",
        href: `${repoBase}/large-models-refresh/data/monthly_data_quality_checks.csv`,
        note: "跨平台覆盖与许可证核验",
      },
    ],
    speakerTime: "约 2 分钟",
    speakerScript: [
      "这张图先讲数据口径。我们取的是 2026 年 6 月 1 日到 30 日，一个完整自然月。OpenRouter 和 ZenMux 的原始 token 数不能直接相加，所以先在各自平台内部换成百分位，再各占 50%。",
      "Top 10 里开放权重与无公开权重各有 5 个。这个月、这两个平台上，两类模型都进入了主流使用区。数据覆盖有限，所以结论只落在这份样本上。",
      "把 Top 50 按模型类型拆开，差异就出来了：13 个 Reasoning 模型中有 12 个开放权重；30 个 Multimodal / VLM 中有 22 个没有公开权重。开放程度和模型类型明显相关。",
      "公开 AAI 能匹配到 8 个样本。使用排名第 1 的模型 AAI 为 40.3；AAI 最高的模型使用排名第 25。真实使用还受价格、延迟、渠道与产品适配影响，能力榜只是其中一个变量。",
      "同样叫开放权重，发布材料仍有很大差别。有的只有权重，有的还有训练代码、数据说明和评测；这一层差异留到许可证部分继续讲。",
    ],
    fullNoteHref: `${repoBase}/landscape-notes/large-models.md`,
  },
  awesome: {
    label: "Awesome",
    perspective: "从人和 Agent 如何消费开源知识的方式看生态",
    question: "README 还是一张给人看的链接表，还是已经变成 Agent 可以直接执行的接口？",
    htmlSrc: "/keynote/awesome/awesome_agentic_landscape_2026.html",
    caption: "把 Awesome 类仓库按 Discover、Reuse、Install、Operate 排列，观察知识怎样进入 Agent 工作流。",
    snapshot: "GitHub 2026-07-29 · OpenRank 2026-04—06",
    base: [3840, 2160],
    metrics: [
      {
        value: "460 → 26",
        label: "候选到编辑短名单",
        note: "候选发现与主图选入分开",
      },
      {
        value: "19 / 26",
        label: "可被 Agent 直接消费",
        note: "skills、instructions、hooks 或 workflows",
      },
      {
        value: "5 · 7 · 7 · 7",
        label: "四个使用阶段",
        note: "Discover · Reuse · Install · Operate",
      },
    ],
    insight: {
      signal: "最值得讲的变化",
      title: "README 开始带有执行语义",
      body: "短名单 26 个仓库里，有 19 个被标记为 direct consumability。它们提供 skills、instructions、hooks、MCP 配置或可重复 workflow，Agent 可以直接把仓库内容带进任务。",
      evidence: "19 direct · 5 hybrid · 2 indirect",
    },
    methodIntro:
      "Awesome 图有自己的 460 项候选池。它把通用 landscape 扫描结果里符合 collection 形态的仓库、10 组 GitHub 定向搜索和 13 个手工种子合并，再看 README 是否包含可供 Agent 消费的结构。",
    methodSteps: [
      {
        number: "01",
        title: "合并三个种子入口",
        body: "从通用 6,118 扫描的 candidate pool 中找 awesome、skills、prompts 类仓库；执行 10 组 GitHub 搜索；加入 13 个已知种子。按 repo ID 去重后得到 460 个候选。",
      },
      {
        number: "02",
        title: "读取当前仓库与 README",
        body: "GitHub API 刷新 stars、forks、许可证、最近 push；对高信号仓库读取 README，统计标题、Markdown 链接、GitHub 链接、agent 文件提及、贡献说明与 taxonomy 信号。",
      },
      {
        number: "03",
        title: "叠加协作与关注信号",
        body: "使用 2026 年 5 月以来可见 WatchEvent、issue / PR / review 的独立参与者，以及 2026 年 4—6 月 Repo OpenRank。指标只做排序证据，不替代 README 语义判断。",
      },
      {
        number: "04",
        title: "判断 Agent consumability",
        body: "README 明确提供 skill、instruction、prompt、hook、workflow、playbook 或 MCP 配置时标记为 direct；兼有传统目录与可执行材料时为 hybrid；只供人浏览的列表为 indirect。",
      },
      {
        number: "05",
        title: "编辑成可讲的 26 项视图",
        body: "机器候选先产生 24 项 provisional shortlist，人工加入两个历史 benchmark，最终得到 16 core、8 watch、2 benchmark，并按 Discover、Reuse、Install、Operate 排列。",
      },
    ],
    caveats: [
      "460 个候选是 candidate-first 扫描，不是完整 census；最终 26 项是用于解释趋势的编辑种子集。",
      "WatchEvent 不是精确 star 增长，近期 OpenRank 对覆盖与回填敏感。",
      "Direct / hybrid / indirect 来自 README 可消费性判断，会随着仓库结构变化而变化。",
    ],
    sources: [
      {
        label: "460 项候选池",
        href: `${repoBase}/awesome-agentic-landscape/method/awesome_agentic_candidates.csv`,
        note: "README、协作与关注信号",
      },
      {
        label: "候选扫描脚本",
        href: `${repoBase}/awesome-agentic-landscape/method/scan_awesome_agentic_projects.py`,
        note: "搜索、README 与 OpenDigger 逻辑",
      },
      {
        label: "扫描与验证摘要",
        href: `${repoBase}/awesome-agentic-landscape/method/scan_summary.json`,
        note: "460 → 26 与数据窗口",
      },
      {
        label: "最终项目表",
        href: `${repoBase}/awesome-agentic-landscape/interactive/awesome_agentic_landscape_projects.csv`,
        note: "26 项、分层与 README 判断",
      },
    ],
    speakerTime: "约 2 分钟",
    speakerScript: [
      "这张图和前面三张的视角不一样。它不看框架或模型，而是看开源知识怎样被使用。传统 awesome list 主要帮人发现链接；现在有一批仓库开始把内容整理成 Agent 能直接加载的形式。",
      "从 460 个候选里选出的 26 个项目中，19 个达到 direct consumability。判断依据是仓库里确实提供 skill、instruction、hook、workflow 或 MCP 配置，Agent 可以直接读取或执行。",
      "沿使用路径看，Install 阶段的 7 个项目全部是 direct；Operate 也有 6 / 7。到了安装和日常运行环节，知识已经更多地以配置、工具入口和固定流程出现。",
      "这批项目很年轻，26 个里有 22 个创建于 2025 年以后。这个比例只描述编辑短名单，不代表整个 GitHub；它提示我们，Agent-native 的知识资产仍在快速成形。",
      "README 依然负责解释项目，只是其中一部分内容现在还会直接影响 Agent 下一步怎么做。代码之外，instructions 和 workflow 也进入了可复用资产的范围。",
    ],
    fullNoteHref: `${repoBase}/landscape-notes/awesome-agentic.md`,
  },
};
