# Agentic AI Weekly Report - 2026-07-03

## TL;DR

- 本周发现 **36** 个新的 Agentic AI 候选项目。
- 热门方向集中在：Coding Agent (25), Workflow Orchestration (16), MCP (Model Context Protocol) (16)。
- 优先关注：diegosouzapw/OmniRoute - OpenRank 增长 735%, 趋势陡峭, 新项目。
- OpenRank 增速最快：diegosouzapw/OmniRoute，约 735% 增长。

## Deep Trend Insights

### 真实工程项目正在从“单点能力”转向“接入层+编排层”竞争

本周最强信号不是单个 Agent 又多聪明，而是“谁能成为统一入口”。**diegosouzapw/OmniRoute** 是最典型样本：作为 **LLM Gateway & Proxy + MCP + Coding Agent** 交叉项目，Star 达 **10.1k**，OpenRank 从 **4.1 跃升到 41.3**，增幅 **735%**，且有 **9 位参与者**。这说明市场关注点正从“模型本身”转向“多提供商接入、自动 fallback、成本压缩、协议兼容”这类工程能力。

与之配套的另一条线是终端编排。**ogulcancelik/herdr** 作为 terminal 中的 agent multiplexer，归类在 **Coding Agent + Workflow Orchestration**，OpenRank 从 **1.1 到 13.4**，增幅 **586%**，Star **10.0k**。虽然参与者只有 **1 位**，但这反而说明：当前很多趋势项目仍由小团队甚至个人快速推动，需求真实且足够集中，能迅速放大关注度。

这两者共同指向一个判断：**真实工程项目的竞争正在前移到“入口控制权”**。谁能同时兼容 Claude Code、Codex、Cursor、Cline、Copilot 这类上层编码代理，谁就更可能吃到后续生态红利。相比单一 Agent Framework，本周数据更支持“网关/多路复用/协议适配”先成为基础设施层热点。

### Coding Agent 的下一阶段，不是再造 IDE，而是补齐“代码上下文基础设施”

如果说 OmniRoute、herdr 抢的是入口，那么 **colbymchenry/codegraph** 抢的是上下文。它被归入 **Coding Agent + MCP + GraphRAG & Knowledge Graph**，Star 已达 **57.0k**，OpenRank 从 **1.2 增至 12.2**，增长 **506%**，有 **3 位参与者**。项目强调 pre-indexed code knowledge graph、代码变更自动同步、100% local，这本质上是在解决 Coding Agent 最核心的瓶颈：**上下文贵、调用多、代码理解碎片化**。

这条线与 **topoteretes/cognee** 的高参与度形成互证。虽然这里没有给出 cognee 的 Star 或 OpenRank，但它拥有本周最多的 **11 位参与者**，且归属在 **Memory & Knowledge** 相关趋势中，说明“记忆/知识层”并不是概念配件，而是工程上正在被密集建设的能力带。

因此，Coding Agent 这周最值得关注的不是“又一个能写代码的 agent”，而是**把代码库、记忆、知识图谱、本地索引做成可复用基础设施**。**codegraph** 和 **cognee** 代表的是更底层、也更可能沉淀护城河的一类真实工程项目；相比之下，单纯包装交互体验的项目更容易被替代。

### MCP 已从“协议话题”变成实际分发渠道，但资源类项目正在放大它的表观热度

从分类分布看，**MCP 项目数达到 16**，已经与 **Workflow Orchestration** 并列高位，仅次于 **Coding Agent 的 25**。这意味着 MCP 不再只是协议讨论，而是在工程里成为“被实际接入”的能力。最直接的例子就是 **OmniRoute** 与 **codegraph**，两者都把 MCP 放在核心分类里，而且都出现了显著 OpenRank 跃升。

