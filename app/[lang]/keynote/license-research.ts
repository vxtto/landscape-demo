import type { LandscapeProject } from "@/lib/landscape-types";

export type LicenseLayer = "all" | "agent" | "model";

export const licenseLayerLabels: Array<[LicenseLayer, string]> = [
  ["all", "全部项目"],
  ["agent", "Agent Infra"],
  ["model", "Model Infra"],
];

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

export const apacheOpenMdwComparison = [
  {
    topic: "授权对象",
    apache:
      "Work、Source、Object、Derivative Works；典型场景是软件、文档与二进制分发。",
    openMdw:
      "模型架构与参数，以及发布者实际放在 OpenMDW 下的数据、代码、文档等 Model Materials。",
  },
  {
    topic: "明示覆盖的权利",
    apache: "版权许可与专利许可。",
    openMdw: "版权、专利、数据库权利与商业秘密权利。",
  },
  {
    topic: "再分发义务",
    apache:
      "附许可证副本；修改文件要有显著说明；保留版权、专利、商标和署名；按条件处理 NOTICE。",
    openMdw:
      "附许可证副本，并保留适用的版权与来源声明；文本更短，围绕 Model Materials。",
  },
  {
    topic: "诉讼触发终止",
    apache:
      "就相关 Work 或 Contribution 发起专利诉讼时，专利许可终止。",
    openMdw:
      "就 Model Materials 发起专利或版权侵权诉讼时，全部授权终止；防御性反诉除外。",
  },
  {
    topic: "模型输出",
    apache: "没有单独定义模型推理输出。",
    openMdw:
      "明确不对使用、修改或分享模型输出附加限制或义务；适用法律仍可能另有要求。",
  },
  {
    topic: "材料完整性",
    apache:
      "许可证管辖被许可的 Work，不要求随软件补齐模型权重、训练数据或训练流程。",
    openMdw:
      "只管已经提供的 Model Materials，不强制发布者交付训练代码、数据或其他完整材料。",
  },
  {
    topic: "第三方权利与风险",
    apache:
      "按“AS IS”提供，排除保证并限制责任；商标权不随许可证授予。",
    openMdw:
      "按“AS IS”提供；使用者自行处理数据、内容等第三方权利和适用法律要求。",
  },
] as const;

export const materialChecks = [
  {
    label: "模型权重",
    reference: "OSAID Parameters；MOF Model Parameters",
  },
  {
    label: "架构说明",
    reference: "OSAID Code / model architecture；MOF Model Architecture",
  },
  {
    label: "训练代码",
    reference: "OSAID complete source code；MOF Training Code",
  },
  {
    label: "数据来源说明",
    reference: "OSAID Data Information；MOF Data Card / Datasets",
  },
  {
    label: "评测方法与结果",
    reference: "MOF Evaluation Code、Data 与 Results",
  },
  {
    label: "使用与修改文档",
    reference: "OSAID preferred form；MOF Model Card / Technical Report",
  },
] as const;

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
