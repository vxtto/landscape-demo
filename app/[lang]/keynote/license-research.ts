import type { LandscapeProject } from "@/lib/landscape-types";

import { type Localized, pick } from "./i18n";
import type { Locale } from "../dictionaries";

export type LicenseLayer = "all" | "agent" | "model";

const licenseLayerLabelsSource: Array<[LicenseLayer, Localized<string>]> = [
  ["all", { en: "All projects", zh: "全部项目" }],
  ["agent", { en: "Agent Infra", zh: "Agent Infra" }],
  ["model", { en: "Model Infra", zh: "Model Infra" }],
];

export function getLicenseLayerLabels(
  lang: Locale,
): Array<[LicenseLayer, string]> {
  return licenseLayerLabelsSource.map(([key, label]) => [key, pick(lang, label)]);
}

export const licenseDisplayNames: Record<string, string> = {
  "Apache-2.0": "Apache-2.0",
  MIT: "MIT",
  NOASSERTION: "NOASSERTION",
  "AGPL-3.0": "AGPL-3.0",
  "BSD-2-Clause": "BSD-2-Clause",
  "BSD-3-Clause": "BSD-3-Clause",
};

export const licenseColors: Record<string, string> = {
  "Apache-2.0": "#6d50ff",
  MIT: "#ff4fa3",
  NOASSERTION: "#b7b7b1",
  "AGPL-3.0": "#ff9d42",
  "BSD-2-Clause": "#45bfd1",
  "BSD-3-Clause": "#45bfd1",
};

export function projectsForLicenseLayer(
  projects: LandscapeProject[],
  layer: LicenseLayer,
) {
  if (layer === "all") return projects;
  const landscapeLayer = layer === "agent" ? "Agent Infra" : "Model Infra";
  return projects.filter((project) => project.categories[0] === landscapeLayer);
}

