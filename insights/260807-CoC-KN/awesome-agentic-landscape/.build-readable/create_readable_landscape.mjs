import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/xiaoyawork/Desktop/src_code/agentic-ai-landscape";
const BUILD_DIR = path.join(
  ROOT,
  "presentations/260729-awesome-agentic-landscape/.build-readable",
);
const FINAL_DIR = path.dirname(BUILD_DIR);
const FINAL_PPTX = path.join(
  FINAL_DIR,
  "awesome_agentic_landscape_readable_2026.pptx",
);
const PREVIEW_DIR = path.join(BUILD_DIR, "preview");
const FINAL_MONTAGE = path.join(
  FINAL_DIR,
  "awesome_agentic_landscape_readable_2026.webp",
);

const INK = "#101216";
const MUTED = "#59616C";
const LIGHT = "#E4E6E9";
const ACCENT = "#C85A3A";
const FONT = "PingFang SC";

const stages = [
  {
    number: "01",
    title: "发现",
    line: "人来读，自己挑",
    repos: ["awesome", "awesome-mcp-servers"],
  },
  {
    number: "02",
    title: "复用",
    line: "拿走一份文件",
    repos: ["awesome-design-md", "awesome-gpt-image-2"],
  },
  {
    number: "03",
    title: "安装",
    line: "交给工具安装",
    repos: ["vercel-labs/skills", "anthropics/skills"],
  },
  {
    number: "04",
    title: "工作方法",
    line: "规定 agent 怎么做",
    repos: ["obra/superpowers", "github/spec-kit"],
  },
];

const discoverReuse = [
  {
    repo: "sindresorhus/awesome",
    tag: "经典元目录",
    what: "它是一份“列表的列表”。主题从命令行工具到设计资源，先帮人找到下一份清单。",
    use: "使用者自己浏览、判断，再把需要的项目摘出来。",
  },
  {
    repo: "punkpeye/awesome-mcp-servers",
    tag: "工具目录",
    what: "它收集 MCP servers：搜索、数据库、浏览器、文件系统等可供 agent 调用的外部能力。",
    use: "人仍然负责挑选，但清单里的条目已经接近 agent 的工具接口。",
  },
  {
    repo: "VoltAgent/awesome-design-md",
    tag: "设计规则文件",
    what: "它把品牌网站的颜色、字体、组件和禁区整理成 DESIGN.md。",
    use: "把文件放进项目，coding agent 就能按这套设计规则生成 UI。",
  },
  {
    repo: "freestylefly/awesome-gpt-image-2",
    tag: "生图方法库",
    what: "它把生图案例、模板和 style library 放在一起，并把常用做法提炼成 skill。",
    use: "人可以看案例，agent 也可以直接复用模板和操作步骤。",
  },
];

const installOperate = [
  {
    repo: "vercel-labs/skills",
    tag: "Skill 安装器",
    what: "它既是 skill 目录，也是命令行工具。npx skills 可以搜索、安装或运行 skill。",
    use: "清单开始有包管理器的感觉：找到以后，下一步可以交给工具完成。",
  },
  {
    repo: "anthropics/skills",
    tag: "官方 Skill 范本",
    what: "它给出公开的 Agent Skills 样例。每项能力都是一个包含说明、脚本和资源的文件夹。",
    use: "这里最有价值的是文件结构：agent 知道先读什么、再执行什么。",
  },
  {
    repo: "obra/superpowers",
    tag: "开发方法",
    what: "它把需求澄清、写计划、TDD 和代码评审整理成会自动触发的 skills。",
    use: "仓库交付的不是代码片段，而是一套 coding agent 的工作纪律。",
  },
  {
    repo: "github/spec-kit",
    tag: "规格驱动开发",
    what: "它先保存规格、计划和验收条件，再让 agent 开始写代码。",
    use: "代码可以快速重写，真正需要长期保留的是意图和判断标准。",
  },
];

