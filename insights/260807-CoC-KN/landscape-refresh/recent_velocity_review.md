# 最近 90 天补漏复核

复核日：2026-07-31  
演讲数据冻结日：2026-07-28

## 这轮修正了什么

首轮扫描的候选池够宽，但进入人工复核前又取了一次绝对 Top-N。这个动作会偏向已经积累较久的项目，历史很短的新仓库容易被压下去。

补漏通道把两类项目单独拿出来：最近 90 天新建；最近三个月 OpenRank 或可见 WatchEvent 明显加速。数据只负责把项目送到桌面上，最终仍按结构位置、通用性、重复度和官方材料判断。

本轮重新读取 222 条旧候选，并执行 12 组近期创建搜索。五个已补入项目从候选中排除后，GitHub 搜索产生 306 条跨 query 命中；合并去重为 448 条，应用新生或加速条件后得到 346 条高召回记录。人工复核后，先补 5 个有 7 月 28 日完整快照的项目。

## 已补入主图

| 项目 | 位置 | 为什么补 | 主要限制 |
| --- | --- | --- | --- |
| [github/spec-kit](https://github.com/github/spec-kit) | Agent Infra · Coding harnesses | 把 specification、plan、tasks 交付成跨 coding agent 的可执行流程 | OpenRank 已从发布期峰值回落，不标成近期增长 |
| [openai/symphony](https://github.com/openai/symphony) | Agent Infra · Coding harnesses | 在 coding agent 之上编排隔离的自主实现 run，并要求 proof-of-work | 官方仍称 engineering preview，当前协作信号不高 |
| [larksuite/cli](https://github.com/larksuite/cli) | Agent Infra · Tool & browser use | 200+ 命令和 26 个 Agent Skills，把业务软件能力交付成机器可执行入口 | 只代表 Lark/飞书生态；不能外推整个 SaaS 市场 |
| [microsoft/SkillOpt](https://github.com/microsoft/SkillOpt) | Agent Infra · Observability & evaluation | 把 skill 文档当作可训练状态，引入 rollout、评估和验证门 | 项目创建不足三个月；暂放现有 section，分类还需观察 |
| [firecrawl/firecrawl](https://github.com/firecrawl/firecrawl) | Agent Infra · Tool & browser use | 补上 search、scrape、crawl、interact 这一类 Web context 基础设施 | 近期 OpenRank 下行；社区版为 AGPL-3.0 |

其中 SkillOpt 标为 `NEW`，Lark CLI 标为 `RISING`。Spec Kit、Symphony 和 Firecrawl 是漏项修正，不因为本版加入就显示趋势标签。

## 很值得关注，但先不混入 7 月 28 日快照

下面这些项目是在 7 月 31 日补扫时发现的。GitHub 当前 stars 已经晚于冻结日，因此先保留为 provisional，不用 7 月 31 日数字改写主图的 7 月 28 日口径。

| 项目 | 建议位置 | 看到的结构变化 | 暂缓原因 |
| --- | --- | --- | --- |
| [xai-org/grok-build](https://github.com/xai-org/grok-build) | Agentic coding | 完整开源 coding runtime、TUI、ACP、skills、hooks 与 sandbox | 7 月 14 日才创建；冻结日 stars 需要独立归档值，且仓库不接受外部贡献 |
| [omnigent-ai/omnigent](https://github.com/omnigent-ai/omnigent) | Coding harnesses | 在 Claude Code、Codex、Cursor 等 harness 之上提供共同编排、策略与 sandbox | alpha；当前 stars 来自 7 月 31 日观察 |
| [deeplethe/forkd](https://github.com/deeplethe/forkd) | Development sandboxes | microVM 从冷启动走向 snapshot、fork 与 branch | 依赖较新的 Linux/KVM 条件；当前 stars 来自 7 月 31 日观察 |
| [oomol-lab/open-connector](https://github.com/oomol-lab/open-connector) | Tool & browser use | 把 OAuth、credentials、scope、policy 和日志放到 Agent 之外的 gateway | 项目很新；自部署与托管能力边界要继续核对 |
| [kvcache-ai/AgentENV](https://github.com/kvcache-ai/AgentENV) | Development sandboxes | 分布式运行 Agent 环境，并直接服务 agentic RL | 7 月 23 日创建，冻结日前观察窗口太短 |

## 保留观察

- [vercel/eve](https://github.com/vercel/eve)：filesystem-first agent framework 很清楚，但仍是 beta，Code-first frameworks 已经拥挤。
- [langchain-ai/openwiki](https://github.com/langchain-ai/openwiki)：Agent 可维护的 code/personal wiki 值得看，与现有 context 项目的边界还要再收紧。
- [antirez/ds4](https://github.com/antirez/ds4)：本地推理支持 Metal、CUDA 和 ROCm，但目前仍偏单一模型家族。
- [vercel-labs/zerolang](https://github.com/vercel-labs/zerolang)：Agent 编程语言是新方向，当前还不足以单独改变分类体系。
- [odysseus-dev/odysseus](https://github.com/odysseus-dev/odysseus) 与 [nexu-io/open-design](https://github.com/nexu-io/open-design)：近期关注很高，但更像工作空间或垂直应用，不直接占 infra 主图。

## 数据边界

- OpenRank 使用 2026-04、05、06 三个已结束月份；7 月不写成完整月。
- WatchEvent 是 OpenDigger 当前可见的发现信号，不等于精确 star 增量。
- GitHub Trending 没有官方历史接口。本轮只把持续上榜观察作为人工 seed；后续应每日归档，才能统计持续时间。
- 7 月 31 日发现的新项目不会用当前 stars 偷换 7 月 28 日快照。

可复核材料：

- [补漏脚本](analysis/audit_recent_velocity_candidates.py)
- [高召回候选表](data/recent_velocity_candidates.csv)
- [审计摘要](data/recent_velocity_audit_summary.json)
- [主项目表](../../../data/agentic-ai-projects.csv)