不过，这里必须明确区分：MCP 的热度里混入了不少**资源/awesome/skills 类项目**的放大效应。数据中多个分类的代表项目反复出现 **vinta/awesome-python**、**VoltAgent/awesome-design-md**、**affaan-m/ECC**。其中 **VoltAgent/awesome-design-md** Star 高达 **95.2k**，且创建于 **2026-03**；**affaan-m/ECC** 更达到 **225.0k**，创建于 **2026-01**。这类项目能够快速把某一标签推上热榜，但它们并不等价于协议已经完成了工程落地。

所以本周对 MCP 更准确的解读是：**协议层已经进入实装阶段，但生态热度被资源聚合型项目显著放大**。看趋势时，应该优先看 **OmniRoute**、**codegraph**、**HKUDS/Vibe-Trading** 这类真正把 MCP 嵌入产品路径的项目，而不是只看标签覆盖面。

### 应用层开始用“金融交易”验证多 Agent 叙事，但热度仍明显大于工程成熟度

本周应用层最强的垂直主题是交易。**TauricResearch/TradingAgents** Star 达 **90.4k**，OpenRank 从 **2.8 到 13.2**，增长 **279%**；分类横跨 **LLM Inference + Agent Framework + LLM Gateway & Proxy**。与此同时，**HKUDS/Vibe-Trading** Star **17.2k**，OpenRank **2.7 到 7.2**，增长 **120%**，覆盖 **Chat UI & Frontend + MCP + API & Backend Service**。

这两个项目有一个共同点：它们都不是纯研究展示，而是在尝试把“多 Agent”“交易决策”“前端交互”“后端服务”打通，属于明显的**应用层趋势**。这说明多 Agent 的叙事正在寻找更容易量化结果的场景，而金融交易天然适合做效果展示与用户传播。

但也要看到另一面：**TradingAgents** 的参与者只有 **1 位**，而 **Vibe-Trading** 在数据里未给出参与者数。对于高星高热应用项目，这意味着它们当前更像“高传播样板”，而不一定代表成熟、可持续扩展的工程生态。我的判断是：**交易场景是多 Agent 应用的流量验证场，不一定是最先跑出基础设施价值的地方**。真正能沉淀的，仍然是它们背后的编排、接入、记忆、评测能力。

### 资源/awesome 类项目正在主导可见度，不能把“高星”直接当成“高工程含量”

本周数据里一个非常强烈的信号是：**资源聚合型项目对分类可见度的影响极大**。例如 **VoltAgent/awesome-design-md** 以 **95.2k** Star、创建于 **2026-03** 的速度，频繁出现在 **Agent Framework、Observability & Evaluation、Chat UI & Frontend、AI Infrastructure & Platform** 等多个分类代表中；**affaan-m/ECC** 则以 **225.0k** Star、创建于 **2026-01** 的超高关注度，同时出现在 **Coding Agent、Workflow Orchestration、MCP、Memory & Knowledge、Speech & Voice AI** 等多个类别代表里。

再加上 **vinta/awesome-python** 在大量分类中重复出现，可以判断：**本周“覆盖分类广”并不完全等于“真实工程创新分散”**，相当一部分是由资源/awesome/技能清单类项目把注意力集中到了若干热门关键词上。

因此，看这周生态不能只盯 Star。像 **OmniRoute**（OpenRank **4.1→41.3**，**9 位参与者**）和 **codegraph**（OpenRank **1.2→12.2**）这类真实工程项目，即使星数不如资源类夸张，也更能代表基础设施层的实际推进。简单说：**高星项目告诉你大家在看什么，OpenRank 增速和参与者数量更接近告诉你大家在“做什么”**。

## Highlighted Projects

### 1. [diegosouzapw/OmniRoute](https://github.com/diegosouzapw/OmniRoute)

- Stars: 10.1k
- Language: TypeScript
- Latest OpenRank: 41.3 (2026-05)
- OpenRank trend: ▁▄▆█
- Participants: 9
- Reason: OpenRank 增长 735%, 趋势陡峭, 新项目

### 2. [ogulcancelik/herdr](https://github.com/ogulcancelik/herdr)

