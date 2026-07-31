"use client";

import Image from "next/image";
import {
  type CSSProperties,
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
  apacheDomains,
} from "../apache-ecosystem";
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

const scenes: Scene[] = [
  { id: "title", chapter: "open", label: "OPEN", duration: "0:00—0:45", maxBuild: 0 },
  { id: "question", chapter: "open", label: "QUESTION", duration: "0:45—1:40", maxBuild: 1 },
  { id: "agent", chapter: "landscape", label: "AGENT INFRA", duration: "1:40—3:25", maxBuild: 1 },
  { id: "model", chapter: "landscape", label: "MODEL INFRA", duration: "3:25—5:05", maxBuild: 1 },
  { id: "large", chapter: "landscape", label: "LARGE MODELS", duration: "5:05—6:35", maxBuild: 1 },
  { id: "awesome", chapter: "landscape", label: "AWESOME", duration: "6:35—7:55", maxBuild: 1 },
  { id: "method", chapter: "landscape", label: "METHOD", duration: "7:55—9:45", maxBuild: 3 },
  { id: "production", chapter: "apache", label: "TURN", duration: "9:45—10:20", maxBuild: 1 },
  { id: "apache-scale", chapter: "apache", label: "APACHE", duration: "10:20—11:45", maxBuild: 1 },
  { id: "apache-position", chapter: "apache", label: "POSITION", duration: "11:45—14:00", maxBuild: 3 },
  { id: "ant-apache", chapter: "apache", label: "ANT × APACHE", duration: "14:00—15:50", maxBuild: 3 },
  { id: "inclusion-scale", chapter: "inclusion", label: "INCLUSIONAI", duration: "15:50—17:20", maxBuild: 1 },
  { id: "inclusion-stack", chapter: "inclusion", label: "PARTICIPATION", duration: "17:20—20:20", maxBuild: 4 },
  { id: "license-question", chapter: "license", label: "OPEN MODEL", duration: "20:20—21:10", maxBuild: 1 },
  { id: "license-layers", chapter: "license", label: "LICENSE", duration: "21:10—23:10", maxBuild: 2 },
  { id: "release-check", chapter: "license", label: "RELEASE CHECK", duration: "23:10—25:10", maxBuild: 3 },
  { id: "community", chapter: "community", label: "COMMUNITY", duration: "25:10—28:35", maxBuild: 4 },
  { id: "close", chapter: "community", label: "CLOSE", duration: "28:35—30:00", maxBuild: 0 },
];

const chapterLabels: Array<{ id: Chapter; label: string }> = [
  { id: "open", label: "开场" },
  { id: "landscape", label: "生态" },
  { id: "apache", label: "Apache" },
  { id: "inclusion", label: "InclusionAI" },
  { id: "license", label: "开放模型" },
  { id: "community", label: "Community" },
];

const externalLandscapes = {
  large: {
    src: "/keynote/large-models/index.html",
    metric: "5 / 5",
    label: "Top 10 中开放权重与无公开权重各占一半",
    note: "这是 2026 年 6 月完整月份的真实使用样本。开放权重已经进入主流使用区，但还没有形成压倒性优势。",
  },
  awesome: {
    src: "/keynote/awesome/awesome_agentic_landscape_2026.html",
    metric: "19 / 24",
    label: "入图项目可被 Agent 直接消费",
    note: "README 开始写执行步骤、边界和检查方式。文档正在变成 Agent 能理解的轻量接口。",
  },
} as const;

type ExternalLandscapeId = keyof typeof externalLandscapes;

