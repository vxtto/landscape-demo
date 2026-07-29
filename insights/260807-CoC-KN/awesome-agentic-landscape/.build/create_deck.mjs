import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";
import { buildSlide01 } from "./grid-layouts/slide-01.mjs";
import { buildSlide08 } from "./grid-layouts/slide-08.mjs";
import { buildSlide11 } from "./grid-layouts/slide-11.mjs";
import { buildSlide13 } from "./grid-layouts/slide-13.mjs";
import { buildSlide17 } from "./grid-layouts/slide-17.mjs";
import { buildSlide19 } from "./grid-layouts/slide-19.mjs";
import { buildSlide26 } from "./grid-layouts/slide-26.mjs";

const BUILD_DIR = path.resolve(
  "/Users/xiaoyawork/Desktop/src_code/agentic-ai-landscape/presentations/260729-awesome-agentic-landscape/.build",
);
const FINAL_DIR = path.dirname(BUILD_DIR);
const FINAL_PPTX = path.join(FINAL_DIR, "awesome_agentic_landscape_trends_2026.pptx");
const RENDER_DIR = path.join(BUILD_DIR, "rendered");

const LANDSCAPE = path.resolve(
  "/Users/xiaoyawork/Desktop/src_code/agentic-ai-landscape/outputs/awesome-agentic-landscape-260729/landscape/awesome_agentic_landscape_2026.png",
);
const ASSETS = {
  vercel: path.join(BUILD_DIR, "assets/vercel-skills.png"),
  design: path.join(BUILD_DIR, "assets/awesome-design-md.png"),
  image2: path.join(BUILD_DIR, "assets/awesome-gpt-image-2.png"),
  superpowers: path.join(BUILD_DIR, "assets/superpowers.png"),
  anthropic: path.resolve(
    "/Users/xiaoyawork/Desktop/src_code/agentic-ai-landscape/outputs/awesome-agentic-landscape-260729/landscape/assets/github-avatars/anthropics.png",
  ),
  openai: path.resolve(
    "/Users/xiaoyawork/Desktop/src_code/agentic-ai-landscape/outputs/awesome-agentic-landscape-260729/landscape/assets/github-avatars/openai.png",
  ),
  google: path.resolve(
    "/Users/xiaoyawork/Desktop/src_code/agentic-ai-landscape/outputs/awesome-agentic-landscape-260729/landscape/assets/github-avatars/google.png",
  ),
};

const FONT = "PingFang SC";
const INK = "#111318";
const MUTED = "#565D68";
const PANEL = "#F2F2F2";
const RULE = "#B8BCC4";
const BLUE = "#3D8DFF";
const LIGHT_BLUE = "#EAF5FB";
const PINK = "#EAA7CE";
const PURPLE = "#CFA8E8";
const STAGE_BLUE = "#9EBDEB";
const GREEN = "#98D5BD";

function rich(text, fontSize = "24px", options = {}) {
  return {
    runs: [
      {
        run: text,
        textStyle: {
          fontSize,
          typeface: FONT,
          color: options.color ?? INK,
          bold: options.bold ?? false,
        },
      },
    ],
    paragraphStyle: {
      lineSpacingPercent: options.lineSpacingPercent ?? 105000,
    },
    ...(options.spaceAfter ? { spaceAfter: options.spaceAfter } : {}),
    ...(options.spaceBefore ? { spaceBefore: options.spaceBefore } : {}),
  };
}

function title(text) {
  return rich(text, "38.67px", { bold: true, lineSpacingPercent: 90000 });
}

function footer(n) {
  return rich(String(n), "13.33px", { color: MUTED });
}

function addTextbox(slide, {
  text,
  left,
  top,
  width,
  height,
  fontSize = 24,
  color = INK,
  bold = false,
  fill = "none",
  lineFill = "none",
  lineWidth = 0,
  typeface = FONT,
  alignment = "left",
  verticalAlignment = "top",
  name = "textbox",
}) {
  const box = slide.shapes.add({
    geometry: "textbox",
    name,
    position: { left, top, width, height },
    fill,
    line: { style: "solid", fill: lineFill, width: lineWidth },
  });
  box.text = text;
  box.text.style = {
    fontSize,
    color,
    bold,
    typeface,
    alignment,
    verticalAlignment,
  };
  return box;
}

