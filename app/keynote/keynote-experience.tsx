"use client";

import {
  ArrowLeftIcon,
  ArrowUpRightIcon,
  ExpandIcon,
} from "lucide-react";
import Link from "next/link";
import {
  type CSSProperties,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import styles from "./page.module.css";
import LandscapeLogo from "../components/landscape-logo";

type LandscapeKey = "agent" | "model" | "large" | "awesome";
type StackKey = "models" | "training" | "runtime";
type CommunityKey = "discover" | "propose" | "review" | "ship" | "trust";
type ProjectSetKey = "landscape" | "ant";
type LicenseFilter = "all" | "license" | "framework" | "definition";

type LandscapeView = {
  label: string;
  src: string;
  caption: string;
  source: string;
  base?: [number, number];
};

const chapters = [
  ["landscape", "生态图更新"],
  ["apache", "Apache 的位置"],
  ["inclusion", "InclusionAI 技术栈"],
  ["licenses", "模型开放与许可证"],
  ["community", "Community >>> Code"],
] as const;

const landscapeViews: Record<LandscapeKey, LandscapeView> = {
  agent: {
    label: "Agent Infra",
    src: "/#agent-infra",
    caption: "站内 live explorer，可搜索项目、切换 OpenRank 月份并查看项目详情。",
    source: "live · same site",
  },
  model: {
    label: "Model Infra",
    src: "/#model-infra",
    caption: "站内 live explorer，观察训练、推理、数据与计算调度层。",
    source: "live · same site",
  },
  large: {
    label: "Large Models",
    src: "/keynote/large-models/index.html",
    caption: "公开权重与使用信号构成的 2026 Large Models 快照。",
    source: "local · 3840 × 2160",
    base: [3840, 2160],
  },
  awesome: {
    label: "Awesome",
    src: "/keynote/awesome/awesome_agentic_landscape_2026.html",
    caption: "Discover、Reuse、Install、Operate 四种 agent 使用方式。",
    source: "local · 1920 × 1080",
    base: [1920, 1080],
  },
};

const apacheProjectSets: Record<ProjectSetKey, string[][]> = {
  landscape: [
    ["Apache Airflow", "Data · Integration", "46,289", "144.80"],
    ["Apache Spark", "Compute & scheduling", "43,716", "87.87"],
    ["Apache Iceberg", "Data · Governance", "9,085", "57.16"],
    ["Apache Hudi", "Data · Governance", "6,197", "38.83"],
    ["Apache Paimon", "Data · Governance", "3,353", "18.40"],
    ["Apache Gravitino", "Data · Governance", "3,136", "40.68"],
  ],
  ant: [
    ["Apache Fory", "多语言序列化", "4,424", "TLP · 2025-07-17"],
    ["Apache GeaFlow", "图计算与流图融合", "788", "Incubating"],
    ["Apache Seata", "分布式事务", "25,976", "Incubating"],
    ["Apache Celeborn", "大数据 shuffle 服务", "1,059", "TLP · 2024-03-21"],
  ],
};

const stackData: Record<
  StackKey,
  { kicker: string; title: string; projects: string[]; body: string; ask: string }
> = {
  models: {
    kicker: "MODELS",
    title: "模型层提供共同研究对象",
    projects: ["Ling", "LLaDA", "Ming"],
    body: "模型层的价值不只在权重可下载。模型说明、评测边界和衍生工作入口越清楚，社区越容易复核结果，继续做领域适配与推理优化。",
    ask: "可以参与：模型评测、领域适配、推理优化和行为研究。",
  },
  training: {
    kicker: "TRAINING & ALIGNMENT",
    title: "训练过程也能进入协作",
    projects: ["AReaL", "AReno", "TwinFlow"],
    body: "训练与对齐层把复现实验、强化学习和系统效率暴露给社区。AReaL 主仓库位于 areal-project，这里描述的是技术栈连接，并未把它计入 inclusionAI org 的仓库数。",
    ask: "可以参与：算法实现、分布式效率、可复现实验与评测工具。",
  },
  runtime: {
    kicker: "AGENT RUNTIME",
    title: "真实环境里还有大量工程工作",
    projects: ["AWorld", "AEnvironment", "Avernet"],
    body: "运行时与环境层连接工具、任务和长链路执行。应用与系统开发者不必重新训练基础模型，也能通过环境、任务集和可靠性工作贡献可验证能力。",
    ask: "可以参与：环境、工具接口、任务集、观测与运行时可靠性。",
  },
};

const communityData: Record<CommunityKey, [string, string]> = {
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

const materialChecks = [
  "模型权重",
  "架构说明",
  "训练代码",
  "数据来源说明",
  "评测方法与结果",
  "使用与修改文档",
];

function DataBar({
  label,
  value,
  display,
  tone = "violet",
}: {
  label: string;
  value: number;
  display: string;
  tone?: "pink" | "violet" | "cyan" | "orange";
}) {
  return (
    <div className={styles.barRow}>
      <span>{label}</span>
      <i className={styles[tone]} aria-hidden="true">
        <b style={{ width: `${value}%` }} />
      </i>
      <strong>{display}</strong>
    </div>
  );
}

export default function KeynoteExperience() {
  const rootRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [activeChapter, setActiveChapter] = useState("landscape");
  const [mode, setMode] = useState<"research" | "presentation">("research");
  const [landscape, setLandscape] = useState<LandscapeKey>("agent");
  const [frameScale, setFrameScale] = useState(1);
  const [frameLoaded, setFrameLoaded] = useState(false);
  const [projectSet, setProjectSet] = useState<ProjectSetKey>("landscape");
  const [stack, setStack] = useState<StackKey>("models");
  const [licenseFilter, setLicenseFilter] = useState<LicenseFilter>("all");
  const [materials, setMaterials] = useState([true, false, false, false, false, false]);
  const [community, setCommunity] = useState<CommunityKey>("discover");

  const currentLandscape = landscapeViews[landscape];
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
    <main
      ref={rootRef}
      lang="zh-CN"
      className={`${styles.page} ${
        mode === "presentation" ? styles.presentationMode : ""
      }`}
    >
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
          <Link className={styles.backLink} href="/">
            <ArrowLeftIcon aria-hidden="true" />
            返回生态图
          </Link>
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
          <div><span>OpenRouter / ZenMux</span><strong>2026-07-21—27</strong></div>
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
          <div className={styles.modeSwitch} aria-label="页面密度">
            <button
              type="button"
              className={mode === "research" ? styles.activeMode : ""}
              onClick={() => setMode("research")}
            >
              研究视图
            </button>
            <button
              type="button"
              className={mode === "presentation" ? styles.activeMode : ""}
              onClick={() => setMode("presentation")}
            >
              演讲视图
            </button>
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
              ["当前总览", "126", "live overview", 2.06],
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
              <div>
                <a href={currentLandscape.src} target="_blank" rel="noreferrer">
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
              {!frameLoaded ? <p className={styles.loading}>正在加载生态图…</p> : null}
              <iframe
                key={landscape}
                className={currentLandscape.base ? styles.fixedFrame : styles.liveFrame}
                style={frameStyle}
                src={currentLandscape.src}
                title={`${currentLandscape.label} landscape`}
                onLoad={() => setFrameLoaded(true)}
              />
            </div>
            <div className={styles.explorerCaption}>
              <span>{currentLandscape.caption}</span>
              <strong>{currentLandscape.source}</strong>
            </div>
          </div>

          <div className={styles.signalGrid}>
            <article><span>SIGNAL A</span><h3>协议开始占据版面</h3><p>MCP、A2A、AG-UI、A2UI 让工具、agent、界面和上下文之间出现了更明确的连接层。</p></article>
            <article><span>SIGNAL B</span><h3>推理栈继续分化</h3><p>推理引擎、KV cache 和调度不再适合压在一个方块里。长链路负载把系统问题重新放大。</p></article>
            <article><span>SIGNAL C</span><h3>README 开始被机器执行</h3><p>24 个入选 Awesome 项目中，19 个已经具备直接供 agent 使用的入口。</p></article>
          </div>

          <details className={`${styles.speakerNote} ${styles.deepDive}`}>
            <summary>给演讲者的讲法 · 约 7 分钟</summary>
            <p>先用 6,118 → 878 → 222 解释扫描，不要逐项念项目。随后切换 Agent Infra 与 Model Infra，分别指出协议层和推理层的增厚。Large Models 用来说明模型开放并非二元标签；Awesome 图引出 README 正在成为可执行接口。OpenRank 最新完整月是 2026-06，GitHub 信息截止 2026-07-28，两种时间口径不能混用。</p>
          </details>
        </section>

        <section className={styles.storySection} id="apache">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionIndex}>02 · APACHE IN THE STACK</p>
            <h2>Apache 不常出现在 Agent 产品层，却已经在<em>系统主干</em>上。</h2>
            <p>Agent 开始调用工具、访问数据并持续运行，底层越来越像一套分布式系统。数据治理、工作流、计算调度和事务，都是 Apache 社区长期积累的地带。</p>
          </div>

          <div className={styles.apacheScale}>
            {[["290+", "Open Source Projects"], ["1,300+", "Annual Releases"], ["10,000+", "Committers"], ["1,190+", "Members"]].map(([value, label]) => (
              <div key={label}><strong>{value}</strong><span>{label}</span></div>
            ))}
          </div>
          <p className={styles.dataNote}>ASF 官网首页展示值，访问于 2026-07-29。项目、年度发布、committer 与 member 是四种统计对象。</p>

          <div className={`${styles.chartGrid} ${styles.deepDive}`}>
            <article>
              <p className={styles.utilityLabel}>GitHub apache org · 2026-07-29</p>
              <h3>仓库规模与近期活动</h3>
              <div className={styles.barChart}>
                <DataBar label="非 fork、非归档" value={100} display="2,474" tone="cyan" />
                <DataBar label="过去 365 天 push" value={94.5} display="2,337" tone="cyan" />
                <DataBar label="过去 90 天 push" value={80.3} display="1,986" tone="cyan" />
                <DataBar label="过去 30 天 push" value={38.3} display="947" tone="cyan" />
              </div>
            </article>
            <article>
              <p className={styles.utilityLabel}>Selected Model Infra landscape</p>
              <h3>Apache 的密度集中在数据与计算</h3>
              <div className={styles.barChart}>
                <DataBar label="Data Governance" value={57.1} display="4 / 7" tone="orange" />
                <DataBar label="Data Integration" value={33.3} display="1 / 3" tone="orange" />
                <DataBar label="Compute & scheduling" value={25} display="1 / 4" tone="orange" />
                <DataBar label="Model Infra overall" value={10.5} display="6 / 57" tone="orange" />
              </div>
            </article>
          </div>

          <div className={styles.projectSwitcher}>
            <div className={styles.inlineTabs}>
              <button className={projectSet === "landscape" ? styles.activeTab : ""} type="button" onClick={() => setProjectSet("landscape")}>全景图中的 Apache</button>
              <button className={projectSet === "ant" ? styles.activeTab : ""} type="button" onClick={() => setProjectSet("ant")}>蚂蚁深度参与</button>
            </div>
            <div className={styles.tableScroller}>
              <table>
                <thead><tr><th>项目</th><th>技术位置</th><th>Stars</th><th>OpenRank 2026-06 / 状态</th></tr></thead>
                <tbody>
                  {apacheProjectSets[projectSet].map((row) => (
                    <tr key={row[0]}>{row.map((cell, index) => <td key={cell}>{index === 3 ? <span>{cell}</span> : cell}</td>)}</tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <blockquote>Apache 在 Agentic AI 里的优势，是一套已经跨组织运行了二十多年的基础设施与治理方法。</blockquote>
          <details className={`${styles.speakerNote} ${styles.deepDive}`}>
            <summary>给演讲者的讲法 · 约 6 分钟</summary>
            <p>四个官网数字只做规模开场，紧接着解释口径：一个 ASF project 可以对应多个 GitHub repo，committer 也不等于 member。然后讲全景图里的 6 个项目，指出 Iceberg、Hudi、Paimon、Gravitino 在 Data Governance 占 4/7。最后切换到 Fory、GeaFlow、Seata、Celeborn；stars 只描述关注度，不代替社区健康。</p>
          </details>
        </section>

        <section className={styles.storySection} id="inclusion">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionIndex}>03 · INCLUSIONAI</p>
            <h2>把开放做成一套<em>可以进入、可以验证</em>的技术栈。</h2>
            <p>InclusionAI 的观察价值不在仓库数量本身。模型、训练系统与 agent 运行时连接起来后，没有大规模训练资源的开发者也能改环境、工具或评测。</p>
          </div>

          <div className={styles.statStrip}>
            {[["58", "公开仓库", "GitHub org snapshot"], ["10,753", "合计 stars", "关注度，不等同活跃度"], ["45 / 58", "Apache-2.0 或 MIT", "GitHub API 识别"], ["22", "7 月以来有 push", "截至 2026-07-28"]].map(([value, label, note]) => (
              <div key={label}><strong>{value}</strong><span>{label}</span><small>{note}</small></div>
            ))}
          </div>

          <div className={styles.stackMap}>
            <div className={styles.stackLayers} role="tablist" aria-label="InclusionAI 技术栈">
              {(Object.keys(stackData) as StackKey[]).map((key) => (
                <button key={key} type="button" role="tab" aria-selected={stack === key} className={stack === key ? styles.activeStack : ""} onClick={() => setStack(key)}>
                  <strong>{key === "models" ? "模型层" : key === "training" ? "训练与对齐" : "Agent 运行时与环境"}</strong>
                  <span>{stackData[key].projects.join(" · ")}</span>
                </button>
              ))}
            </div>
            <article className={styles.stackDetail}>
              <p className={styles.utilityLabel}>{stackData[stack].kicker}</p>
              <h3>{stackData[stack].title}</h3>
              <div>{stackData[stack].projects.map((project) => <span key={project}>{project}</span>)}</div>
              <p>{stackData[stack].body}</p>
              <small>{stackData[stack].ask}</small>
            </article>
          </div>

          <div className={`${styles.chartGrid} ${styles.deepDive}`}>
            <article>
              <p className={styles.utilityLabel}>Repository license detection</p>
              <h3>GitHub API 识别的许可证分布</h3>
              <div className={styles.barChart}>
                <DataBar label="Apache-2.0" value={44.8} display="26" />
                <DataBar label="MIT" value={32.8} display="19" />
                <DataBar label="未识别 / 未声明" value={22.4} display="13" tone="pink" />
              </div>
            </article>
            <article className={styles.prosePanel}>
              <p className={styles.utilityLabel}>Participation surfaces</p>
              <h3>贡献入口的成本并不相同</h3>
              <p>模型研究者可以改训练与评测；系统研究者可以优化并行和环境；应用开发者可以贡献工具和任务。共同点是接口与结果能够公开验证。</p>
              <small>AReaL 位于 areal-project/AReaL，按技术栈关系呈现，不计入 inclusionAI org 的 58 个仓库。</small>
            </article>
          </div>

          <details className={`${styles.speakerNote} ${styles.deepDive}`}>
            <summary>给演讲者的讲法 · 约 5 分钟</summary>
            <p>依次点模型、训练、运行时三层，每层只举一两个项目和一种可贡献内容。重点放在参与面：即使不能训练基础模型，也能改环境、任务、评测和 runtime，并通过公开结果进入协作。</p>
          </details>
        </section>

        <section className={styles.storySection} id="licenses">
          <div className={styles.sectionHeading}>
            <p className={styles.sectionIndex}>04 · LICENSE AND OPENNESS</p>
            <h2>开放模型时代，一份许可证只能说明<em>一部分事实</em>。</h2>
            <p>软件许可证回答权利、义务和责任边界。模型发布还要说明权重、训练代码、数据说明和评测材料究竟提供到了什么程度。</p>
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

          <div className={`${styles.opennessLab} ${styles.deepDive}`}>
            <div>
              <p className={styles.utilityLabel}>Interactive release check</p>
              <h3>一份“可修改”的模型发布，还缺哪些材料？</h3>
              <p>勾选发布者实际提供的内容。这个演示只表达材料完整度，不构成法律判断，也不对应任何框架的正式评级。</p>
              <div className={styles.checks}>
                {materialChecks.map((label, index) => (
                  <label key={label}>
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
                    {label}
                  </label>
                ))}
              </div>
            </div>
            <div className={styles.gauge}>
              <div style={gaugeStyle}>
                <span><strong>{materialScore}%</strong><small>{materialLabel}</small></span>
              </div>
            </div>
          </div>

          <blockquote>Apache 2.0 没有过时。模型时代需要补上的，是对开放对象和材料边界同样清楚的说明。</blockquote>
          <details className={`${styles.speakerNote} ${styles.deepDive}`}>
            <summary>给演讲者的讲法 · 约 7 分钟</summary>
            <p>先用 26/50 与 24/50 说明公开权重需要单独观察。比较表不要按严格到宽松来念，因为这里混合了许可证、框架和定义。可现场勾选权重、训练代码和数据说明，让观众看到：license 字段相同，材料完整度仍可能完全不同。</p>
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
