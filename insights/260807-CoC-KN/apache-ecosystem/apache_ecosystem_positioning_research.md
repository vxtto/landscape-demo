# Apache 在 Agentic AI 生态里的位置

数据截止要求：2026-07-28
研究校验时间：2026-07-29 02:33 CST

## 先给结论

Apache 很少出现在 Agent 产品和交互层。到了 Model Infra，密度马上变高。

当前全景图的 57 个 Model Infra 项目里，有 6 个 ASF 项目，占 10.5%。它们集中在三个位置：

- Data · Governance：Iceberg、Hudi、Paimon、Gravitino，占这一格 7 个项目中的 4 个。
- Data · Integration：Airflow，占这一格 3 个项目中的 1 个。
- Compute & scheduling：Spark，占这一格 4 个项目中的 1 个。

这和 Apache 整体生态的重心一致。ASF 项目目录里，除去 retired 记录后，最常见的技术标签是 library、big-data、network-server 和 database。GitHub 主语言则明显偏向 Java。Apache 长期积累最深的是数据系统、分布式计算、网络服务和通用工程组件。

放到 Agentic AI 里，可以这样概括：

> Agent 越像同事，底层越像一套分布式系统；这正是 Apache 最熟的地方。

Agent 开始修改数据、跨系统调用工具、并行执行任务以后，状态怎样传、数据是否一致、失败怎么补偿、计算怎样稳定扩展，都会重新变成前台问题。

## 1. ASF 官方规模

### 2026 年官网首页滚动数字

| 指标 | 官网当前值 | 演讲时怎么解释 |
|---|---:|---|
| Open Source Projects | 290+ | 基金会治理的项目规模，不等于 GitHub repo 数 |
| Software Releases | 1300+ | 年度发布量；不是 1999 年以来累计发布量 |
| Committers | 10000+ | 获得项目提交权限并承担社区责任的人 |
| Members | 1190+ | ASF 法人组织成员，可参与 Member 和董事选举 |

截图里的四个数字与 2026-07-29 直接读取的官网 HTML 一致。搜索引擎缓存仍可能显示 `9700+ Committers / 1140+ Members`，演讲材料应使用官网实时值和用户提供的截图。

### FY2025 冻结口径

ASF FY2025 截止 2025-04-30：

| 指标 | FY2025 |
|---|---:|
| Projects | 295 |
| Committers | 9,905 |
| Members | 1,147 |
| Committees | 208 |
| Software releases issued in FY25 | 1,310 |
| Incubating podlings | 32 |
| Graduated to TLP in FY25 | 5 |
| Added to the Attic in FY25 | 9 |

这组年报数字适合解释官网整数的来源，也能说明 Apache 的项目生命周期不是单向扩张：FY25 有 5 个项目毕业，同时有 9 个项目进入 Attic。

## 2. GitHub `apache` org 是另一套口径

GitHub API 在 2026-07-29 02:33 CST 观察到：

| 指标 | 数值 | 口径提醒 |
|---|---:|---|
| Public repositories | 3,148 | 包含代码、网站、文档、子项目、基础设施和历史仓库 |
| Non-fork repositories | 3,119 | 排除 fork |
| Archived repositories | 648 | GitHub archived 状态 |
| Non-fork, non-archived repositories | 2,474 | 仍不能直接等同于“活跃 Apache 项目” |
| 近 30 天有 push 的 active source repos | 947 | 38.3%；含自动化和网站更新 |
| 近 90 天有 push 的 active source repos | 1,986 | 80.3%；只代表仓库发生 push |
| 近 365 天有 push 的 active source repos | 2,337 | 94.5% |
| Non-fork repo stars 合计 | 1,390,334 | 注意力信号，不能相加后解释成社区健康 |
| Non-fork repo forks 合计 | 556,251 | 同一 ASF 项目可能对应多个 repo |

这批组织级指标比演讲数据截止晚约 2.5 小时，只作为研究校验。正式 PPT 的项目级数字继续使用 2026-07-28 已冻结快照。

为什么 290+ projects 对应 3,148 repos：

- 一个项目可能拆成主代码、语言 SDK、网站、文档和插件等多个仓库。
- Incubator、基础设施和 Foundation 自身也有仓库。
- GitHub 里保留了大量 archived 仓库。
- ASF 的 project / PMC 是治理单位，GitHub repo 是代码托管单位。

### GitHub 主语言分布

对 2,474 个 non-fork、non-archived repo，按 GitHub `language` 字段统计：

