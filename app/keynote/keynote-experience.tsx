"use client";

import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  CircleHelpIcon,
  ExpandIcon,
  MonitorPlayIcon,
  SearchIcon,
  XIcon,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import type { LandscapeProject } from "@/lib/landscape-types";

import styles from "./page.module.css";
import {
  type LandscapeKey,
  landscapeViews,
} from "./landscape-story";
import {
  type ApacheDomainKey,
  apacheBackbone,
} from "./apache-ecosystem";
import ApacheProjectAtlas from "./apache-project-atlas";
import {
  apacheOpenMdwComparison,
  buildLicenseDistribution,
  licenseColors,
  licenseDisplayNames,
  type LicenseLayer,
  licenseLayerLabels,
  licenseReferences,
  materialChecks,
  projectsForLicenseLayer,
} from "./license-research";
import LandscapeExplorer from "../components/landscape-explorer";
import LandscapeLogo from "../components/landscape-logo";

export type StackKey = "models" | "embodied" | "infra" | "industry";
export type CommunityKey = "discover" | "propose" | "review" | "ship" | "trust";
type LicenseFilter = "all" | "license" | "framework" | "definition";

type InclusionProject = {
  name: string;
  role: string;
  description: string;
  href: string;
  logo: string;
};

const chapters = [
  ["landscape", "生态图更新"],
  ["apache", "Apache 的位置"],
  ["inclusion", "InclusionAI 技术栈"],
  ["licenses", "模型开放与许可证"],
  ["community", "Community >>> Code"],
] as const;

export const stackData: Record<
  StackKey,
  {
    label: string;
    kicker: string;
    title: string;
    projects: InclusionProject[];
    body: string;
    ask: string;
  }
