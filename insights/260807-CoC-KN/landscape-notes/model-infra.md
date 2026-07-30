# Model Infra 全景图说明

数据快照：GitHub 2026-07-28；图中 OpenRank 使用 2026-06。

## 这张图回答什么

Model Infra 沿模型生命周期组织项目：数据怎样进入训练，计算如何调度，模型如何微调和强化学习，推理如何部署，token 怎样经过 gateway、engine、cache 与硬件适配层。

最终图中有 57 个项目：

- 47 个保留；
- 10 个新增；
- 13 个 section；
- `Serving · Inference` 从 6 个项目增加到 8 个；
- 5 个 Model API gateway 被放在模型访问层。

完整表格：[model_infra_landscape_projects.csv](../landscape-refresh/data/model_infra_landscape_projects.csv)

## 候选发现方法

Model Infra 与 Agent Infra 共用一套候选扫描。6,118 个原始候选来自：

- 2026-05-01 至 07-28 可见 WatchEvent 前 2,500；
- 2026 年 4—6 月 Repo OpenRank 合计前 4,000；
- 12 组 GitHub 定向搜索，每组最多 100 条；
- 按稳定 repo ID 去重，并排除旧图已有的 227 个仓库。

自动过滤读取仓库名、description、topics 与 README 前 8,000 字符，通过 Agent、Model Infra、模型和教程/合集关键词做高召回筛选：

```text
6,118 原始候选
→ 878 自动相关
→ 227 个 GitHub API 刷新对象
→ 222 个 README 复核后的机器候选
→ 12 个 A 档 + 12 个 B 档编辑短名单
```

详细解释和复核入口：

- [扫描方法全文](../landscape-refresh/landscape_scanning_methodology.md)
- [扫描脚本](../landscape-refresh/analysis/scan_landscape_candidates.py)
- [扫描摘要](../landscape-refresh/data/scan_summary.json)
- [人工复核短名单](../landscape-refresh/data/human_review_shortlist.csv)

## Model Infra 的最后一轮判断

共用候选池并不意味着共用最终分类。Model Infra 的人工复核重点是：

- 项目是否真正影响模型训练、数据、计算、serving 或访问；
- 它是通用基础设施，还是某个 Agent 产品里的内部模块；
- 主仓库、插件和硬件适配仓库是否值得分别占据版面；
- benchmark、OpenRank 与 stars 分别能支持什么结论；
- 一个项目是在表达新结构，还是重复一个已经很拥挤的类别。

## 为什么把 Model API gateway 移到这里

旧图把 Model API gateway 放在 Agent Infra。这样会把三类职责混在一起：

- model API gateway：模型供应商切换、路由、成本、限流；
- MCP gateway：Agent 与工具服务的连接和治理；
- agentic proxy：Agent 协议流量、策略与控制平面。

新版把 5 个 Model API gateway 放回 Model Infra。这个调整让分类沿流量职责展开，也解释了为什么 Agent gateway 与 Model gateway 不应只因为名字相似就放在一起。

相关前后计数见 [landscape_editorial_summary.json](../landscape-refresh/data/landscape_editorial_summary.json)。

## 这次最值得讲的变化

### Inference 从 6 个项目增加到 8 个

推理区的变化不是单纯增加 engine：

- LMCache 让 KV cache 从引擎内部优化变成可持久化、跨引擎复用的独立层；
- vLLM-Omni 把 serving 扩展到文本、图像、音频、视频与 action output；
- vLLM-Ascend 补上 CUDA 之外的硬件与开发者社区；
- vLLM、SGLang、TensorRT-LLM、llama.cpp 等继续表达核心引擎差异。

Agent workload 往往包含长上下文、多轮执行和重复前缀，因此 cache、调度与恢复更容易成为系统瓶颈。

## 数据口径

- OpenRank：2026-06 Repo OpenRank，图中用于表达近期协作信号。
- Stars：GitHub 2026-07-28 快照，只表示累计关注度。
- WatchEvent：2026-05-01 至 07-28 的可见事件，只用于候选发现。
- License：GitHub API 当前识别结果，`NOASSERTION` 不等于没有许可证，需要回到仓库核验。

## 数据限制

- OpenRank 不能替代模型性能、部署份额或真实 token 使用。
- 同一技术栈的主仓库、插件与硬件适配项目可能共享大量贡献者，需要结合结构代表性去重。
- 最近两个月的 OpenRank 与事件数据存在覆盖和回填问题。
- Large Models 使用另一套方法，不从 GitHub 仓库热度直接推导模型采用情况。

## 给演讲者的讲法

先交代读图方式：

> 这张图覆盖模型访问、训练、数据和计算。57 个项目里有 10 个是这次新加的。我们真正想指出的变化集中在 Serving · Inference。

再解释 `6 → 8`：

> vLLM、SGLang 还是大家熟悉的推理引擎，但现在已经不能只看引擎本身。LMCache 在处理 KV cache 的跨请求和跨引擎复用；vLLM-Omni 把图像、音频和视频带进 serving；vLLM-Ascend 代表硬件适配也开始形成自己的协作面。

把趋势落到 Agent workload：

> Agent 把一次调用拉成连续几十步以后，缓存能不能复用、请求怎样排队、不同硬件怎样接入，会直接影响成本和延迟。OpenRank 只能描述协作活跃度，不能拿来证明哪个推理系统性能最好。

最后接 Large Models：

> 基础设施在变复杂，但模型使用端到底更偏向开放权重还是闭源 API？我们用同一个完整月份的数据来看。
