"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import LandscapeExplorer from "@/app/components/landscape-explorer";
import LandscapeLogo from "@/app/components/landscape-logo";
import type { LandscapeProject } from "@/lib/landscape-types";

import { type ApacheDomainKey, getApacheBackbone } from "../apache-ecosystem";
import ApacheProjectAtlas from "../apache-project-atlas";
import {
  type CommunityKey,
  type StackKey,
  getCommunityData,
  getInclusionServices,
  getStackData,
} from "../keynote-experience";
import { type Localized, pick } from "../i18n";
import type { Locale } from "../../dictionaries";
import LocaleSwitch from "../../locale-switch";
import researchStyles from "../page.module.css";
import styles from "./presentation.module.css";

type Chapter =
  | "open"
  | "landscape"
  | "apache"
  | "inclusion"
  | "license"
  | "community";

type Scene = {
  id: string;
  chapter: Chapter;
  label: string;
  duration: string;
  maxBuild: number;
};

type SwipeStart = {
  pointerId: number;
  x: number;
  y: number;
  time: number;
};

function resolveSwipeDirection(
  start: SwipeStart,
  endX: number,
  endY: number,
  endTime: number,
  viewportWidth: number,
) {
  const deltaX = endX - start.x;
  const deltaY = endY - start.y;
  const minimumDistance = Math.max(56, Math.min(110, viewportWidth * 0.06));

  if (endTime - start.time > 1400) return null;
  if (Math.abs(deltaX) < minimumDistance) return null;
  if (Math.abs(deltaX) < Math.abs(deltaY) * 1.25) return null;

  return deltaX < 0 ? "next" : "previous";
}

const scenes: Scene[] = [
  { id: "title", chapter: "open", label: "OPEN", duration: "0:00—0:45", maxBuild: 0 },
  { id: "question", chapter: "open", label: "QUESTION", duration: "0:45—1:40", maxBuild: 1 },
  { id: "agent", chapter: "landscape", label: "AGENT INFRA", duration: "1:40—3:25", maxBuild: 4 },
  { id: "model", chapter: "landscape", label: "MODEL INFRA", duration: "3:25—5:05", maxBuild: 3 },
  { id: "large", chapter: "landscape", label: "LARGE MODELS", duration: "5:05—6:35", maxBuild: 3 },
  { id: "awesome", chapter: "landscape", label: "AWESOME", duration: "6:35—7:55", maxBuild: 3 },
  { id: "method", chapter: "landscape", label: "METHOD", duration: "7:55—9:45", maxBuild: 3 },
  { id: "production", chapter: "apache", label: "TURN", duration: "9:45—10:20", maxBuild: 1 },
  { id: "apache-scale", chapter: "apache", label: "APACHE", duration: "10:20—11:45", maxBuild: 1 },
  { id: "apache-position", chapter: "apache", label: "POSITION", duration: "11:45—14:00", maxBuild: 3 },
  { id: "ant-apache", chapter: "apache", label: "ANT × APACHE", duration: "14:00—15:50", maxBuild: 3 },
  { id: "inclusion-scale", chapter: "inclusion", label: "INCLUSIONAI", duration: "15:50—17:20", maxBuild: 1 },
  { id: "inclusion-stack", chapter: "inclusion", label: "PARTICIPATION", duration: "17:20—20:20", maxBuild: 4 },
  { id: "license-question", chapter: "license", label: "OPEN MODEL", duration: "20:20—21:05", maxBuild: 1 },
  { id: "license-distribution", chapter: "license", label: "LICENSE DATA", duration: "21:05—22:35", maxBuild: 1 },
  { id: "license-compare", chapter: "license", label: "WHAT CHANGED", duration: "22:35—24:10", maxBuild: 2 },
  { id: "license-layers", chapter: "license", label: "LICENSE", duration: "24:10—25:30", maxBuild: 2 },
  { id: "release-check", chapter: "license", label: "RELEASE CHECK", duration: "25:30—27:00", maxBuild: 3 },
  { id: "community", chapter: "community", label: "COMMUNITY", duration: "27:00—29:20", maxBuild: 4 },
  { id: "close", chapter: "community", label: "CLOSE", duration: "29:20—30:00", maxBuild: 0 },
];

const chapterLabelsSource: Array<{ id: Chapter; label: Localized<string> }> = [
  { id: "open", label: { en: "Open", zh: "开场" } },
  { id: "landscape", label: { en: "Landscape", zh: "生态" } },
  { id: "apache", label: { en: "Apache", zh: "Apache" } },
  { id: "inclusion", label: { en: "InclusionAI", zh: "InclusionAI" } },
  { id: "license", label: { en: "Open models", zh: "开放模型" } },
  { id: "community", label: { en: "Community", zh: "Community" } },
];

type LandscapeStageInsight = {
  angle: string;
  metric: string;
  label: string;
  note: string;
  focus?: string;
  interaction?: "top10" | "open" | "aai" | "direct" | "install" | "all";
};

type LocalizedStageInsight = {
  angle: Localized<string>;
  metric: string;
  label: Localized<string>;
  note: Localized<string>;
  focus?: string;
  interaction?: LandscapeStageInsight["interaction"];
};

function resolveInsights(lang: Locale, insights: LocalizedStageInsight[]): LandscapeStageInsight[] {
  return insights.map((insight) => ({
    angle: pick(lang, insight.angle),
    metric: insight.metric,
    label: pick(lang, insight.label),
    note: pick(lang, insight.note),
    focus: insight.focus,
    interaction: insight.interaction,
  }));
}

const externalLandscapesSource: Record<
  "large" | "awesome",
  { src: string; insights: LocalizedStageInsight[] }