| 主语言 | repo 数 | 占比 |
|---|---:|---:|
| Java | 1,045 | 42.2% |
| Unknown | 304 | 12.3% |
| Python | 164 | 6.6% |
| HTML | 149 | 6.0% |
| Go | 142 | 5.7% |
| JavaScript | 124 | 5.0% |
| TypeScript | 77 | 3.1% |
| Rust | 56 | 2.3% |
| Shell | 52 | 2.1% |
| C++ | 47 | 1.9% |
| Scala | 39 | 1.6% |

`language` 是 GitHub 判定的主语言，不是代码量占比。Unknown 主要是文档、配置或未识别仓库。

## 3. Apache 项目生态分布

Apache Projects Directory 每天从 PMC RDF 和项目维护的 DOAP 文件生成结构化数据。2026-07-29 读取到 375 条 project records，其中 70 条带 retired 标签；排除 retired 后有 305 条记录，另有 46 条 `no-tlp-doap` 虚拟记录。

非 retired 记录中最常见的技术标签如下。标签可以多选，所以不能相加成项目总数。

| 技术标签 | project records |
|---|---:|
| library | 94 |
| big-data | 54 |
| network-server | 32 |
| database | 30 |
| xml | 24 |
| network-client | 21 |
| build-management | 18 |
| web-framework | 17 |
| content | 15 |
| cloud | 12 |
| http | 12 |
| data-engineering | 7 |
| javaee | 7 |
| IoT | 5 |
| search | 5 |

这组分布透露出两个特点：

1. Apache 的重心长期在“被很多系统共同依赖”的组件上。Library、网络服务、数据库和构建工具都属于这一类。
2. Big data 是最强的领域集群。Agentic AI 大量消耗数据、计算和实时上下文，因此会自然接上这批成熟项目。

## 4. 当前全景图里的 Apache

项目级 GitHub 信息和 stars 使用 2026-07-28 冻结快照；OpenRank 使用最近可用完整月份 2026-06。

| 项目 | Landscape 位置 | Stars | OpenRank 2026-06 | 对 Agentic AI 的作用 |
|---|---|---:|---:|---|
| Apache Airflow | Model Infra / Data · Integration | 46,289 | 144.80 | 数据准备和可追踪工作流编排 |
| Apache Spark | Model Infra / Compute & scheduling | 43,716 | 87.87 | 大规模数据处理和分布式计算 |
| Apache Iceberg | Model Infra / Data · Governance | 9,085 | 57.16 | 开放表格式、版本化数据和多引擎互操作 |
| Apache Hudi | Model Infra / Data · Governance | 6,197 | 38.83 | 增量数据处理、更新与删除 |
| Apache Paimon | Model Infra / Data · Governance | 3,353 | 18.40 | 流批一体的实时 lakehouse 表格式 |
| Apache Gravitino | Model Infra / Data · Governance | 3,136 | 40.68 | 跨系统元数据、数据和模型目录 |

这 6 个项目里，4 个都在 Data · Governance。这里可以形成一个有数据支撑的判断：

> Apache 在 Agentic AI 全景图里最强的位置，是开放的数据平面。

Agent 可以换框架，也可以换模型；一旦生产数据被某个封闭格式锁住，迁移成本会迅速上升。Iceberg、Hudi、Paimon 和 Gravitino 共同占据这一格，说明开放格式、增量数据和元数据治理已经是 AI 基础设施的一部分。

## 5. 图上没有画全的 Apache 邻接带

Landscape 为了保持可读性，不会把所有相关 Apache 项目都放进来。GitHub `apache` org 里还有一圈与 Agent 生产化直接相邻的项目：

| 技术位置 | 代表项目 | 连接点 |
|---|---|---|
| 实时数据与事件 | Kafka、Flink、Pulsar | Agent 需要持续感知业务事件，批处理快照不够 |
| 跨语言数据交换 | Arrow、Fory | 工具、runtime 和数据服务之间传递结构化状态 |
| AI/API gateway | APISIX | 模型和工具调用的入口、路由及流量治理 |
| 编译与部署 | TVM | 模型在不同硬件上的编译和运行 |
| 分析与检索数据服务 | Doris | 实时分析及面向 Agent 的 hybrid search |
| 可观测与系统治理 | SkyWalking 等 | 多步执行链的故障定位 |

这里要克制。它们与 Agentic AI 有连接点，不需要改名成 “Agent 项目”。

## 6. 蚂蚁深度参与的四个项目

2026-07-28 冻结快照：

| 项目 | 社区状态 | Stars | 原本解决的问题 | 放进 Agent 生产系统后的连接点 |
|---|---|---:|---|---|
| Apache Fory | TLP，2025-07-17 毕业 | 4,424 | 多语言序列化与数据交换 | runtime、工具和服务之间传递结构化状态 |
| Apache GeaFlow | Incubating | 788 | 流批一体的图计算 | 持续更新关系上下文，支持图检索和复杂状态分析 |
| Apache Seata | Incubating | 25,976 | 分布式事务一致性 | 跨系统动作的提交、补偿和失败恢复 |
| Apache Celeborn | TLP，2024-03-21 毕业 | 1,059 | shuffle 和 spilled data 服务 | AI/数据计算负载的性能、弹性和稳定性 |

