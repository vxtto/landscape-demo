# Agentic AI 全景图项目增补扫描

> 截止口径：GitHub 仓库元数据快照为 2026-07-28；OpenRank 使用 2026-04、05、06 三个已结束月份，但近期分区存在显著回填缺口。本文是全景图项目取舍工作稿，不是生态排行榜。

## tl;dr

从当前 227 个仓库基线出发，扫描得到 6,118 个原始 repo id，经关键词、仓库状态、GitHub 元数据和人工结构复核后，建议 **A 档立即补入 12 个项目**、**B 档候补观察 12 个项目**。

数据表已在 2026-07-28 完成刷新：24 个扫描短名单项目都已写入 `data/agentic-ai-projects.csv`，当前共 251 个项目。A/B 档只保留在这份扫描工作稿中；主表使用 `landscape_action` 记录最终的 keep、add、remove 和 omit 判断。

这轮补项最有价值的，是五个结构性缺口终于有了清晰的代表项目：

1. Context database 正从 RAG/vector store 中独立出来：OpenViking。
2. Agent framework 开始补齐 JVM/.NET 等企业开发栈：Koog、Microsoft Agent Framework。
3. MCP/A2A 之外出现 agent-to-user / agent-to-UI 协议：AG-UI、A2UI。
4. Sandbox 从单机执行环境走向 Kubernetes 声明式编排与安全 runtime：agent-sandbox。
5. Model Infra 针对 agent workload 增加 multimodal serving 与可复用 KV state：vLLM-Omni、LMCache。

## A 档建议补入

