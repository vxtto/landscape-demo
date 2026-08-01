# CommunityOverCode China 2026 Agentic AI Keynote Brief

> 工作稿。演讲与 PPT 均为中文，演讲时长 30 分钟。标题暂定，最终版本可在内容和数据图表完成后再敲定。

## 我建议整场只讲一件事

Agentic AI 的项目数量还在快速增长，但生态已经开始离开“谁又做了一个新 agent”的阶段。Agent 真正进入生产系统后，大家重新碰到一些开源世界很熟悉的问题：跨语言协作、数据与状态、事务一致性、分布式计算、可审查的变更，以及如何让一个项目不依赖单一公司继续成长。

这正是 Apache 生态与 Agentic AI 发生关系的地方。

最后再把问题推远一步：传统软件里，Apache License 2.0 已经把源代码的使用、修改、分发和专利授权说得很清楚；到了模型时代，开放的对象变成了权重、架构、训练代码、数据说明、评测和文档。许可证只回答“你被允许做什么”，还需要 Model Openness Framework 这类框架回答“究竟开放了什么”。

InclusionAI 可以作为这条主线中的现实案例：一个覆盖模型、训练、推理和 agent 基础设施的开放技术栈，如何通过实际项目把“开放智能”做出来。

## 标题方向

暂定标题：

**Agentic AI 新趋势下，开放生态的那些老规矩**

备选：

- **Agentic AI 生态正在长出自己的开放基础设施**
- **当 Agent 开始真正做事，开放生态要回答什么**
- **Open Source After the Agent Boom**

当前标题先作为内容取舍和视觉设计的工作基线；最终可根据结尾观点再做小幅调整。

## 30 分钟叙事结构

### 1. 开场：三张生态图和它们的更新方法（4 分钟）

这一段使用两页 PPT。详细口播见 `keynote_script.md`。

第一页并排展示 Agent Infra、Model Infra 和 Large Models。三张图都在 Vercel 动态页面中提供交互版本，PPT 中保留静态预览作为结构说明和断网备份。

这一页只建立三个视角，不逐个介绍 logo：

- Agent Infra：Agent 怎样开发、协作并在真实环境中运行。
- Model Infra：训练、推理和数据系统怎样承接生产约束。
- Large Models：模型能力、使用情况和开放边界怎样分布。

第二页解释更新方法：

- 高召回候选池：6,118。
- 自动相关性过滤：878。
- GitHub 元数据和 README 复核：222。
- 编辑结果：在 122 个项目的旧版基线上，当前主图为 132 个：106 个保留、26 个补入；17 个旧项目拿下。

这一页必须讲清楚：6,118 是候选池，不是 Agentic AI 项目总数。数据负责降低漏项风险，最后的编辑判断负责控制结构、重复度和版面密度。

可以带出的三项版面变化：

- Agentic coding：15 → 12。
- Protocols & interoperability：3 → 5。
- Serving · Inference：6 → 8。

### 2. 截至 2026-07-28，我们看到哪些变化（4 分钟）

方法论已经在上一段讲完，这里不再重复漏斗。保留三个有证据的发现，不做排行榜瀑布：

1. **Agent Infra 继续膨胀，但注意力正在向 coding、runtime、sandbox、memory 和 agent coordination 收拢。**
2. **Model Infra 的关注点更靠近生产约束。** 训练和推理仍重要，但成本、路由、可靠性、环境和评估变得更具体。
3. **项目热度和社区成熟度开始分叉。** star 可以在短期内激增，持续参与、PR review、release 和贡献者分布更能说明项目有没有长成社区。

这里应使用严格匹配的时间窗口：

- GitHub 事件：2025-01-01 至 2025-07-28，对比 2026-01-01 至 2026-07-28。
- GitHub 仓库元数据：2026-07-28 快照。
- OpenRank：只使用已完成且质量检查通过的月度数据；若最新可靠月份为 2026-06，则图上明确写 `through 2026-06`，不写成 `through 2026-07-28`。

### 3. Apache 在这张图里处于什么位置（7 分钟）

不要把 Fory、GeaFlow、Seata、Celeborn 包装成 Agent 项目。把它们放在“Agent 进入生产后必须依赖的开放基础设施”这一层：