> = {
  large: {
    src: "/keynote/large-models/index.html",
    insights: [
      {
        angle: { en: "Real usage", zh: "真实使用" },
        metric: "5 / 5",
        label: { en: "Top 10 splits evenly between both model types", zh: "Top 10 两类模型各占一半" },
        note: {
          en: "In June 2026, both open-weight and no-public-weight models reached mainstream usage.",
          zh: "2026 年 6 月，开放权重与无公开权重模型都进入了主流使用区。",
        },
        interaction: "top10",
      },
      {
        angle: { en: "Capability spread", zh: "能力分布" },
        metric: "12 / 13",
        label: { en: "Reasoning is almost entirely open-weight", zh: "Reasoning 区几乎都是开放权重模型" },
        note: {
          en: "Multimodal/VLM runs the other way: 22 of 30 models have no public weights. Openness clearly correlates with model type.",
          zh: "Multimodal / VLM 则相反：30 个模型中有 22 个没有公开权重。开放程度和模型类型明显相关。",
        },
        interaction: "open",
      },
      {
        angle: { en: "Usage vs. capability", zh: "使用与能力" },
        metric: "#1 / #25",
        label: { en: "Public usage and capability leaderboards don't line up", zh: "公开使用与能力榜没有排成同一条队伍" },
        note: {
          en: "Among 8 comparable AAI samples, the #1 model by usage has an AAI of 40.3; the model with the highest AAI ranks #25 by usage.",
          zh: "8 个可比 AAI 样本中，使用第 1 的模型 AAI 为 40.3；AAI 最高的模型使用排名第 25。",
        },
        interaction: "aai",
      },
    ],
  },
  awesome: {
    src: "/keynote/awesome/awesome_agentic_landscape_2026.html",
    insights: [
      {
        angle: { en: "Consumability", zh: "可消费性" },
        metric: "19 / 26",
        label: { en: "Most shortlisted projects already ship agent-readable material", zh: "多数入图项目已经提供 Agent 可直接读取的材料" },
        note: {
          en: "The basis: the repo genuinely has a skill, instruction, hook, workflow, or MCP config.",
          zh: "判断依据是仓库里确实有 skill、instruction、hook、workflow 或 MCP 配置。",
        },
        interaction: "direct",
      },
      {
        angle: { en: "Usage path", zh: "使用路径" },
        metric: "7 / 7",
        label: { en: "Install is the only stage that's 100% direct", zh: "Install 是唯一全部达到 direct 的阶段" },
        note: {
          en: "By the install stage, checklists, configs, and tool entry points have largely become machine-executable deliverables.",
          zh: "到了安装环节，清单、配置和工具入口已经普遍变成机器可执行的交付物。",
        },
        interaction: "install",
      },
      {
        angle: { en: "Pace of formation", zh: "形成速度" },
        metric: "22 / 26",
        label: { en: "22 of 26 shortlisted projects were created after 2025", zh: "入图项目中有 22 个创建于 2025 年以后" },
        note: {
          en: "This describes the editorial sample's age, not all of GitHub — but it shows agent-native knowledge assets are still forming fast.",
          zh: "这是编辑样本的年龄结构，不代表 GitHub 全量；但它说明 Agent-native 的知识资产还在快速形成。",
        },
        interaction: "all",
      },
    ],
  },
};

type ExternalLandscapeId = keyof typeof externalLandscapesSource;

const landscapeInsightsSource: Record<"agent" | "model", LocalizedStageInsight[]> = {
  agent: [
    {
      angle: { en: "Current structure", zh: "当前结构" },
      metric: "22 / 74",
      label: { en: "The two largest sections still center on coding", zh: "最大的两个 section 仍然围绕 coding" },
      note: {
        en: "Agentic coding has 12 projects, code-first frameworks has 10. Code is still the densest entry point into agents.",
        zh: "Agentic coding 有 12 个项目，Code-first frameworks 有 10 个。代码仍是最密集的 Agent 入口。",
      },
      focus: "Agentic coding",
    },
    {
      angle: { en: "Recent signal", zh: "近期信号" },
      metric: "35.96 → 140.23",
      label: { en: "OpenViking · 2026-03—06 OpenRank", zh: "OpenViking · 2026-03—06 OpenRank" },
      note: {
        en: "Memory, RAG, and skills are folding into a context database; context is becoming its own data layer.",
        zh: "Memory、RAG 和 skills 开始收进 context database；上下文正在成为独立的数据层。",
      },
      focus: "Memory, knowledge & context",
    },
    {
      angle: { en: "Interface shift", zh: "接口变化" },
      metric: "3 → 5",
      label: { en: "Protocols & interoperability", zh: "Protocols & interoperability" },
      note: {
        en: "Beyond MCP and A2A, AG-UI and A2UI bring event streams and interfaces into the shared protocol layer.",
        zh: "MCP、A2A 之外，AG-UI 与 A2UI 把事件流和界面带进了公共接口层。",
      },
      focus: "Protocols & interoperability",
    },
    {
      angle: { en: "How improvement happens", zh: "改进方式" },
      metric: "15.2K / 45",
      label: { en: "SkillOpt · stars / July visible participants", zh: "SkillOpt · stars / 7 月可见参与者" },
      note: {
        en: "Skill docs are starting to go through rollouts, evaluation, and validation gates — agent improvement is stepping outside model-weight space.",
        zh: "skill 文档开始经历 rollout、评估和验证门；Agent 改进正在走出模型权重空间。",
      },
      focus: "Observability & evaluation",
    },
  ],
  model: [
    {
      angle: { en: "Recent signal", zh: "近期信号" },
      metric: "4.07 → 39.04",
      label: { en: "OmniRoute · 2026-02—06 OpenRank", zh: "OmniRoute · 2026-02—06 OpenRank" },
      note: {
        en: "Gateways are extending from model-API proxying into quota fallback and MCP/A2A traffic.",
        zh: "Gateway 正从模型 API 代理延伸到配额 fallback、MCP 与 A2A 流量。",
      },
      focus: "Model API gateways",
    },
    {
      angle: { en: "Execution chain", zh: "执行链路" },
      metric: "6 → 8",
      label: { en: "Serving · Inference", zh: "Serving · Inference" },
      note: {
        en: "LMCache adds KV cache reuse, vLLM-Omni adds multimodal serving — responsibilities within the inference zone are splitting apart.",
        zh: "LMCache 补上 KV cache 复用，vLLM-Omni 补上多模态 serving；推理区内部的职责已经分开。",
      },
      focus: "Serving · Inference",
    },
    {
      angle: { en: "Collaboration & license", zh: "协作许可" },
      metric: "39 / 58",
      label: { en: "Two-thirds of Model Infra uses Apache-2.0", zh: "Model Infra 中三分之二采用 Apache-2.0" },
      note: {
        en: "Hardware adaptation, patent grants, and enterprise collaboration keep Apache-2.0 a clear majority at this layer.",
        zh: "硬件适配、专利授权和企业协作，使 Apache-2.0 在这一层保持明显多数。",
      },
    },
  ],
};

const apacheDomainSequence: ApacheDomainKey[] = [
  "data",
  "libraries",
  "network",
  "operations",
];

const releaseMaterialsSource: [Localized<string>, number][] = [
  [{ en: "Model weights", zh: "模型权重" }, 0],
  [{ en: "Architecture description", zh: "架构说明" }, 1],
  [{ en: "Training code", zh: "训练代码" }, 2],
  [{ en: "Data provenance", zh: "数据来源" }, 2],
  [{ en: "Evaluation method", zh: "评测方法" }, 3],
  [{ en: "Modification docs", zh: "修改文档" }, 3],
];

const softwareLicenseDistribution = [
  { label: "Apache-2.0", value: 61, share: 46.2, color: "#6d50ff" },
  { label: "MIT", value: 37, share: 28.0, color: "#ff68b4" },
  { label: "NOASSERTION", value: 25, share: 18.9, color: "#b7b7b1" },
  { label: "Other", value: 9, share: 6.8, color: "#ff955d" },
] as const;

const modelLicenseDistribution = [
  { label: "Apache-2.0", value: 57, share: 57, color: "#6d50ff" },
  { label: "MIT", value: 18, share: 18, color: "#ff68b4" },
  { label: "Model-specific / other", value: 20, share: 20, color: "#73dce9" },
  { label: "No license tag", value: 5, share: 5, color: "#b7b7b1" },
] as const;

