# Agent Infra 全景图说明

数据快照：GitHub 2026-07-28；图中 OpenRank 使用 2026-06。

## 这张图回答什么

Agent Infra 沿着一次任务的执行路径组织项目：用户从哪里进入，Agent 如何编排，怎样连接工具与其他 Agent，上下文放在哪里，代码或浏览器任务在什么环境中执行，最后又怎样评估与观察。

这张图没有试图收集所有带有 “agent” 标签的仓库。它保留能表达通用技术结构的代表项目，同一家公司或同一产品谱系中高度重叠的仓库会主动去重。

最终图中有 69 个项目：

- 58 个从上一版保留；
- 11 个新增；
- 12 个 section；
- 图中展示的 OpenRank 为 2026-06 Repo OpenRank。

原始项目表：[agent_infra_landscape_projects.csv](../landscape-refresh/data/agent_infra_landscape_projects.csv)

## 6,118 个候选到底从哪里来

6,118 是 Agent Infra 与 Model Infra 共用的高召回候选池。它不是 “6,118 个 Agentic AI 项目”。

扫描开始前，上一版 reference source 中有 227 个唯一仓库。我们先用稳定的 GitHub repo ID 建立基线，避免仓库改名后被当成一个新项目。

随后合并三个入口：

1. **近期关注度**
   - 数据表：OpenDigger `opensource.events`
   - 事件：GitHub WatchEvent
   - 窗口：2026-05-01 至 2026-07-28
   - 取前 2,500 个仓库
   - 用途：发现近期受到关注的新项目

2. **近期协作活动**
   - 数据表：OpenDigger `opensource.global_openrank`
   - 对象：GitHub Repo
   - 窗口：2026-04、05、06 三个已结束月份
   - 三个月 OpenRank 相加后取前 4,000
   - 用途：避免候选池完全被累计 stars 支配

3. **GitHub 定向搜索**
   - 共 12 组 query
   - 覆盖 `agentic`、`coding agent`、`agent framework`、`agent memory`、`computer use`、`MCP`、`LLM inference`、`model serving`、`post-training` 等方向
   - 要求 2026-05-01 之后仍有 push
   - 按类别设置 100、300 或 500 stars 的最低门槛
   - 每组最多取 100 个结果

三个入口取并集，按 repo ID 去重，排除旧图中已有的 227 个仓库，得到 6,118 个原始候选。

可复核材料：

- [扫描脚本](../landscape-refresh/analysis/scan_landscape_candidates.py)
- [扫描摘要](../landscape-refresh/data/scan_summary.json)
- [候选池](../landscape-refresh/data/candidate_pool.csv)
- [数据质量检查](../landscape-refresh/data/data_quality_checks.csv)

## 6,118 怎样变成 878

自动相关性过滤读取四类文本：

- repository name；
- description；
- topics；
- README 前 8,000 个字符。

使用的启发式分数是：

```text
Agent 关键词数量 × 4
+ Model Infra 关键词数量 × 2
+ Model 关键词数量 × 2
- 教程和合集关键词数量 × 3
```

`awesome-*`、课程、prompt 合集和教程会被降权。它们能反映传播与学习需求，但通常不代表一个适合长期放进基础设施全景图的技术项目。

这一层把 6,118 个候选缩小到 878 个。

## 878 怎样变成 222

从 878 个项目中分别取：

- 可见 WatchEvent 前 100；
- OpenRank 前 100；
- GitHub 定向搜索前 80。

三组取并集后，用 GitHub API 刷新当前名称、stars、许可证、最近 push、fork、archive 和 disabled 状态。随后读取高信号项目的最新 README，再判断它到底是通用框架、基础设施、垂直应用，还是教程集合。

失效仓库、fork、归档项目、旧图已有项目以及 README 语义不匹配的项目被移除，最后留下 222 个机器候选。

## 222 之后为什么还需要人工编辑

机器分数只决定项目是否值得看一眼。进入主图还要回答：

- 是否补上结构缺口；
- 是否能服务多类 Agent，而不是单一垂直应用；
- 是否与现有项目重复表达；
- 是否补上被忽略的语言、硬件或开发者生态；
- 当前证据是否足以支持“现在就进入主图”。

扫描阶段最终形成 12 个 A 档建议补入项目和 12 个 B 档观察项目。A/B 不是质量排名，只表达这次全景图的编辑决定。相关材料见：

- [人工复核短名单](../landscape-refresh/data/human_review_shortlist.csv)
- [项目刷新报告](../landscape-refresh/landscape_project_refresh_report.md)
- [编辑决定](../landscape-refresh/landscape_editorial_decisions.md)

## 这次 Agent Infra 最值得讲的变化

### 协议区从 3 个项目增加到 5 个

MCP 与 A2A 仍然是主干，但 AG-UI 和 A2UI 把 Agent 到用户界面的事件与生成式 UI 补进来。协议层现在覆盖工具连接、Agent 协作和人机交互。

## 数据限制

- WatchEvent 是 OpenDigger 当前可见的发现信号，不是完整 GitHub star 增量。
- GitHub 在 2026 年 7 月收紧公开 stargazer 明细接口，因此没有把精确 star 增长作为必要字段。
- 2026 年 5、6 月 OpenRank 仍可能继续回填，不能把全体仓库的近期总量变化解释成生态升降。
- OpenRank 只描述协作活跃度，stars 只描述关注度；两者都不能自动回答项目是否具有结构代表性。

## 给演讲者的讲法

先让观众看整张图几秒，不要急着念项目。可以先说：

> 这张图把 Agent 生态分成应用、框架和运行基础设施三层。我们这次保留了 58 个项目，新加了 11 个。数量不是重点，重点是版面往哪里长。

然后把视线带到 `Protocols & interoperability`：

> 上一版这里有 3 个项目，这次是 5 个。MCP 主要处理 Agent 怎么接工具，A2A 处理 Agent 之间怎么协作；AG-UI 和 A2UI 开始处理 Agent 如何把过程和界面交给用户。它们解决的不是同一个问题，但共同点很清楚：生态正在补接口约定。

把开放生态的含义说具体：

> 接口公开以后，工具、运行时和产品可以由不同社区实现，不必绑定在同一套框架里。这些协议还很年轻，所以不要讲成“标准已经定了”。更准确的说法是：大家已经意识到，Agent 之间需要一层公共语言。

最后直接接 Model Infra：

> Agent 这一侧开始补连接协议，模型这一侧则在补长链路运行需要的系统能力。

如果现场还有 40 秒，可以补充扫描方法：

> 我们先从 WatchEvent、OpenRank 和 GitHub 定向搜索里合并出 6,118 个高召回候选。机器读取名称、description、topics 和 README，缩到 878，再刷新 GitHub 状态，留下 222 个值得人工看一眼的项目。最后进不进图，不由综合分决定，而是看它有没有帮助我们看清新的生态结构。
