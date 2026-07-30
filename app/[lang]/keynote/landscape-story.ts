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
    body: "分别取 WatchEvent 前 100、OpenRank 前 100、GitHub 搜索前 80，再取并集。GitHub API 刷新名称、stars、许可证、最近 push、fork 和 archive 状态；最新 README 再做一次技术定位，留下 222 个机器候选。",
  },
  {
    number: "05",
    title: "最后由编辑判断决定版面",
    body: "人工检查它是否补上结构缺口、是不是通用能力、是否和现有 logo 重复，以及数据能否支撑“现在就放进去”。扫描阶段得到 12 个 A 档与 12 个 B 档；最终主表记录 keep、add、remove、omit。",
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
        value: "69",
        label: "进入 Agent Infra",
        note: "58 个保留，11 个新增",
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
      title: "协议开始成为一层基础设施",
      body: "MCP 处理 agent 与工具的连接，A2A 处理 agent 之间的协作；AG-UI 和 A2UI 又把事件流与界面生成补进来。协议区只增加了两个项目，但它说明大家开始把接口约定当成独立的公共层。",
      evidence: "Protocols & interoperability · 3 → 5",
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
        note: "69 个项目及逐项选择理由",
      },
      {
        label: "人工复核池",
        href: `${repoBase}/landscape-refresh/data/human_review_shortlist.csv`,
        note: "A/B 档证据与 caveat",
      },
    ],
    speakerTime: "约 2 分钟",
    speakerScript: [
      "先让观众看整张图几秒，不要急着念项目。可以先说：这张图把 Agent 生态分成应用、框架和运行基础设施三层。我们这次保留了 58 个项目，新加了 11 个。数量不是重点，重点是版面往哪里长。",
      "我会把视线带到 Protocols & interoperability。上一版这里有 3 个项目，这次是 5 个。MCP 主要处理 Agent 怎么接工具，A2A 处理 Agent 之间怎么协作；AG-UI 和 A2UI 开始处理 Agent 如何把过程和界面交给用户。它们解决的不是同一个问题，但共同点很清楚：生态正在补接口约定。",
      "这件事对开放生态很重要。接口公开以后，工具、运行时和产品可以由不同社区实现，不必绑定在同一套框架里。我们今天看到的协议还很年轻，也可能继续合并或调整，所以这里不要讲成“标准已经定了”。更准确的说法是：大家已经意识到，Agent 之间需要一层公共语言。",
      "讲完这一点就停。不要把 memory、sandbox 等每一块都解释一遍。下一张 Model Infra 可以这样接：Agent 这一侧开始补连接协议，模型这一侧则在补长链路运行需要的系统能力。",
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
        value: "57",
        label: "进入 Model Infra",
        note: "47 个保留，10 个新增",
      },
      {
        value: "6 → 8",
        label: "Serving · Inference",
        note: "KV cache、硬件插件与多模态 serving 增厚",
      },
      {
        value: "5",
        label: "Model API gateways",
        note: "从 Agent 产品层调整到模型访问层",
      },
    ],
    insight: {
      signal: "最值得讲的变化",
      title: "Inference 已经装不进一个方块",
      body: "vLLM、SGLang 仍是核心引擎，LMCache 把 KV cache 变成可复用层，vLLM-Omni 扩展到多模态，vLLM-Ascend 则体现硬件适配。推理区从 6 个项目增到 8 个，内部职责也明显分开了。",
      evidence: "Serving · Inference · 6 → 8",
    },
    methodIntro:
      "候选池与 Agent Infra 共用，但最后一轮的编辑问题不同：这个项目是否真正影响模型训练、数据、计算、推理或访问，而不是仅仅调用了一个模型 API。",
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
        href: `${repoBase}/landscape-refresh/data/landscape_editorial_summary.json`,
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
      "这张图也不要从左到右逐格讲。先告诉观众，它覆盖模型访问、训练、数据和计算。57 个项目里有 10 个是这次新加的。我们真正想指出的变化集中在 Serving · Inference。",
      "上一版 inference 有 6 个项目，这次是 8 个。vLLM、SGLang 还是大家熟悉的推理引擎，但现在已经不能只看引擎本身。LMCache 在处理 KV cache 的跨请求和跨引擎复用；vLLM-Omni 把图像、音频和视频带进 serving；vLLM-Ascend 代表硬件适配也开始形成自己的协作面。",
      "所以这里可以说得很具体：Agent 把一次调用拉成连续几十步以后，缓存能不能复用、请求怎样排队、不同硬件怎样接入，会直接影响成本和延迟。OpenRank 只能告诉我们这些项目的协作活跃度，不能拿来证明哪个推理系统性能最好，这个边界最好当场说清楚。",
      "收尾时不要再展开 gateway 或 post-training。直接把问题交给下一张图：基础设施在变复杂，但模型使用端到底更偏向开放权重还是闭源 API？我们用同一个完整月份的数据来看。",
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
      "看结果，Top 50 里有 24 个开放权重模型，26 个没有公开权重，几乎对半。更有意思的是 Top 10：两边刚好各 5 个，综合第一还是 DeepSeek V4 Flash。至少在这一个月、这两个平台上，开放权重模型已经处在主流使用区，不是边缘选项。",
      "这里一定不要顺手讲成“开放模型赢了”。这份数据只覆盖两个模型聚合平台，而且榜外模型会进入 other。它能说明使用格局已经混在一起，不能代表整个市场，更不能替代企业内部调用数据。",
      "最后留一个问题给后面的许可证部分：同样叫开放权重，发布者提供的材料差异很大。有的只有权重，有的还有训练代码、数据说明和评测。使用量看不出这些差别，许可证也只能回答其中一部分。",
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
      "我们从 460 个候选里选了 26 个做这张图，其中 19 个被标记为 direct consumability。判断依据不是名字里有没有 awesome，也不是 star 高不高，而是 README 里是否真的提供 skill、instruction、hook、workflow 或 MCP 配置。比如有的仓库可以直接安装到 coding agent，有的把代码评审或规格驱动开发整理成可重复步骤。",
      "所以最值得讲的一句话就是：README 开始带有执行语义。过去文档主要告诉人怎么做，现在文档里的一部分结构会被 Agent 读取，并直接影响它下一步怎么做。README 没有消失，只是多了一类读者。",
      "这里也别讲成所有 awesome list 都会变成插件市场。我们的 26 个项目是编辑短名单，不是整个 GitHub 的普查。更稳妥的结论是：开源项目的贡献界面正在扩大，代码之外，instructions 和 workflow 也开始成为可复用资产。",
    ],
    fullNoteHref: `${repoBase}/landscape-notes/awesome-agentic.md`,
  },
};