> = {
  models: {
    label: "基础模型",
    kicker: "FOUNDATION MODELS",
    title: "四条模型路线并行推进",
    projects: [
      {
        name: "Ling",
        role: "语言 · 高效 MoE",
        description: "从轻量激活到万亿参数，把通用能力与训练效率放在同一条模型线上。",
        href: "https://github.com/inclusionAI/Ling-V2.5",
        logo: "/keynote/inclusionai/ling.png",
      },
      {
        name: "Ring",
        role: "推理 · Agentic",
        description: "面向深度推理与长链路任务的 thinking model 系列。",
        href: "https://github.com/inclusionAI/Ring-V2.5",
        logo: "/keynote/inclusionai/ling.png",
      },
      {
        name: "LLaDA",
        role: "扩散语言模型",
        description: "把离散扩散路线扩展到 100B 级，并配套开放推理与微调工具。",
        href: "https://github.com/inclusionAI/LLaDA2.X",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
      {
        name: "Ming",
        role: "全模态",
        description: "连接文本、图像、语音、音乐等理解与生成能力。",
        href: "https://github.com/inclusionAI/Ming",
        logo: "/keynote/inclusionai/ming.png",
      },
    ],
    body: "Ling、Ring、LLaDA、Ming 分别关注语言、推理、扩散和全模态。除了权重，项目还提供模型卡、阶段性 checkpoint、推理实现和评测材料。",
    ask: "参与入口：复核评测、领域适配、推理优化、量化部署与模型行为研究。",
  },
  embodied: {
    label: "具身大脑",
    kicker: "EMBODIED INTELLIGENCE",
    title: "智能开始进入物理世界",
    projects: [
      {
        name: "LingBot-Map",
        role: "空间智能",
        description: "面向流式场景重建的前馈 3D foundation model。",
        href: "https://github.com/Robbyant/lingbot-map",
        logo: "/keynote/inclusionai/robbyant.png",
      },
      {
        name: "LingBot-World",
        role: "世界模型",
        description: "以开放 world model 支撑可交互环境的理解与生成。",
        href: "https://github.com/Robbyant/lingbot-world",
        logo: "/keynote/inclusionai/robbyant.png",
      },
      {
        name: "LingBot-VLA",
        role: "感知到行动",
        description: "连接视觉、语言与机器人动作的 VLA foundation model。",
        href: "https://github.com/Robbyant/lingbot-vla",
        logo: "/keynote/inclusionai/robbyant.png",
      },
      {
        name: "LingBot-Depth",
        role: "空间感知",
        description: "以 masked depth modeling 建立通用空间感知表征。",
        href: "https://github.com/Robbyant/lingbot-depth",
        logo: "/keynote/inclusionai/robbyant.png",
      },
    ],
    body: "Robbyant 的 LingBot 系列把地图、深度、世界模型和动作模型连起来。参与者也可以从机器人数据、仿真、评测和真实环境工程进入。",
    ask: "参与入口：空间数据、仿真环境、机器人适配、真实世界评测与部署。",
  },
  infra: {
    label: "Model Infra",
    kicker: "AI LIBRARY · PRE-TRAIN · POST-TRAIN · INFERENCE",
    title: "从训练到推理，把基础模型变成可运行系统",
    projects: [
      {
        name: "cuLA",
        role: "AI Library",
        description: "以 CuTe DSL 与 CUTLASS 实现线性注意力 CUDA kernels。",
        href: "https://github.com/inclusionAI/cuLA",
        logo: "/keynote/inclusionai/cula.png",
      },
      {
        name: "Humming",
        role: "AI Library",
        description: "面向模型训练和推理的高性能算子与系统组件。",
        href: "https://github.com/inclusionAI/humming",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
      {
        name: "DLRover",
        role: "Pre-train",
        description: "支撑大规模分布式训练的容错、弹性调度与 checkpoint。",
        href: "https://github.com/intelligent-machine-learning/dlrover",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
      {
        name: "ATorch",
        role: "Pre-train",
        description: "为大模型训练提供自动并行与性能优化能力。",
        href: "https://github.com/intelligent-machine-learning/atorch",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
      {
        name: "AReaL",
        role: "Post-train · RL",
        description: "连接 foundation model 训练与 agentic applications 的强化学习系统。",
        href: "https://github.com/areal-project/AReaL",
        logo: "/keynote/inclusionai/areal.png",
      },
      {
        name: "AReno",
        role: "Post-train · RL",
        description: "降低单节点规模化 RL post-training 的使用门槛。",
        href: "https://github.com/inclusionAI/AReno",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
      {
        name: "dInfer",
        role: "Inference",
        description: "面向扩散语言模型的高效、可扩展推理框架。",
        href: "https://github.com/inclusionAI/dInfer",
        logo: "/keynote/inclusionai/dinfer.svg",
      },
      {
        name: "dFactory",
        role: "dLLM Fine-tuning",
        description: "为扩散语言模型提供高效、可复用的微调工程链路。",
        href: "https://github.com/inclusionAI/dFactory",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
    ],
    body: "这一层对应 InclusionAI 架构图里的 AI Library、Pre Train、Post Train 和 DLLM：cuLA、Humming、DLRover、ATorch、AReaL、AReno、dInfer、dFactory。",
    ask: "参与入口：算子、分布式训练、强化学习、微调、推理与系统效率。",
  },
  industry: {
    label: "Agent Infra",
    kicker: "AGENT RUNTIME · ENVIRONMENT · SEARCH · COORDINATION",
    title: "把模型能力接入环境、工具和任务",
    projects: [
      {
        name: "AWorld",
        role: "Agent Harness",
        description: "把工具、记忆、上下文、执行与自我进化组织成 agent runtime。",
        href: "https://github.com/inclusionAI/AWorld",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
      {
        name: "AEnvironment",
        role: "Everything as Environment",
        description: "为 Agentic RL、benchmark 和服务部署提供统一环境接口。",
        href: "https://github.com/inclusionAI/AEnvironment",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
      {
        name: "Avernet",
        role: "多 Agent 协同",
        description: "让 agents 连接、协调、执行并持续演进。",
        href: "https://github.com/inclusionAI/Avernet",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
      {
        name: "ASearcher",
        role: "搜索 Agent",
        description: "面向大规模 search agent 的开放强化学习项目。",
        href: "https://github.com/inclusionAI/ASearcher",
        logo: "/keynote/inclusionai/inclusionai.png",
      },
    ],
    body: "AWorld、AEnvironment、Avernet 和 ASearcher 对应 Landscape 关注的 Agent Infra：运行时、环境、协作与搜索。",
    ask: "参与入口：工具协议、运行环境、任务定义、协同、评测与可靠性。",
  },
};

export const inclusionServices = [
  {
    domain: "通用服务",
    name: "LingGuang",
    description: "全模态 AI 助手",
    logo: "/keynote/inclusionai/lingguang.png",
  },
  {
    domain: "金融服务",
    name: "MA XIAO CAI",
    description: "AI Financial Steward",
    logo: "/keynote/inclusionai/ma-xiao-cai.svg",
  },
  {
    domain: "医疗服务",
    name: "AQ",
    description: "面向健康与医疗的可信助手",
    logo: "/keynote/inclusionai/aq-medai.png",
  },
  {
    domain: "生活服务",
    name: "Life Services",
    description: "支付、出行、家庭等真实场景",
    logo: "/keynote/apache/assets/ant-group.png",
  },
] as const;

export const communityData: Record<CommunityKey, [string, string]> = {
  discover: [
    "先让入口可见",
    "公开 roadmap、模型卡和清楚的任务说明，会让陌生贡献者知道当前问题在哪里，以及怎样开始。",
  ],
  propose: [
    "把想法放进共同记录",
    "proposal、issue 或可复现实验为技术主张提供上下文。贡献不必一开始就写成代码，但要能被其他人找到。",
  ],
  review: [
    "让选择经得起回看",
    "公开审查留下取舍、风险和替代方案。后来者不必依赖某家公司或某位维护者的内部记忆。",
  ],
  ship: [
    "一起承担交付结果",
    "合并、发布、兼容性和回归验证把个人工作变成公共资产。稳定的协作节奏比单纯追求发布次数更有价值。",
  ],
  trust: [
    "权限跟着贡献增长",
    "维护、回应和技术判断会逐步累积成信任。committer 或 member 是治理责任，不是一枚活跃度徽章。",
  ],
};

export default function KeynoteExperience({
  projects,
}: {
  projects: LandscapeProject[];
}) {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [activeChapter, setActiveChapter] = useState("landscape");
  const [landscape, setLandscape] = useState<LandscapeKey>("agent");
  const [infraQuery, setInfraQuery] = useState("");
  const [frameScale, setFrameScale] = useState(1);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [apacheDomain, setApacheDomain] =
    useState<ApacheDomainKey>("data");
  const [stack, setStack] = useState<StackKey>("models");
  const [licenseFilter, setLicenseFilter] = useState<LicenseFilter>("all");
  const [licenseLayer, setLicenseLayer] = useState<LicenseLayer>("all");
  const [materials, setMaterials] = useState([true, false, false, false, false, false]);
  const [community, setCommunity] = useState<CommunityKey>("discover");

  const currentLandscape = landscapeViews[landscape];
  const visibleLicenseProjects = useMemo(
    () => projectsForLicenseLayer(projects, licenseLayer),
    [licenseLayer, projects],
  );
  const licenseDistribution = useMemo(
    () => buildLicenseDistribution(visibleLicenseProjects),
    [visibleLicenseProjects],
  );
  const maxLicenseCount = licenseDistribution[0]?.count ?? 1;
  const materialScore = Math.round(
    (materials.filter(Boolean).length / materials.length) * 100,
  );
  const materialLabel = [
    "没有可修改材料",
    "只有权重可得",
    "材料仍然很薄",
    "已有基本修改线索",
    "接近可复现发布",
    "材料较为完整",
    "六类材料均提供",
  ][materials.filter(Boolean).length];

  const gaugeStyle = {
    "--score": `${materialScore}%`,
  } as CSSProperties;

  const frameStyle = useMemo(() => {
    if (!currentLandscape.base) return undefined;
    return {
      width: `${currentLandscape.base[0]}px`,
      height: `${currentLandscape.base[1]}px`,
      transform: `scale(${frameScale})`,
      left: `calc(50% - ${(currentLandscape.base[0] * frameScale) / 2}px)`,
      top: `calc(50% - ${(currentLandscape.base[1] * frameScale) / 2}px)`,
    } as CSSProperties;
  }, [currentLandscape, frameScale]);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const sections = chapters
      .map(([id]) => root.querySelector<HTMLElement>(`#${id}`))
      .filter((section): section is HTMLElement => Boolean(section));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) setActiveChapter(entry.target.id);
        });
      },
      { rootMargin: "-30% 0px -60% 0px" },
    );

    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !currentLandscape.base) {
      setFrameScale(1);
      return;
    }

    const resize = () => {
      const [width, height] = currentLandscape.base!;
      setFrameScale(
        Math.min(stage.clientWidth / width, stage.clientHeight / height),
      );
    };
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    resize();
    return () => observer.disconnect();
  }, [currentLandscape]);

  function chooseLandscape(key: LandscapeKey) {
    setFrameLoaded(false);
    setLandscape(key);
  }

  return (
    <main ref={rootRef} lang="zh-CN" className={styles.page}>
      <div className={styles.shell}>
        <header className={styles.header}>
          <Link className={styles.brand} href="/" aria-label="返回 Agentic AI Landscape">
            <LandscapeLogo className={styles.brandMark} />
            <strong>Agentic AI Landscape</strong>
          </Link>
          <p className={styles.eventLabel}>
            CommunityOverCode China
            <span>2026 keynote · 08.07</span>
          </p>
          <div className={styles.headerActions}>
            <Link className={styles.stageLink} href="/keynote/present">
              <MonitorPlayIcon aria-hidden="true" />
              演讲播放
            </Link>
            <Link className={styles.backLink} href="/">
              <ArrowLeftIcon aria-hidden="true" />
              返回生态图
            </Link>
          </div>
        </header>

        <section className={styles.hero} aria-labelledby="keynote-title">
          <div className={styles.dateBlock} aria-label="2026 年 8 月 7 日">
            <span>CommunityOverCode</span>
            <strong>
              08<span aria-hidden="true">.</span>07
            </strong>
            <small>2026 · Beijing</small>
          </div>
          <div className={styles.heroCopy}>
            <p className={styles.eyebrow}>30 min · 中文 keynote 工作稿</p>
            <h1 id="keynote-title">
              Agentic AI 新趋势下，
              <em>开放生态</em>的那些老规矩
            </h1>
            <p className={styles.heroIntro}>
              Agent 正在改变软件的入口、生产方式和运行边界。生态图上的名字变化很快，但项目怎样被发现、技术怎样被复用、权利怎样说清楚，仍然决定一项技术能不能成为公共基础设施。
            </p>
          </div>
        </section>

        <div className={styles.dataWindow} aria-label="数据时间口径">
          <div><span>GitHub snapshot</span><strong>2026-07-28</strong></div>
          <div><span>OpenRank window</span><strong>2025-07—2026-06</strong></div>
          <div><span>OpenRouter / ZenMux</span><strong>2026-06-01—30</strong></div>
          <div><span>ASF homepage</span><strong>2026-07-29</strong></div>
        </div>

        <nav className={styles.chapterNav} aria-label="Keynote 章节">
          <div className={styles.chapterLinks}>
            {chapters.map(([id, label], index) => (
              <a
                key={id}
                className={activeChapter === id ? styles.activeChapter : ""}
                href={`#${id}`}
              >
                <span>{String(index + 1).padStart(2, "0")}</span>
                {label}
              </a>
            ))}
          </div>
        </nav>

        <section className={styles.storySection} id="landscape">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionIndex}>01 · ECOSYSTEM REFRESH</p>
            <h2>生态图每次刷新，都在回答：<em>什么开始变得重要？</em></h2>
            <p>
              这次更新没有从 star 榜单里挑几个新名字。候选集先扩张，再用语义、活跃度和生态角色逐层收窄，最后才处理版面。数字负责发现变化，进入 landscape 仍然是一项编辑判断。
            </p>
          </div>

          <div className={`${styles.funnel} ${styles.deepDive}`} aria-label="项目筛选漏斗">
            {[
              ["原始候选集合", "6,118", "多源仓库 ID", 100],
              ["语义相关", "878", "README / topic / 描述筛选", 14.35],
              ["人工复核池", "222", "GitHub 信息刷新后", 3.63],
              ["当前总览", "132", "live overview", 2.06],
            ].map(([label, value, note, width]) => (
              <div className={styles.funnelRow} key={label as string}>
                <span>{label}</span>
                <i><b style={{ width: `${width}%` }} /></i>
                <strong>{value}</strong>
                <small>{note}</small>
              </div>
            ))}
          </div>

          <div className={styles.statStrip}>
            {[
              ["105", "保留", "生态角色仍然清晰"],
              ["21", "新增", "补足协议、推理与上下文"],
              ["17", "移出", "去重、弱相关或版面取舍"],
              ["251", "reference source", "CSV 保留完整判断"],
            ].map(([value, label, note]) => (
              <div key={label}>
                <strong>{value}</strong>
                <span>{label}</span>
                <small>{note}</small>
              </div>
            ))}
          </div>

          <div className={`${styles.editorialGrid} ${styles.deepDive}`}>
            <article>
              <p className={styles.utilityLabel}>版面变化</p>
              <h3>分类没有推倒重来</h3>
              <dl>
                <div><dt>Agentic coding</dt><dd>15 → 12</dd></div>
                <div><dt>Protocols & interoperability</dt><dd>3 → 5</dd></div>
                <div><dt>Serving · Inference</dt><dd>6 → 8</dd></div>
              </dl>
            </article>
            <article>
              <p className={styles.utilityLabel}>指标边界</p>
              <h3>三个信号各自只回答一部分问题</h3>
              <dl>
                <div><dt>OpenRank</dt><dd>协作活跃度</dd></div>
                <div><dt>Stars / WatchEvent</dt><dd>关注变化</dd></div>
                <div><dt>README 与项目角色</dt><dd>能否被采用</dd></div>
              </dl>
            </article>
          </div>

          <div className={styles.explorer}>
            <div className={styles.explorerToolbar}>
              <div role="tablist" aria-label="生态图切换">
                {(Object.keys(landscapeViews) as LandscapeKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    role="tab"
                    aria-selected={landscape === key}
                    className={landscape === key ? styles.activeTab : ""}
                    onClick={() => chooseLandscape(key)}
                  >
                    {landscapeViews[key].label}
                  </button>
                ))}
              </div>
              {landscape === "agent" || landscape === "model" ? (
                <label className={styles.explorerSearch}>
                  <SearchIcon aria-hidden="true" />
                  <span className={styles.srOnly}>
                    搜索 Agent Infra 和 Model Infra
                  </span>
                  <input
                    type="search"
                    value={infraQuery}
                    onChange={(event) => setInfraQuery(event.target.value)}
                    placeholder="Search Agent & Model Infra"
                  />
                  {infraQuery ? (
                    <button
                      type="button"
                      onClick={() => setInfraQuery("")}
                      aria-label="清除 Infra 搜索"
                    >
                      <XIcon aria-hidden="true" />
                    </button>
                  ) : null}
                </label>
              ) : null}
              <div className={styles.explorerActions}>
                <a
                  href={
                    currentLandscape.sourceHref ?? currentLandscape.htmlSrc
                  }
                  target="_blank"
                  rel="noreferrer"
                >
                  单独打开 <ArrowUpRightIcon aria-hidden="true" />
                </a>
                <button
                  type="button"
                  onClick={() => stageRef.current?.requestFullscreen()}
                >
                  <ExpandIcon aria-hidden="true" />
                  全屏
                </button>
              </div>
            </div>
            <div className={styles.explorerStage} ref={stageRef}>
              {landscape === "agent" || landscape === "model" ? (
                <div
                  className={styles.inlineLandscape}
                  style={frameStyle}
                >
                  <LandscapeExplorer
                    projects={projects}
                    embedOnly={landscape}
                    filterQuery={infraQuery}
                  />
                </div>
              ) : (
                <>
                  {!frameLoaded ? (
                    <p className={styles.loading}>正在加载高清生态图…</p>
                  ) : null}
                  <iframe
                    key={`${landscape}-html`}
                    className={styles.fixedFrame}
                    style={frameStyle}
                    src={currentLandscape.htmlSrc}
                    title={`${currentLandscape.label} landscape`}
                    onLoad={() => setFrameLoaded(true)}
                  />
                </>
              )}
            </div>
            <div className={styles.explorerCaption}>
              <span>{currentLandscape.caption}</span>
              <strong>{currentLandscape.snapshot}</strong>
            </div>
          </div>

          <div className={styles.landscapeReadout} aria-live="polite">
            <div className={styles.perspectiveLead}>
              <p className={styles.utilityLabel}>这张图怎么看</p>
              <span>{currentLandscape.perspective}</span>
              <h3>{currentLandscape.question}</h3>
            </div>

            <div className={styles.landscapeMetrics}>
              {currentLandscape.metrics.map((metric) => (
                <div key={metric.label}>
                  <strong>{metric.value}</strong>
                  <span>{metric.label}</span>
                  <small>{metric.note}</small>
                </div>
              ))}
            </div>

            <div className={styles.landscapeInsights}>
              <article>
                <div>
                  <span>ONE SIGNAL</span>
                  <small>{currentLandscape.insight.signal}</small>
                </div>
                <h3>{currentLandscape.insight.title}</h3>
                <p>{currentLandscape.insight.body}</p>
                <strong>{currentLandscape.insight.evidence}</strong>
              </article>
            </div>
          </div>

          <details className={styles.landscapeSpeakerNote}>
            <summary>
              <span>给演讲者的讲法</span>
              <small>
                {currentLandscape.label} · {currentLandscape.speakerTime}
              </small>
            </summary>
            <div>
              {currentLandscape.speakerScript.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>
          </details>

          <details className={styles.howPanel}>
            <summary>
              <CircleHelpIcon aria-hidden="true" />
              <span>How we made this?</span>
              <small>{currentLandscape.label} 的数据、筛选与讲法</small>
            </summary>
            <div className={styles.howDrawer}>
              <div className={styles.methodIntro}>
                <p className={styles.utilityLabel}>METHOD NOTE</p>
                <h3>{currentLandscape.label} 是怎样做出来的</h3>
                <p>{currentLandscape.methodIntro}</p>
              </div>

              <ol className={styles.methodSteps}>
                {currentLandscape.methodSteps.map((step) => (
                  <li key={step.number}>
                    <span>{step.number}</span>
                    <div>
                      <h4>{step.title}</h4>
                      <p>{step.body}</p>
                    </div>
                  </li>
                ))}
              </ol>

              <div className={styles.methodFooter}>
                <div className={styles.methodCaveats}>
                  <p className={styles.utilityLabel}>读数字时要带上的限制</p>
                  <ul>
                    {currentLandscape.caveats.map((caveat) => (
                      <li key={caveat}>{caveat}</li>
                    ))}
                  </ul>
                </div>
                <div className={styles.sourceList}>
                  <p className={styles.utilityLabel}>原始材料</p>
                  {currentLandscape.sources.map((source) => (
                    <a
                      href={source.href}
                      key={source.label}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>
                        <strong>{source.label}</strong>
                        <small>{source.note}</small>
                      </span>
                      <ArrowUpRightIcon aria-hidden="true" />
                    </a>
                  ))}
                  <a
                    className={styles.fullNoteLink}
                    href={currentLandscape.fullNoteHref}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <span>
                      <strong>打开完整说明文档</strong>
                      <small>适合演讲前通读与答疑准备</small>
                    </span>
                    <ArrowUpRightIcon aria-hidden="true" />
                  </a>
                </div>
              </div>

            </div>
          </details>
        </section>

        <section className={styles.storySection} id="apache">
          <div className={styles.apacheOpening}>
            <div>
              <p className={styles.sectionIndex}>02 · APACHE IN THE STACK</p>
              <h2>Apache 项目集中在 Agent 的<em>数据与运行底座</em>。</h2>
            </div>
            <dl>
              <div>
                <dt>Agent 运行</dt>
                <dd>工具调用 · 数据访问 · 持续执行</dd>
              </div>
              <div>
                <dt>Apache 积累</dt>
                <dd>工作流 · 计算 · 数据治理 · 事务</dd>
              </div>
            </dl>
          </div>

          <div className={styles.apacheScale}>
            {[
              ["305", "非 retired 项目记录"],
              ["259", "有 DOAP 技术分类"],
              ["2,473", "非 fork、非归档仓库"],
              ["6 / 57", "入选 Model Infra"],
            ].map(([value, label]) => (
              <div key={label}><strong>{value}</strong><span>{label}</span></div>
            ))}
          </div>
          <p className={styles.dataNote}>
            Projects Directory 2026-07-27 · GitHub apache org 2026-07-30。ASF
            官网另展示 290+ projects、1,300+ releases、10,000+ committers 与
            1,190+ members；这些对象不能互相替代。
          </p>

          <ApacheProjectAtlas
            activeDomain={apacheDomain}
            onDomainChange={setApacheDomain}
          />

          <div className={styles.apacheBridgeLead} id="apache-backbone">
            <div className={styles.apacheBridgeSource}>
              <Image
                src="/project-logos/apache.png"
                alt="Apache"
                width={44}
                height={44}
              />
              <span>LANDSCAPE</span>
              <strong>6 个 Apache 项目</strong>
            </div>
            <div className={styles.apacheBridgeAxis}>
              <span>共同覆盖一条运行链</span>
              <div>
                <b>编排</b>
                <b>计算</b>
                <b>数据</b>
                <b>状态</b>
                <b>恢复</b>
              </div>
            </div>
            <div className={styles.apacheBridgeSource}>
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

          <div className={styles.apacheBackbone}>
            {apacheBackbone.map((stage) => (
              <article key={stage.label}>
                <header>
                  <p>{stage.label}</p>
                  <h3>{stage.title}</h3>
                </header>
                <div className={styles.apacheBackboneProjects}>
                  {stage.projects.map((project) => (
                    <a
                      href={`https://github.com/${project.repo}`}
                      key={project.name}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <div className={styles.apacheProjectLogo}>
                        <Image
                          src={project.logo}
                          alt={`${project.name} logo`}
                          width={150}
                          height={54}
                        />
                      </div>
                      <div className={styles.apacheProjectIdentity}>
                        <strong>{project.name}</strong>
                        <div className={styles.apacheProjectMarks}>
                          <span>
                            <Image
                              src="/project-logos/apache.png"
                              alt=""
                              width={18}
                              height={18}
                            />
                            ASF
                          </span>
                          {project.source === "ant" ? (
                            <span className={styles.antMark}>
                              <Image
                                src="/keynote/apache/assets/ant-group.png"
                                alt=""
                                width={18}
                                height={18}
                              />
                              ANT
                            </span>
                          ) : (
                            <span className={styles.landscapeMark}>
                              LANDSCAPE
                            </span>
                          )}
                        </div>
                      </div>
                      <dl className={styles.apacheProjectFacts}>
                        <div><dt>ROLE</dt><dd>{project.role}</dd></div>
                        <div><dt>POSITION</dt><dd>{project.signal}</dd></div>
                      </dl>
                    </a>
                  ))}
                </div>
              </article>
            ))}
          </div>

          <blockquote>
            Agent 在生产环境里要处理跨语言状态、关系上下文、失败恢复和大规模计算。Landscape 中的
            Apache 项目与蚂蚁参与的四个项目覆盖了这条运行链。
          </blockquote>
          <details className={`${styles.speakerNote} ${styles.deepDive}`}>
            <summary>给演讲者的讲法 · 约 6 分钟</summary>
            <p>
              这一节按两个尺度展开。Projects Directory 展示 Apache 横跨数据、网络、库、云、Web、安全和边缘领域；当前 Model Infra
              中的 6 个 ASF 项目集中在数据、编排与计算。接下来沿系统运行顺序讲项目：Airflow
              组织任务，Spark 与 Celeborn 支撑计算；Iceberg、Hudi、Paimon、Gravitino
              管理开放数据平面，Fory 传递跨语言状态；GeaFlow 维护关系上下文，Seata
              处理提交、补偿和失败恢复。Agent 进入生产后，这些长期存在的系统问题会同时出现。
            </p>
          </details>
        </section>

        <section className={styles.storySection} id="inclusion">
          <div className={styles.inclusionHero}>
            <div className={styles.inclusionMark}>
              <Image
                src="/keynote/inclusionai/inclusionai.png"
                alt="InclusionAI logo"
                width={460}
                height={460}
              />
            </div>
            <div className={styles.sectionHeading}>
              <p className={styles.sectionIndex}>03 · INCLUSIONAI</p>
              <h2>AI Built By Everyone, <em>For Everyone.</em></h2>
              <p>
                InclusionAI 同时开放模型和背后的工程系统。有人做训练，有人接环境，也有人把这些能力带进机器人和医疗场景。
              </p>
              <div className={styles.valueChips} aria-label="InclusionAI 价值主张">
                <span>Fairness</span>
                <span>Transparency</span>
                <span>Collaboration</span>
              </div>
            </div>
          </div>

          <div className={styles.platformGrid}>
            <a href="https://github.com/inclusionAI" target="_blank" rel="noreferrer">
              <header>
                <span>GitHub · 3 orgs</span>
                <ArrowUpRightIcon aria-hidden="true" />
              </header>
              <strong>92</strong>
              <p>公开仓库</p>
              <div>
                <span><b>41,045</b> Stars</span>
                <span><b>3,820</b> Forks</span>
              </div>
            </a>
            <a href="https://huggingface.co/inclusionAI" target="_blank" rel="noreferrer">
              <header>
                <span>Hugging Face · 3 orgs</span>
                <ArrowUpRightIcon aria-hidden="true" />
              </header>
              <strong>197</strong>
              <p>公开模型</p>
              <div>
                <span><b>531,025</b> 近 30 天下载</span>
                <span><b>8,757</b> Likes</span>
              </div>
            </a>
            <a href="https://modelscope.cn/organization/inclusionAI" target="_blank" rel="noreferrer">
              <header>
                <span>ModelScope · 3 orgs</span>
                <ArrowUpRightIcon aria-hidden="true" />
              </header>
              <strong>188</strong>
              <p>公开模型</p>
              <div>
                <span><b>204,942</b> Downloads</span>
                <span><b>634</b> Likes</span>
              </div>
            </a>
          </div>

          <div className={styles.serviceBand}>
            <header>
              <span>AI SERVICE</span>
              <strong>模型和基础设施最后落到这些服务里</strong>
            </header>
            <div>
              {inclusionServices.map((service) => (
                <article key={service.domain}>
                  <Image
                    src={service.logo}
                    alt={`${service.name} logo`}
                    width={56}
                    height={56}
                  />
                  <span>{service.domain}</span>
                  <strong>{service.name}</strong>
                  <small>{service.description}</small>
                </article>
              ))}
            </div>
          </div>

          <div className={styles.inclusionAtlas}>
            <div className={styles.stackLayers} role="tablist" aria-label="InclusionAI 技术栈">
              {(Object.keys(stackData) as StackKey[]).map((key) => (
                <button key={key} type="button" role="tab" aria-selected={stack === key} className={stack === key ? styles.activeStack : ""} onClick={() => setStack(key)}>
                  <strong>{stackData[key].label}</strong>
                  <span>{stackData[key].projects.map((project) => project.name).join(" · ")}</span>
                </button>
              ))}
            </div>
            <article className={styles.stackDetail}>
              <p className={styles.utilityLabel}>{stackData[stack].kicker}</p>
              <h3>{stackData[stack].title}</h3>
              <p>{stackData[stack].body}</p>
              <div className={styles.inclusionProjects}>
                {stackData[stack].projects.map((project) => (
                  <a href={project.href} key={project.name} target="_blank" rel="noreferrer">
                    <span className={styles.inclusionProjectLogo}>
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
                    <ArrowUpRightIcon aria-hidden="true" />
                  </a>
                ))}
              </div>
              <small className={styles.participationCue}>{stackData[stack].ask}</small>
            </article>
          </div>

          <div className={styles.inclusionDetails}>
            <details className={styles.deepDive}>
              <summary>数据口径与三个组织</summary>
              <div>
                <p>
                  GitHub 统计 inclusionAI、AQ-MedAI、Robbyant 三个组织的全部公开仓库；其中 inclusionAI 有 3 个 fork。Hugging Face
                  与 ModelScope 按同名三个发布者分别取公开模型列表。模型在两个 Hub 同时发布时分别保留，不做跨平台去重后总计。
                </p>
                <p>
                  Hugging Face API 的 <code>downloads</code> 对应近 30 天下载。ModelScope OpenAPI 只返回 <code>downloads</code>
                  数值，没有在响应中声明窗口，因此页面只按平台字段原样展示。
                </p>
                <div className={styles.sourceLinks}>
                  <a href="https://github.com/inclusionAI" target="_blank" rel="noreferrer">GitHub ↗</a>
                  <a href="https://huggingface.co/inclusionAI" target="_blank" rel="noreferrer">Hugging Face ↗</a>
                  <a href="https://modelscope.cn/organization/inclusionAI" target="_blank" rel="noreferrer">ModelScope ↗</a>
                  <a href="/keynote/inclusionai/snapshot-2026-07-30.md" target="_blank" rel="noreferrer">完整快照 ↗</a>
                </div>
              </div>
            </details>
            <details className={styles.deepDive}>
              <summary>查看上一版 InclusionAI 技术大图</summary>
              <div className={styles.previousMap}>
                <Image
                  src="/keynote/inclusionai/previous-technical-map.png"
                  alt="上一版 InclusionAI 技术地图"
                  width={2826}
                  height={1592}
                />
              </div>
            </details>
          </div>

          <details className={`${styles.speakerNote} ${styles.deepDive}`}>
            <summary>给演讲者的讲法 · 约 5 分钟</summary>
            <div>
              <p>
                先指着 Logo 和标题说：InclusionAI 的原话是 “AI Built By Everyone, For Everyone”。Everyone
                说的是参与方式。有人训练模型，有人做环境、工具和评测，也有人把技术带进机器人、医疗和日常服务。公平、透明和协作落到工程上，就是材料能拿到、边界能看懂、实验能复现，后来者还能接着做。
              </p>
              <p>
                然后快速扫三张平台卡。GitHub 看软件与协作，Hugging Face 和 ModelScope 看模型发布与分发。只念三个 headline：92 个公开仓库、HF
                197 个公开模型、ModelScope 188 个公开模型。不要把三个平台的模型数相加，也不要把 HF downloads 说成累计下载；它是近 30 天窗口。Stars 和
                Likes 也不要合成一个“认可度”，因为用户动作和平台分母不同。若需要讲变化，只讲可比部分：相较 7 月 11 日快照，GitHub
                多了 6 个公开仓库、7,999 Stars 和 803 Forks；HF downloads 是滚动窗口，不把差值说成“新增下载”。
              </p>
              <p>
                接着从 AI Service 往下讲。LingGuang、金融、医疗和生活服务已经进入真实使用。用户碰到的问题会再传回技术栈，变成数据、环境、奖励、评测和可靠性要求。这里不用展开产品功能，一句话把“开放研究”接到“日常生活”就够了。
              </p>
              <p>
                四个 Tab 不必全部逐项目念。模型页抓住四条路线：Ling 是语言与效率，Ring 是推理和长链路任务，LLaDA 是扩散语言模型，Ming 是全模态。具身页抓住一个闭环：Map / Depth
                解决空间感知，World 建环境模型，VLA 把理解变成动作。行业应用页只举 AQ-MedAI 和 UI-Venus，说明真实行业会重新定义开放材料的边界。
              </p>
              <p>
                最后一定点到 Infra。沿用原来三层参与路径：AReaL、AReno、TwinFlow 是训练与对齐；AWorld、AEnvironment 是 Agent
                运行时与环境；dInfer 把新模型路线变成可运行的软件。收束句可以是：即使你没有资源训练基础模型，也可以从环境、工具、benchmark、推理优化和可靠性进入。AReaL
                主仓库在 areal-project，因此没有计入页面上三个 GitHub 组织的仓库数，但它属于这套协作技术栈。
              </p>
            </div>
          </details>
        </section>

        <section className={styles.storySection} id="licenses">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionIndex}>04 · LICENSE AND OPENNESS</p>
            <h2>开放模型时代，一份许可证只能说明<em>一部分事实</em>。</h2>
            <p>软件许可证回答权利、义务和责任边界。模型发布还要说明权重、训练代码、数据说明和评测材料究竟提供到了什么程度。</p>
          </div>

          <div className={`${styles.licenseDistribution} ${styles.deepDive}`}>
            <div className={styles.licenseDistributionHead}>
              <div>
                <span>LANDSCAPE REPOSITORY LICENSES</span>
                <strong>{visibleLicenseProjects.length} 个项目</strong>
              </div>
              <p>GitHub 仓库的 SPDX 标识 · 数据快照 2026-07-28</p>
            </div>
            <div className={styles.inlineTabs}>
              {licenseLayerLabels.map(([key, label]) => {
                const count = projectsForLicenseLayer(projects, key).length;
                return (
                  <button
                    key={key}
                    type="button"
                    className={licenseLayer === key ? styles.activeTab : ""}
                    onClick={() => setLicenseLayer(key)}
                  >
                    {label} · {count}
                  </button>
                );
              })}
            </div>
            <div className={styles.licenseBars}>
              {licenseDistribution.map((item) => (
                <div className={styles.licenseBarRow} key={item.licenseId}>
                  <strong>
                    {licenseDisplayNames[item.licenseId] ?? item.licenseId}
                  </strong>
                  <i>
                    <b
                      style={{
                        "--license-width": `${(item.count / maxLicenseCount) * 100}%`,
                        "--license-color":
                          licenseColors[item.licenseId] ?? "#6d50ff",
                      } as CSSProperties}
                    />
                  </i>
                  <span>{item.count}</span>
                  <small>{item.share.toFixed(1)}%</small>
                </div>
              ))}
            </div>
            <div className={styles.licenseDistributionFoot}>
              <p>
                全部 132 个项目中，Apache-2.0 为 61 个，MIT 为 37
                个，两者合计 74.2%。
              </p>
              <p>
                NOASSERTION 表示 GitHub / SPDX 没有给出可确认的 SPDX
                标识，不能据此判断“没有许可证”。
              </p>
            </div>
          </div>

          <div className={styles.licenseBand}>
            <div><strong>26</strong><span>Top 50 中没有公开权重</span></div>
            <div><strong>24</strong><span>提供公开权重</span></div>
            <div><strong>70.8%</strong><span>公开权重中采用 MIT 或 Apache-2.0</span></div>
          </div>

          <div className={`${styles.inlineTabs} ${styles.deepDive}`}>
            {([
              ["all", "全部"],
              ["license", "许可证"],
              ["framework", "开放框架"],
              ["definition", "定义"],
            ] as [LicenseFilter, string][]).map(([key, label]) => (
              <button key={key} type="button" className={licenseFilter === key ? styles.activeTab : ""} onClick={() => setLicenseFilter(key)}>{label}</button>
            ))}
          </div>
          <div className={styles.tableScroller}>
            <table className={styles.comparisonTable}>
              <thead><tr><th>方案</th><th>类型</th><th>主要对象</th><th>它说清楚什么</th><th>仍需另行检查</th></tr></thead>
              <tbody>
                {[
                  ["license", "Apache License 2.0", "软件许可证", "软件、文档", "版权许可、专利授权、NOTICE 与责任边界", "模型材料是否完整"],
                  ["license", "OpenMDW 1.1", "模型材料许可证", "Model Materials", "模型材料的使用和分发权利", "不强制发布者提供完整材料"],
                  ["license", "ModelGo", "可组合许可证家族", "模型", "8 个变体组合 BY、SA、RAI、NC、ND 等条件", "不等同于开放完整度分级"],
                  ["framework", "Model Openness Framework", "开放完整度框架", "模型及相关材料", "按代码、数据和文档判断开放层级", "它不是法律许可证"],
                  ["definition", "OSAID 1.0", "开放 AI 定义", "AI 系统", "Use、Study、Modify、Share 及 preferred form", "它不是单一许可证文本"],
                ].filter((row) => licenseFilter === "all" || row[0] === licenseFilter).map((row) => (
                  <tr key={row[1]}>{row.slice(1).map((cell) => <td key={cell}>{cell}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className={`${styles.licenseClauseStudy} ${styles.deepDive}`}>
            <div className={styles.licenseClauseHead}>
              <h3>Apache-2.0 与 OpenMDW-1.1，条款在管什么？</h3>
              <p>
                这里比较许可证文本本身。项目实际发布了哪些材料，要回到仓库和模型页逐项检查。
              </p>
            </div>
            <div className={styles.tableScroller}>
              <table className={styles.clauseTable}>
                <thead>
                  <tr>
                    <th>比较项</th>
                    <th>Apache License 2.0</th>
                    <th>OpenMDW 1.1</th>
                  </tr>
                </thead>
                <tbody>
                  {apacheOpenMdwComparison.map((row) => (
                    <tr key={row.topic}>
                      <td>{row.topic}</td>
                      <td>{row.apache}</td>
                      <td>{row.openMdw}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className={`${styles.opennessLab} ${styles.deepDive}`}>
            <div>
              <p className={styles.utilityLabel}>Interactive release check</p>
              <h3>一份“可修改”的模型发布，还缺哪些材料？</h3>
              <p>六项材料等权，每项占 1/6。分数只表达这张检查表的材料覆盖率，不构成法律判断，也不对应 MOF 或 OSAID 的正式评级。</p>
              <div className={styles.checks}>
                {materialChecks.map((item, index) => (
                  <label key={item.label}>
                    <input
                      type="checkbox"
                      checked={materials[index]}
                      onChange={(event) =>
                        setMaterials((current) =>
                          current.map((value, itemIndex) =>
                            itemIndex === index ? event.target.checked : value,
                          ),
                        )
                      }
                    />
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.reference}</small>
                    </span>
                  </label>
                ))}
              </div>
              <div className={styles.materialReferences}>
                <span>检查项依据</span>
                <a
                  href="https://lfaidata.foundation/wp-content/uploads/sites/3/2025/01/05_White_paper_MOF_Specification.pdf"
                  target="_blank"
                  rel="noreferrer"
                >
                  MOF 1.0
                </a>
                <a
                  href="https://opensource.org/ai/open-source-ai-definition"
                  target="_blank"
                  rel="noreferrer"
                >
                  OSAID 1.0
                </a>
              </div>
            </div>
            <div className={styles.gauge}>
              <div style={gaugeStyle}>
                <span><strong>{materialScore}%</strong><small>{materialLabel}</small></span>
              </div>
            </div>
          </div>

          <div className={`${styles.licenseReferenceRail} ${styles.deepDive}`}>
            <span>PRIMARY REFERENCES</span>
            {licenseReferences.map((reference) => (
              <a
                key={reference.href}
                href={reference.href}
                target="_blank"
                rel="noreferrer"
              >
                {reference.label}
                <ArrowUpRightIcon aria-hidden="true" />
              </a>
            ))}
          </div>

          <blockquote>Apache 2.0 仍然适合软件与文档。模型发布还要交代权重、数据、代码、评测和输出的边界。</blockquote>
          <details className={`${styles.speakerNote} ${styles.deepDive}`}>
            <summary>给演讲者的讲法 · 约 7 分钟</summary>
            <p>
              先讲 132 个项目的仓库许可证。Apache-2.0 与 MIT 合计 98
              个，占 74.2%；25 个 NOASSERTION
              只表示 GitHub 没有给出可确认的 SPDX 标识。它不是“无许可证”的同义词，也没有经过逐仓法律审查。
            </p>
            <ol className={styles.speakerPrompts}>
              <li>
                <strong>从授权对象讲起。</strong>
                Apache-2.0 的语言围绕 Work、Source、Object 和 Derivative
                Works 展开。OpenMDW 把架构、参数以及实际随附的数据、代码和文档合称
                Model Materials。模型许可证需要同时面对参数、数据和文档可能落入的不同权利体系。
              </li>
              <li>
                <strong>再看权利范围。</strong>
                Apache-2.0 明示授予版权和专利许可；OpenMDW
                还写入数据库权利与商业秘密权利。OpenMDW
                的写法试图覆盖模型材料常见的多种权利基础，不代表发布者已经解决其中所有第三方权利。
              </li>
              <li>
                <strong>再分发义务很具体。</strong>
                Apache-2.0 要求附许可证、标记修改、保留相关声明，并按条件处理
                NOTICE。OpenMDW 要求附许可证并保留版权与来源声明。两者都属于宽松授权，但合规动作不能只概括为“可以商用”。
              </li>
              <li>
                <strong>诉讼终止的范围不同。</strong>
                Apache-2.0 的防御性终止落在专利许可；OpenMDW
                覆盖专利与版权诉讼，并让全部授权终止，防御性反诉除外。
              </li>
              <li>
                <strong>输出是模型场景新增的问题。</strong>
                Apache-2.0 没有模型输出这一对象。OpenMDW
                明确不把许可限制或义务传递到生成输出，但著作权、隐私、数据合规等适用法律仍需另行判断。
              </li>
              <li>
                <strong>许可证不会自动补齐材料。</strong>
                OpenMDW 只管发布者实际提供并置于该许可证下的 Model
                Materials，不强制交出训练代码和数据。现场勾选六项材料，展示相同的许可证字段仍可能对应不同的可研究、可复现程度。
              </li>
            </ol>
            <p>
              最后回到 26/50 与 24/50：公开权重需要单独观察。方案总表里混有许可证、框架和定义，不要按“宽松到严格”排序讲。MOF
              检查材料与许可证，OSAID 说明 Use、Study、Modify、Share
              所需的 preferred form；它们承担的任务和许可证文本不同。
            </p>
          </details>
        </section>

        <section className={styles.storySection} id="community">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionIndex}>05 · COMMUNITY OVER CODE</p>
            <h2>Community &gt;&gt;&gt; Code，<br />不是一句温情口号。</h2>
            <p>它描述了一套把陌生贡献变成长期信任的机制。入口要能被找到，讨论要经得起回看，权限要跟着可见贡献增长。</p>
          </div>

          <div className={styles.communityPath} role="tablist" aria-label="开放社区贡献路径">
            {(Object.keys(communityData) as CommunityKey[]).map((key, index) => (
              <button key={key} type="button" role="tab" aria-selected={community === key} className={community === key ? styles.activeCommunity : ""} onClick={() => setCommunity(key)}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <strong>{["发现入口", "提出变更", "公开审查", "共同交付", "积累信任"][index]}</strong>
              </button>
            ))}
          </div>
          <article className={styles.communityDetail}>
            <h3>{communityData[community][0]}</h3>
            <p>{communityData[community][1]}</p>
          </article>

          <div className={`${styles.signalGrid} ${styles.deepDive}`}>
            <article><span>DISCOVERABLE</span><h3>贡献表面要清楚</h3><p>Good first issue、公开 roadmap、模型卡和评测任务，让潜在贡献者知道怎样开始。</p></article>
            <article><span>REVIEWABLE</span><h3>决定要留下理由</h3><p>公开 proposal、issue / PR 审查和可复现实验，让技术选择不依赖内部上下文。</p></article>
            <article><span>EARNED</span><h3>权限跟随贡献</h3><p>committer 和 member 的权限来自持续、可见、能被社区检验的工作。</p></article>
          </div>

          <blockquote>老规矩要保留的是透明入口、公开过程和渐进式信任；现在，它们还要覆盖模型、数据和评测。</blockquote>

          <div className={styles.resourceGrid}>
            <a href="https://github.com/antgroup/agentic-ai-landscape" target="_blank" rel="noreferrer"><span>LANDSCAPE</span><strong>Agentic AI Landscape</strong><small>项目表、筛选方法与生态图</small><ArrowUpRightIcon aria-hidden="true" /></a>
            <a href="https://github.com/inclusionAI" target="_blank" rel="noreferrer"><span>STACK</span><strong>InclusionAI</strong><small>模型、训练与 agent 基础设施</small><ArrowUpRightIcon aria-hidden="true" /></a>
            <a href="https://www.apache.org/theapacheway/" target="_blank" rel="noreferrer"><span>GOVERNANCE</span><strong>The Apache Way</strong><small>跨组织开放协作的实践</small><ArrowUpRightIcon aria-hidden="true" /></a>
          </div>

          <details className={`${styles.speakerNote} ${styles.deepDive}`}>
            <summary>给演讲者的讲法 · 约 3 分钟</summary>
            <p>逐个点击贡献路径，但不要把结尾讲成价值观清单。举一个具体动作：一个模型发布如果能被社区继续训练，需要的不只是下载按钮，还要有材料、复现实验、公开问题和变更过程。最后停在三个资源入口。</p>
          </details>
        </section>

        <footer className={styles.footer}>
          <p>CommunityOverCode China 2026 <span>·</span> August 7</p>
          <div>
            <a href="https://openmdw.ai/faq/" target="_blank" rel="noreferrer">OpenMDW</a>
            <a href="https://www.modelgo.li/" target="_blank" rel="noreferrer">ModelGo</a>
            <a href="https://opensource.org/ai/open-source-ai-definition" target="_blank" rel="noreferrer">OSAID</a>
          </div>
        </footer>
      </div>
    </main>
  );
}