const licenseComparisonRowsSource: {
  topic: Localized<string>;
  software: Localized<string>;
  model: Localized<string>;
}[] = [
  {
    topic: { en: "What's licensed", zh: "被许可的对象" },
    software: { en: "Source code, object code, documentation, and derivative works", zh: "源代码、目标代码、文档与衍生作品" },
    model: { en: "Weights, architecture, code, data, and documentation may each carry separate rights", zh: "权重、架构、代码、数据与文档可能分别授权" },
  },
  {
    topic: { en: "Materials needed to modify", zh: "修改所需材料" },
    software: { en: "Source code is usually the primary form for modification", zh: "源代码通常就是首要修改形式" },
    model: { en: "Also needs parameters, training code, data notes, and evaluation method", zh: "还需要参数、训练代码、数据说明与评测方法" },
  },
  {
    topic: { en: "Combination of rights", zh: "权利组合" },
    software: { en: "Copyright and patent grants are the core", zh: "版权与专利授权是核心" },
    model: { en: "Also touches database rights, trade secrets, and third-party data rights", zh: "还会碰到数据库权利、商业秘密与数据第三方权利" },
  },
  {
    topic: { en: "Usage restrictions", zh: "使用限制" },
    software: { en: "OSI licenses may not restrict a specific use or field", zh: "OSI 许可不得限制特定用途或领域" },
    model: { en: "Some dedicated terms attach acceptable-use or field-of-use restrictions", zh: "部分专用条款另附可接受用途或领域限制" },
  },
  {
    topic: { en: "Derivatives and distribution", zh: "衍生与分发" },
    software: { en: "Built around Source, Object, and Derivative Works", zh: "围绕 Source、Object 与 Derivative Works" },
    model: { en: "Checkpoints, fine-tunes, adapters, and outputs may follow different rules", zh: "checkpoint、微调、adapter 与输出可能适用不同规则" },
  },
  {
    topic: { en: "How to verify openness", zh: "怎样验证开放" },
    software: { en: "Can it be built, modified, and redistributed from source", zh: "能从源码构建、修改和再分发" },
    model: { en: "Check legal rights first, then whether materials are sufficient to study and modify", zh: "先看法律权利，再看材料是否足以研究和修改" },
  },
];

const communityKeys: CommunityKey[] = [
  "discover",
  "propose",
  "review",
  "ship",
  "trust",
];

const communityStepLabels: Localized<string>[] = [
  { en: "Find the entry point", zh: "发现入口" },
  { en: "Propose a change", zh: "提出变更" },
  { en: "Review in the open", zh: "公开审查" },
  { en: "Ship together", zh: "共同交付" },
  { en: "Earn trust", zh: "积累信任" },
];

const pageText = {
  en: {
    backToKeynote: "← Back to keynote",
    timelineAria: "Talk chapter progress",
  },
  zh: {
    backToKeynote: "← 回到 keynote",
    timelineAria: "演讲章节进度",
  },
} as const;

export default function KeynotePresentation({
  projects,
  lang,
}: {
  projects: LandscapeProject[];
  lang: Locale;
}) {
  const t = pageText[lang];
  const [sceneIndex, setSceneIndex] = useState(0);
  const [build, setBuild] = useState(0);
  const hashReady = useRef(false);
  const swipeStart = useRef<SwipeStart | null>(null);
  const scene = scenes[sceneIndex];

  const goTo = useCallback((nextIndex: number, nextBuild = 0) => {
    const safeIndex = Math.max(0, Math.min(scenes.length - 1, nextIndex));
    const safeBuild = Math.max(
      0,
      Math.min(scenes[safeIndex].maxBuild, nextBuild),
    );
    setSceneIndex(safeIndex);
    setBuild(safeBuild);
  }, []);

  const next = useCallback(() => {
    if (build < scene.maxBuild) {
      setBuild((current) => current + 1);
      return;
    }
    if (sceneIndex < scenes.length - 1) goTo(sceneIndex + 1);
  }, [build, goTo, scene.maxBuild, sceneIndex]);

  const previous = useCallback(() => {
    if (build > 0) {
      setBuild((current) => current - 1);
      return;
    }
    if (sceneIndex > 0) {
      const previousIndex = sceneIndex - 1;
      goTo(previousIndex, scenes[previousIndex].maxBuild);
    }
  }, [build, goTo, sceneIndex]);

  const handlePointerDown = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      if (event.pointerType !== "touch") return;

      swipeStart.current = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        time: event.timeStamp,
      };

      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Synthetic events used in QA do not always register an active pointer.
      }
    },
    [],
  );

  const handlePointerUp = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      const start = swipeStart.current;
      swipeStart.current = null;
      if (!start || start.pointerId !== event.pointerId) return;

      const direction = resolveSwipeDirection(
        start,
        event.clientX,
        event.clientY,
        event.timeStamp,
        window.innerWidth,
      );
      if (direction) event.preventDefault();
      if (direction === "next") next();
      if (direction === "previous") previous();
    },
    [next, previous],
  );

  const handlePointerCancel = useCallback(() => {
    swipeStart.current = null;
  }, []);

  useEffect(() => {
    const restoreHash = () => {
      const raw = window.location.hash.replace("#", "");
      hashReady.current = true;
      if (!raw) {
        window.history.replaceState(null, "", `#${scenes[0].id}.0`);
        return;
      }
      const [sceneId, buildValue] = raw.split(".");
      const index = scenes.findIndex((item) => item.id === sceneId);
      if (index >= 0) {
        goTo(index, Number.parseInt(buildValue ?? "0", 10) || 0);
      }
    };

    window.addEventListener("hashchange", restoreHash);
    const restoreTimer = window.setTimeout(restoreHash, 0);
    return () => {
      window.clearTimeout(restoreTimer);
      window.removeEventListener("hashchange", restoreHash);
    };
  }, [goTo]);

  useEffect(() => {
    if (!hashReady.current) return;
    window.history.replaceState(null, "", `#${scene.id}.${build}`);
  }, [build, scene.id]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || event.repeat) return;

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("a, button, input, textarea, select")
      ) {
        return;
      }

      const nextKeys = ["PageDown", "ArrowDown", "ArrowRight"];
      const previousKeys = ["PageUp", "ArrowUp", "ArrowLeft"];

      if (nextKeys.includes(event.key)) {
        event.preventDefault();
        next();
        return;
      }

      if (previousKeys.includes(event.key)) {
        event.preventDefault();
        previous();
        return;
      }

      if (event.key === "Enter") {
        event.preventDefault();
        if (!document.fullscreenElement) {
          void document.documentElement.requestFullscreen().catch(() => undefined);
        }
        return;
      }

      if (event.key === "Escape" && document.fullscreenElement) {
        event.preventDefault();
        void document.exitFullscreen().catch(() => undefined);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [next, previous]);

  const chapterLabels = useMemo(
    () => chapterLabelsSource.map((chapter) => ({ id: chapter.id, label: pick(lang, chapter.label) })),
    [lang],
  );

  const chapterProgress = useMemo(
    () =>
      chapterLabels.map((chapter) => {
        const chapterScenes = scenes
          .map((item, index) => ({ ...item, index }))
          .filter((item) => item.chapter === chapter.id);
        const first = chapterScenes[0]?.index ?? 0;
        const last = chapterScenes.at(-1)?.index ?? first;
        return {
          ...chapter,
          active: sceneIndex >= first && sceneIndex <= last,
          complete: sceneIndex > last,
          width: chapterScenes.length,
        };
      }),
    [chapterLabels, sceneIndex],
  );

  return (
    <main
      className={styles.stage}
      lang={lang === "zh" ? "zh-CN" : "en"}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div className={styles.preload} aria-hidden="true">
        {Object.values(externalLandscapesSource).map((landscape) => (
          <iframe key={landscape.src} src={landscape.src} title="" tabIndex={-1} />
        ))}
      </div>

      <section className={styles.deck} aria-live="polite">
        <header className={styles.stageHeader}>
          <div className={styles.stageHeaderLeft}>
            <Link className={styles.backLink} href={`/${lang}/keynote`}>
              {t.backToKeynote}
            </Link>
            <span>{scene.label}</span>
          </div>
          <div className={styles.stageHeaderRight}>
            <LocaleSwitch
              locales={["en", "zh"]}
              current={lang}
              label="Change language"
              names={{ en: "EN", zh: "中" }}
            />
            <span>
              {scene.duration} · {String(sceneIndex + 1).padStart(2, "0")} /{" "}
              {scenes.length}
            </span>
          </div>
        </header>

        <div className={styles.scene} data-stage-scene={scene.id} key={scene.id}>
          <SceneContent
            id={scene.id}
            build={build}
            projects={projects}
            lang={lang}
            onSwipeNext={next}
            onSwipePrevious={previous}
          />
        </div>

        <footer className={styles.timeline} aria-label={t.timelineAria}>
          {chapterProgress.map((chapter) => (
            <div
              key={chapter.id}
              data-active={chapter.active}
              data-complete={chapter.complete}
              style={{ "--chapter-width": chapter.width } as CSSProperties}
            >
              <i />
              <span>{chapter.label}</span>
            </div>
          ))}
        </footer>
      </section>
    </main>
  );
}

