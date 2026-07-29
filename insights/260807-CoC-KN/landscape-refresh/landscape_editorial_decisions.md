# 2026-07 Landscape 项目取舍

当前 Vercel 版本有 122 个项目：Agent Infra 73 个，Model Infra 49 个。

这轮建议落在 126 个：Agent Infra 74 个，Model Infra 52 个。分类结构继续沿用现有 25 个 section，没有新增大类。变化主要靠替换完成：新增 21 个，拿下 17 个。

## 版面密度变化

只列项目数发生变化的 section。最大的拥挤区 Agentic coding 从 15 个压到 12 个；其余扩容都控制在 1–2 个 logo。

| Layer | Section | 当前 | 建议 | 变化 |
|---|---|---:|---:|---:|
| Agent Infra | Agentic coding | 15 | 12 | -3 |
| Agent Infra | Code-first frameworks | 9 | 10 | +1 |
| Agent Infra | Development sandboxes | 3 | 4 | +1 |
| Agent Infra | Model API gateways | 6 | 5 | -1 |
| Agent Infra | Personal AI assistants | 6 | 7 | +1 |
| Agent Infra | Protocols & interoperability | 3 | 5 | +2 |
| Model Infra | Data · Integration | 2 | 3 | +1 |
| Model Infra | Pre-Train · Compiler & accelerator | 7 | 8 | +1 |
| Model Infra | Serving · Deploy | 4 | 3 | -1 |
| Model Infra | Serving · Inference | 6 | 8 | +2 |

## 建议补入

