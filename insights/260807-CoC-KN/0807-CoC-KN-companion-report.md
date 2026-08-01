# Agentic AI 新趋势下，开放生态的那些老规矩

CommunityOverCode China 2026 Keynote 辅助报告
演讲时间：2026 年 8 月 7 日
演讲时长：30 分钟
核心数据截止：2026 年 7 月 28 日


## 核心判断

Agentic AI 正在同时改变三件事：

1. 软件从“人调用工具”转向“agent 组合工具、环境和其他 agent 完成任务”；
2. 开源资产从“给人阅读的代码与 README”转向“可被 agent 发现、复用、安装和执行的知识单元”；
3. 模型成为新的可分发对象后，传统软件许可证不再足以独自描述开放性。

但真正决定开放生态能否持续的机制并没有过时：贡献入口是否透明，决策过程是否可审查，身份与权限是否随可见贡献逐步积累。今天需要更新的不是这些原则，而是把它们的适用对象从 code 延伸到 model、data、tool、prompt、skill、evaluation、environment 与 governance。

## 数据口径：先把“最新”拆开

本次分享使用多种数据源，它们的更新节奏并不一致：

| 数据 | 本次使用口径 | 说明 |
|---|---:|---|
| GitHub stars、仓库元数据 | 2026-07-28 快照 | 可用于横截面规模与近期增长比较 |
| GitHub apache org 宏观观察 | 2026-07-29 | 比演讲主要截止日晚一天，单独标注，不与 7 月 28 日快照混算 |
| OpenRank 当月值 | 2026-06 | 7 月尚未结束，6 月是最后一个可比较的完整月份 |
| OpenRank 趋势窗口 | 2025-07—2026-06 | 连续 12 个完整月，避免拿不完整的 2026-07 与历史完整月比较 |
| Apache 官网宏观数字 | 2026-07-29 页面展示 | 290+ projects、1,300+ annual releases、10,000+ committers、1,190+ members |
| ASF 年报冻结口径 | FY2025 | 适合年度复核，不应被表述成 2026 年 7 月实时值 |
| InclusionAI 组织快照 | 2026-07-28 | 58 个公开仓库、10,753 stars；许可证为 GitHub API 识别结果 |

OpenRank 是用于发现项目活跃度和社区协作趋势的信号，不是项目质量排行榜；stars 是关注度累积值，也不等于近期活跃度。最终是否进入 landscape，还要结合项目角色、可采用性、代表性、可替代性与版面容量。

---

## 一、生态图更新：变化发生在三层的连接处