function addText(slide, {
  text,
  left,
  top,
  width,
  height,
  fontSize,
  bold = false,
  color = INK,
  alignment = "left",
  verticalAlignment = "top",
  name,
}) {
  const shape = slide.shapes.add({
    geometry: "textbox",
    name,
    position: { left, top, width, height },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  shape.text = text;
  shape.text.style = {
    typeface: FONT,
    fontSize,
    bold,
    color,
    alignment,
    verticalAlignment,
  };
  return shape;
}

function addRect(slide, {
  left,
  top,
  width,
  height,
  fill,
  name,
}) {
  return slide.shapes.add({
    geometry: "rect",
    name,
    position: { left, top, width, height },
    fill,
    line: { style: "solid", fill, width: 0 },
  });
}

function addRule(slide, left, top, width, fill = LIGHT, height = 1.5) {
  return addRect(slide, {
    left,
    top,
    width,
    height,
    fill,
    name: "rule",
  });
}

function addSlideTitle(slide, title, subtitle) {
  addText(slide, {
    text: title,
    left: 54,
    top: 34,
    width: 1160,
    height: 58,
    fontSize: 42,
    bold: true,
    name: "slide-title",
  });
  if (subtitle) {
    addText(slide, {
      text: subtitle,
      left: 56,
      top: 94,
      width: 1148,
      height: 36,
      fontSize: 21,
      color: MUTED,
      name: "slide-subtitle",
    });
  }
  addRule(slide, 54, 135, 1172, INK, 3);
}

function addNotes(slide, lines, sources) {
  slide.speakerNotes.textFrame.setText(
    [
      ...lines,
      "",
      "[Sources]",
      "- Local analysis: outputs/awesome-agentic-landscape-260729/data/editorial_shortlist.csv",
      ...sources.map((source) => `- ${source}`),
      "[/Sources]",
    ].join("\n"),
  );
}

function addOverviewSlide(presentation) {
  const slide = presentation.slides.add();
  slide.background.fill = "#FFFFFF";

  addText(slide, {
    text: "同样叫 awesome，用法已经分成四种",
    left: 54,
    top: 38,
    width: 1130,
    height: 66,
    fontSize: 50,
    bold: true,
    name: "deck-title",
  });
  addText(slide, {
    text: "有些仍然给人浏览，有些已经提供文件、安装入口和工程方法。",
    left: 56,
    top: 112,
    width: 1120,
    height: 40,
    fontSize: 23,
    color: MUTED,
    name: "deck-subtitle",
  });
  addRule(slide, 54, 168, 1172, INK, 3);

  const left = 54;
  const gap = 30;
  const width = 270.5;
  stages.forEach((stage, index) => {
    const x = left + index * (width + gap);
    addText(slide, {
      text: stage.number,
      left: x,
      top: 205,
      width: 44,
      height: 28,
      fontSize: 18,
      bold: true,
      color: ACCENT,
      name: `stage-${index + 1}-number`,
    });
    addText(slide, {
      text: stage.title,
      left: x,
      top: 236,
      width,
      height: 48,
      fontSize: 32,
      bold: true,
      name: `stage-${index + 1}-title`,
    });
    addText(slide, {
      text: stage.line,
      left: x,
      top: 286,
      width,
      height: 32,
      fontSize: 21,
      color: MUTED,
      name: `stage-${index + 1}-line`,
    });
    addRule(slide, x, 335, width, ACCENT, 4);
    addText(slide, {
      text: stage.repos[0],
      left: x,
      top: 365,
      width,
      height: 46,
      fontSize: 23,
      bold: true,
      name: `stage-${index + 1}-repo-1`,
    });
    addText(slide, {
      text: stage.repos[1],
      left: x,
      top: 438,
      width,
      height: 58,
      fontSize:
        stage.repos[1].length > 20 ? 19 : stage.repos[1].length > 17 ? 21 : 23,
      bold: true,
      name: `stage-${index + 1}-repo-2`,
    });
  });

  addRule(slide, 54, 557, 1172, LIGHT, 2);
  addText(slide, {
    text: "越靠右，agent 可以直接使用的内容越多。",
    left: 54,
    top: 588,
    width: 1030,
    height: 48,
    fontSize: 30,
    bold: true,
    name: "overview-takeaway",
  });

  addNotes(
    slide,
    [
      "这一页先看结构，不逐个念项目。",
      "经典 awesome 主要帮人发现信息。后面的项目开始交付可复制文件、安装命令和工作方法。",
    ],
    [
      "https://github.com/sindresorhus/awesome",
      "https://github.com/punkpeye/awesome-mcp-servers",
      "https://github.com/VoltAgent/awesome-design-md",
      "https://github.com/freestylefly/awesome-gpt-image-2",
      "https://github.com/vercel-labs/skills",
      "https://github.com/anthropics/skills",
      "https://github.com/obra/superpowers",
      "https://github.com/github/spec-kit",
    ],
  );
  return slide;
}

function addProjectListSlide(presentation, {
  title,
  subtitle,
  projects,
  sources,
  noteLines,
}) {
  const slide = presentation.slides.add();
  slide.background.fill = "#FFFFFF";
  addSlideTitle(slide, title, subtitle);

  const rowTop = 157;
  const rowHeight = 133;
  projects.forEach((project, index) => {
    const top = rowTop + index * rowHeight;
    const [owner, ...repoParts] = project.repo.split("/");
    const repoName = repoParts.join("/");
    addText(slide, {
      text: repoName,
      left: 56,
      top: top + 2,
      width: 330,
      height: 36,
      fontSize: repoName.length > 19 ? 21 : 25,
      bold: true,
      name: `project-${index + 1}-name`,
    });
    addText(slide, {
      text: owner,
      left: 56,
      top: top + 38,
      width: 300,
      height: 22,
      fontSize: 15,
      color: MUTED,
      name: `project-${index + 1}-owner`,
    });
    addText(slide, {
      text: project.tag,
      left: 56,
      top: top + 68,
      width: 300,
      height: 26,
      fontSize: 17,
      bold: true,
      color: ACCENT,
      name: `project-${index + 1}-tag`,
    });

    addText(slide, {
      text: project.what,
      left: 420,
      top,
      width: 790,
      height: 54,
      fontSize: 22,
      color: INK,
      name: `project-${index + 1}-what`,
    });
    addText(slide, {
      text: project.use,
      left: 420,
      top: top + 61,
      width: 790,
      height: 50,
      fontSize: 19,
      color: MUTED,
      name: `project-${index + 1}-use`,
    });
    if (index < projects.length - 1) {
      addRule(slide, 56, top + 116, 1154, LIGHT, 1.5);
    }
  });

  addNotes(slide, noteLines, sources);
  return slide;
}

async function writeBlob(outputPath, blob) {
  await fs.writeFile(outputPath, new Uint8Array(await blob.arrayBuffer()));
}

async function main() {
  await fs.mkdir(PREVIEW_DIR, { recursive: true });
  const presentation = Presentation.create({
    slideSize: { width: 1280, height: 720 },
  });

  addOverviewSlide(presentation);
  addProjectListSlide(presentation, {
    title: "目录还在，内容已经可以直接放进项目里",
    subtitle: "这四个项目分别交付入口、工具接口、设计规则和生图方法。",
    projects: discoverReuse,
    sources: [
      "https://github.com/sindresorhus/awesome",
      "https://github.com/punkpeye/awesome-mcp-servers",
      "https://github.com/VoltAgent/awesome-design-md",
      "https://github.com/freestylefly/awesome-gpt-image-2",
    ],
    noteLines: [
      "这里的关键区别是交付物。",
      "前两个项目仍然以浏览和发现为主。DESIGN.md 和生图 skill 已经可以直接放进 agent 的工作上下文。",
    ],
  });
  addProjectListSlide(presentation, {
    title: "更进一步，仓库开始规定 agent 怎么工作",
    subtitle: "安装器解决“怎么拿到”，方法库解决“拿到以后怎么做”。",
    projects: installOperate,
    sources: [
      "https://github.com/vercel-labs/skills",
      "https://github.com/anthropics/skills",
      "https://github.com/obra/superpowers",
      "https://github.com/github/spec-kit",
    ],
    noteLines: [
      "这四个项目更接近 agent-native 的形态。",
      "skills 和 anthropics/skills 把能力做成可安装的目录结构。superpowers 和 spec-kit 进一步保存工程方法和判断标准。",
    ],
  });

  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(
      path.join(PREVIEW_DIR, `${stem}.png`),
      await presentation.export({ slide, format: "png", scale: 2 }),
    );
    await fs.writeFile(
      path.join(PREVIEW_DIR, `${stem}.layout.json`),
      await (await slide.export({ format: "layout" })).text(),
    );
  }

  await writeBlob(
    FINAL_MONTAGE,
    await presentation.export({ format: "webp", montage: true, scale: 1 }),
  );
  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(FINAL_PPTX);

  console.log(FINAL_PPTX);
  console.log(FINAL_MONTAGE);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
