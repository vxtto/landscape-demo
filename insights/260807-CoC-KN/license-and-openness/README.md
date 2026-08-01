# Landscape 许可证与模型开放度研究

数据快照：2026-07-28  
统计对象：Agent Infra 74 个项目、Model Infra 58 个项目，共 132 个唯一 GitHub 仓库。  
许可证字段：GitHub 仓库元数据中的 SPDX 标识。它适合做仓库层分布统计，不替代逐项目法律审查，也不能代表另行分发的模型权重、数据或文档所用条款。

## 132 个项目的许可证分布

| SPDX 标识 | 全部项目 | 占比 | Agent Infra | Model Infra |
| --- | ---: | ---: | ---: | ---: |
| Apache-2.0 | 61 | 46.2% | 22 | 39 |
| MIT | 37 | 28.0% | 27 | 10 |
| NOASSERTION | 25 | 18.9% | 18 | 7 |
| AGPL-3.0 | 7 | 5.3% | 6 | 1 |
| BSD-2-Clause | 1 | 0.8% | 1 | 0 |
| BSD-3-Clause | 1 | 0.8% | 0 | 1 |

Apache-2.0 与 MIT 合计 98 个，占全部项目的 74.2%；在 107 个有可识别 SPDX 标识的项目中占 91.6%。

`NOASSERTION` 沿用 SPDX 的原意：没有得出许可证结论、没有尝试得出结论，或刻意不提供信息。它不等于“没有许可证”。本次统计将其保留为未知状态。

复算：

```bash
python3 insights/260807-CoC-KN/license-and-openness/analysis/build_license_snapshot.py
```

输出文件：[license_distribution_2026-07-28.json](data/license_distribution_2026-07-28.json)

## Hugging Face 文本生成模型仓库 Top 100

快照日期：2026-07-31

统计对象：Hugging Face Hub 中标注为 `text-generation`、按 Hub `downloads` 字段降序排列的前 100 个模型仓库。许可证来自模型卡 metadata 的 `license` tag。

| 许可证标识 | 模型仓库数 | 占比 |
| --- | ---: | ---: |
| apache-2.0 | 57 | 57% |
| mit | 18 | 18% |
| other | 9 | 9% |
| llama3.2 | 4 | 4% |
| llama3.1 | 2 | 2% |
| llama3 | 2 | 2% |
| gemma | 2 | 2% |
| apple-amlr | 1 | 1% |
| 未标注 | 5 | 5% |

合并后，Apache-2.0 与 MIT 占 75%；模型专用或其他条款占 20%；没有 `license` tag 的仓库占 5%。这说明软件许可证仍然覆盖大多数热门模型仓库，同时，Llama、Gemma 等模型专用条款已经形成清晰的一块。

这里的单位是模型仓库，不是独立模型家族。Top 100 中可能包含微调、量化、测试仓库和同一模型家族的多个版本；`downloads` 是 Hub 提供的仓库热度字段，不代表能力排名。许可证 tag 也不能证明训练数据、代码和其他修改材料已经公开。

复算（也可以传入已保存的 API 响应）：

```bash
python3 insights/260807-CoC-KN/license-and-openness/analysis/build_hf_top100_license_snapshot.py
```

输出文件：[hf_top100_text_generation_licenses_2026-07-31.json](data/hf_top100_text_generation_licenses_2026-07-31.json)

## 从软件许可证到模型条款，发生了什么变化

| 问题 | 开源软件 | 开放模型 |
| --- | --- | --- |
| 被许可的对象 | 源代码、目标代码、文档和衍生作品 | 权重、架构、代码、数据、文档可能由不同主体提供，并适用不同条款 |
| 首要修改形式 | 源代码通常就是首要修改形式 | OSAID 1.0 将参数、完整训练和运行代码、数据说明纳入修改所需材料 |
| 权利组合 | 版权与专利授权是核心 | 还可能涉及数据库权利、商业秘密以及训练数据和内容的第三方权利 |
| 使用限制 | OSI 认可的软件许可证不得限制特定用途或领域 | 部分模型专用条款附带 acceptable-use 或领域限制；这类限制与 OSAID 的自由并不等价 |
| 衍生与分发 | 主要围绕 Source、Object 与 Derivative Works | checkpoint、微调模型、adapter 和模型输出可能适用不同规则 |
| 验证方式 | 能否从源码构建、修改和再分发 | 先核对法律权利，再核对材料是否足以研究、修改和复现 |

因此，模型“开放”至少有三个相互独立的问题：

1. **权利**：条款是否允许使用、研究、修改和分享。
2. **材料**：权重之外，代码、数据说明、评测和文档交付到什么程度。
3. **过程**：这些材料是否由可参与、可审查、可持续的社区维护。

许可证回答第一个问题的一部分，无法自动补齐第二和第三个问题。

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
- [Hugging Face Hub API](https://huggingface.co/docs/hub/api)
- [Hugging Face Model Card metadata](https://huggingface.co/docs/hub/model-cards)
- [SPDX Package Information: concluded license and NOASSERTION](https://spdx.github.io/spdx-spec/v2.3/package-information/)