| 项目 | 建议位置 | stars 快照 | OR 4月 | OR 5月 | OR 6月 | 为什么 | 注意 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [volcengine/OpenViking](https://github.com/volcengine/OpenViking) | Memory, Knowledge & Context | 27,554 | 125.51 | 130.99 | 140.23 | context database 是当前图上的结构缺口；OpenRank 在不完整的 4–6 月数据中仍连续上升，且当前关注度高。 | 主项目为 AGPL-3.0，需在图例或许可证分析中明确；不能只写成普通向量数据库。 |
| [microsoft/agent-framework](https://github.com/microsoft/agent-framework) | Agent Framework | 12,463 | 69.24 | 57.77 | 48.02 | 统一 Python 与 .NET 的 agent / multi-agent framework，补足企业开发栈与跨语言框架代表。 | 与 AutoGen、Semantic Kernel 有谱系关系，制图时避免三个 Microsoft logo 重复表达同一层。 |
| [JetBrains/koog](https://github.com/JetBrains/koog) | Agent Framework | 4,476 | 42.06 | 30.28 | 37.49 | 当前框架区以 Python/TypeScript 为主；Koog 提供 JVM、Android、iOS 和浏览器覆盖，对 Apache 中文受众也更有代表性。 | star 不是最高，但结构代表性强；应作为语言生态补位而非热度冠军。 |
| [trycua/cua](https://github.com/trycua/cua) | Tool Use / Computer Use | 20,723 | 16.52 | 13.67 | 14.16 | 把 computer-use 从单一 browser agent 扩展到跨 OS driver、fleet、benchmark、训练与评估数据。 | OpenRank 绝对值不高；推荐理由主要是技术类别变化和当前 attention signal。 |
| [agentgateway/agentgateway](https://github.com/agentgateway/agentgateway) | Protocols & Tool Interoperability | 4,084 | 32.32 | 30.10 | 28.63 | 代表 MCP/agent 流量从简单 API proxy 走向 agentic proxy、策略和控制平面。 | 应与 LiteLLM 的 model API proxy 区分，避免都放在 Model API Proxy。 |
| [ag-ui-protocol/ag-ui](https://github.com/ag-ui-protocol/ag-ui) | Protocols & Tool Interoperability | 14,962 | 20.85 | 15.16 | 12.72 | 补上 agent 到前端应用之间的事件与交互协议，当前图只覆盖 MCP/A2A，协议栈不完整。 | 与 A2UI 不是二选一：AG-UI 更偏 agent-user interaction transport/event layer。 |
| [a2ui-project/a2ui](https://github.com/a2ui-project/a2ui) | Protocols & Tool Interoperability | 15,926 | 33.87 | 27.57 | 35.99 | 代表 agent-generated UI 的声明式开放标准，与 MCP、A2A、AG-UI 形成新的交互协议层。 | 官方仍标注 early-stage public preview；图上建议加 preview 标识。 |
| [kubernetes-sigs/agent-sandbox](https://github.com/kubernetes-sigs/agent-sandbox) | Dev Environment & Sandbox | 3,316 | 36.00 | 25.28 | 21.60 | 由 Kubernetes SIG Apps 承载，提供声明式 Sandbox CRD、稳定身份、持久存储和 warm pool，代表 sandbox 走向标准化编排。 | 它是 sandbox orchestrator，不是底层隔离 runtime；需与 gVisor/Kata/OpenSandbox 区分。 |
| [vllm-project/vllm-omni](https://github.com/vllm-project/vllm-omni) | Serving | 5,719 | 137.40 | 131.19 | 105.73 | 把 vLLM 的 serving 范围扩展到文本、图像、音频、视频和 action output，4–6 月 OpenRank 信号强。 | 与 vLLM 主项目并列时要标注 omni-modality，不能只增加一个相似 logo。 |
| [LMCache/LMCache](https://github.com/LMCache/LMCache) | Inference | 10,920 | 53.66 | 49.91 | 42.86 | KV cache 已从引擎内部优化变成可持久化、跨引擎复用和可观测的独立层，尤其匹配长上下文和多轮 agent workload。 | 建议新增 KV Cache / State Reuse 小类，而不是继续塞进通用 inference。 |
| [vllm-project/vllm-ascend](https://github.com/vllm-project/vllm-ascend) | Serving / Hardware | 2,511 | 145.56 | 111.88 | 87.97 | 4–6 月 OpenRank 信号很强，补足当前图过度集中于 CUDA/GPU 的硬件与社区多样性。 | 它是 vLLM hardware plugin；版面紧张时可作为 vLLM 的子标识而非独立大 logo。 |
| [huggingface/trl](https://github.com/huggingface/trl) | Post-Train | 18,949 | 44.22 | 38.64 | 31.15 | SFT、GRPO、DPO 等 post-training 的基础库，在 Hugging Face 生态中的通用性和持续活动都足以成为基线项目。 | 项目并非 2026 新出现；这是旧图漏项修正，不要叙述成新晋爆发项目。 |

## B 档候补观察

| 项目 | 建议位置 | stars 快照 | OR 4月 | OR 5月 | OR 6月 | 为什么 | 注意 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| [NVIDIA/OpenShell](https://github.com/NVIDIA/OpenShell) | Dev Environment & Sandbox | 7,846 | 21.39 | 34.49 | 33.60 | 安全、私有的 autonomous-agent runtime，5–6 月 OpenRank 信号保持在较高位置。 | 与 NemoClaw 构成同一产品栈，图上最多选一个主 logo；优先观察社区独立性。 |
| [topoteretes/cognee](https://github.com/topoteretes/cognee) | Memory, Knowledge & Context | 29,496 | 31.58 | 24.07 | 25.68 | 长期记忆与 knowledge graph 结合，当前 star 与可见 WatchEvent 信号都高。 | memory 区已有 Mem0、Hindsight、MemU 等，需用外部贡献/采用证据决定是否替换而非无限加 logo。 |
| [googleapis/mcp-toolbox](https://github.com/googleapis/mcp-toolbox) | Protocols & Tool Interoperability | 16,037 | 41.15 | 37.93 | 29.09 | 数据库 MCP server 的代表实现，连接 agent 与生产数据系统。 | 更像具体工具集成；若协议区只保留标准和通用 runtime，可不单列。 |
| [coze-dev/coze-loop](https://github.com/coze-dev/coze-loop) | Observability & Evaluation | 5,652 | 32.51 | 34.98 | 31.06 | 覆盖开发、调试、评测与监控的 agent optimization lifecycle，4–6 月 OpenRank 相对稳定。 | 需要进一步核验外部采用和贡献者结构，再决定是否替换现有 eval/observability logo。 |
| [microsoft/agent-lightning](https://github.com/microsoft/agent-lightning) | Post-Train | 17,427 | — | — | — | 直接面向 agent training/optimization，当前 star 快照高。 | OpenDigger 最近三个月没有可靠 OpenRank记录；不能仅凭 star 进入 A 档。 |
| [NVIDIA/Model-Optimizer](https://github.com/NVIDIA/Model-Optimizer) | Inference Optimization | 3,323 | 66.79 | 62.34 | 56.14 | 把量化、蒸馏、剪枝、投机解码等部署优化统一到一套库中，OpenRank 信号持续。 | 厂商工具属性较强，需与 TensorRT-LLM/TransformerEngine 的重复度一起取舍。 |
| [NVIDIA-NeMo/RL](https://github.com/NVIDIA-NeMo/RL) | Post-Train | 1,855 | 45.15 | 52.82 | 47.02 | 可扩展 reinforcement learning toolkit，5–6 月 OpenRank 信号稳定。 | Post-Train 已有 verl、AReaL、Slime、Miles；应以生态代表性而不是 logo 数量决定。 |
| [jundot/omlx](https://github.com/jundot/omlx) | Inference / Edge | 18,251 | 36.47 | 35.51 | 26.03 | Apple Silicon 上的 continuous batching 与 SSD caching，当前 star 和可见 WatchEvent 信号突出。 | 较新且偏单平台；建议先放观察区，避免用短期 star 替代成熟度。 |
| [stacklok/toolhive](https://github.com/stacklok/toolhive) | Protocols & Tool Interoperability | 1,977 | 37.51 | 36.12 | 19.76 | MCP server 的运行、管理与安全平台，代表 MCP 从 server catalog 走向运维层。 | 当前 star 规模较小，且与 agentgateway 部分重叠。 |
| [OpenHands/software-agent-sdk](https://github.com/OpenHands/software-agent-sdk) | Agent Framework | 938 | 27.53 | 26.81 | 58.54 | 6 月 OpenRank 信号相对 4–5 月明显增强，显示 OpenHands 正把产品能力模块化为 SDK。 | OpenHands 主 logo 已在图中；更适合作为谱系变化注释而不是新增 logo。 |
| [microsoft/fara](https://github.com/microsoft/fara) | Computer-use Model | 6,079 | 3.45 | — | — | 明确面向 computer use agent 的模型家族，能把 tool-use 趋势连接到模型层。 | Large Models 图的更新应以模型发布、权重与评测为主，不能直接沿用 GitHub 项目排名方法。 |
| [NVIDIA/Isaac-GR00T](https://github.com/NVIDIA/Isaac-GR00T) | Robotics / Action Model | 7,697 | 3.57 | 1.31 | — | 通用机器人 foundation model，代表输出从 token 扩展到 action。 | 需要和 Model Infra 图中的 robotics infra 分开；模型开放度也需单独复核。 |

## 不建议因短期热度直接补入

- `awesome-*`、课程、prompt/skill 合集：能反映学习与传播热度，不是生态基础设施。
- 垂直应用或个人效率工具：除非它开创了一个新类别，否则不应挤占框架、协议、runtime 的版面。
- 只有短期 star 信号、缺少 OpenRank/持续协作证据的新仓库：进入观察区，不直接进入主图。
- 同一厂商同一产品栈的多个仓库：例如 OpenShell/NemoClaw，应选一个主 logo，其他用谱系说明。
- 已在图中的项目拆分仓库：例如 OpenHands software-agent-sdk，优先作为项目演化注释，而不是重复 logo。

## 数据与方法

- 基线：`data/agentic-ai-projects.csv`，227 个唯一仓库。
- 候选发现：OpenDigger `opensource.events` 中 2026-05-01 至 2026-07-28 可见的 GitHub WatchEvent；只用于发现，不解释为完整 star 增量。
- 活跃信号：OpenDigger `opensource.global_openrank` 的 2026-04、05、06 月 Repo OpenRank。
- 当前快照：GitHub API / 官方仓库页的 stars、license、archive/fork 状态、描述与最近 push。
- 人工判断：是否补足全景图结构、是否是通用基础设施/开放协议、是否与现有 logo 重复、许可证与成熟度是否需要显式标注。

## 数据质量结论

**Share with caveats。** 这份名单足以支持“该看哪些项目”和“全景图缺了哪些结构层”的编辑决策，但不支持精确的近三个月 star 增长排行榜，也不支持把 4–6 月 OpenRank 总量变化解释为生态升降。

- GitHub 在 2026 年 7 月限制了公开 stargazer 列表接口；没有仓库协作者权限时，无法稳定重建准确的逐日新增 star。
- OpenDigger 最近月份存在明显覆盖下降：Repo OpenRank 行数从 2026-04 的 648,328 降至 2026-06 的 246,364。
- 因此，本文把当前 stars 当关注度快照，把可见 WatchEvent/OpenRank 当候选发现和交叉验证信号。
- Large Models 层不能直接复用 repo 排名：下一步应按模型发布、开放权重、许可证、评测与真实使用单独更新。

## 制图建议

- 主图不要把 A 档 12 个 logo 全部等权塞入；按“新增小类”和“替换旧代表”处理。
- 建议新增三个小类：`Agent–User / Agent–UI Protocols`、`Sandbox Orchestration`、`KV Cache / State Reuse`。
- OpenViking 的 AGPL-3.0、A2UI 的 preview 状态、以及 vLLM-Ascend 的 plugin 身份应显式标注。
- 演讲只点名 5–6 个项目，其余留在完整全景图和附录。
