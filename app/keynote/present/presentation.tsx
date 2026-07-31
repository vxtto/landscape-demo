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

import {
  type ApacheDomainKey,
  apacheBackbone,
} from "../apache-ecosystem";
import ApacheProjectAtlas from "../apache-project-atlas";
import {
  type CommunityKey,
  type StackKey,
  communityData,
  inclusionServices,
  stackData,
} from "../keynote-experience";
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

const chapterLabels: Array<{ id: Chapter; label: string }> = [
  { id: "open", label: "开场" },
  { id: "landscape", label: "生态" },
  { id: "apache", label: "Apache" },
  { id: "inclusion", label: "InclusionAI" },
  { id: "license", label: "开放模型" },
  { id: "community", label: "Community" },
];

type LandscapeStageInsight = {
  angle: string;
  metric: string;
  label: string;
  note: string;
  focus?: string;
  interaction?: "top10" | "open" | "aai" | "direct" | "install" | "all";
};

const externalLandscapes: Record<
  "large" | "awesome",
  { src: string; insights: LandscapeStageInsight[] }
> = {
  large: {
    src: "/keynote/large-models/index.html",
    insights: [
      {
        angle: "真实使用",
        metric: "5 / 5",
        label: "Top 10 两类模型各占一半",
        note: "2026 年 6 月，开放权重与无公开权重模型都进入了主流使用区。",
        interaction: "top10",
      },
      {
        angle: "能力分布",
        metric: "12 / 13",
        label: "Reasoning 区几乎都是开放权重模型",
        note: "Multimodal / VLM 则相反：30 个模型中有 22 个没有公开权重。开放程度和模型类型明显相关。",
        interaction: "open",
      },
      {
        angle: "使用与能力",
        metric: "#1 / #25",
        label: "公开使用与能力榜没有排成同一条队伍",
        note: "8 个可比 AAI 样本中，使用第 1 的模型 AAI 为 40.3；AAI 最高的模型使用排名第 25。",
        interaction: "aai",
      },
    ],
  },
  awesome: {
    src: "/keynote/awesome/awesome_agentic_landscape_2026.html",
    insights: [
      {
        angle: "可消费性",
        metric: "19 / 26",
        label: "多数入图项目已经提供 Agent 可直接读取的材料",
        note: "判断依据是仓库里确实有 skill、instruction、hook、workflow 或 MCP 配置。",
        interaction: "direct",
      },
      {
        angle: "使用路径",
        metric: "7 / 7",
        label: "Install 是唯一全部达到 direct 的阶段",
        note: "到了安装环节，清单、配置和工具入口已经普遍变成机器可执行的交付物。",
        interaction: "install",
      },
      {
        angle: "形成速度",
        metric: "22 / 26",
        label: "入图项目中有 22 个创建于 2025 年以后",
        note: "这是编辑样本的年龄结构，不代表 GitHub 全量；但它说明 Agent-native 知识资产还在快速形成。",
        interaction: "all",
      },
    ],
  },
};

type ExternalLandscapeId = keyof typeof externalLandscapes;

const landscapeInsights: Record<"agent" | "model", LandscapeStageInsight[]> = {
  agent: [
    {
      angle: "当前结构",
      metric: "22 / 74",
      label: "最大的两个 section 仍然围绕 coding",
      note: "Agentic coding 有 12 个项目，Code-first frameworks 有 10 个。代码仍是最密集的 Agent 入口。",
      focus: "Agentic coding",
    },
    {
      angle: "近期信号",
      metric: "35.96 → 140.23",
      label: "OpenViking · 2026-03—06 OpenRank",
      note: "Memory、RAG 和 skills 开始收进 context database；上下文正在成为独立的数据层。",
      focus: "Memory, knowledge & context",
    },
    {
      angle: "接口变化",
      metric: "3 → 5",
      label: "Protocols & interoperability",
      note: "MCP、A2A 之外，AG-UI 与 A2UI 把事件流和界面带进了公共接口层。",
      focus: "Protocols & interoperability",
    },
    {
      angle: "改进方式",
      metric: "15.2K / 45",
      label: "SkillOpt · stars / 7 月可见参与者",
      note: "skill 文档开始经历 rollout、评估和验证门；Agent 改进正在走出模型权重空间。",
      focus: "Observability & evaluation",
    },
  ],
  model: [
    {
      angle: "近期信号",
      metric: "4.07 → 39.04",
      label: "OmniRoute · 2026-02—06 OpenRank",
      note: "Gateway 正从模型 API 代理延伸到配额 fallback、MCP 与 A2A 流量。",
      focus: "Model API gateways",
    },
    {
      angle: "执行链路",
      metric: "6 → 8",
      label: "Serving · Inference",
      note: "LMCache 补上 KV cache 复用，vLLM-Omni 补上多模态 serving；推理区内部的职责已经分开。",
      focus: "Serving · Inference",
    },
    {
      angle: "协作许可",
      metric: "39 / 58",
      label: "Model Infra 中三分之二采用 Apache-2.0",
      note: "硬件适配、专利授权和企业协作，使 Apache-2.0 在这一层保持明显多数。",
    },
  ],
};