function addRule(slide, left, top, width, fill = RULE, height = 2) {
  return slide.shapes.add({
    geometry: "rect",
    name: "rule",
    position: { left, top, width, height },
    fill,
    line: { style: "solid", fill, width: 0 },
  });
}

async function addImage(slide, imagePath, position, {
  alt,
  fit = "cover",
  crop,
  radius = "rounded-xl",
} = {}) {
  const blob = await fs.readFile(imagePath);
  return slide.images.add({
    blob,
    contentType: "image/png",
    alt: alt ?? path.basename(imagePath),
    fit,
    position,
    ...(crop ? { crop } : {}),
    geometry: "roundRect",
    borderRadius: radius,
  });
}

function setNotes(slide, narrative, sources) {
  const sourceLines = sources.map((source) => `- ${source}`).join("\n");
  slide.speakerNotes.textFrame.setText(
    `${narrative}\n\n[Sources]\n${sourceLines}\n[/Sources]`,
  );
}

function addSourceLine(slide, text) {
  addTextbox(slide, {
    text,
    left: 42,
    top: 650,
    width: 1100,
    height: 22,
    fontSize: 12,
    color: MUTED,
    name: "source-note",
  });
}

async function writeBlob(outputPath, blob) {
  await fs.writeFile(outputPath, new Uint8Array(await blob.arrayBuffer()));
}