| 项目 | 原本解决的问题 | 在 agentic 系统中的连接点 | 建议证据 |
|---|---|---|---|
| Apache Fory | 高性能、多语言序列化和数据交换 | agent runtime、工具和服务跨语言传递结构化状态 | 语言覆盖、release、贡献者与 PR 活动 |
| Apache GeaFlow (Incubating) | 流批一体的图计算 | 持续更新的关系上下文、图检索和复杂状态分析 | release、社区参与、issue/PR 主题变化 |
| Apache Seata (Incubating) | 分布式事务一致性 | agent 执行跨系统动作时的提交、补偿和失败恢复 | issue/PR、使用生态、社区独立性 |
| Apache Celeborn | 分布式计算引擎的中间数据服务 | AI/数据计算负载中的 shuffle、性能和稳定性 | release、committers/PMC、计算引擎集成 |

这一段的核心不是“这些项目都支持 AI”，而是：

> Agent 越能做事，系统越需要把状态、边界和失败处理清楚。Apache 项目积累多年的工程问题，正在以新的方式回到 AI 系统里。

Apache 项目分析建议使用三类指标：

- **技术活动**：commit、PR、review、issue、release，按月或季度展示。
- **社区结构**：活跃贡献者、新增贡献者、贡献集中度、组织多样性。
- **成熟度事件**：进入孵化、毕业、版本发布、新 committer/PMC，以及公开社区报告中提到的健康信号。

不要用 star 数替代社区健康。

### 4. InclusionAI：把开放做成一套可以参与的技术栈（5 分钟）

建议按问题而不是按项目清单讲：

- 模型能力如何开放：Ling、LLaDA、Ming 等模型与相关材料。
- Agent 如何训练和进化：AReaL 及相关 RL/agent training 基础设施。
- Agent 如何运行和协作：AWorld、AEnvironment、Avernet、sandbox/runtime 类项目。
- 开放如何形成真实参与：仓库活跃度、外部贡献者、许可证分布、release 和社区机制。

2026-07-28 20:13 CST 的 GitHub 初步快照：

- inclusionAI 组织下有 58 个公开仓库，合计 10,753 stars。
- 22 个仓库在 2026-07-01 之后有 push 活动。
- GitHub API 识别到的许可证分布为 Apache-2.0 26 个、MIT 19 个、未识别/未声明 13 个。

这些数字只能作为待复核快照。最终图表还要排除镜像、归档仓库和非核心仓库，并把“未识别许可证”逐仓库检查，不能直接解释成“没有许可证”。

### 5. 开放模型时代，许可证只解决了一半问题（7 分钟）

建议用两条轴解释，观众会更容易理解：

1. **Rights：我可以做什么？**
2. **Artifacts：为了学习、修改和复现，我实际拿到了什么？**

| 工具或框架 | 它是什么 | 主要回答的问题 | keynote 中的定位 |
|---|---|---|---|
| Apache License 2.0 | 宽松的软件许可证 | 代码和文档如何使用、修改、分发，如何处理版权、NOTICE 和专利授权 | 开放软件协作的成熟基线 |
| OpenMDW 1.1 | 面向模型材料的宽松许可证 | 架构、参数以及一并发布的代码、数据、文档在多类知识产权下如何被使用和分发 | 把宽松授权扩展到模型分发 |
| ModelGo Licenses | 面向模型发布的一组可组合许可证 | 是否要求署名、相同方式共享、非商业、禁止衍生或负责任使用限制 | 展示模型发布者对“开放与控制”的不同选择 |
| Model Openness Framework | 三层开放度与完整性分类框架，不是许可证 | 权重、架构、代码、数据和文档究竟开放到了什么程度 | 补上“开放材料完整性”的判断 |
| OSI Open Source AI Definition 1.0 | Open Source AI 的定义 | 一个 AI 系统是否提供使用、研究、修改和分享的必要自由 | 给“open source AI”提供判断边界 |

需要说清楚的三个区别：

- **Open-weight 不自动等于 open source。**
- **有宽松许可证，不等于模型材料足够完整。**
- **带非商业、禁止衍生或用途限制的条款可以是合理的发布选择，但不能不加区分地称为 open source。**

收束句可以是：

> Apache 2.0 没有过时。它把开放软件最重要的权利和责任讲得很清楚。模型时代需要做的，是把同样的清晰度带到更大的材料边界里。

### 6. 结尾：Community Over Code 仍然是答案的一部分（3 分钟）

回到全景图。logo 会继续换，Agent 也会继续变强，但一个开放生态能不能持续，仍然取决于几件很朴素的事：变更是否可见，决策是否能被参与，贡献能不能跨公司继续，使用者是否真的拥有学习和修改的自由。

不要用口号收尾。最后一页保留三项可访问资源即可：

- `antgroup/agentic-ai-landscape`
- InclusionAI GitHub / 官网
- Apache、OpenMDW、ModelGo、MOF、OSAID 的参考链接

## 数据刷新与制图清单