- Stars: 10.0k
- Language: Rust
- Latest OpenRank: 13.4 (2026-05)
- OpenRank trend: ▁▂█
- Participants: 1
- Reason: OpenRank 增长 586%, 趋势陡峭, 新项目

### 3. [colbymchenry/codegraph](https://github.com/colbymchenry/codegraph)

- Stars: 57.0k
- Language: TypeScript
- Latest OpenRank: 12.2 (2026-05)
- OpenRank trend: ▁▂▂▁█
- Participants: 3
- Reason: OpenRank 增长 506%, 趋势陡峭, 新项目

### 4. [TauricResearch/TradingAgents](https://github.com/TauricResearch/TradingAgents)

- Stars: 90.4k
- Language: Python
- Latest OpenRank: 13.2 (2026-05)
- OpenRank trend: ▁▁▅▅█
- Participants: 1
- Reason: OpenRank 增长 279%, 趋势陡峭, 高关注 (90384 stars)

### 5. [HKUDS/Vibe-Trading](https://github.com/HKUDS/Vibe-Trading)

- Stars: 17.2k
- Language: Python
- Latest OpenRank: 7.2 (2026-05)
- OpenRank trend: ▁█
- Participants: 0
- Reason: OpenRank 增长 120%, 趋势陡峭, 新项目

## Review Candidates