export function buildLicenseDistribution(projects: LandscapeProject[]) {
  const counts = new Map<string, number>();
  projects.forEach((project) => {
    const licenseId = project.license || "NOASSERTION";
    counts.set(licenseId, (counts.get(licenseId) ?? 0) + 1);
  });

  return [...counts]
    .map(([licenseId, count]) => ({
      licenseId,
      count,
      share: projects.length ? (count / projects.length) * 100 : 0,
    }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        left.licenseId.localeCompare(right.licenseId),
    );
}

const apacheOpenMdwComparisonSource: {
  topic: Localized<string>;
  apache: Localized<string>;
  openMdw: Localized<string>;
}[] = [
  {
    topic: { en: "What is licensed", zh: "授权对象" },
    apache: {
      en: "Work, Source, Object, Derivative Works — the typical case is software, docs, and binary distribution.",
      zh: "Work、Source、Object、Derivative Works；典型场景是软件、文档与二进制分发。",
    },
    openMdw: {
      en: "Model architecture and parameters, plus whatever data, code, and documentation the publisher actually places under OpenMDW as Model Materials.",
      zh: "模型架构与参数，以及发布者实际放在 OpenMDW 下的数据、代码、文档等 Model Materials。",
    },
  },
  {
    topic: { en: "Rights explicitly covered", zh: "明示覆盖的权利" },
    apache: { en: "Copyright license and patent license.", zh: "版权许可与专利许可。" },
    openMdw: {
      en: "Copyright, patent, database rights, and trade secret rights.",
      zh: "版权、专利、数据库权利与商业秘密权利。",
    },
  },
  {
    topic: { en: "Redistribution obligations", zh: "再分发义务" },
    apache: {
      en: "Include a copy of the license, mark changed files clearly, retain copyright/patent/trademark/attribution notices, and carry NOTICE where required.",
      zh: "附许可证副本；修改文件要有显著说明；保留版权、专利、商标和署名；按条件处理 NOTICE。",
    },
    openMdw: {
      en: "Include a copy of the license and retain the applicable copyright and provenance notices — shorter text, scoped to Model Materials.",
      zh: "附许可证副本，并保留适用的版权与来源声明；文本更短，围绕 Model Materials。",
    },
  },
  {
    topic: { en: "Termination on litigation", zh: "诉讼触发终止" },
    apache: {
      en: "The patent license terminates if you bring a patent suit over the Work or a Contribution.",
      zh: "就相关 Work 或 Contribution 发起专利诉讼时，专利许可终止。",
    },
    openMdw: {
      en: "All grants terminate if you bring a patent or copyright infringement suit over the Model Materials — defensive counterclaims excepted.",
      zh: "就 Model Materials 发起专利或版权侵权诉讼时，全部授权终止；防御性反诉除外。",
    },
  },
  {
    topic: { en: "Model output", zh: "模型输出" },
    apache: { en: "Has no separate concept of inference output.", zh: "没有单独定义模型推理输出。" },
    openMdw: {
      en: "States explicitly that it adds no restriction or obligation to using, modifying, or sharing model output — other applicable law may still apply.",
      zh: "明确不对使用、修改或分享模型输出附加限制或义务；适用法律仍可能另有要求。",
    },
  },
  {
    topic: { en: "Completeness of materials", zh: "材料完整性" },
    apache: {
      en: "Governs the licensed Work; does not require weights, training data, or a training pipeline to ship alongside the software.",
      zh: "许可证管辖被许可的 Work，不要求随软件补齐模型权重、训练数据或训练流程。",
    },
    openMdw: {
      en: "Only governs the Model Materials that were actually provided; it does not force the publisher to hand over training code, data, or anything else.",
      zh: "只管已经提供的 Model Materials，不强制发布者交付训练代码、数据或其他完整材料。",
    },
  },
  {
    topic: { en: "Third-party rights and risk", zh: "第三方权利与风险" },
    apache: {
      en: 'Provided "AS IS", disclaims warranties and limits liability; trademark rights are not granted by the license.',
      zh: "按“AS IS”提供，排除保证并限制责任；商标权不随许可证授予。",
    },
    openMdw: {
      en: 'Provided "AS IS"; users handle third-party rights in data and content, and any applicable law, on their own.',
      zh: "按“AS IS”提供；使用者自行处理数据、内容等第三方权利和适用法律要求。",
    },
  },
];

export function getApacheOpenMdwComparison(lang: Locale) {
  return apacheOpenMdwComparisonSource.map((row) => ({
    topic: pick(lang, row.topic),
    apache: pick(lang, row.apache),
    openMdw: pick(lang, row.openMdw),
  }));
}

const materialChecksSource: { label: Localized<string>; reference: string }[] = [
  { label: { en: "Model weights", zh: "模型权重" }, reference: "OSAID Parameters; MOF Model Parameters" },
  {
    label: { en: "Architecture description", zh: "架构说明" },
    reference: "OSAID Code / model architecture; MOF Model Architecture",
  },
  { label: { en: "Training code", zh: "训练代码" }, reference: "OSAID complete source code; MOF Training Code" },
  {
    label: { en: "Data provenance notes", zh: "数据来源说明" },
    reference: "OSAID Data Information; MOF Data Card / Datasets",
  },
  {
    label: { en: "Evaluation method and results", zh: "评测方法与结果" },
    reference: "MOF Evaluation Code, Data & Results",
  },
  {
    label: { en: "Usage and modification docs", zh: "使用与修改文档" },
    reference: "OSAID preferred form; MOF Model Card / Technical Report",
  },
];

export function getMaterialChecks(lang: Locale) {
  return materialChecksSource.map((item) => ({
    label: pick(lang, item.label),
    reference: item.reference,
  }));
}

export const licenseReferences = [
  {
    label: "Apache License 2.0",
    href: "https://www.apache.org/licenses/LICENSE-2.0.html",
  },
  {
    label: "OpenMDW 1.1",
    href: "https://openmdw.ai/license/1-1/",
  },
  {
    label: "OpenMDW FAQ",
    href: "https://openmdw.ai/faq/",
  },
  {
    label: "MOF 1.0",
    href: "https://lfaidata.foundation/wp-content/uploads/sites/3/2025/01/05_White_paper_MOF_Specification.pdf",
  },
  {
    label: "OSAID 1.0",
    href: "https://opensource.org/ai/open-source-ai-definition",
  },
  {
    label: "SPDX NOASSERTION",
    href: "https://spdx.github.io/spdx-spec/v2.3/package-information/",
  },
] as const;