async function main() {
  await fs.mkdir(RENDER_DIR, { recursive: true });
  const presentation = Presentation.create({
    slideSize: { width: 1280, height: 720 },
  });

  // 1 — Cover
  const s1 = buildSlide01(presentation, {
    title: rich("OPEN-SOURCE SIGNALS / JULY 2026", "22px", {
      bold: true,
      color: BLUE,
    }),
    title2: rich("当 README\n开始被 agent 执行", "76px", {
      bold: true,
      lineSpacingPercent: 88000,
    }),
    title3: rich(
      "Awesome × Agentic AI Landscape 2026\n460 repositories scanned",
      "25px",
      { color: MUTED, lineSpacingPercent: 112000 },
    ),
  });
  addRule(s1, 41, 145, 1198, BLUE, 5);
  setNotes(
    s1,
    "开场可以先抛出这个观察：代码生成越来越便宜，但让 agent 按正确顺序做事、遵守团队习惯，仍然很贵。我们去看 awesome 仓库，是因为它们正在记录这种稀缺知识。",
    [
      "Local analysis: outputs/awesome-agentic-landscape-260729/data/awesome_agentic_candidates.csv",
      "Local artifact: outputs/awesome-agentic-landscape-260729/landscape/awesome_agentic_landscape_2026.png",
    ],
  );

  // 2 — Full landscape
  const s2 = buildSlide08(presentation, {
    title: title("这张图画的，是知识靠近 agent 的方式"),
    body1: {
      titleHere: "",
      loremIpsumDolorSitAmetConsecteturAdipiscing: "",
    },
    footer1: footer(2),
  });
  await addImage(
    s2,
    LANDSCAPE,
    { left: 41, top: 112, width: 1198, height: 524 },
    {
      alt: "Awesome × Agentic AI Landscape 2026",
      fit: "cover",
      crop: { left: 0, top: 0.095, right: 0, bottom: 0.025 },
      radius: 0,
    },
  );
  s2.shapes.add({
    geometry: "rect",
    name: "title-cleanup",
    position: { left: 0, top: 0, width: 1280, height: 112 },
    fill: "#FFFFFF",
    line: { style: "solid", fill: "#FFFFFF", width: 0 },
  });
  addTextbox(s2, {
    text: "这张图画的，是知识靠近 agent 的方式",
    left: 41,
    top: 36,
    width: 1197,
    height: 74,
    fontSize: 39,
    bold: true,
    name: "landscape-title-overlay",
  });
  setNotes(
    s2,
    "不要逐个念项目。先解释横向逻辑：左边仍然是给人读的地图；越往右，内容越接近 agent 可以直接加载和执行的形态。Core、Watch 和历史参照只是编辑角色，不是质量评级。",
    [
      "Local artifact: outputs/awesome-agentic-landscape-260729/landscape/awesome_agentic_landscape_2026.png",
      "Local data: outputs/awesome-agentic-landscape-260729/landscape/awesome_agentic_landscape_projects.csv",
    ],
  );

  // 3 — Evidence
  const s3 = buildSlide19(presentation, {
    title: title("真正有故事的项目，大多已经靠近 agent 运行时"),
    body1: {
      topic: rich("这是一份编辑样本，不是市场份额统计。它说明我们在 460 个候选里看到了什么。", "22px", {
        bold: true,
      }),
      loremIpsumDolorSitAmetConsecteturAdipiscing: rich(
        "近三个月的活动信号负责发现项目；最终入选还要看内容能否被 agent 直接消费，以及它是否代表一种新的策展形态。",
        "19px",
        { color: MUTED },
      ),
    },
    stat1: rich("24", "56px", { bold: true }),
    stat2: rich("19 / 24", "56px", { bold: true, color: BLUE }),
    stat3: rich("22 / 24", "56px", { bold: true }),
    body2: rich("进入首轮 landscape\n另有 2 个历史参照", "18px", {
      color: MUTED,
    }),
    body3: rich("可直接交给 agent\n约 79%", "18px", { color: MUTED }),
    body4: rich("创建于 2025 年以后\n约 92%", "18px", { color: MUTED }),
    footer1: footer(3),
  });
  addRule(s3, 41, 302, 1198, BLUE, 4);
  addSourceLine(
    s3,
    "Snapshot 2026-07-29 · WatchEvents/participants: May 1–Jul 28 · OpenRank: Apr–Jun 2026",
  );
  setNotes(
    s3,
    "这里最值得讲的是 19/24。入选项目里，绝大多数已经不是纯阅读材料，而是文件、目录、命令或方法，可以直接进入 agent 工作流。22/24 创建于 2025 年以后，也说明这个形态非常新。注意：这是编辑样本，只能用来描述我们观察到的模式。",
    [
      "Local data: outputs/awesome-agentic-landscape-260729/data/editorial_shortlist.csv",
      "Local validation: outputs/awesome-agentic-landscape-260729/data/validation_report.json",
    ],
  );

  // 4 — Four forms
  const s4 = buildSlide13(presentation, {
    title: title("“Awesome”正在长出四种消费方式"),
    body1: {
      titleGoesHere: rich("01  DISCOVER", "24px", { bold: true, color: "#8A245F" }),
      loremIpsumDolorSitAmetConsecteturAdipiscing: rich(
        "人来阅读、浏览、比较。\n代表：经典 awesome 列表、生态地图。",
        "20px",
        { color: MUTED },
      ),
    },
    body2: {
      titleGoesHere: rich("02  REUSE", "24px", { bold: true, color: "#70408C" }),
      loremIpsumDolorSitAmetConsecteturAdipiscing: rich(
        "复制一份资产，再让 agent 使用。\n代表：prompt、DESIGN.md、工作流模板。",
        "20px",
        { color: MUTED },
      ),
    },
    body3: {
      titleGoesHere: rich("03  INSTALL", "24px", { bold: true, color: "#285D9E" }),
      loremIpsumDolorSitAmetConsecteturAdipiscing: rich(
        "目录带有解析和安装语义。\n代表：skills、plugins、跨 agent catalog。",
        "20px",
        { color: MUTED },
      ),
    },
    body4: {
      titleGoesHere: rich("04  OPERATE", "24px", { bold: true, color: "#257653" }),
      loremIpsumDolorSitAmetConsecteturAdipiscing: rich(
        "内容开始规定 agent 如何计划、评审和收尾。\n代表：spec、TDD、角色与工程方法。",
        "20px",
        { color: MUTED },
      ),
    },
    footer1: footer(4),
  });
  addRule(s4, 51, 199, 250, PINK, 7);
  addRule(s4, 666, 199, 250, PURPLE, 7);
  addRule(s4, 51, 408, 250, STAGE_BLUE, 7);
  addRule(s4, 666, 408, 250, GREEN, 7);
  setNotes(
    s4,
    "这四列不是成熟度阶梯。它们描述的是消费方式：谁来读、怎样拿走、能不能安装，以及能不能约束 agent 的工作过程。一个项目也可能跨两列，我们放在最能说明故事的位置。",
    [
      "Local data: outputs/awesome-agentic-landscape-260729/landscape/awesome_agentic_landscape_projects.csv",
      "Local methodology: outputs/awesome-agentic-landscape-260729/analysis/render_awesome_agentic_landscape.py",
    ],
  );

  // 5 — Vercel story
  const s5 = buildSlide08(presentation, {
    title: title("这个列表学会了安装自己"),
    body1: {
      titleHere: rich("vercel-labs/skills", "27px", { bold: true }),
      loremIpsumDolorSitAmetConsecteturAdipiscing: rich(
        "过去，我们打开 awesome 列表，点链接，再把东西搬进自己的项目。\n\n这里，一条命令完成发现、选择和安装。目录第一次带上了“执行语义”。",
        "21px",
        { color: MUTED, lineSpacingPercent: 116000 },
      ),
    },
    footer1: footer(5),
  });
  await addImage(
    s5,
    ASSETS.vercel,
    { left: 658, top: 122, width: 582, height: 291 },
    { alt: "GitHub repository card for vercel-labs/skills", fit: "cover" },
  );
  addTextbox(s5, {
    text: "npx skills add vercel-labs/agent-skills",
    left: 690,
    top: 452,
    width: 518,
    height: 78,
    fontSize: 22,
    bold: true,
    fill: LIGHT_BLUE,
    lineFill: BLUE,
    lineWidth: 1,
    typeface: "SFMono-Regular",
    verticalAlignment: "middle",
    name: "install-command",
  });
  addTextbox(s5, {
    text: "也可以不安装：skills use 会生成 prompt，直接启动一个受支持的 coding agent。",
    left: 690,
    top: 548,
    width: 506,
    height: 72,
    fontSize: 17,
    color: MUTED,
    name: "use-command-explainer",
  });
  setNotes(
    s5,
    "这个项目很像 npm 早期给 JavaScript 带来的变化：它给 skill 目录增加了解析、安装、更新和运行的语义。README 还展示了不落盘的 skills use。列表不再等人来摘，它已经知道怎样进入 agent。",
    [
      "https://github.com/vercel-labs/skills",
      "Local metrics: outputs/awesome-agentic-landscape-260729/data/editorial_shortlist.csv",
      "Image: https://opengraph.githubassets.com/1/vercel-labs/skills",
    ],
  );

  // 6 — Two domain-playbook stories
  const s6 = buildSlide11(presentation, {
    title: title("专业手艺开始被压进一份 Markdown"),
    body1: {
      topic: "",
      loremIpsumDolorSitAmetConsecteturAdipiscing: "",
      loremIpsumDolorSitAmetConsecteturAdipiscing2: "",
    },
    body2: rich('DESIGN.md\n“build me a page that looks like this”', "24px", {
      bold: true,
      lineSpacingPercent: 108000,
    }),
    body3: rich("style-library.json\n→ website + Agent Skill", "24px", {
      bold: true,
      lineSpacingPercent: 108000,
    }),
    body4: {
      detailGoesHere: rich("复制一个 DESIGN.md 到项目根目录。", "18px"),
      detailGoesHere2: rich("颜色、排版、组件和禁区都写进去。", "18px"),
      detailGoesHere3: rich("agent 读的不是链接，而是一套视觉语言。", "18px", {
        bold: true,
      }),
    },
    body5: {
      detailGoesHere: rich("470+ 案例和 20+ 模板共用一份 style library。", "18px"),
      detailGoesHere2: rich("同一份数据同时驱动网站和 agent skill。", "18px"),
      detailGoesHere3: rich("Prompt gallery 开始像软件包一样分发。", "18px", {
        bold: true,
      }),
    },
    footer1: footer(6),
  });
  await addImage(
    s6,
    ASSETS.design,
    { left: 42, top: 137, width: 581, height: 182 },
    { alt: "GitHub repository card for awesome-design-md", fit: "cover" },
  );
  await addImage(
    s6,
    ASSETS.image2,
    { left: 657, top: 137, width: 581, height: 182 },
    { alt: "GitHub repository card for awesome-gpt-image-2", fit: "cover" },
  );
  setNotes(
    s6,
    "这两个项目很有画面感。左边把一个品牌的视觉规则压成 DESIGN.md，agent 放进项目就能读。右边更进一步：网站展示的 470 多个案例，和 agent skill 读取的是同一份 style-library 数据。过去的 prompt gallery 是给人找灵感；现在它开始维护一个可安装的知识包。",
    [
      "https://github.com/VoltAgent/awesome-design-md",
      "https://github.com/freestylefly/awesome-gpt-image-2",
      "Images: GitHub OpenGraph cards for both repositories",
      "Local metrics: outputs/awesome-agentic-landscape-260729/data/editorial_shortlist.csv",
    ],
  );

  // 7 — Superpowers story
  const s7 = buildSlide17(presentation, {
    title: title("Superpowers 最反直觉的设计，是先让 agent 慢下来"),
    label1: rich("先聊清楚", "18px", { bold: true, color: BLUE }),
    label2: rich("再写计划", "18px", { bold: true, color: BLUE }),
    label3: rich("最后开工", "18px", { bold: true, color: BLUE }),
    body1: {
      titleHere: rich("把想法变成规格", "23px", { bold: true }),
      loremIpsumDolorSitAmetConsecteturAdipiscing: rich(
        "先提问，分段确认设计，不急着生成代码。",
        "18px",
        { color: MUTED },
      ),
    },
    body2: {
      titleHere: rich("把判断变成顺序", "23px", { bold: true }),
      loremIpsumDolorSitAmetConsecteturAdipiscing: rich(
        "拆任务、写验证步骤，把上下文和验收条件交代清楚。",
        "18px",
        { color: MUTED },
      ),
    },
    body3: {
      titleHere: rich("把过程变成技能", "23px", { bold: true }),
      loremIpsumDolorSitAmetConsecteturAdipiscing: rich(
        "TDD、子 agent、两阶段 review 和收尾都有固定做法。",
        "18px",
        { color: MUTED },
      ),
    },
    footer1: footer(7),
  });
  await addImage(
    s7,
    ASSETS.superpowers,
    { left: 764, top: 122, width: 438, height: 152 },
    { alt: "GitHub repository card for obra/superpowers", fit: "cover" },
  );
  addTextbox(s7, {
    text: "代码便宜之后，顺序、判断和复核变成更稀缺的资产。",
    left: 42,
    top: 145,
    width: 660,
    height: 106,
    fontSize: 28,
    bold: true,
    name: "superpowers-thesis",
  });
  setNotes(
    s7,
    "Superpowers 的故事不是又收集了一堆 prompt。它把完整的软件开发方法拆成可触发的 skills：brainstorming、writing plans、TDD、subagent development、code review。为了让 agent 跑得更远，它先给 agent 铺了一条轨道。",
    [
      "https://github.com/obra/superpowers",
      "https://github.com/obra/superpowers/blob/main/.codex-plugin/plugin.json",
      "Image: https://opengraph.githubassets.com/1/obra/superpowers",
      "Local metrics: outputs/awesome-agentic-landscape-260729/data/editorial_shortlist.csv",
    ],
  );

  // 8 — Official convergence
  const s8 = buildSlide19(presentation, {
    title: title("三家官方仓库正在用同一种文件组织 agent 能力"),
    body1: {
      topic: rich("这不是单个社区的偶然实验。Anthropic、OpenAI 和 Google 都开始公开维护 skill 仓库。", "22px", {
        bold: true,
      }),
      loremIpsumDolorSitAmetConsecteturAdipiscing: rich(
        "它们的产品边界不同，但共同点很清楚：知识被包装成文件夹、说明、脚本和资源，由 agent 动态发现和使用。",
        "19px",
        { color: MUTED },
      ),
    },
    stat1: rich("SKILL.md", "36px", { bold: true }),
    stat2: rich("write once", "36px", { bold: true, color: BLUE }),
    stat3: rich("npx add", "36px", { bold: true }),
    body2: rich("Anthropic\n自包含的说明、脚本与资源", "17px", {
      color: MUTED,
    }),
    body3: rich("OpenAI\nagent 可发现、可复用的能力目录", "17px", {
      color: MUTED,
    }),
    body4: rich("Google\n产品知识可以被选择并安装", "17px", {
      color: MUTED,
    }),
    footer1: footer(8),
  });
  await addImage(
    s8,
    ASSETS.anthropic,
    { left: 330, top: 338, width: 58, height: 58 },
    { alt: "Anthropic GitHub avatar", fit: "cover", radius: "rounded-lg" },
  );
  await addImage(
    s8,
    ASSETS.openai,
    { left: 742, top: 338, width: 58, height: 58 },
    { alt: "OpenAI GitHub avatar", fit: "cover", radius: "rounded-lg" },
  );
  await addImage(
    s8,
    ASSETS.google,
    { left: 1155, top: 338, width: 58, height: 58 },
    { alt: "Google GitHub avatar", fit: "cover", radius: "rounded-lg" },
  );
  addRule(s8, 41, 302, 1198, BLUE, 4);
  setNotes(
    s8,
    "这一页不要讲成厂商排名。它说明格式正在收敛。Anthropic 把 skill 定义成动态加载的 instructions、scripts 和 resources；OpenAI 直接写了 write once, use everywhere；Google 让产品知识通过 npx skills add 被选择和安装。文档正在获得包管理和运行时语义。",
    [
      "https://github.com/anthropics/skills",
      "https://github.com/openai/skills",
      "https://github.com/google/skills",
      "Local metrics: outputs/awesome-agentic-landscape-260729/data/editorial_shortlist.csv",
      "Images: GitHub organization avatars",
    ],
  );

  // 9 — Close
  const s9 = buildSlide26(presentation, {
    title: rich("NEXT", "22px", {
      bold: true,
      color: BLUE,
    }),
    title2: rich("Awesome 仓库正在变成\nagent behavior 的源代码", "68px", {
      bold: true,
      lineSpacingPercent: 90000,
    }),
    title3: {
      loremIpsumDetails: rich("Stars 仍然说明谁被看见。", "23px", {
        color: MUTED,
      }),
      loremIpsumDetails2: rich("下一步要追踪：谁被安装，谁被 agent 调用。", "23px", {
        bold: true,
      }),
      loremIpsumDetails3: rich("这会让下一版 landscape 更接近真实使用。", "23px", {
        color: MUTED,
      }),
    },
  });
  addRule(s9, 41, 145, 1198, BLUE, 5);
  setNotes(
    s9,
    "最后把问题留在测量上。Stars 适合发现趋势，但如果 awesome 已经接近代码，我们就该像观察依赖包一样观察它：被谁安装、在哪些 agent 中被调用、更新如何传播、出了问题怎样追溯。这个方向会让下一轮研究更有独特性。",
    [
      "Local synthesis: outputs/awesome-agentic-landscape-260729/data/editorial_shortlist.csv",
      "Local methodology: outputs/awesome-agentic-landscape-260729/analysis/scan_awesome_agentic_projects.py",
    ],
  );

  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    const png = await presentation.export({ slide, format: "png", scale: 1.5 });
    await writeBlob(path.join(RENDER_DIR, `${stem}.png`), png);
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(
      path.join(RENDER_DIR, `${stem}.layout.json`),
      await layout.text(),
    );
  }

  const montage = await presentation.export({
    format: "webp",
    montage: true,
    scale: 1,
  });
  await writeBlob(path.join(BUILD_DIR, "deck-montage.webp"), montage);

  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(FINAL_PPTX);
  console.log(FINAL_PPTX);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
