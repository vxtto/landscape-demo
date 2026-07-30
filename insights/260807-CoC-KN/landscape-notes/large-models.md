# Large Models 全景图说明

数据窗口：2026-06-01 至 2026-06-30，上一完整自然月。

## 为什么不用 GitHub stars 排模型

模型的仓库热度很容易受到 SDK、模型家族总仓库和发布方式影响。Large Models 图改用两组互相独立的证据：

- OpenRouter 与 ZenMux 的真实 token 使用；
- Hugging Face 上官方权重仓库、许可证、gating 与模型元数据。

主表的粒度是“一个托管模型 endpoint / release”。同一 endpoint 的免费和付费别名合并，避免重复占位。

## 时间窗口怎样确定

脚本使用 `previous_complete_month(today)`：

1. 取当前月份第一天；
2. 向前退一天得到上月最后一天；
3. 再取该月第一天。

脚本在 2026 年 7 月运行，因此数据窗口固定为 2026-06-01 至 06-30。当前月数据不会进入主表。

实现见 [build_monthly_open_closed_model_table.py](../large-models-refresh/analysis/build_monthly_open_closed_model_table.py)。

## OpenRouter 月度数据

接口：

```text
https://openrouter.ai/api/v1/datasets/rankings-daily
```

请求参数：

```text
start_date=2026-06-01
end_date=2026-06-30
```

处理方式：

- 每天公开 Top 50 模型和一个 `other` 汇总项；
- 30 天共返回 1,530 条日度记录；
- 月内 78 个具名模型至少进入过一次每日 Top 50；
- 每个模型累加 prompt + completion tokens；
- 同时记录进入日榜的天数；
- 具名模型覆盖 93.5989% 的可见 token。

限制：一个模型如果整月都没有进入每日 Top 50，它的流量会落在 `other`，无法获得具名月度 token。

## ZenMux 月度数据

接口：

```text
https://zenmux.ai/api/v1/management/statistics/leaderboard
```

请求参数：

```text
metric=tokens
starting_at=2026-06-01
ending_at=2026-06-30
limit=50
```

结果：

- 50 个具名模型；
- 1 个 `__others__` 汇总项；
- 指标为整月 prompt + completion tokens；
- 具名模型覆盖 99.5243% 的 token。

榜外意味着“没有进入可见 Top 50”，不等于零使用。

## 为什么不能直接相加两家的 token

OpenRouter 与 ZenMux 的平台规模、用户结构、供应商覆盖和 tokenizer 口径不同。直接相加会让体量更大的平台主导结果。

主比较先在各平台内部计算 token 百分位：

```text
usage composite
= 50% OpenRouter monthly token percentile
+ 50% ZenMux monthly token percentile
```

缺席某个平台 Top 50 的模型在该平台记零。综合分相同的时候，优先保留在较弱平台上表现更好的模型。

完整说明见 [monthly_source_summary.json](../large-models-refresh/data/monthly_source_summary.json)。

## Hugging Face 在这里做什么

Hugging Face 不进入开放与闭源模型的共同 usage composite。它用于核验：

- 是否存在官方公开权重仓库；
- 许可证；
- 是否 gated；
- 30 天与累计 downloads；
- likes；
- pipeline tag；
- architecture、model type 与参数量；
- 模型卡信息。

开放权重候选 36 个，36 个都完成了 Hugging Face 仓库解析。

`hf_open_ecosystem_score` 只描述开放权重模型内部的生态采用：

```text
75% HF 30-day downloads percentile
+ 25% HF likes percentile
```

这个分数不会和闭源模型进行比较。

## 最终 Top 50 的结构

- 开放权重：24；
- 无公开权重：26；
- Top 10 中开放权重：5；
- Top 10 中无公开权重：5；
- 两个平台都有可见使用信号：37 / 50；
- 综合排名最高的开放权重模型：DeepSeek V4 Flash，rank 1；
- 综合排名最高的无公开权重模型：Claude Opus 4.8，rank 3。

主表：[monthly_models_top50_open_closed.csv](../large-models-refresh/data/monthly_models_top50_open_closed.csv)

质量检查：[monthly_data_quality_checks.csv](../large-models-refresh/data/monthly_data_quality_checks.csv)

## “Open weight” 的边界

图里的开放权重表示解析到了官方公开 Hugging Face 权重仓库。它不能自动推出：

- 训练代码开放；
- 训练数据可检查；
- 商业使用不受限制；
- 可以自由再分发；
- 满足 OSI 对 open source AI 的定义。

因此图中同时展示 license class、gating 和材料完整度，后续许可证章节再继续讨论。

## 给演讲者的讲法

先把时间窗口讲清楚：

> 我们取的是 2026 年 6 月 1 日到 30 日，一个完整自然月。OpenRouter 和 ZenMux 的原始 token 数不能直接相加，所以先在各自平台内部换成百分位，再各占 50%。

然后讲唯一需要观众记住的结果：

> Top 50 里有 24 个开放权重模型，26 个没有公开权重，几乎对半。Top 10 里两边刚好各 5 个，综合第一还是 DeepSeek V4 Flash。至少在这一个月、这两个平台上，开放权重模型已经处在主流使用区。

主动限制结论：

> 这里不要讲成“开放模型赢了”。这份数据只覆盖两个模型聚合平台，而且榜外模型会进入 other。它能说明使用格局已经混在一起，不能代表整个市场。

最后接许可证：

> 同样叫开放权重，发布者提供的材料差异很大。有的只有权重，有的还有训练代码、数据说明和评测。使用量看不出这些差别，许可证也只能回答其中一部分。

如果观众追问排名，可以补充：

> 我们没有把两家平台的 token 直接相加。每家先算自己的月度百分位，再各占一半。这样可以减少平台体量和 tokenizer 口径带来的偏差。