function ExternalLandscapeFrame({
  id,
  build,
  lang,
  onSwipeNext,
  onSwipePrevious,
}: {
  id: ExternalLandscapeId;
  build: number;
  lang: Locale;
  onSwipeNext: () => void;
  onSwipePrevious: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loadVersion, setLoadVersion] = useState(0);
  const loaded = loadVersion > 0;
  const landscape = externalLandscapesSource[id];
  const insights = useMemo(() => resolveInsights(lang, landscape.insights), [lang, landscape.insights]);
  const activeInsight = insights[build - 1];

  useEffect(() => {
    if (!loaded) return;

    const applyStageState = () => {
      const documentInFrame = iframeRef.current?.contentDocument;
      if (!documentInFrame) return;

      if (id === "large") {
        const reset = documentInFrame.querySelector<HTMLButtonElement>(
          "#reset-filter",
        );
        reset?.click();
        if (activeInsight?.interaction === "top10") {
          documentInFrame
            .querySelector<HTMLButtonElement>('[data-primary-filter="top10"]')
            ?.click();
        }
        if (activeInsight?.interaction === "open") {
          documentInFrame
            .querySelector<HTMLButtonElement>('[data-primary-filter="open"]')
            ?.click();
        }
        if (activeInsight?.interaction === "aai") {
          documentInFrame
            .querySelector<HTMLButtonElement>("#aai-filter")
            ?.click();
        }
        return;
      }

      const resetFilters = documentInFrame.querySelector<HTMLButtonElement>(
        "#reset-filters",
      );
      const resetView = documentInFrame.querySelector<HTMLButtonElement>(
        ".reset-view",
      );
      const directAssets = documentInFrame.querySelector<HTMLButtonElement>(
        "#direct-filter",
      );
      resetFilters?.click();
      resetView?.click();
      if (activeInsight?.interaction === "direct") directAssets?.click();
      if (activeInsight?.interaction === "install") {
        documentInFrame
          .querySelector<HTMLButtonElement>(
            '[data-stage="install"] .stage-heading',
          )
          ?.click();
      }
    };

    const timers = [40, 180, 500].map((delay) =>
      window.setTimeout(applyStageState, delay),
    );
    return () => timers.forEach((timer) => window.clearTimeout(timer));
  }, [activeInsight?.interaction, build, id, loadVersion, loaded]);

  useEffect(() => {
    if (!loaded) return;

    const documentInFrame = iframeRef.current?.contentDocument;
    if (!documentInFrame) return;

    let start: SwipeStart | null = null;
    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType !== "touch") return;
      start = {
        pointerId: event.pointerId,
        x: event.clientX,
        y: event.clientY,
        time: event.timeStamp,
      };
      if (event.target instanceof Element) {
        try {
          event.target.setPointerCapture(event.pointerId);
        } catch {
          // Pointer capture may be unavailable for a synthetic event.
        }
      }
    };

    const handlePointerUp = (event: PointerEvent) => {
      if (!start || start.pointerId !== event.pointerId) return;
      const direction = resolveSwipeDirection(
        start,
        event.clientX,
        event.clientY,
        event.timeStamp,
        documentInFrame.defaultView?.innerWidth ?? window.innerWidth,
      );
      start = null;
      if (direction) event.preventDefault();
      if (direction === "next") onSwipeNext();
      if (direction === "previous") onSwipePrevious();
    };

    const handlePointerCancel = () => {
      start = null;
    };

    documentInFrame.addEventListener("pointerdown", handlePointerDown);
    documentInFrame.addEventListener("pointerup", handlePointerUp);
    documentInFrame.addEventListener("pointercancel", handlePointerCancel);
    return () => {
      documentInFrame.removeEventListener("pointerdown", handlePointerDown);
      documentInFrame.removeEventListener("pointerup", handlePointerUp);
      documentInFrame.removeEventListener("pointercancel", handlePointerCancel);
    };
  }, [loadVersion, loaded, onSwipeNext, onSwipePrevious]);

  return (
    <iframe
      key={`${id}-${build}`}
      ref={iframeRef}
      className={styles.externalLandscapeFrame}
      src={landscape.src}
      title={`${id} landscape`}
      tabIndex={-1}
      onLoad={() => setLoadVersion((version) => version + 1)}
    />
  );
}