| 项目 | Layer | Section | 判断 | 注意 |
|---|---|---|---|---|
| `lobehub/lobehub` | Agent Infra | Personal AI assistants | 80k+ stars、最近可用 OpenRank 仍在 60 左右，已经成为个人 agent 工作空间和长期运行入口的代表项目。 | 产品同时覆盖聊天、知识库和多 agent 管理；主图只放在 Personal AI assistants，避免重复出现在 framework 或 chatbot。 |
| `FlowiseAI/Flowise` | Agent Infra | Workflow & agent builders | 54k+ stars 的可视化 agent builder，结构定位比 ComfyUI 更贴合通用 agent workflow。 | 与 Dify、Langflow 功能接近；该区维持五个 logo，不继续扩容。 |
| `docling-project/docling` | Model Infra | Data · Integration | 文档解析和结构化已经成为 RAG 与 agent 数据准备的常见入口，当前 63k+ stars、最近可用 OpenRank 66.74。 | 它代表文档数据准备，不是通用 ETL；Data · Integration 区控制在三个项目。 |
| `milvus-io/milvus` | Agent Infra | Memory, knowledge & context | 成熟向量数据库仍是 agent context 的重要底座；当前 45k+ stars、最近可用 OpenRank 68.34，社区信号稳定。 | 它是通用向量数据库，不应被描述成 agent memory framework；在图中承担底层检索基础设施的位置。 |
| `microsoft/onnxruntime` | Model Infra | Serving · Inference | 跨平台推理 runtime 仍是 CPU、GPU 和边缘部署的重要基线，当前 21k+ stars、最近可用 OpenRank 64.52。 | 项目覆盖广泛 ML workload，不专属于 LLM；在图中只表达通用 inference runtime。 |
| `openxla/xla` | Model Infra | Pre-Train · Compiler & accelerator | Apache-2.0 的跨 GPU、CPU 和专用加速器编译基础设施，补足当前编译器层只展示 kernel 与算子库的问题。 | star 规模不大；保留依据是结构代表性和开放编译栈位置。 |
| `tensorflow/tensorflow` | Model Infra | Pre-Train · Framework & parallel | 通用训练框架的历史基线仍应保留，尤其在 NeMo 仓库改名为 Speech 后，原位置已经不再准确。 | 近期 OpenRank 明显低于 PyTorch、JAX；入图表示生态基线，不解释成增长项目。 |
| `IBM/mcp-context-forge` | Agent Infra | Model API gateways | 提供 MCP gateway、registry 与可观测能力，补足协议落地后的企业运维和治理入口。 | 与 AgentGateway 有交叉；保留两个是为了区分流量代理和 MCP 管理平台，不再继续增加同类 gateway。 |
| `volcengine/OpenViking` | Agent Infra | Memory, knowledge & context | 把 memory、RAG 和 skills 收敛为 context database，补上当前图缺少的 agent-native context 数据层。 | 主仓库使用 AGPL-3.0；图例或许可证分析中需要明确标注。 |
| `microsoft/agent-framework` | Agent Infra | Code-first frameworks | 统一 Python 与 .NET 的 agent 和 multi-agent 开发路径，补足企业开发栈与跨语言框架代表。 | 与 AutoGen、Semantic Kernel 有谱系关系；主图只保留当前统一框架，不并列堆放三个 Microsoft 项目。 |
| `JetBrains/koog` | Agent Infra | Code-first frameworks | 为 Kotlin/JVM、Android 和 iOS 提供 agent framework，修正当前框架区过度集中在 Python、TypeScript 的问题。 | 社区规模仍小于 LangChain、Pydantic AI；入图理由是语言生态代表性，不是热度排名。 |
| `trycua/cua` | Agent Infra | Tool & browser use | 把 computer use 扩展到跨 OS driver、fleet、benchmark 和数据生成，结构价值高于再增加一个 browser agent。 | 最近可用 OpenRank 绝对值不高；保留依据主要是类别变化和当前关注度。 |
| `agentgateway/agentgateway` | Agent Infra | Model API gateways | Rust 实现的 agentic proxy，覆盖 MCP 与 agent 流量策略，能代表 gateway 从模型 API 代理扩展到 agent 控制面。 | 与 LiteLLM 的 model API gateway 定位不同，图中应直接标成 agentic proxy。 |
| `ag-ui-protocol/ag-ui` | Agent Infra | Protocols & interoperability | 补上 agent 到前端应用之间的事件与交互协议，当前协议区不再只围绕 MCP 和 A2A。 | AG-UI 更偏交互事件和传输层；不要与 A2UI 合并成同一个概念。 |
| `a2ui-project/a2ui` | Agent Infra | Protocols & interoperability | 代表声明式 agent-generated UI，与 MCP、A2A、AG-UI 共同构成更完整的 agent interface 协议面。 | 官方仍标注 early-stage public preview，主图应加 preview 标识。 |
| `kubernetes-sigs/agent-sandbox` | Agent Infra | Development sandboxes | Kubernetes SIG Apps 承载的声明式 sandbox orchestration，补上稳定身份、持久存储和 warm pool 这一层。 | 它是 sandbox orchestrator，不是底层隔离 runtime；与 OpenSandbox、Coder、Daytona 的角色需要区分。 |
| `vllm-project/vllm-omni` | Model Infra | Serving · Inference | 把 vLLM serving 扩展到文本、图像、音频、视频和 action output，直接对应多模态 agent workload。 | 它与 vLLM 主项目同属一个生态；版面上应做子项目关系提示，避免看成两个无关引擎。 |
| `LMCache/LMCache` | Model Infra | Serving · Inference | KV cache 已成为长上下文和多轮 agent workload 的独立复用层；LMCache 的社区信号和采用度足以进入主图。 | 与 Mooncake 的位置高度重叠，本版采用替换而不是并列增加。 |
| `huggingface/trl` | Model Infra | Post-Train · Reinforcement learning | SFT、DPO、GRPO 等 post-training 的通用基础库，在 Hugging Face 生态中具有长期代表性。 | 项目不是 2026 新晋热点；这是旧图漏项修正，并替换社区信号较弱的 OpenRLHF。 |
| `topoteretes/cognee` | Agent Infra | Memory, knowledge & context | 长期记忆与 knowledge graph 结合，补足当前 memory 区对图结构和持久知识表达的覆盖。 | 与 RAGFlow、Mem0 有部分功能重叠；保留重点是 graph-based memory，不再额外增加同类项目。 |
| `NVIDIA/Model-Optimizer` | Model Infra | Pre-Train · Compiler & accelerator | 统一量化、蒸馏、剪枝和投机解码等部署优化能力，最近可用 OpenRank 56.14。 | 厂商主导且与 TensorRT-LLM 有交叉；主图只表达模型优化层，不扩展 NVIDIA 同栈项目数量。 |

## 建议拿下