| # | Repo | Description | Topics | Stars | Created | Latest OpenRank | OpenRank Month | Trend | Participants | Language | Categories |
|---|------|-------------|--------|-------|---------|-----------------|----------------|-------|--------------|----------|------------|
| 1 | [DietrichGebert/ponytail](https://github.com/DietrichGebert/ponytail) | Makes your AI agent think like the laziest senior dev in the room. The... | agent-skills,ai-agents,claude,claude-code,claude-c... | 71.5k | 2026-06-12 | - | - | — | 0 | JavaScript | Coding Agent, Observability & Evaluation, API & Backend Service |
| 2 | [calesthio/OpenMontage](https://github.com/calesthio/OpenMontage) | World's first open-source, agentic video production system. 12 pipelin... | agent,agentic-ai,ai,claude,copilot,cursor,elevenla... | 31.5k | 2026-03-29 | 1.3 | 2026-05 | █▁ | 0 | Python | Coding Agent, Speech & Voice AI, Image & Video Generation |
| 3 | [Panniantong/Agent-Reach](https://github.com/Panniantong/Agent-Reach) | Give your AI agent eyes to see the entire internet. Read & search Twit... | agent-infrastructure,ai-agent,ai-search,automation... | 49.0k | 2026-02-24 | 2.1 | 2026-05 | ▁█▆▁ | 0 | Python | MCP (Model Context Protocol), Coding Agent |
| 4 | [xbtlin/ai-berkshire](https://github.com/xbtlin/ai-berkshire) | AI 时代的伯克希尔：基于 Claude Code / Codex 的价值投资研究框架。巴菲特·芒格·段永平·李录四大师方法论 + 多Age... | ai,ai-agent,anthropic,berkshire-hathaway,charlie-m... | 8.6k | 2026-04-07 | 0.1 | 2026-04 | — | 2 | Python | Coding Agent, Workflow Orchestration, Agent Framework |
| 5 | [unicity-sphere/sphere](https://github.com/unicity-sphere/sphere) | A Web3 wallet and agent platform for the Unicity network - dual-layer ... | ai-agents,wallet | 7.6k | 2025-11-22 | 1.9 | 2026-04 | █▆▁ | 0 | TypeScript | LLM SDK & Library |
| 6 | [JCodesMore/ai-website-cloner-template](https://github.com/JCodesMore/ai-website-cloner-template) | Clone any website with one command using AI coding agents | ai,ai-agents,ai-tools,automation,boilerplate,claud... | 24.8k | 2026-03-13 | 1.2 | 2026-05 | ▂█▁ | 0 | TypeScript | Coding Agent |
| 7 | [hugohe3/ppt-master](https://github.com/hugohe3/ppt-master) | AI generates a real, editable PowerPoint from any document — native sh... | ai-agent,aippt,office,powerpoint,powerpoint-genera... | 36.1k | 2025-12-10 | 5.8 | 2026-05 | ▁▁▂▄█ | 0 | Python | Coding Agent, Speech & Voice AI |
| 8 | [ZhuLinsen/daily_stock_analysis](https://github.com/ZhuLinsen/daily_stock_analysis) | LLM 驱动的多市场股票智能分析系统：多源行情、实时新闻、决策看板与自动推送，支持零成本定时运行。  LLM-powered multi-m... | a-stock,ai-agent,aigc,llm,quant,quantitative-finan... | 53.5k | 2026-01-10 | 17.2 | 2026-05 | ▂▅█▃▁ | 3 | Python | LLM Inference, Workflow Orchestration, Search & Information Retrieval |
| 9 | [headroomlabs-ai/headroom](https://github.com/headroomlabs-ai/headroom) | Compress tool outputs, logs, files, and RAG chunks before they reach t... | agent,ai,anthropic,claude-code,compression,context... | 55.7k | 2026-01-07 | - | - | — | 3 | Python | LLM Gateway & Proxy, Coding Agent, MCP (Model Context Protocol) |
| 10 | [topoteretes/cognee](https://github.com/topoteretes/cognee) | Cognee is the open-source AI memory platform for agents. Give your AI ... | agent-memory,agent-skills,ai,ai-agents,ai-memory,c... | 26.6k | 2023-08-16 | 24.1 | 2026-05 | ▆█▄▅▁ | 11 | Python | Memory & Knowledge, MCP (Model Context Protocol), GraphRAG & Knowledge... |
| 11 | [firecrawl/firecrawl](https://github.com/firecrawl/firecrawl) | The API to search, scrape, and interact with the web at scale. 🔥 | ai,ai-agents,ai-crawler,ai-scraping,ai-search,craw... | 143.1k | 2024-04-15 | 8.8 | 2026-05 | █▆▅▂▁ | 2 | TypeScript | MCP (Model Context Protocol), Coding Agent, LLM Gateway & Proxy |
| 12 | [usestrix/strix](https://github.com/usestrix/strix) | Open-source AI penetration testing tool to find and fix your app’s vul... | agents,ai-hacking,ai-penetration-testing,ai-pentes... | 31.4k | 2025-08-05 | 5.2 | 2026-05 | █▅▇▂▁ | 1 | Python | Agent Framework, Workflow Orchestration, Multi-Agent System |
| 13 | [HKUDS/Vibe-Trading](https://github.com/HKUDS/Vibe-Trading) | "Vibe-Trading: Your Personal Trading Agent" | ai-agent,algorithmic-trading,backtesting,fintech,l... | 17.2k | 2026-04-01 | 7.2 | 2026-05 | ▁█ | 0 | Python | Chat UI & Frontend, MCP (Model Context Protocol), API & Backend Servic... |
| 14 | [affaan-m/ECC](https://github.com/affaan-m/ECC) | The agent harness performance optimization system. Skills, instincts, ... | ai-agents,anthropic,claude,claude-code,developer-t... | 225.0k | 2026-01-18 | 21.5 | 2026-05 | — | 1 | JavaScript | Coding Agent, Memory & Knowledge, MCP (Model Context Protocol) |
| 15 | [opendatalab/MinerU](https://github.com/opendatalab/MinerU) | Transforms complex documents like PDFs and Office docs into LLM-ready ... | ai4science,document-analysis,docx,extract-data,lay... | 73.0k | 2024-02-29 | 10.6 | 2026-05 | █▃▃▁▁ | 1 | Python | Vector Database & RAG, MCP (Model Context Protocol), Coding Agent |
| 16 | [NanmiCoder/MediaCrawler](https://github.com/NanmiCoder/MediaCrawler) | 小红书笔记 │ 评论爬虫、抖音视频 │ 评论爬虫、快手视频 │ 评论爬虫、B 站视频 ｜ 评论爬虫、微博帖子 ｜ 评论爬虫、百度贴吧帖子 ｜... |  | 55.0k | 2023-06-09 | 0.7 | 2026-05 | █▅▃▂▁ | 0 | Python | Browser Agent, Coding Agent, LLM Gateway & Proxy |
| 17 | [facebook/astryx](https://github.com/facebook/astryx) | An open source design system that's fully customizable and agent ready |  | 3.4k | 2026-01-09 | - | - | — | 7 | TypeScript | LLM SDK & Library |
| 18 | [diegosouzapw/OmniRoute](https://github.com/diegosouzapw/OmniRoute) | Never stop coding. Free AI gateway: one endpoint, 231+ providers (50+ ... | a2a,ai-agents,ai-gateway,anthropic,claude,claude-c... | 10.1k | 2026-02-13 | 41.3 | 2026-05 | ▁▄▆█ | 9 | TypeScript | Coding Agent, MCP (Model Context Protocol), LLM Gateway & Proxy |
| 19 | [browser-use/video-use](https://github.com/browser-use/video-use) | Edit videos with coding agents |  | 13.7k | 2026-04-12 | 1.8 | 2026-05 | ▁█ | 0 | Python | Browser Agent, Speech & Voice AI, Coding Agent |
| 20 | [ogulcancelik/herdr](https://github.com/ogulcancelik/herdr) | agent multiplexer that lives in your terminal. | agent,agent-orchestration,ai,ai-agents,claude-code... | 10.0k | 2026-03-27 | 13.4 | 2026-05 | ▁▂█ | 1 | Rust | Coding Agent, Workflow Orchestration |
| 21 | [pewdiepie-archdaemon/odysseus](https://github.com/pewdiepie-archdaemon/odysseus) | Self-hosted AI workspace.  |  | 80.1k | 2026-05-31 | 6.8 | 2026-05 | — | 4 | Python | MCP (Model Context Protocol), Memory & Knowledge, Search & Information... |
| 22 | [datawhalechina/hello-agents](https://github.com/datawhalechina/hello-agents) | 📚 《从零开始构建智能体》——从零开始的智能体原理与实践教程 | agent,llm,rag,tutorial | 63.5k | 2025-09-07 | 6.8 | 2026-05 | █▄▂▁▁ | 0 | Python | Workflow Orchestration, Agent Framework, MCP (Model Context Protocol) |
| 23 | [kunchenguid/no-mistakes](https://github.com/kunchenguid/no-mistakes) | git push no-mistakes |  | 4.9k | 2026-04-05 | 1.0 | 2026-05 | ▁█ | 1 | Go | Coding Agent, LLM Gateway & Proxy, Workflow Orchestration |
| 24 | [TauricResearch/TradingAgents](https://github.com/TauricResearch/TradingAgents) | TradingAgents: Multi-Agents LLM Financial Trading Framework | agent,finance,llm,multiagent,trading | 90.4k | 2024-12-28 | 13.2 | 2026-05 | ▁▁▅▅█ | 1 | Python | LLM Inference, Agent Framework, LLM Gateway & Proxy |
| 25 | [santifer/career-ops](https://github.com/santifer/career-ops) | AI-powered job search system built on Claude Code. 14 skill modes, Go ... | ai-agent,anthropic,automation,beginner-friendly,ca... | 57.6k | 2026-04-04 | 12.9 | 2026-05 | █▁ | 4 | JavaScript | Coding Agent, Browser Agent, Observability & Evaluation |
| 26 | [Egonex-AI/Understand-Anything](https://github.com/Egonex-AI/Understand-Anything) | Graphs that teach > graphs that impress. Turn any code into an interac... | antigravity-skills,business-knowledge,claude-code,... | 70.4k | 2026-03-15 | - | - | — | 0 | TypeScript | Coding Agent, GraphRAG & Knowledge Graph, Memory & Knowledge |
| 27 | [colbymchenry/codegraph](https://github.com/colbymchenry/codegraph) | Pre-indexed code knowledge graph, auto syncs on code changes, for Clau... |  | 57.0k | 2026-01-18 | 12.2 | 2026-05 | ▁▂▂▁█ | 3 | TypeScript | Coding Agent, MCP (Model Context Protocol), GraphRAG & Knowledge Graph |
| 28 | [harry0703/MoneyPrinterTurbo](https://github.com/harry0703/MoneyPrinterTurbo) | 利用AI大模型，一键生成高清短视频 Generate short videos with one click using AI LLM. | ai,automation,chatgpt,moviepy,python,shortvideo,ti... | 95.2k | 2024-03-11 | 2.6 | 2026-05 | ▁▁▁▄█ | 0 | Python | Coding Agent, LLM Inference, LLM Gateway & Proxy |
| 29 | [vinta/awesome-python](https://github.com/vinta/awesome-python) | An opinionated list of Python frameworks, libraries, tools, and resour... | awesome,collections,python,python-frameworks,pytho... | 306.0k | 2014-06-27 | 4.2 | 2026-05 | █▄▅▅▁ | 0 | Python | Model Training & Fine-tuning, Deep Learning Core, Speech & Voice AI |
| 30 | [github/spec-kit](https://github.com/github/spec-kit) | 💫 Toolkit to help you get started with Spec-Driven Development | ai,copilot,development,engineering,prd,spec,spec-d... | 117.4k | 2025-08-21 | 22.5 | 2026-05 | ▆▁▂█▆ | 4 | Python | Coding Agent, Workflow Orchestration, Notebook & Development Environme... |
| 31 | [VoltAgent/awesome-design-md](https://github.com/VoltAgent/awesome-design-md) | A collection of DESIGN.md files analysis by popular brand design syste... | awesome-list,design-md,design-system,design-tokens... | 95.2k | 2026-03-31 | 4.7 | 2026-05 | █▁ | 0 | - | Coding Agent, Tool & Integration Platform, LLM Inference |
| 32 | [antirez/ds4](https://github.com/antirez/ds4) | DeepSeek 4 Flash and PRO local inference engine for Metal, CUDA and RO... |  | 17.3k | 2026-05-06 | 10.6 | 2026-05 | — | 0 | C | LLM Inference, Model Training & Fine-tuning, Deep Learning Core |
| 33 | [D4Vinci/Scrapling](https://github.com/D4Vinci/Scrapling) | 🕷️ An adaptive Web Scraping framework that handles everything from a s... | ai,ai-scraping,automation,crawler,crawling,crawlin... | 67.8k | 2024-10-13 | 5.7 | 2026-05 | ▁▄▅▇█ | 0 | Python | MCP (Model Context Protocol), LLM Gateway & Proxy, Browser Agent |
| 34 | [every-app/open-seo](https://github.com/every-app/open-seo) | Open source alternative to Semrush and Ahrefs | backlink-analysis,google-search-console-mcp,keywor... | 4.0k | 2026-02-27 | 2.5 | 2026-05 | ▁▅█ | 0 | TypeScript | MCP (Model Context Protocol) |
| 35 | [OpenCut-app/OpenCut](https://github.com/OpenCut-app/OpenCut) | The open-source CapCut alternative | editor,oss,videoeditor | 61.3k | 2025-06-22 | 4.2 | 2026-05 | █▆▅▄▁ | 0 | TypeScript | MCP (Model Context Protocol), Speech & Voice AI |
| 36 | [microsoft/SkillOpt](https://github.com/microsoft/SkillOpt) | SkillOpt is a text-space optimizer that trains reusable natural-langua... | agent-skills,self-evolving-agents | 10.4k | 2026-05-08 | 1.7 | 2026-05 | — | 0 | Python | Coding Agent, Observability & Evaluation, API & Backend Service |

---
*Generated by weekly_update.py*