function LandscapeInsightCard({
  insight,
  index,
  total,
}: {
  insight: LandscapeStageInsight;
  index: number;
  total: number;
}) {
  return (
    <aside
      key={`${insight.angle}-${insight.metric}`}
      className={styles.landscapeInsight}
      data-visible="true"
      aria-live="polite"
    >
      <div className={styles.insightIndex}>
        <span>{insight.angle}</span>
        <strong>
          {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")}
        </strong>
        <div aria-hidden="true">
          {Array.from({ length: total }, (_, itemIndex) => (
            <i key={itemIndex} data-active={itemIndex + 1 === index} />
          ))}
        </div>
      </div>
      <strong className={styles.insightMetric}>{insight.metric}</strong>
      <div className={styles.insightCopy}>
        <p>{insight.label}</p>
        <span>{insight.note}</span>
      </div>
    </aside>
  );
}

function SceneContent({
  id,
  build,
  projects,
  lang,
  onSwipeNext,
  onSwipePrevious,
}: {
  id: string;
  build: number;
  projects: LandscapeProject[];
  lang: Locale;
  onSwipeNext: () => void;
  onSwipePrevious: () => void;
}) {
  const stackData = useMemo(() => getStackData(lang), [lang]);
  const inclusionServices = useMemo(() => getInclusionServices(lang), [lang]);
  const communityData = useMemo(() => getCommunityData(lang), [lang]);
  const apacheBackbone = useMemo(() => getApacheBackbone(lang), [lang]);

  if (id === "title") {
    return (
      <div className={styles.titleScene}>
        <div className={styles.titleBrand}>
          <LandscapeLogo />
          <span>COMMUNITY OVER CODE ASIA 2026</span>
        </div>
        {lang === "en" ? (
          <h1>
            Old rules for an open ecosystem, <em>under new Agentic AI trends</em>
          </h1>
        ) : (
          <h1>
            Agentic AI 新趋势下，
            <em>开放生态</em>的那些老规矩
          </h1>
        )}
        <div className={styles.titleContext}>
          <span>{lang === "en" ? "August 7, 2026" : "2026 年 8 月 7 日"}</span>
          <strong>Community Over Code Asia 2026</strong>
          <span>{lang === "en" ? "Speakers: Xu Wang, Xiaoya" : "演讲人：王旭、夏小雅"}</span>
        </div>
        <div className={styles.titleMeta}>
          <span>{lang === "en" ? "30 MIN · ENGLISH KEYNOTE" : "30 MIN · 中文 KEYNOTE"}</span>
          <span className={styles.keyboardControls}>
            {lang === "en"
              ? "Enter fullscreen · Esc exit · ↓ / → start"
              : "Enter 全屏 · Esc 退出 · ↓ / → 开始"}
          </span>
          <span className={styles.touchControls}>
            {lang === "en" ? "Swipe left / right to change slides" : "手指左右滑动翻页"}
          </span>
        </div>
      </div>
    );
  }

  if (id === "question") {
    return (
      <div className={styles.questionScene}>
        <p>
          {lang === "en"
            ? "The Agentic AI project list gets redrawn every few months."
            : "Agentic AI 的项目名单，几个月就要重画一次。"}
        </p>
        {lang === "en" ? (
          <h2>
            The map keeps changing.
            <br />
            What&apos;s worth keeping?
          </h2>
        ) : (
          <h2>
            图一直在变。
            <br />
            什么值得留下？
          </h2>
        )}
        <div className={styles.questionAnswer} data-visible={build >= 1}>
          <span>{lang === "en" ? "What an open ecosystem really cares about is" : "开放生态真正关心的是"}</span>
          <strong>
            {lang === "en"
              ? "whether someone else can pick it up and keep building."
              : "别人能不能接住它，继续往下做。"}
          </strong>
        </div>
      </div>
    );
  }

  if (id === "agent" || id === "model") {
    const landscapeModule = id as "agent" | "model";
    const insights = resolveInsights(lang, landscapeInsightsSource[landscapeModule]);
    const activeInsight = insights[build - 1];
    return (
      <div className={styles.liveLandscapeScene}>
        <div className={styles.liveLandscape}>
          <LandscapeExplorer
            projects={projects}
            embedOnly={landscapeModule}
            presentationMode
            presentationFocus={activeInsight?.focus}
          />
        </div>
        {activeInsight ? (
          <LandscapeInsightCard
            insight={activeInsight}
            index={build}
            total={insights.length}
          />
        ) : null}
      </div>
    );
  }

  if (id === "large" || id === "awesome") {
    const landscape = externalLandscapesSource[id];
    const insights = resolveInsights(lang, landscape.insights);
    const activeInsight = insights[build - 1];
    return (
      <div className={styles.externalLandscapeScene}>
        <ExternalLandscapeFrame
          id={id}
          build={build}
          lang={lang}
          onSwipeNext={onSwipeNext}
          onSwipePrevious={onSwipePrevious}
        />
        {activeInsight ? (
          <LandscapeInsightCard
            insight={activeInsight}
            index={build}
            total={insights.length}
          />
        ) : null}
      </div>
    );
  }

  if (id === "method") {
    const methodRows = [
      {
        id: "agent",
        view: "Agent Infra",
        count: lang === "en" ? "74 projects" : "74 项",
        window: "GitHub 07-28 · OpenRank 04—06",
        sources: [
          { label: "OpenDigger", mark: "OD" },
          { label: "GitHub", icon: "/project-logos/github.png" },
        ],
        path:
          lang === "en"
            ? ["Absolute signal + 90-day growth", "README & status review", "Structural gap-fill"]
            : ["绝对信号 + 90 天增速", "README 与状态复核", "结构补位"],
      },
      {
        id: "model",
        view: "Model Infra",
        count: lang === "en" ? "58 projects" : "58 项",
        window: "GitHub 07-28 · OpenRank 04—06",
        sources: [
          { label: "OpenDigger", mark: "OD" },
          { label: "GitHub", icon: "/project-logos/github.png" },
        ],
        path:
          lang === "en"
            ? ["Shared repo candidate pool", "Model-lifecycle review", "Dedup & reclassify"]
            : ["共用仓库候选池", "模型生命周期复核", "去重与归类"],
      },
      {
        id: "large",
        view: "Large Models",
        count: lang === "en" ? "50 endpoints" : "50 个 endpoint",
        window: lang === "en" ? "full calendar month · 2026-06" : "完整自然月 · 2026-06",
        sources: [
          {
            label: "OpenRouter",
            icon: "/keynote/large-models/assets/vendor-logos/openrouter-text.svg",
          },
          { label: "ZenMux", mark: "ZM" },
          { label: "Hugging Face", icon: "/project-logos/huggingface.png" },
        ],
        path:
          lang === "en"
            ? ["Monthly endpoint merge", "Within-platform percentile", "Official weight verification"]
            : ["月度 endpoint 合并", "平台内分位", "官方权重核验"],
      },
      {
        id: "awesome",
        view: "Awesome",
        count: lang === "en" ? "26 items" : "26 项",
        window: "GitHub 07-29 · OpenRank 04—06",
        sources: [
          { label: "GitHub", icon: "/project-logos/github.png" },
          { label: "OpenDigger", mark: "OD" },
          { label: "13 seeds", mark: "+" },
        ],
        path:
          lang === "en"
            ? ["Collection-shaped candidates", "README consumability", "Four-stage editorial pass"]
            : ["集合类候选", "README consumability", "四阶段编辑"],
      },
    ] as const;

    const methodChecks =
      lang === "en"
        ? ([
            ["WINDOW", "Only compare complete windows"],
            ["GRAIN", "Repos, endpoints, and knowledge assets kept separate"],
            ["EVIDENCE", "Usage signals cross-checked against project material"],
            ["EDITORIAL", "Fill structural gaps while deduplicating"],
          ] as const)
        : ([
            ["WINDOW", "只比较完整窗口"],
            ["GRAIN", "仓库、endpoint、知识资产分开"],
            ["EVIDENCE", "使用信号与项目材料相互校验"],
            ["EDITORIAL", "补结构缺口，同时去重"],
          ] as const);

    const methodTakeaways =
      lang === "en"
        ? ([
            [
              "OBSERVATION",
              "Open weights have entered mainstream usage; protocols, inference, and executable knowledge assets are also thickening.",
            ],
            [
              "CONCLUSION",
              "Adoption data answers whether anyone is using it; licenses and release materials answer whether the community can keep building.",
            ],
            [
              "INITIATIVE",
              "Every refresh ships its snapshot, scripts, and inclusion rationale together, so project communities can add evidence or file corrections directly.",
            ],
          ] as const)
        : ([
            [
              "OBSERVATION",
              "开放权重进入主流使用；协议、推理与可执行知识资产也在增厚。",
            ],
            [
              "CONCLUSION",
              "采用数据回答有没有人在用；许可证和发布材料回答社区能不能接着做。",
            ],
            [
              "INITIATIVE",
              "每次更新同步发布快照、脚本和入图理由，项目社区可以直接补证据、提修正。",
            ],
          ] as const);

    return (
      <div className={styles.methodScene}>
        <div className={styles.methodIntro}>
          <span>METHOD · FOUR VIEWS</span>
          <h2>
            {lang === "en"
              ? "Four views, four samples — the same criteria checked side by side."
              : "四张图各自取样，判断准则放在一起核对。"}
          </h2>
        </div>

        <div className={styles.methodMatrix}>
          <div className={styles.methodMatrixHeader} aria-hidden="true">
            <span>VIEW</span>
            <span>DATA &amp; WINDOW</span>
            <span>SAMPLE</span>
            <span>SCREEN &amp; REVIEW</span>
          </div>
          {methodRows.map((row) => (
            <div className={styles.methodRow} data-view={row.id} key={row.id}>
              <strong>{row.view}</strong>
              <div className={styles.methodSources}>
                <div>
                  {row.sources.map((source) => (
                    <span key={source.label}>
                      {"icon" in source ? (
                        <Image
                          src={source.icon}
                          alt=""
                          width={54}
                          height={22}
                        />
                      ) : (
                        <i>{source.mark}</i>
                      )}
                      {source.label}
                    </span>
                  ))}
                </div>
                <small>{row.window}</small>
              </div>
              <b>{row.count}</b>
              <div className={styles.methodPath} data-visible={build >= 1}>
                {row.path.map((step, index) => (
                  <span key={step}>
                    {step}
                    {index < row.path.length - 1 ? <i>→</i> : null}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className={styles.methodChecks} data-visible={build >= 2}>
          <strong>{lang === "en" ? "Shared checks" : "共同判断"}</strong>
          {methodChecks.map(([label, text]) => (
            <div key={label}>
              <span>{label}</span>
              <p>{text}</p>
            </div>
          ))}
        </div>

        <div className={styles.methodTakeaways} data-visible={build >= 3}>
          {methodTakeaways.map(([label, text]) => (
            <div key={label} data-kind={label.toLocaleLowerCase()}>
              <span>{label}</span>
              <p>{text}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === "production") {
    return (
      <div className={styles.productionScene}>
        {lang === "en" ? (
          <h2>
            Once agents reach production,
            <br />
            the old problems come back too.
          </h2>
        ) : (
          <h2>
            Agent 进入生产环境，
            <br />
            老问题一起回来。
          </h2>
        )}
        <div className={styles.productionPath} data-visible={build >= 1}>
          <span>{lang === "en" ? "Task" : "任务"}</span>
          <i>→</i>
          <span>{lang === "en" ? "Shared state" : "共享状态"}</span>
          <i>→</i>
          <span>{lang === "en" ? "Execution" : "执行"}</span>
          <i>→</i>
          <strong>{lang === "en" ? "What happens on failure?" : "失败怎么办？"}</strong>
        </div>
      </div>
    );
  }

  if (id === "apache-scale") {
    const stats =
      lang === "en"
        ? [
            ["295", "Projects"],
            ["1,310", "Software releases"],
            ["9,905", "Committers"],
            ["1,147", "Members"],
          ]
        : [
            ["295", "Projects"],
            ["1,310", "Software releases"],
            ["9,905", "Committers"],
            ["1,147", "Members"],
          ];
    return (
      <div className={styles.apacheScaleScene}>
        <div className={styles.apacheIdentity}>
          <Image
            src="/project-logos/apache.png"
            alt="Apache Software Foundation"
            width={220}
            height={220}
          />
          <div>
            <p>02 · THE APACHE WAY</p>
            <h2>Apache</h2>
            <strong>PROJECTS &amp; PEOPLE</strong>
          </div>
        </div>
        <div className={styles.apacheMeaning}>
          <article>
            <span>PROJECTS</span>
            <strong>ARE COMMUNITIES</strong>
            <p>{lang === "en" ? "Code is the output; the community is the project." : "代码是产出；社区才是项目本身。"}</p>
          </article>
          <article>
            <span>PEOPLE</span>
            <strong>MAKE THEM LAST</strong>
            <p>{lang === "en" ? "Permissions grow with sustained contribution and shared trust." : "权限随持续贡献和共同信任增长。"}</p>
          </article>
        </div>
        <div className={styles.apacheStats} data-visible={build >= 1}>
          {stats.map(([value, label], index) => (
            <div key={label} style={{ "--stat-index": index } as CSSProperties}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <p className={styles.sceneSource}>
          Source: The Apache Software Foundation · FY2025 Annual Report, p.13
        </p>
      </div>
    );
  }

  if (id === "apache-position") {
    const domain = apacheDomainSequence[build];
    return (
      <div className={styles.apacheAtlasStage}>
        <ApacheProjectAtlas activeDomain={domain} stage lang={lang} />
      </div>
    );
  }

  if (id === "ant-apache") {
    const bridgeStages =
      lang === "en"
        ? ["Orchestrate", "Compute", "Data", "State", "Recover"]
        : ["编排", "计算", "数据", "状态", "恢复"];
    return (
      <div className={`${styles.researchScene} ${styles.apacheBackboneScene}`}>
        <div className={researchStyles.apacheBridgeLead}>
          <div className={researchStyles.apacheBridgeSource}>
            <Image src="/project-logos/apache.png" alt="Apache" width={44} height={44} />
            <span>LANDSCAPE</span>
            <strong>{lang === "en" ? "6 Apache projects" : "6 个 Apache 项目"}</strong>
          </div>
          <div className={researchStyles.apacheBridgeAxis}>
            <span>{lang === "en" ? "Together cover one runtime chain" : "共同覆盖一条运行链"}</span>
            <div>
              {bridgeStages.map((stage) => (
                <b key={stage}>{stage}</b>
              ))}
            </div>
          </div>
          <div className={researchStyles.apacheBridgeSource}>
            <Image
              src="/keynote/apache/assets/ant-group.png"
              alt="Ant Group"
              width={44}
              height={44}
            />
            <span>ANT PARTICIPATION</span>
            <strong>{lang === "en" ? "4 Apache projects" : "4 个 Apache 项目"}</strong>
          </div>
        </div>
        <div className={researchStyles.apacheBackbone}>
          {apacheBackbone.map((stage, index) => (
            <article
              key={stage.label}
              className={styles.guidedApacheGroup}
              data-active={build === 0 || build === index + 1}
            >
              <header>
                <p>{stage.label}</p>
                <h3>{stage.title}</h3>
              </header>
              <div className={researchStyles.apacheBackboneProjects}>
                {stage.projects.map((project) => (
                  <a
                    href={`https://github.com/${project.repo}`}
                    key={project.name}
                    tabIndex={-1}
                  >
                    <div className={researchStyles.apacheProjectLogo}>
                      <Image
                        src={project.logo}
                        alt={`${project.name} logo`}
                        width={150}
                        height={54}
                      />
                    </div>
                    <div className={researchStyles.apacheProjectIdentity}>
                      <strong>{project.name}</strong>
                      <div className={researchStyles.apacheProjectMarks}>
                        <span>
                          <Image src="/project-logos/apache.png" alt="" width={18} height={18} />
                          ASF
                        </span>
                        {project.source === "ant" ? (
                          <span className={researchStyles.antMark}>
                            <Image
                              src="/keynote/apache/assets/ant-group.png"
                              alt=""
                              width={18}
                              height={18}
                            />
                            ANT
                          </span>
                        ) : (
                          <span className={researchStyles.landscapeMark}>LANDSCAPE</span>
                        )}
                      </div>
                    </div>
                    <dl className={researchStyles.apacheProjectFacts}>
                      <div>
                        <dt>ROLE</dt>
                        <dd>{project.role}</dd>
                      </div>
                      <div>
                        <dt>POSITION</dt>
                        <dd>{project.signal}</dd>
                      </div>
                    </dl>
                  </a>
                ))}
              </div>
            </article>
          ))}
        </div>
      </div>
    );
  }

  if (id === "inclusion-scale") {
    return (
      <div className={`${styles.researchScene} ${styles.inclusionScaleScene}`}>
        <div className={styles.inclusionHeroStage}>
          <div className={styles.inclusionHeroMark}>
            <Image
              src="/keynote/inclusionai/inclusionai.png"
              alt="InclusionAI logo"
              width={460}
              height={460}
            />
          </div>
          <div className={styles.inclusionHeroCopy}>
            <p>03 · OPEN ECOSYSTEM</p>
            <h2>InclusionAI</h2>
            <strong>AI Built By Everyone, For Everyone.</strong>
            <p>
              {lang === "en"
                ? "From foundation models and embodied intelligence to Model Infra, Agent Infra, and AI Service — contributors can join at any layer."
                : "从基础模型、具身大脑到 Model Infra、Agent Infra 与 AI Service， 参与者可以从不同层进入。"}
            </p>
            <div className={researchStyles.valueChips}>
              <span>Fairness</span>
              <span>Transparency</span>
              <span>Collaboration</span>
            </div>
          </div>
        </div>
        <div className={researchStyles.platformGrid} data-visible={build >= 1}>
          <a href="https://github.com/inclusionAI" tabIndex={-1}>
            <header><span>GitHub · 3 orgs</span></header>
            <strong>92</strong>
            <p>{lang === "en" ? "public repos" : "公开仓库"}</p>
            <div><span><b>41,045</b> Stars</span><span><b>3,820</b> Forks</span></div>
          </a>
          <a href="https://huggingface.co/inclusionAI" tabIndex={-1}>
            <header><span>Hugging Face · 3 orgs</span></header>
            <strong>197</strong>
            <p>{lang === "en" ? "public models" : "公开模型"}</p>
            <div><span><b>531,025</b> {lang === "en" ? "downloads, last 30 days" : "近 30 天下载"}</span><span><b>8,757</b> Likes</span></div>
          </a>
          <a href="https://modelscope.cn/organization/inclusionAI" tabIndex={-1}>
            <header><span>ModelScope · 3 orgs</span></header>
            <strong>188</strong>
            <p>{lang === "en" ? "public models" : "公开模型"}</p>
            <div><span><b>204,942</b> Downloads</span><span><b>634</b> Likes</span></div>
          </a>
        </div>
      </div>
    );
  }

  if (id === "inclusion-stack") {
    const stackKeys: StackKey[] = ["models", "embodied", "infra", "industry"];
    const isService = build === 4;
    const stackKey = stackKeys[Math.min(build, 3)];
    const stack = stackData[stackKey];
    return (
      <div className={`${styles.researchScene} ${styles.inclusionStackScene}`}>
        <div className={researchStyles.inclusionAtlas}>
          <div className={researchStyles.stackLayers}>
            <button
              type="button"
              tabIndex={-1}
              className={isService ? researchStyles.activeStack : ""}
            >
              <strong>AI Service</strong>
              <span>{inclusionServices.map((service) => service.name).join(" · ")}</span>
            </button>
            {[...stackKeys].reverse().map((key) => (
              <button
                type="button"
                tabIndex={-1}
                key={key}
                className={!isService && key === stackKey ? researchStyles.activeStack : ""}
              >
                <strong>{stackData[key].label}</strong>
                <span>{stackData[key].projects.map((project) => project.name).join(" · ")}</span>
              </button>
            ))}
          </div>
          {!isService ? (
            <article className={researchStyles.stackDetail} key={stackKey}>
              <p className={researchStyles.utilityLabel}>{stack.kicker}</p>
              <h3>{stack.title}</h3>
              <p>{stack.body}</p>
              <div className={researchStyles.inclusionProjects}>
                {stack.projects.map((project) => (
                  <a href={project.href} key={project.name} tabIndex={-1}>
                    <span className={researchStyles.inclusionProjectLogo}>
                      <Image
                        src={project.logo}
                        alt={`${project.name} logo`}
                        width={72}
                        height={72}
                      />
                    </span>
                    <span>
                      <strong>{project.name}</strong>
                      <small>{project.role}</small>
                    </span>
                    <p>{project.description}</p>
                  </a>
                ))}
              </div>
              <small className={researchStyles.participationCue}>{stack.ask}</small>
            </article>
          ) : (
            <div className={`${researchStyles.serviceBand} ${styles.serviceDetail}`}>
              <header>
                <span>AI SERVICE</span>
                <strong>
                  {lang === "en"
                    ? "Real services bring new problems back into the stack"
                    : "真实服务会把新问题重新带回技术栈"}
                </strong>
              </header>
              <div>
                {inclusionServices.map((service) => (
                  <article key={service.domain}>
                    <Image
                      src={service.logo}
                      alt={`${service.name} logo`}
                      width={84}
                      height={84}
                    />
                    <span>{service.domain}</span>
                    <strong>{service.name}</strong>
                    <small>{service.description}</small>
                  </article>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (id === "license-question") {
    return (
      <div className={styles.licenseQuestionScene}>
        <span>{lang === "en" ? "From open-source software to open models" : "从开源软件走到开放模型"}</span>
        <h2>{lang === "en" ? "The list of things a license has to govern just got longer." : "许可证要管的对象，变多了。"}</h2>
        <div className={styles.missingMaterials} data-visible={build >= 1}>
          <i>{lang === "en" ? "Weights" : "权重"}</i>
          <i>{lang === "en" ? "Code" : "代码"}</i>
          <i>{lang === "en" ? "Data" : "数据"}</i>
          <i>{lang === "en" ? "Docs" : "文档"}</i>
          <i>{lang === "en" ? "Output" : "输出"}</i>
        </div>
      </div>
    );
  }

  if (id === "license-distribution") {
    const bars = [
      {
        title: "Agent Infra + Model Infra",
        subtitle: lang === "en" ? "132 open-source software repos" : "132 个开源软件仓库",
        items: softwareLicenseDistribution,
        source: "GitHub SPDX metadata · 2026-07-28",
      },
      {
        title: "Hugging Face Text Generation",
        subtitle: lang === "en" ? "Top 100 model repos by downloads" : "下载量排序 Top 100 模型仓库",
        items: modelLicenseDistribution,
        source: "Hugging Face Hub API · 2026-07-31",
      },
    ];
    return (
      <div className={styles.licenseDistributionScene}>
        <header>
          <span>LICENSE DISTRIBUTION</span>
          <h2>{lang === "en" ? "Model repos still lean heavily on software licenses." : "模型仓库仍在大量使用软件许可证。"}</h2>
        </header>
        <div className={styles.licenseSamplePair}>
          {bars.map((bar, index) => (
            <article key={bar.title} data-visible={index === 0 || build >= 1}>
              <header>
                <div>
                  <strong>{bar.title}</strong>
                  <span>{bar.subtitle}</span>
                </div>
                <b>{index === 0 ? "74.2%" : "75%"}</b>
              </header>
              <p>Apache-2.0 {lang === "en" ? "or" : "或"} MIT</p>
              <div className={styles.stackedLicenseBar}>
                {bar.items.map((item) => (
                  <i
                    key={item.label}
                    style={{
                      width: `${item.share}%`,
                      background: item.color,
                    }}
                    title={`${item.label}: ${item.value}`}
                  />
                ))}
              </div>
              <div className={styles.licenseLegend}>
                {bar.items.map((item) => (
                  <span key={item.label}>
                    <i style={{ background: item.color }} />
                    <b>{item.label}</b>
                    <strong>{item.value}</strong>
                  </span>
                ))}
              </div>
              <small>{bar.source}</small>
            </article>
          ))}
        </div>
        <p className={styles.sceneSource}>
          {lang === "en"
            ? "The unit is the repo, not the independent model family; licenses come from repo / model-card metadata and are not a legal review."
            : "统计单位是仓库，不是独立模型家族；许可证来自仓库 / 模型卡元数据，不构成法律审查。"}
        </p>
      </div>
    );
  }

  if (id === "license-compare") {
    const licenseComparisonRows = licenseComparisonRowsSource.map((row) => ({
      topic: pick(lang, row.topic),
      software: pick(lang, row.software),
      model: pick(lang, row.model),
    }));
    return (
      <div className={styles.licenseCompareScene}>
        <header>
          <span>LICENSE SCOPE</span>
          <h2>{lang === "en" ? "No single document covers a whole model release." : "模型发布没有一份材料能代表全部。"}</h2>
        </header>
        <div className={styles.licenseCompareFrame}>
          <div className={styles.licenseCompareColumns}>
            <strong>{lang === "en" ? "Open-source software" : "开源软件"}</strong>
            <span>{lang === "en" ? "Comparison" : "对照项"}</span>
            <strong>{lang === "en" ? "Open models" : "开放模型"}</strong>
          </div>
          {licenseComparisonRows.map((row, index) => (
            <div
              key={row.topic}
              data-visible={index < 3 ? build >= 1 : build >= 2}
            >
              <p>{row.software}</p>
              <strong>{row.topic}</strong>
              <p>{row.model}</p>
            </div>
          ))}
        </div>
        <p className={styles.sceneSource}>
          Sources: Apache License 2.0 · OSAID 1.0 · OpenMDW 1.1 · Model Openness Framework 1.0
        </p>
      </div>
    );
  }

  if (id === "license-layers") {
    return (
      <div className={styles.licenseLayersScene}>
        <h2>
          {lang === "en"
            ? "Ask what the terms govern first, then check whether the materials showed up."
            : "先问条款管什么，再看材料交付了没有。"}
        </h2>
        <div className={styles.licenseLayers}>
          <article data-visible={build >= 1}>
            <span>RIGHTS</span>
            <strong>{lang === "en" ? "What are you legally allowed to do?" : "法律上可以做什么？"}</strong>
            <p>
              {lang === "en"
                ? "Terms like Apache-2.0, MIT, and OpenMDW answer questions about use, modification, distribution, and the obligations attached."
                : "Apache-2.0、MIT、OpenMDW 等条款回答使用、修改、分发以及相关义务。"}
            </p>
          </article>
          <article data-visible={build >= 2}>
            <span>MATERIALS</span>
            <strong>{lang === "en" ? "What did you actually get?" : "实际上拿到了什么？"}</strong>
            <p>
              {lang === "en"
                ? "OSAID and MOF bring parameters, code, data documentation, evaluation, and docs into scope for checking."
                : "OSAID 与 MOF 把参数、代码、数据说明、评测和文档放进检查范围。"}
            </p>
          </article>
        </div>
      </div>
    );
  }

  if (id === "release-check") {
    const statuses =
      lang === "en"
        ? [
            "Weights only, downloadable",
            "Clear structure, understandable",
            "Training material is fairly complete, researchable",
            "Evaluation and docs complete, modifiable",
          ]
        : [
            "只有权重，可下载",
            "结构清楚，可理解",
            "训练材料较完整，可研究",
            "评测与文档齐备，可继续修改",
          ];
    const releaseMaterials = releaseMaterialsSource.map(([label, threshold]) => [
      pick(lang, label),
      threshold,
    ] as const);
    return (
      <div className={styles.releaseScene}>
        <header>
          <h2>{lang === "en" ? "What does a model release actually deliver?" : "一个模型发布，到底交付了什么？"}</h2>
          <strong>{statuses[build]}</strong>
        </header>
        <div className={styles.materialGrid}>
          {releaseMaterials.map(([label, threshold]) => (
            <div key={label} data-checked={build >= threshold}>
              <i>{build >= threshold ? "✓" : ""}</i>
              <span>{label}</span>
            </div>
          ))}
        </div>
        <p>
          {lang === "en"
            ? "The license still matters. It can't fill in materials the publisher never provided."
            : "许可证仍然重要。它无法替发布者补齐没有提供的材料。"}
        </p>
      </div>
    );
  }

  if (id === "community") {
    const activeKey = communityKeys[build];
    const [title, body] = communityData[activeKey];
    return (
      <div className={`${styles.researchScene} ${styles.communityScene}`}>
        <h2>{lang === "en" ? "How a stranger's contribution becomes long-term trust" : "陌生贡献怎样变成长期信任"}</h2>
        <div className={researchStyles.communityPath}>
          {communityKeys.map((key, index) => (
            <button
              type="button"
              tabIndex={-1}
              key={key}
              className={key === activeKey ? researchStyles.activeCommunity : ""}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{pick(lang, communityStepLabels[index])}</strong>
            </button>
          ))}
        </div>
        <article className={researchStyles.communityDetail} key={activeKey}>
          <h3>{title}</h3>
          <p>{body}</p>
        </article>
      </div>
    );
  }

  return (
    <div className={styles.closeScene}>
      <span>COMMUNITY &gt;&gt;&gt; CODE</span>
      <h2>{lang === "en" ? "The old rules still hold." : "老规矩继续有效。"}</h2>
      <p>
        {lang === "en"
          ? "Now, they have to cover models, data, and evaluation too."
          : "现在，它们要覆盖模型、数据和评测。"}
      </p>
      <div>
        <i>{lang === "en" ? "A findable front door" : "入口能被找到"}</i>
        <i>{lang === "en" ? "A process that holds up on review" : "过程经得起回看"}</i>
        <i>{lang === "en" ? "Trust that grows with contribution" : "信任跟着贡献增长"}</i>
      </div>
      <small>THANK YOU</small>
    </div>
  );
}
