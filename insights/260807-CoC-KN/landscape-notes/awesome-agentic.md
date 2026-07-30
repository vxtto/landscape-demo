# Awesome Agentic 全景图说明

GitHub 快照：2026-07-29。

指标窗口：

- 可见 WatchEvent：2026-05-01 至 07-28；
- issue / PR / review 参与者：同上；
- Repo OpenRank：2026-04、05、06。

## 这张图为什么存在

传统 Awesome list 主要帮助人发现链接。Agentic 时代，一部分仓库已经把知识包装成 skills、instructions、hooks、MCP 配置和 repeatable workflows。

这张图不按技术栈分类，而按消费方式排列：

- **Discover**：帮助找到项目和资源；
- **Reuse**：可以复制、引用或带入任务；
- **Install**：提供明确的安装与注册入口；
- **Operate**：直接改变 Agent 的工作方式。

四个阶段表达使用方式，不是成熟度评分。

## 460 个候选从哪里来

候选发现合并三个入口。

### 通用 landscape 候选池

从 Agent / Model Infra 的 [candidate_pool.csv](../landscape-refresh/data/candidate_pool.csv) 中筛出：

- 仓库名包含 `awesome`；
- 仓库名为 `skills`、`prompts`；
- 仓库名以 `-skills` 或 `_skills` 结尾；
- 同时在名称、description 或 topics 中命中 Agent 或可消费材料信号。

### GitHub 定向搜索

执行 10 组搜索，包括：

- `awesome agent`；
- `awesome coding-agent`；
- `awesome claude-code`；
- `awesome codex`；
- `agent skills`；
- `awesome mcp`；
- `awesome prompts agent`；
- `awesome ai-agents`；
- `awesome best practices ai`；
- `system prompts + coding agent`。

搜索要求 2026-04-01 之后仍有 push，并设置 50 或 100 stars 的最低门槛。

### 手工种子

加入 13 个已知种子，用来避免搜索词漏掉已经改名或命名不典型的仓库，包括 GitHub、OpenAI、Google、Vercel、Anthropic 等官方 skills 仓库和代表性 awesome 项目。

三个入口按 repo ID 去重，得到 460 个候选。

可复核材料：

- [候选扫描脚本](../awesome-agentic-landscape/method/scan_awesome_agentic_projects.py)
- [460 项候选池](../awesome-agentic-landscape/method/awesome_agentic_candidates.csv)
- [扫描摘要](../awesome-agentic-landscape/method/scan_summary.json)
- [验证报告](../awesome-agentic-landscape/method/validation_report.json)

## 每个候选收集什么

GitHub 当前元数据：

- stars、forks、open issues；
- language、license；
- created_at、pushed_at；
- topics；
- archive、disabled、fork 状态。

README 结构：

- heading 数量；
- Markdown links；
- GitHub links；
- agent file mentions；
- 是否出现 contributing 信号；
- 是否有 taxonomy；
- Agent 关键词；
- 可消费材料关键词；
- 纯学习材料关键词。

协作与关注信号：

- 可见 WatchEvent；
- issue、PR、comment 与 review 的独立参与者；
- 2026 年 4、5、6 月 OpenRank；
- 三个月中有活动的月份数。

## 怎样判断 Agent consumability

README 明确提供以下材料时，仓库更接近 direct：

- skill / skills；
- instruction / instructions；
- prompt / prompts；
- subagent；
- hook；
- workflow；
- playbook；
- configuration；
- MCP。

最终编辑分成：

- **direct：19**，Agent 可以直接消费明确材料；
- **hybrid：5**，传统目录与可执行材料并存；
- **indirect：2**，主要供人浏览，作为历史 benchmark。

## 460 怎样变成 26

机器扫描先计算：

- semantic fit；
- traction；
- collaboration；
- freshness；
- curation；
- README consumability。

由此产生 24 个 provisional shortlist。人工编辑随后加入两个历史 benchmark：

- `sindresorhus/awesome`；
- `e2b-dev/awesome-ai-agents`。

最终 26 个项目分为：

- core：16；
- watch：8；
- benchmark：2。

并按使用路径排列：

- Discover：5；
- Reuse：7；
- Install：7；
- Operate：7。

项目表：[awesome_agentic_landscape_projects.csv](../awesome-agentic-landscape/interactive/awesome_agentic_landscape_projects.csv)

摘要：[landscape_source_summary.json](../awesome-agentic-landscape/interactive/landscape_source_summary.json)

## 为什么必须按 repo ID 聚合

仓库可能改名或转移 owner。`sickn33/agentic-awesome-skills` 在观察期内发生过改名：

- 按 repo ID 聚合：432 个可见 WatchEvent；
- 按当前名称聚合：6 个。

如果只用仓库名，项目历史会在改名那天被切断。Repo ID 是生态扫描中更可靠的身份键。

## 这张图最值得讲的趋势

### README 变成可执行入口

26 个项目中有 19 个 direct consumability。README 仍然承担说明，但目录结构已经开始指向具体的 skill、hook、workflow 和配置文件。

## 数据限制

- 460 个候选是 candidate-first 扫描，不是 Awesome 生态的完整 census。
- WatchEvent 是方向性信号，不是精确 star 增长。
- 2026 年 4—6 月 OpenRank 对覆盖与回填敏感。
- README consumability 是可复核的编辑判断，不是永久标签。
- core、watch、benchmark 表达本次叙事角色，不是项目质量评级。

## 给演讲者的讲法

先说明这张图为什么和前三张不一样：

> 它不看框架或模型，而是看开源知识怎样被使用。传统 awesome list 主要帮人发现链接；现在有一批仓库开始把内容整理成 Agent 能直接加载的形式。

再解释 19 / 26 的判断：

> 我们从 460 个候选里选了 26 个，其中 19 个被标记为 direct consumability。判断依据不是名字里有没有 awesome，也不是 star 高不高，而是 README 里是否真的提供 skill、instruction、hook、workflow 或 MCP 配置。

把核心观点说出来：

> README 开始带有执行语义。过去文档主要告诉人怎么做，现在文档里的一部分结构会被 Agent 读取，并直接影响它下一步怎么做。README 没有消失，只是多了一类读者。

最后给结论加上边界：

> 这 26 个项目是编辑短名单，不是整个 GitHub 的普查。更稳妥的结论是：开源项目的贡献界面正在扩大，代码之外，instructions 和 workflow 也开始成为可复用资产。

如果需要解释这张图为什么不按 stars 排：

> 我们先从 460 个候选里看当前关注度和协作信号，但最后更关心 README 里到底有什么。一个 star 很高的目录，如果 Agent 只能浏览链接，它仍然放在 Discover；一个规模不大的仓库，如果提供清楚的安装和运行入口，反而可能进入 Install 或 Operate。