| 图或表 | 数据源 | 截止口径 | 风险控制 |
|---|---|---|---|
| 三层生态项目快照 | 仓库 CSV + GitHub API | 2026-07-28 快照 | 检查 repo rename、archive、duplicate、missing license |
| 2025/2026 活动对比 | OpenDigger `opensource.events` | 两个匹配的 1/1–7/28 窗口 | 时区、事件回填、平台覆盖一致 |
| OpenRank 趋势 | `global_openrank` / `community_openrank` | 最新可靠完整月份 | 不把不完整 2026 月份解释成下降 |
| Apache 四项目对比 | GitHub/OpenDigger + ASF 项目页与 board/incubator report | 2026-07-28 快照与季度趋势 | star 与社区健康分开；孵化/毕业状态以 ASF 为准 |
| InclusionAI 开放栈 | GitHub/Hugging Face/ModelScope + 项目文档 | 2026-07-28 快照 | 排除镜像、归档和非核心仓库；许可证逐项复核 |
| 开放模型许可证分布 | Hugging Face API/数据集 + 官方许可证文本 | 2026-07-28 快照 | `license` tag 不等于法律审查；多许可证单独处理 |
| 许可证/开放度二维图 | Apache/OpenMDW/ModelGo/MOF/OSI 官方材料 | 版本号和访问日期同时标注 | 区分许可证、定义、分类框架；不提供法律意见 |

## 已确认的可复用资产

- 三张现有全景图：`insights/260527-agentic_landscape/`
- 2026 年 5 月中英文趋势报告：`insights/260527-agentic_landscape/260527_agentic_ai_cn.md`
- Q1 趋势材料：`insights/260401_agentic_landscape/`
- FINOS 分享里的三层架构和 InclusionAI 视觉资产：`presentations/260721-FINOS-sharing/html-helper/`
- 当前项目表：`data/agentic-ai-projects.csv`，已更新为 251 个项目。GitHub 仓库信息和 star 截至 2026-07-28；最近可用 OpenRank 为 `openrank_2606`，12 个月趋势字段为 `openrank_trend_2508_2607`，参与者字段为 `participants_2607`。OpenRank 的 2026-07 月尚未产出，因此趋势最后一个点保留为 `null`；5–6 月仍可能继续回填，分享中应明确标注。

## 当前已确认、仍需最终冻结的事实

- CommunityOverCode Asia 2026 在北京举行，时间为 2026-08-07 至 2026-08-09；keynote 是主会场内容，定位为开放源码社区的愿景与洞察。
- 大会另设 Agentic coding、AI Infra、Data + AI、Community 等 track。Agentic coding 的官方介绍已经把可审查性、代码质量和 ASF 社区原则列为核心问题，和本 keynote 的主线高度一致。
- Apache Fory 已于 2025-07-17 毕业为 TLP；Apache Celeborn 已于 2024-03-21 毕业。
- Apache GeaFlow 和 Apache Seata 当前官方页面仍标注为 Incubating。
- 2026-07-28 20:13 CST 的 GitHub 快照：Fory 4,424 stars，GeaFlow 788，Seata 25,976，Celeborn 1,059；四个仓库均由 GitHub API 识别为 Apache-2.0。star 只用于描述关注度，不用于判断社区健康。

## 仍需最终确认

- 30 分钟是否包含 Q&A。
- 对蚂蚁参与 Apache 项目的表述边界：哪些可以写“发起/捐赠/深度参与”，哪些只讲公开可验证的社区贡献数据。

## 首轮官方资料

- [CommunityOverCode Asia 2026](https://asia.communityovercode.org/)
- [Keynote track](https://asia.communityovercode.org/tracks/keynote.html)
- [Agentic coding track](https://asia.communityovercode.org/tracks/agenticcoding.html)
- [Apache Fory](https://fory.apache.org/) / [incubation and graduation record](https://incubator.apache.org/projects/fory.html)
- [Apache GeaFlow incubation status](https://incubator.apache.org/clutch/geaflow.html)
- [Apache Seata](https://seata.apache.org/)
- [Apache Celeborn incubation and graduation record](https://incubator.apache.org/projects/celeborn.html)
- [ASF licenses](https://apache.org/licenses/)
- [OpenMDW 1.1 FAQ](https://openmdw.ai/faq/)
- [ModelGo Licenses](https://www.modelgo.li/)
- [Model Openness Framework paper](https://arxiv.org/abs/2403.13784)
- [OSI Open Source AI Definition 1.0](https://opensource.org/ai/open-source-ai-definition)
- [InclusionAI on GitHub](https://github.com/inclusionAI)