const apacheDomainSequence: ApacheDomainKey[] = [
  "data",
  "libraries",
  "network",
  "operations",
];

const releaseMaterials = [
  ["模型权重", 0],
  ["架构说明", 1],
  ["训练代码", 2],
  ["数据来源", 2],
  ["评测方法", 3],
  ["修改文档", 3],
] as const;

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

const licenseComparisonRows = [
  {
    topic: "被许可的对象",
    software: "源代码、目标代码、文档与衍生作品",
    model: "权重、架构、代码、数据与文档可能分别授权",
  },
  {
    topic: "修改所需材料",
    software: "源代码通常就是首要修改形式",
    model: "还需要参数、训练代码、数据说明与评测方法",
  },
  {
    topic: "权利组合",
    software: "版权与专利授权是核心",
    model: "还会碰到数据库权利、商业秘密与数据第三方权利",
  },
  {
    topic: "使用限制",
    software: "OSI 许可不得限制特定用途或领域",
    model: "部分专用条款另附可接受用途或领域限制",
  },
  {
    topic: "衍生与分发",
    software: "围绕 Source、Object 与 Derivative Works",
    model: "checkpoint、微调、adapter 与输出可能适用不同规则",
  },
  {
    topic: "怎样验证开放",
    software: "能从源码构建、修改和再分发",
    model: "先看法律权利，再看材料是否足以研究和修改",
  },
] as const;

const communityKeys: CommunityKey[] = [
  "discover",
  "propose",
  "review",
  "ship",
  "trust",
];