const landscapeInsights = {
  agent: {
    focus: "Protocols & interoperability",
    metric: "3 → 5",
    label: "Protocols & interoperability",
    note: "MCP、A2A 之外，AG-UI 与 A2UI 把事件流和界面也带进公共接口层。",
  },
  model: {
    focus: "Serving · Inference",
    metric: "6 → 8",
    label: "Serving · Inference",
    note: "推理引擎、KV cache、多模态 serving 和硬件适配开始形成不同的协作面。",
  },
} as const;

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
    <main className={styles.stage} lang="zh-CN">
      <div className={styles.preload} aria-hidden="true">
        {Object.values(externalLandscapes).map((landscape) => (
          <iframe key={landscape.src} src={landscape.src} title="" tabIndex={-1} />
        ))}
      </div>

      <section className={styles.deck} aria-live="polite">
        <header className={styles.stageHeader}>
          <span>{scene.label}</span>
          <span>
            {scene.duration} · {String(sceneIndex + 1).padStart(2, "0")} /{" "}
            {scenes.length}
          </span>
        </header>

        <div className={styles.scene} data-stage-scene={scene.id} key={scene.id}>
          <SceneContent id={scene.id} build={build} projects={projects} />
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
}: {
  id: ExternalLandscapeId;
  build: number;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [loaded, setLoaded] = useState(false);
  const landscape = externalLandscapes[id];

  useEffect(() => {
    if (!loaded) return;

    const documentInFrame = iframeRef.current?.contentDocument;
    if (!documentInFrame) return;

    const applyStageState = () => {
      if (id === "large") {
        const reset = documentInFrame.querySelector<HTMLButtonElement>(
          "#reset-filter",
        );
        const topTen = documentInFrame.querySelector<HTMLButtonElement>(
          '[data-primary-filter="top10"]',
        );
        reset?.click();
        if (build >= 1) topTen?.click();
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
      if (build >= 1) directAssets?.click();
    };

    const timer = window.setTimeout(applyStageState, 40);
    return () => window.clearTimeout(timer);
  }, [build, id, loaded]);

  return (
    <iframe
      ref={iframeRef}
      className={styles.externalLandscapeFrame}
      src={landscape.src}
      title={`${id} landscape`}
      tabIndex={-1}
      onLoad={() => setLoaded(true)}
    />
  );
}

function SceneContent({
  id,
  build,
  projects,
}: {
  id: string;
  build: number;
  projects: LandscapeProject[];
}) {
  if (id === "title") {
    return (
      <div className={styles.titleScene}>
        <div className={styles.titleBrand}>
          <LandscapeLogo />
          <span>CommunityOverCode China · 2026.08.07</span>
        </div>
        <h1>
          Agentic AI 新趋势下，
          <em>开放生态</em>的那些老规矩
        </h1>
        <div className={styles.titleMeta}>
          <span>30 MIN · 中文 KEYNOTE</span>
          <span>Enter 全屏 · Esc 退出 · ↓ / → 开始</span>
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
    const insight = landscapeInsights[landscapeModule];
    return (
      <div className={styles.liveLandscapeScene}>
        <div className={styles.liveLandscape}>
          <LandscapeExplorer
            projects={projects}
            embedOnly={landscapeModule}
            presentationMode
            presentationFocus={build >= 1 ? insight.focus : undefined}
          />
        </div>
        <div className={styles.landscapeInsight} data-visible={build >= 1}>
          <strong>{insight.metric}</strong>
          <div>
            <span>{insight.label}</span>
            <p>{insight.note}</p>
          </div>
        </div>
      </div>
    );
  }

  if (id === "large" || id === "awesome") {
    const landscape = externalLandscapes[id];
    return (
      <div className={styles.externalLandscapeScene}>
        <ExternalLandscapeFrame id={id} build={build} />
        <div className={styles.landscapeInsight} data-visible={build >= 1}>
          <strong>{landscape.metric}</strong>
          <div>
            <span>{landscape.label}</span>
            <p>{landscape.note}</p>
          </div>
        </div>
      </div>
    );
  }

  if (id === "method") {
    const funnel = [
      ["6,118", "高召回候选"],
      ["878", "语义相关"],
      ["222", "人工复核池"],
      ["126", "当前总览"],
    ];
    return (
      <div className={styles.methodScene}>
        <h2>
          数字负责发现，
          <br />
          进入版面仍是编辑判断。
        </h2>
        <div className={styles.funnel}>
          {funnel.map(([value, label], index) => (
            <div key={value} data-visible={build >= index}>
              <span>{label}</span>
              <strong>{value}</strong>
              {index < funnel.length - 1 ? <i>→</i> : null}
            </div>
          ))}
        </div>
        <p data-visible={build >= 3}>
          星标和 OpenRank 帮我们发现变化。是否补上结构缺口，仍要回到项目本身。
        </p>
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
      ["290+", "Open Source Projects"],
      ["1,300+", "Software Releases"],
      ["10,000+", "Committers"],
      ["1,190+", "Members"],
    ];
    return (
      <div className={`${styles.researchScene} ${styles.apacheScaleScene}`}>
        <div className={researchStyles.apacheOpening}>
          <div>
            <p className={researchStyles.sectionIndex}>02 · APACHE</p>
            <h2>
              规模背后是一套
              <br />
              <em>长期协作能力</em>
            </h2>
          </div>
          <dl>
            <div>
              <dt>PROJECTS</dt>
              <dd>孵化、治理、发布和退出都有公开过程</dd>
            </div>
            <div>
              <dt>PEOPLE</dt>
              <dd>权限跟随持续贡献和社区信任增长</dd>
            </div>
          </dl>
        </div>
        <div className={researchStyles.apacheScale}>
          {stats.map(([value, label], index) => (
            <div key={label} data-visible={index === 0 || build >= 1}>
              <strong>{value}</strong>
              <span>{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (id === "apache-position") {
    const domain = apacheDomainSequence[build];
    const detail = apacheDomains[domain];
    return (
      <div className={`${styles.researchScene} ${styles.apacheAtlasScene}`}>
        <div className={researchStyles.apacheAtlas}>
          <div className={researchStyles.apacheAtlasHeading}>
            <div>
              <strong>APACHE PROJECT ATLAS</strong>
              <span>七个技术领域，定位 Agent 的数据与运行底座</span>
            </div>
            <dl>
              <div>
                <dt>MODEL INFRA</dt>
                <dd>6 / 57 ASF projects</dd>
              </div>
              <div>
                <dt>ACTIVE DOMAIN</dt>
                <dd>{detail.label}</dd>
              </div>
            </dl>
          </div>
          <div className={researchStyles.apacheAtlasBody}>
            <div className={researchStyles.apacheDomainTabs}>
              {(Object.keys(apacheDomains) as ApacheDomainKey[]).map((key) => (
                <button
                  type="button"
                  tabIndex={-1}
                  key={key}
                  className={key === domain ? researchStyles.activeDomain : ""}
                >
                  <strong>{apacheDomains[key].count}</strong>
                  <span>{apacheDomains[key].label}</span>
                </button>
              ))}
            </div>
            <article className={researchStyles.apacheDomainDetail} key={domain}>
              <div className={researchStyles.apacheDomainLead}>
                <div>
                  <span>PROJECT RECORDS · MULTI-LABEL</span>
                  <strong>{detail.count}</strong>
                </div>
                <div className={researchStyles.apacheDomainName}>
                  <h3>{detail.label}</h3>
                  <div className={researchStyles.apacheLabelCloud}>
                    {detail.officialLabels.map((label) => (
                      <span key={label}>{label}</span>
                    ))}
                  </div>
                </div>
                <p className={researchStyles.apacheDomainDefinition}>
                  {detail.definition}
                </p>
              </div>
              <div className={researchStyles.apacheHeadProjects}>
                <p>HEAD PROJECTS · GITHUB STARS SNAPSHOT</p>
                <div>
                  {detail.heads.map(([name, stars]) => (
                    <span key={name}>
                      <strong>{name}</strong>
                      <small>★ {stars}</small>
                    </span>
                  ))}
                </div>
              </div>
              <div className={researchStyles.apacheLandscapeMatch}>
                <p>SELECTED INTO AGENTIC LANDSCAPE</p>
                {detail.landscape.length ? (
                  <div>
                    {detail.landscape.map((project) => (
                      <span key={project}>
                        <Image
                          src="/project-logos/apache.png"
                          alt=""
                          width={18}
                          height={18}
                        />
                        Apache {project}
                      </span>
                    ))}
                  </div>
                ) : (
                  <small>当前主图没有从这一官方分类直接入选的 ASF 项目。</small>
                )}
              </div>
            </article>
          </div>
        </div>
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
        <div className={researchStyles.inclusionHero}>
          <div className={researchStyles.inclusionMark}>
            <Image
              src="/keynote/inclusionai/inclusionai.png"
              alt="InclusionAI logo"
              width={460}
              height={460}
            />
          </div>
          <div className={researchStyles.sectionHeading}>
            <p className={researchStyles.sectionIndex}>03 · INCLUSIONAI</p>
            <h2>
              AI Built By Everyone, <em>For Everyone.</em>
            </h2>
            <p>
              模型、工程系统和真实场景都对外开放。参与者可以从训练、环境、工具、评测和应用进入。
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
            {stackKeys.map((key) => (
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
            <button
              type="button"
              tabIndex={-1}
              className={isService ? researchStyles.activeStack : ""}
            >
              <strong>AI Service</strong>
              <span>{inclusionServices.map((service) => service[1]).join(" · ")}</span>
            </button>
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
                {inclusionServices.map(([domain, name, description]) => (
                  <article key={domain}>
                    <span>{domain}</span>
                    <strong>{name}</strong>
                    <small>{description}</small>
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
        <span>一个模型允许商用</span>
        <h2>够不够称为开放？</h2>
        <div className={styles.missingMaterials} data-visible={build >= 1}>
          <i>训练代码？</i>
          <i>数据说明？</i>
          <i>评测方法？</i>
        </div>
      </div>
    );
  }

  if (id === "license-layers") {
    return (
      <div className={styles.licenseLayersScene}>
        <h2>先把两个问题分开。</h2>
        <div className={styles.licenseLayers}>
          <article data-visible={build >= 1}>
            <span>RIGHTS</span>
            <strong>法律上可以做什么？</strong>
            <p>Apache-2.0、OpenMDW 等许可证回答使用、修改与分发的权利和义务。</p>
          </article>
          <article data-visible={build >= 2}>
            <span>MATERIALS</span>
            <strong>实际上拿到了什么？</strong>
            <p>MOF 与 OSAID 关注权重之外，是否还有研究和修改需要的材料。</p>
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