| 项目 | Layer | Section | 判断 | 注意 |
|---|---|---|---|---|
| `Comfy-Org/ComfyUI` | Agent Infra | Workflow & agent builders | 核心定位是图像和视频生成工作流，不适合作为通用 Workflow & agent builder 代表。 | 它仍应出现在生成式媒体生态图，而不是本版 Agent Infra 主图。 |
| `continuedev/continue` | Agent Infra | Agentic coding | coding agent 区需要压缩；当前 OpenRank 信号明显低于同区头部项目，结构上也没有新增能力层。 | Continue 具有历史影响力，本次下架是版面取舍，不等于项目失去价值。 |
| `charmbracelet/crush` | Agent Infra | Agentic coding | 终端 coding agent 已有足够代表项目，Crush 的功能增量不足以支撑第十三个 logo。 | 项目仍活跃；若未来形成独特交互或协作模式，可再进入候选池。 |
| `supabase/supabase` | Agent Infra | Memory, knowledge & context | 通用后端平台不能直接代表 agent memory；当前 memory 区需要让位给 agent-native context 项目。 | Supabase 仍是重要基础设施，但不在本图的有限 logo 预算内。 |
| `rapidsai/cudf` | Model Infra | Pre-Train · Compiler & accelerator | cuDF 是 GPU dataframe library，放在 Compiler & accelerator 区的解释成本过高。 | 它仍是 GPU 数据处理基础设施，但不属于本图的模型编译主线。 |
| `NVIDIA-NeMo/Speech` | Model Infra | Pre-Train · Framework & parallel | 原 NeMo 仓库已经改名为 Speech，继续放在通用 Pre-Train framework 会造成事实错误。 | Speech 项目可在语音模型或多模态工具图中单独评估。 |
| `xorbitsai/inference` | Model Infra | Serving · Deploy | Serving · Deploy 已有 Ollama、Dynamo 和 llm-d，Xorbits Inference 的近期社区信号相对较弱。 | 项目仍有部署价值；本次下架主要是控制 serving 区密度。 |
| `OpenRLHF/OpenRLHF` | Model Infra | Post-Train · Reinforcement learning | Post-Train 区加入 TRL 后需要一进一出；OpenRLHF 最近窗口缺少可靠 OpenRank。 | 项目仍是 RLHF 工程实践的重要参考，本次只是不再占主图 logo。 |
| `kvcache-ai/Mooncake` | Model Infra | Serving · Inference | KV cache 位置与 LMCache 重叠，本版选择社区信号更强、定位更直接的 LMCache。 | Mooncake 继续保留在项目池，后续按跨引擎采用情况复核。 |
| `songquanpeng/one-api` | Agent Infra | Model API gateways | 与 New API、LiteLLM 高度重叠，最近可用 OpenRank 只有 0.64。 | 保留 New API 作为该产品谱系的当前代表。 |
| `browser-use/browser-harness` | Agent Infra | Tool & browser use | 与同组织 browser-use 主项目重叠，Tool & browser use 区只保留一个主 logo。 | 其 self-healing harness 能力可以作为 browser-use 的项目演化注释。 |
| `rtk-ai/rtk` | Agent Infra | Model API gateways | 项目是开发命令 token 压缩 CLI，并非 Model API gateway；现有位置属于误分类。 | 它可以继续作为 coding workflow 工具观察，但暂不占主图位置。 |
| `Yeachan-Heo/oh-my-codex` | Agent Infra | Coding harnesses | 与 ECC、Superpowers、oh-my-openagent 同属 coding harness 增强层，当前版面无需四个相似配置栈。 | 保留在项目池中观察其独立社区和跨 agent 支持。 |
| `MemPalace/mempalace` | Agent Infra | Memory, knowledge & context | 短期关注度很高，但与 Mem0、Hindsight 的长期记忆定位重叠，独立采用证据仍需观察。 | 保留为观察项目；若持续贡献和外部采用站稳，可替换当前 memory 代表。 |
| `NevaMind-AI/memU` | Agent Infra | Memory, knowledge & context | 个人 memory 定位与 Mem0、Hindsight 重叠，最近可用 OpenRank 只有 2.40。 | 不因短期 stars 单独增加 logo。 |
| `Gitlawb/openclaude` | Agent Infra | Agentic coding | 项目定位和描述过于模糊，难以在已经拥挤的 coding agent 区解释其独立代表性。 | 若后续形成稳定产品边界和独立社区，再重新评估。 |
| `RightNow-AI/openfang` | Agent Infra | Code-first frameworks | Agent OS 定位较宽，与现有 code-first framework 和 personal assistant 项目重叠，最近可用 OpenRank 也偏低。 | 若形成清晰 runtime 边界，可在后续版本重新考虑。 |

## 分类调整

- `farion1231/cc-switch` 从 Model API gateways 移到 Coding harnesses。它管理 coding agent 的配置和切换，并不是模型 API gateway。
- Protocols & interoperability 继续保留原 section，补入 AG-UI 和 A2UI，不另建协议大类。
- Memory, knowledge & context 维持七个项目，通过一进一出提高结构覆盖，不扩大版面。
- Serving · Inference 增加多模态 serving、KV cache 和通用 runtime，但硬件 plugin 仍作为主项目注释。

## 数据口径

- GitHub 仓库信息与 stars：2026-07-28。
- 最近可用 Repo OpenRank：`openrank_2606`。
- 12 个月趋势：`openrank_trend_2508_2607`，覆盖 2025-08 至 2026-07；7 月尚未产出 OpenRank，因此最后一个点为 `null`。
- 当月参与者：`participants_2607`。
- OpenRank 只作为持续协作信号，最终取舍还考虑结构代表性、项目重复度、许可证和版面预算。