本次将生态拆成 Agent Infra、Model Infra 和 Large Models 三张图，并在[动态页面](https://landscape-demo-omega.vercel.app/)中统一展示。

### Agent Infra

![Agent Infra Landscape](./landscape-refresh/agent_infra_landscape_2026.png)

Agent Infra 回答的是“agent 怎样行动”：框架、运行时、工具使用、协议、记忆、可观测、评测、环境与 agentic coding 都在这一层发生。2026 年中值得关注的不是又出现了多少框架，而是框架之间开始依赖共同的协议、运行时和基础服务。

### Model Infra

![Model Infra Landscape](./landscape-refresh/model_infra_landscape_2026.png)

Model Infra 回答的是“agent 的能力和行动依赖什么系统”：数据、训练、推理、Serving、调度、治理与集成。Agent 越接近生产系统，这一层越重要，因为自主调用会放大延迟、状态、一致性、成本、数据质量和可追溯问题。

### Large Models

![Large Models Landscape](./large-models-refresh/model_landscape_trends_one_slide.png)

Large Models 决定能力边界，但模型之间的比较不应只停留在参数、榜单或是否提供权重。开放模型时代还要同时询问：权重以什么条件分发，训练和推理代码是否存在，数据来源和处理信息是否充分，文档是否足以支持修改。

### 6,118 个项目是怎样定位出来的

这不是把一个 GitHub 搜索结果直接画成图，而是一个“高召回发现—语义降噪—人工判断—编辑取舍”的过程：

| 阶段 | 项目数 | 主要动作 |
|---|---:|---|
| 原始候选池 | 6,118 | GitHub topics、awesome 清单、已有种子、项目关系网络扩张 |
| 语义候选 | 878 | 名称、描述、topics、README 语义初筛 |
| 人工复核 | 222 | 是否承担明确 agentic / model infrastructure 角色 |
| 最终入图 | 132 | 106 保留、26 新增、17 下架 |

“发现层”重视召回率，因此会允许噪音进入；“人工复核层”才回答项目是否真的形成生态角色。OpenRank 与 stars 增长帮助发现高信号候选，但不会自动决定入图。

本轮三个结构变化尤其值得在台上解释：

| 分类 | 旧版 | 新版 | 解释 |
|---|---:|---:|---|
| Agentic Coding | 15 | 12 | 降低泛化工具噪音，保留角色更清晰的代表项目 |
| Protocols & Interoperability | 3 | 5 | 多 agent、多工具协作正在从私有胶水走向协议化 |
| Serving · Inference | 6 | 8 | 推理效率、缓存、调度和资源利用成为 agent 规模化硬约束 |

这说明生态的重心正在从“又一个 agent 框架”向“互操作 + 运行时 + 生产基础设施”移动。

### 一个容易漏掉的新趋势：README 开始被 agent 执行

对 460 个 awesome、skills 与 agentic workflow 相关仓库的扫描中，24 个项目进入图谱，另保留 2 个历史参照：

- 19/24 可以被 agent 直接发现、复用、安装或执行，约 79%；
- 22/24 创建于 2025 年以后，约 92%。

这里的“直接消费”包含四种模式：

- Discover：agent 能找到结构化知识；
- Reuse：agent 能复用 prompt、skill、workflow 或规则；
- Install：资产能被安装到具体运行环境；
- Operate：agent 可以按声明的过程执行任务。

README 因此不再只是人类说明书。它正在承载顺序、约束、上下文和操作经验，成为一种轻量的 agent 接口。

---

## 二、Apache 在 Agentic AI 生态中的位置

### 宏观规模：不要混淆项目、仓库和治理身份

Apache 官网当前展示：

- 290+ Open Source Projects；
- 1,300+ Software Releases per year；
- 10,000+ Committers；
- 1,190+ Members。

FY2025 冻结口径为 295 个项目、9,905 位 committers、1,147 位 members、1,310 次 releases。官网当前数字与年报数字可以相互校验，但不能拼成同一个时间点。

GitHub `apache` 组织在 2026 年 7 月 29 日观察到：

- 3,148 个公开仓库；
- 648 个已归档仓库；
- 2,474 个非 fork、非 archive 仓库；
- 947 个仓库在近 30 天有 push；
- 1,986 个仓库在近 90 天有 push；
- 2,337 个仓库在近 365 天有 push；
- 非 fork、非 archive 仓库中，Java 为主要语言的有 1,045 个，占 42.2%。

这些 GitHub 数字说明 ASF 的工程表面积与持续维护范围，但“3,148 个仓库”不能说成“3,148 个 Apache 项目”。一个项目可能包含代码、网站、文档、发布、工具与历史仓库。

### 为什么 Apache 看起来不在 Agent 产品层，却在系统主干上

在当前 Model Infra landscape 的 57 个入图项目中，Apache 项目有 6 个，占 10.5%。但分到具体领域后，集中度非常明显。

![Apache projects in Model Infra](./rendered/slide-8.png)

| Model Infra 分区 | Apache 项目 | Apache / 分区项目 |
|---|---|---:|
| Data · Governance | Iceberg、Hudi、Paimon、Gravitino | 4/7，57.1% |
| Data · Integration | Airflow | 1/3，33.3% |
| Compute & Scheduling | Spark | 1/4，25.0% |
| Model Infra 全体 | 上述 6 个 | 6/57，10.5% |

这个结果不是“Apache 影响力排名”，而是结构位置：Apache 更容易在标准、格式、计算、调度、工作流和治理等生命周期长、跨组织协作成本高的层形成密度。

截至 2026 年 7 月 28 日的项目快照：

| 项目 | Stars | 2026-06 OpenRank | 生态角色 |
|---|---:|---:|---|
| Apache Airflow | 46,289 | 144.80 | 工作流编排与数据集成 |
| Apache Spark | 43,716 | 87.87 | 计算与调度 |
| Apache Iceberg | 9,085 | 57.16 | 开放表格式与数据治理 |
| Apache Hudi | 6,197 | 38.83 | 数据湖事务与增量处理 |
| Apache Gravitino | 3,136 | 40.68 | 元数据与数据治理 |
| Apache Paimon | 3,353 | 18.40 | 流批统一湖存储 |

可直接用于演讲的判断是：

> Agent 越像同事，底层越像一套分布式系统；这正是 Apache 最熟的地方。

Agent 自主调用工具和服务后，失败不再只是一条报错：它可能带来跨系统状态不一致、重复执行、数据污染、成本放大与责任难以追踪。数据格式、工作流、事务、调度和可追溯治理会重新成为核心竞争力。

### 蚂蚁深度参与的 Apache 项目

| 项目 | 2026-07-28 Stars | Apache 状态 | 与 Agentic AI 的连接 |
|---|---:|---|---|
| Apache Fory | 4,424 | 2025-07-17 成为 TLP | 高性能跨语言序列化；状态、消息与工具结果传输 |
| Apache GeaFlow | 788 | Incubating | 图流融合；实时关系、知识与行为计算 |
| Apache Seata | 25,976 | Incubating | 分布式事务；跨服务副作用、一致性与补偿 |
| Apache Celeborn | 1,059 | 2024-03-21 成为 TLP | 大数据 shuffle；计算与数据移动解耦 |

介绍这四个项目时，不要把它们包装成“Agent 项目”。更准确的说法是：它们解决的是 agent 从 demo 进入生产系统后必然遇到的系统问题。

---

## 三、InclusionAI：把开放做成一套可以参与的技术栈

![InclusionAI participatory stack](./rendered/slide-11.png)

InclusionAI 的价值不只是一组公开仓库，而是让不同能力和资源的参与者可以从不同层进入：

| 层 | 代表项目 | 可以贡献什么 |
|---|---|---|
| Models | Ling、LLaDA、Ming | 模型架构、模态能力、推理与应用适配 |
| Training | AReaL、AReno、TwinFlow | 训练系统、rollout、强化学习方法与效率 |
| Agent Runtime | AWorld、AEnvironment、Avernet | 环境、工具连接、运行时、网络与评测 |

这条路径把“开放模型”从下载权重扩展为多个可验证的贡献入口。一个没有大规模训练资源的开发者，仍然可以改环境、工具、评测或运行时；系统与模型研究者也可以在不同层形成协作。

截至 2026 年 7 月 28 日的 InclusionAI GitHub 组织冻结快照：

- 58 个公开仓库；
- 10,753 GitHub stars；
- GitHub API 识别到 26 个 Apache-2.0、19 个 MIT；
- 45/58 使用 Apache-2.0 或 MIT；
- 13 个仓库的许可证未识别或未声明，需要逐仓人工核验。

这里应避免两个过度结论：

1. GitHub 未识别不等于没有许可证，可能是自定义模型许可证、非标准文件名、镜像或非核心仓库；
2. AReaL 的主要仓库位于 `areal-project/AReaL`，因此“技术栈”不应被误解为全部项目都位于 `inclusionAI` GitHub org。

更稳妥的说法是：InclusionAI 正尝试把模型、训练和 agent 运行时连接成一条开放参与路径。

---

## 四、开放模型时代：许可证只解决了一半问题

### 两层问题

软件开源经常用一个 `license` 字段作为开放性的代理变量；模型至少需要两层证据：

| 层 | 回答的问题 | 典型证据 |
|---|---|---|
| 法律许可层 | 你可以做什么？ | 使用、修改、分发、专利授权、署名、责任和用途限制 |
| 材料开放层 | 你实际拿到了什么？ | 权重、训练/推理代码、数据信息、训练方法、文档、评测与修改路径 |

“允许使用”不自动等于“能够理解、复现、修改和参与”。

### 五套方案不能放在一条严格程度轴上

| 方案 | 类型 | 主要对象 | 解决什么 | 不解决什么 |
|---|---|---|---|---|
| Apache License 2.0 | 软件许可证 | 软件 | 宽松版权许可、明确专利授权、NOTICE 与责任边界 | 不定义模型材料是否完整 |
| OpenMDW 1.1 | 模型材料许可证 | Model Materials | 面向模型材料的宽松使用与权利清晰 | 不强制发布者提供完整材料 |
| ModelGo | 可组合许可证家族 | 模型 | 用 8 个变体组合 BY、NC、ND、RAI、SA 与零条件 | 不等同于开放度分级 |
| Model Openness Framework | 开放完整度框架 | 模型及其材料 | 按代码、数据、文档等判断开放完整度 | 不是法律许可证 |
| OSAID 1.0 | 开放 AI 定义 | AI 系统 | 四项自由与 preferred form for modification | 不是单一许可证文本 |

OpenMDW 1.1 的 FAQ 明确：

- Model Materials 包含模型架构、参数，以及发布者实际提供并置于许可证下的相关材料；
- 权利范围覆盖版权、专利、数据库权利和商业秘密；
- 不限制使用领域与用途；
- 输出不受许可证限制；
- 不要求发布者提供的材料必须达到某种完整度；
- 截至 2026 年 5 月尚未进入 SPDX，可使用 `LicenseRef-OpenMDW-1.1`。

ModelGo 提供 8 个变体：MG0、MG-BY、MG-BY-SA、MG-BY-RAI、MG-BY-NC、MG-BY-ND、MG-BY-NC-RAI、MG-BY-NC-ND。2026 年 2 月，MG0 和 MG-BY 提交 OSI 评审，MG-BY-SA 因潜在兼容问题撤回。

MOF 与 OSAID 的作用，是补足许可证无法单独表达的“材料与自由”问题。实践中更合理的判断顺序是：

1. 先确认开放对象：软件、权重、模型材料还是完整 AI 系统；
2. 再确认法律权利和限制；
3. 单独核验材料完整度；
4. 最后确认贡献和治理入口。

### Top 50 模型快照

![License distribution among open-weight models](./rendered/slide-16.png)

本仓库 2026 年 7 月 28 日 Top 50 大模型选择集中：

- 26/50 没有公开权重；
- 24/50 提供公开权重；
- 24 个公开权重模型中，MIT 9 个、Apache-2.0 8 个、其他许可证 7 个；
- MIT 与 Apache-2.0 合计 17/24，占 70.8%。

这不是全球模型市场份额，而是本次 landscape 选择集。它说明宽松软件许可证在公开权重模型中仍占主流，同时也暴露出一个问题：如果只看 `license` 字段，很容易高估模型的开放完整度。

---

## 五、Community >>> Code：答案的一部分

![Community operating system](./rendered/slide-18.png)

“社区比代码重要”不应被讲成价值口号。更准确的表达是：

> 代码是协作的结果；社区是持续生产、审查和维护这些结果的系统。

### 1. 可发现的贡献入口

软件时代的入口包括 issue、文档、测试和代码。模型与 agent 时代还要增加：

- 模型卡与数据卡；
- 权重、数据和训练材料说明；
- prompt、skill、tool 与 environment；
- 评测集、评测方法和失败案例；
- 安全边界、限制条件和事件处置。

“材料公开”只有在贡献者知道如何进入、如何验证、如何完成时，才会转化为参与。

### 2. 可审查的公开过程

Apache Way 的关键价值之一，是把跨组织协作中的设计、异议、review、投票和发布留在公开过程里。模型时代同样需要追问：

- 模型能力与限制如何被记录；
- 数据来源和处理如何被审查；
- 评测方法是否可复核；
- 安全事件由谁、以什么过程处理；
- 发布与撤回如何形成可追溯记录。

共识不是“没有人反对”，而是异议被看见、讨论和处理。

### 3. 随贡献积累的信任

Apache 的成熟经验是：身份和权限来自持续贡献，而不是雇主或头衔。Agentic AI 时代需要扩展“贡献”的定义，把数据、评测、文档、环境、模型材料与治理工作纳入信用积累，但不应放弃以公开贡献建立信任的原则。

这就是标题中“老规矩”的含义：

- 规则没有过时；
- 开放对象发生了变化；
- 社区需要把同一套问题求解能力扩展到新对象。

## 结语

Agentic AI 改变了谁在写代码，也改变了什么需要被开放。Apache 展示了跨组织基础设施如何长期治理；InclusionAI 展示了模型、训练和 agent 运行时如何形成多层参与路径；OpenMDW、ModelGo、MOF 与 OSAID 则提醒我们，开放模型不能只由一份 LICENSE 文件定义。

开放生态真正需要保留的老规矩，是透明入口、可审查过程和渐进式信任。真正需要更新的，是把它们从 code 延伸到 model、data、tool、evaluation 与 governance。

Community >>> Code，不是因为代码不重要，而是因为社区决定代码、模型和 agent 能走多远。

## 主要来源

- [CommunityOverCode Asia Tracks](https://asia.communityovercode.org/tracks/)
- [Apache Software Foundation](https://www.apache.org/)
- [Apache GitHub Organization](https://github.com/apache)
- [How the ASF Works](https://www.apache.org/foundation/how-it-works.html)
- [The Apache Way](https://www.apache.org/theapacheway/)
- [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0)
- [InclusionAI GitHub Organization](https://github.com/inclusionAI)
- [OpenMDW FAQ](https://openmdw.ai/faq/)
- [ModelGo](https://www.modelgo.li/)
- [Model Openness Framework Paper](https://arxiv.org/abs/2403.13784)
- [Open Source AI Definition 1.0](https://opensource.org/ai/open-source-ai-definition)
- [OpenRank Documentation](https://open-digger.cn/en/docs/user_docs/metrics/openrank)
- 本仓库 `data/agentic-ai-projects.csv`
- 本仓库 `data/large_models_landscape_top50.csv`
- 本目录 `apache-ecosystem/apache_ecosystem_positioning_research.md`
- 本目录 `keynote_brief.md`