export default function KeynotePresentation({
  projects,
}: {
  projects: LandscapeProject[];
}) {
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
    [sceneIndex],
  );

  return (
    <main
      className={styles.stage}
      lang="zh-CN"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerCancel}
    >
      <div className={styles.preload} aria-hidden="true">
        {Object.values(externalLandscapes).map((landscape) => (
          <iframe key={landscape.src} src={landscape.src} title="" tabIndex={-1} />
        ))}
      </div>

      <section className={styles.deck} aria-live="polite">
        <header className={styles.stageHeader}>
          <div className={styles.stageHeaderLeft}>
            <Link className={styles.backLink} href="/keynote">
              ← 回到 keynote
            </Link>
            <span>{scene.label}</span>
          </div>
          <span>
            {scene.duration} · {String(sceneIndex + 1).padStart(2, "0")} /{" "}
            {scenes.length}
          </span>
        </header>

        <div className={styles.scene} data-stage-scene={scene.id} key={scene.id}>
          <SceneContent
            id={scene.id}
            build={build}
            projects={projects}
            onSwipeNext={next}
            onSwipePrevious={previous}
          />
        </div>

        <footer className={styles.timeline} aria-label="演讲章节进度">
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
  onSwipeNext,
  onSwipePrevious,
}: {
  id: ExternalLandscapeId;
  build: number;
  onSwipeNext: () => void;
  onSwipePrevious: () => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loadVersion, setLoadVersion] = useState(0);
  const loaded = loadVersion > 0;
  const landscape = externalLandscapes[id];
  const activeInsight = landscape.insights[build - 1];

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
  onSwipeNext,
  onSwipePrevious,
}: {
  id: string;
  build: number;
  projects: LandscapeProject[];
  onSwipeNext: () => void;
  onSwipePrevious: () => void;
}) {
  if (id === "title") {
    return (
      <div className={styles.titleScene}>
        <div className={styles.titleBrand}>
          <LandscapeLogo />
          <span>COMMUNITY OVER CODE ASIA 2026</span>
        </div>
        <h1>
          Agentic AI 新趋势下，
          <em>开放生态</em>的那些老规矩
        </h1>
        <div className={styles.titleContext}>
          <span>2026 年 8 月 7 日</span>
          <strong>Community Over Code Asia 2026</strong>
          <span>演讲人：王旭、夏小雅</span>
        </div>
        <div className={styles.titleMeta}>
          <span>30 MIN · 中文 KEYNOTE</span>
          <span className={styles.keyboardControls}>
            Enter 全屏 · Esc 退出 · ↓ / → 开始
          </span>
          <span className={styles.touchControls}>手指左右滑动翻页</span>
        </div>
      </div>
    );
  }

  if (id === "question") {
    return (
      <div className={styles.questionScene}>
        <p>Agentic AI 的项目名单，几个月就要重画一次。</p>
        <h2>
          图一直在变。
          <br />
          什么值得留下？
        </h2>
        <div className={styles.questionAnswer} data-visible={build >= 1}>
          <span>开放生态真正关心的是</span>
          <strong>别人能不能接住它，继续往下做。</strong>
        </div>
      </div>
    );
  }

  if (id === "agent" || id === "model") {
    const landscapeModule = id as "agent" | "model";
    const insights = landscapeInsights[landscapeModule];
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
    const landscape = externalLandscapes[id];
    const activeInsight = landscape.insights[build - 1];
    return (
      <div className={styles.externalLandscapeScene}>
        <ExternalLandscapeFrame
          id={id}
          build={build}
          onSwipeNext={onSwipeNext}
          onSwipePrevious={onSwipePrevious}
        />
        {activeInsight ? (
          <LandscapeInsightCard
            insight={activeInsight}
            index={build}
            total={landscape.insights.length}
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
        count: "74 项",
        window: "GitHub 07-28 · OpenRank 04—06",
        sources: [
          { label: "OpenDigger", mark: "OD" },
          { label: "GitHub", icon: "/project-logos/github.png" },
        ],
        path: ["绝对信号 + 90 天增速", "README 与状态复核", "结构补位"],
      },
      {
        id: "model",
        view: "Model Infra",
        count: "58 项",
        window: "GitHub 07-28 · OpenRank 04—06",
        sources: [
          { label: "OpenDigger", mark: "OD" },
          { label: "GitHub", icon: "/project-logos/github.png" },
        ],
        path: ["共用仓库候选池", "模型生命周期复核", "去重与归类"],
      },
      {
        id: "large",
        view: "Large Models",
        count: "50 个 endpoint",
        window: "完整自然月 · 2026-06",
        sources: [
          {
            label: "OpenRouter",
            icon: "/keynote/large-models/assets/vendor-logos/openrouter-text.svg",
          },
          { label: "ZenMux", mark: "ZM" },
          { label: "Hugging Face", icon: "/project-logos/huggingface.png" },
        ],
        path: ["月度 endpoint 合并", "平台内分位", "官方权重核验"],
      },
      {
        id: "awesome",
        view: "Awesome",
        count: "26 项",
        window: "GitHub 07-29 · OpenRank 04—06",
        sources: [
          { label: "GitHub", icon: "/project-logos/github.png" },
          { label: "OpenDigger", mark: "OD" },
          { label: "13 seeds", mark: "+" },
        ],
        path: ["集合类候选", "README consumability", "四阶段编辑"],
      },
    ] as const;

    const methodChecks = [
      ["WINDOW", "只比较完整窗口"],
      ["GRAIN", "仓库、endpoint、知识资产分开"],
      ["EVIDENCE", "使用信号与项目材料相互校验"],
      ["EDITORIAL", "补结构缺口，同时去重"],
    ] as const;

    const methodTakeaways = [
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
    ] as const;

    return (
      <div className={styles.methodScene}>
        <div className={styles.methodIntro}>
          <span>METHOD · FOUR VIEWS</span>
          <h2>四张图各自取样，判断准则放在一起核对。</h2>
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
          <strong>共同判断</strong>
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
        <h2>
          Agent 进入生产环境，
          <br />
          老问题一起回来。
        </h2>
        <div className={styles.productionPath} data-visible={build >= 1}>
          <span>任务</span>
          <i>→</i>
          <span>共享状态</span>
          <i>→</i>
          <span>执行</span>
          <i>→</i>
          <strong>失败怎么办？</strong>
        </div>
      </div>
    );
  }

  if (id === "apache-scale") {
    const stats = [
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
            <p>代码是产出；社区才是项目本身。</p>
          </article>
          <article>
            <span>PEOPLE</span>
            <strong>MAKE THEM LAST</strong>
            <p>权限随持续贡献和共同信任增长。</p>
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
        <ApacheProjectAtlas activeDomain={domain} stage />
      </div>
    );
  }

  if (id === "ant-apache") {
    return (
      <div className={`${styles.researchScene} ${styles.apacheBackboneScene}`}>
        <div className={researchStyles.apacheBridgeLead}>
          <div className={researchStyles.apacheBridgeSource}>
            <Image src="/project-logos/apache.png" alt="Apache" width={44} height={44} />
            <span>LANDSCAPE</span>
            <strong>6 个 Apache 项目</strong>
          </div>
          <div className={researchStyles.apacheBridgeAxis}>
            <span>共同覆盖一条运行链</span>
            <div>
              <b>编排</b>
              <b>计算</b>
              <b>数据</b>
              <b>状态</b>
              <b>恢复</b>
            </div>
          </div>
          <div className={researchStyles.apacheBridgeSource}>
            <Image
              src="/keynote/apache/assets/ant-group.png"
              alt="蚂蚁集团"
              width={44}
              height={44}
            />
            <span>ANT PARTICIPATION</span>
            <strong>4 个 Apache 项目</strong>
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
              从基础模型、具身大脑到 Model Infra、Agent Infra 与 AI Service，
              参与者可以从不同层进入。
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
            <p>公开仓库</p>
            <div><span><b>41,045</b> Stars</span><span><b>3,820</b> Forks</span></div>
          </a>
          <a href="https://huggingface.co/inclusionAI" tabIndex={-1}>
            <header><span>Hugging Face · 3 orgs</span></header>
            <strong>197</strong>
            <p>公开模型</p>
            <div><span><b>531,025</b> 近 30 天下载</span><span><b>8,757</b> Likes</span></div>
          </a>
          <a href="https://modelscope.cn/organization/inclusionAI" tabIndex={-1}>
            <header><span>ModelScope · 3 orgs</span></header>
            <strong>188</strong>
            <p>公开模型</p>
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
                <strong>真实服务会把新问题重新带回技术栈</strong>
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
        <span>从开源软件走到开放模型</span>
        <h2>许可证要管的对象，变多了。</h2>
        <div className={styles.missingMaterials} data-visible={build >= 1}>
          <i>权重</i>
          <i>代码</i>
          <i>数据</i>
          <i>文档</i>
          <i>输出</i>
        </div>
      </div>
    );
  }

  if (id === "license-distribution") {
    const bars = [
      {
        title: "Agent Infra + Model Infra",
        subtitle: "132 个开源软件仓库",
        items: softwareLicenseDistribution,
        source: "GitHub SPDX metadata · 2026-07-28",
      },
      {
        title: "Hugging Face Text Generation",
        subtitle: "下载量排序 Top 100 模型仓库",
        items: modelLicenseDistribution,
        source: "Hugging Face Hub API · 2026-07-31",
      },
    ];
    return (
      <div className={styles.licenseDistributionScene}>
        <header>
          <span>LICENSE DISTRIBUTION</span>
          <h2>模型仓库仍在大量使用软件许可证。</h2>
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
              <p>Apache-2.0 或 MIT</p>
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
          统计单位是仓库，不是独立模型家族；许可证来自仓库 / 模型卡元数据，不构成法律审查。
        </p>
      </div>
    );
  }

  if (id === "license-compare") {
    return (
      <div className={styles.licenseCompareScene}>
        <header>
          <span>LICENSE SCOPE</span>
          <h2>模型发布没有一份材料能代表全部。</h2>
        </header>
        <div className={styles.licenseCompareFrame}>
          <div className={styles.licenseCompareColumns}>
            <strong>开源软件</strong>
            <span>对照项</span>
            <strong>开放模型</strong>
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
        <h2>先问条款管什么，再看材料交付了没有。</h2>
        <div className={styles.licenseLayers}>
          <article data-visible={build >= 1}>
            <span>RIGHTS</span>
            <strong>法律上可以做什么？</strong>
            <p>Apache-2.0、MIT、OpenMDW 等条款回答使用、修改、分发以及相关义务。</p>
          </article>
          <article data-visible={build >= 2}>
            <span>MATERIALS</span>
            <strong>实际上拿到了什么？</strong>
            <p>OSAID 与 MOF 把参数、代码、数据说明、评测和文档放进检查范围。</p>
          </article>
        </div>
      </div>
    );
  }

  if (id === "release-check") {
    const statuses = [
      "只有权重，可下载",
      "结构清楚，可理解",
      "训练材料较完整，可研究",
      "评测与文档齐备，可继续修改",
    ];
    return (
      <div className={styles.releaseScene}>
        <header>
          <h2>一个模型发布，到底交付了什么？</h2>
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
        <p>许可证仍然重要。它无法替发布者补齐没有提供的材料。</p>
      </div>
    );
  }

  if (id === "community") {
    const activeKey = communityKeys[build];
    const [title, body] = communityData[activeKey];
    return (
      <div className={`${styles.researchScene} ${styles.communityScene}`}>
        <h2>陌生贡献怎样变成长期信任</h2>
        <div className={researchStyles.communityPath}>
          {communityKeys.map((key, index) => (
            <button
              type="button"
              tabIndex={-1}
              key={key}
              className={key === activeKey ? researchStyles.activeCommunity : ""}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <strong>{communityData[key][0]}</strong>
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
      <h2>老规矩继续有效。</h2>
      <p>现在，它们要覆盖模型、数据和评测。</p>
      <div>
        <i>入口能被找到</i>
        <i>过程经得起回看</i>
        <i>信任跟着贡献增长</i>
      </div>
      <small>THANK YOU</small>
    </div>
  );
}
