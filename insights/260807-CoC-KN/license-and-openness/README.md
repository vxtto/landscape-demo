# Landscape 许可证与模型开放度研究

数据快照：2026-07-28  
统计对象：Agent Infra 69 个项目、Model Infra 57 个项目，共 126 个唯一 GitHub 仓库。  
许可证字段：GitHub 仓库元数据中的 SPDX 标识。它适合做仓库层分布统计，不替代逐项目法律审查，也不能代表另行分发的模型权重、数据或文档所用条款。

## 126 个项目的许可证分布

| SPDX 标识 | 全部项目 | 占比 | Agent Infra | Model Infra |
| --- | ---: | ---: | ---: | ---: |
| Apache-2.0 | 60 | 47.6% | 21 | 39 |
| MIT | 33 | 26.2% | 24 | 9 |
| NOASSERTION | 25 | 19.8% | 18 | 7 |
| AGPL-3.0 | 6 | 4.8% | 5 | 1 |
| BSD-2-Clause | 1 | 0.8% | 1 | 0 |
| BSD-3-Clause | 1 | 0.8% | 0 | 1 |

Apache-2.0 与 MIT 合计 93 个，占全部项目的 73.8%；在 101 个有可识别 SPDX 标识的项目中占 92.1%。

`NOASSERTION` 沿用 SPDX 的原意：没有得出许可证结论、没有尝试得出结论，或刻意不提供信息。它不等于“没有许可证”。本次统计将其保留为未知状态。

复算：

```bash
python3 insights/260807-CoC-KN/license-and-openness/analysis/build_license_snapshot.py
```

输出文件：[license_distribution_2026-07-28.json](data/license_distribution_2026-07-28.json)

## Apache-2.0 与 OpenMDW-1.1

| 比较项 | Apache License 2.0 | OpenMDW 1.1 |
| --- | --- | --- |
| 授权对象 | `Work`、`Source`、`Object`、`Derivative Works`；典型场景是软件、文档和二进制分发 | 模型架构与参数，以及发布者实际置于 OpenMDW 下的数据、软件、文档等 `Model Materials` |
| 明示覆盖的权利 | 版权、专利 | 版权、专利、数据库权利、商业秘密权利 |
| 使用与修改 | 允许复制、修改、制作衍生作品和分发，受许可证条件约束 | 允许不受限制地处理 Model Materials，包括使用、复制、修改和分发，受许可证条件约束 |
| 再分发义务 | 附许可证副本；标记修改文件；保留适用声明；按条件处理 NOTICE | 附许可证副本；保留适用的版权和来源声明 |
| 诉讼触发终止 | 就相关 Work 或 Contribution 发起专利诉讼时，专利许可终止 | 就 Model Materials 发起专利或版权诉讼时，全部授权终止；防御性反诉除外 |
| 模型输出 | 没有单独定义模型推理输出 | 明确不对模型输出的使用、修改或分享附加限制与义务；适用法律可能另有要求 |
| 材料完整性 | 管辖已经置于许可证下的 Work，不要求补齐模型训练材料 | 管辖已经提供的 Model Materials，不强制发布者交出训练代码、数据或其他材料 |
| 第三方权利 | “AS IS”、排除保证、限制责任；不授予商标权 | “AS IS”、排除保证、限制责任；使用者自行处理第三方权利和适用法律 |

演讲时可以抓住三个差异：

1. 软件许可证以源代码、目标形式和衍生作品为中心；模型发布同时涉及参数、架构、数据、代码和文档。
2. OpenMDW 明示覆盖数据库权利与商业秘密权利，并直接处理模型输出；Apache-2.0 没有针对这些模型场景写专门条款。
3. OpenMDW 没有强制材料完整。一个模型可以使用 OpenMDW，却只发布权重。材料是否足以研究、修改或复现，需要 MOF、OSAID 以及逐项检查提供第二层信息。

以上内容用于研究与演讲，不构成法律意见。

## 六项等权材料检查

页面保留等权计算，每项占 `1/6`，勾选一项显示 17%。百分比只表示这六项的材料覆盖率。

| 页面检查项 | 依据 |
| --- | --- |
| 模型权重 | OSAID `Parameters`；MOF `Model Parameters` |
| 架构说明 | OSAID `Code` 中的 model architecture；MOF `Model Architecture` |
| 训练代码 | OSAID complete source code used to train and run；MOF `Training Code` |
| 数据来源说明 | OSAID `Data Information`；MOF `Data Card` / `Datasets` |
| 评测方法与结果 | MOF `Evaluation Code`、`Evaluation Data`、`Evaluation Results` |
| 使用与修改文档 | OSAID preferred form to make modifications；MOF `Model Card` / `Technical Report` |

六项是为演讲压缩后的检查表，不是 MOF 的正式评分，也不是 OSAID 认证。

## Primary references

- [Apache License 2.0 full text](https://www.apache.org/licenses/LICENSE-2.0.html)
- [Applying the Apache License 2.0](https://www.apache.org/legal/apply-license)
- [OpenMDW 1.1 full text](https://openmdw.ai/license/1-1/)
- [OpenMDW FAQ](https://openmdw.ai/faq/)
- [Model Openness Framework Specification 1.0](https://lfaidata.foundation/wp-content/uploads/sites/3/2025/01/05_White_paper_MOF_Specification.pdf)
- [Open Source AI Definition 1.0](https://opensource.org/ai/open-source-ai-definition)
- [SPDX Package Information: concluded license and NOASSERTION](https://spdx.github.io/spdx-spec/v2.3/package-information/)