四个项目刚好把 Agent 进入生产后的四类老问题串起来：

- Fory 处理状态怎样高效传递。
- GeaFlow 处理关系和上下文怎样持续更新。
- Seata 处理一次跨系统动作失败后怎样收场。
- Celeborn 处理大规模计算过程中间数据怎样稳定流动。

Star 差异很大，不能据此判断技术重要性。Seata 面向的开发者范围更广；Celeborn 和 GeaFlow 属于更专业的基础设施赛道。

## 7. Apache 在这张生态图里的位置

| 生态层 | Apache 当前存在感 | 判断 |
|---|---|---|
| Agent 产品、coding、个人助手 | 弱 | 当前全景图没有 ASF 项目；这一层变化快，项目多由公司和创业团队推动 |
| Agent framework、协议与交互 | 弱到中 | ASF 还没有形成与 LangChain、MCP、A2A 同量级的直接中心 |
| Workflow、gateway、模型编译 | 中 | Airflow、APISIX、TVM 等已有成熟连接点 |
| Data、compute、streaming | 强 | 当前 landscape 中的 Apache 项目高度集中在这里 |
| 一致性、数据交换、可靠性 | 强且常被低估 | Fory、Seata、Celeborn 等解决 Agent 做事以后暴露的系统问题 |
| 开放治理与长期维护 | 结构性优势 | 中立治理、公开决策、release 投票、签名和安全流程已经运行多年 |

Apache 在这个生态里并不控制最上层的 Agent 入口，也没有占据大模型权重层。它的优势在图的下半部：开放数据格式、分布式计算、运行可靠性，以及让项目跨公司存续的治理机制。

## 8. 和 keynote 题目的连接

暂定题目是《Agentic AI 新趋势下，开放生态的那些老规矩》。Apache 这一段可以落在两个“老规矩”上。

第一，软件会失败，所以状态、事务和恢复路径要提前设计。Agent 自主性越高，这条规矩越重要。

第二，开放需要一套能长期执行的社区流程。ASF 的 source release、PMC 投票、签名、公开决策和安全响应，看起来都很传统。到了 AI 时代，这些机制恰好对应可追溯、可审计和供应链责任。

建议演讲人这样开这一段：

> 刚才三张图里有一个细节很容易错过。Agent Infra 那张图里几乎看不到 Apache；到了 Model Infra，57 个项目里出现了 6 个，而且数据治理这一格 7 个项目有 4 个来自 Apache。
>
> 这很像 Apache 过去二十多年的位置。它很少决定用户今天和哪个 Agent 聊天。它更关心系统做完一次跨语言调用、改完一批数据、跑完一组分布式任务以后，还能不能把状态说清楚，把失败收回来。
>
> Agent 越像同事，底层越像一套分布式系统。这些听起来有点老的问题，现在又站到了 AI 系统的正中央。

## 9. 数据与来源

- ASF 首页：https://www.apache.org/
- ASF FY2025 Annual Report：https://www.apache.org/foundation/docs/FY2025AnnualReport.pdf
- Apache Projects Directory：https://projects.apache.org/
- Projects Directory 数据说明：https://projects.apache.org/about.html
- Project DOAP JSON：https://projects.apache.org/json/foundation/projects.json
- Apache GitHub org：https://github.com/apache
- Apache Fory incubation / graduation record：https://incubator.apache.org/projects/fory.html
- Apache GeaFlow Clutch status：https://incubator.apache.org/clutch/geaflow.html
- Apache Seata official site：https://seata.apache.org/
- Apache Celeborn incubation / graduation record：https://incubator.apache.org/projects/celeborn.html
- 当前 landscape reference：`data/agentic-ai-projects.csv`
- Model Infra 选中项目：`landscape-refresh/data/model_infra_landscape_projects.csv`

## 10. 口径限制

- ASF project、PMC、GitHub repo 是三种不同对象，不能混用。
- Projects Directory 的 category 是多标签；目录数据由各 PMC 维护，完整度并不完全一致。
- GitHub `pushed_at` 包含自动化、网站和依赖更新，不等于有多少人类开发者活跃。
- Stars 只描述关注度。判断社区健康还需要 release、PR review、活跃贡献者、组织集中度和公开社区报告。
- 2026-07-28 的 OpenRank 最新完整月份仍是 2026-06；不要把它标成 7 月数据。
