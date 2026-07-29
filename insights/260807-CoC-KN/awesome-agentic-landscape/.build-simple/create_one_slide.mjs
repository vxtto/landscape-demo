import fs from "node:fs/promises";
import path from "node:path";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT = "/Users/xiaoyawork/Desktop/src_code/agentic-ai-landscape";
const BUILD_DIR = path.join(
  ROOT,
  "presentations/260729-awesome-agentic-landscape/.build-simple",
);
const FINAL_DIR = path.dirname(BUILD_DIR);
const FINAL_PPTX = path.join(
  FINAL_DIR,
  "awesome_agentic_landscape_one_slide_2026.pptx",
);
const FINAL_PNG = path.join(
  FINAL_DIR,
  "awesome_agentic_landscape_one_slide_2026.png",
);

const INK = "#101216";
const MUTED = "#545B65";
const RULE = "#C4C8CE";
const FONT = "PingFang SC";

const columns = [
  {
    number: "01",
    verb: "DISCOVER",
    line: "人来读，自己挑",
    color: "#E9A8CC",
    projects: [
      {
        name: "awesome",
        owner: "sindresorhus",
        description:
          "经典元目录。人按主题浏览，再进入下一份列表。",
      },
      {
        name: "awesome-mcp-servers",
        owner: "punkpeye",
        nameFontSize: 21,
        description:
          "收集 MCP servers，帮人找到 agent 能调用的数据源和工具。",
      },
    ],
  },
  {
    number: "02",
    verb: "REUSE",
    line: "拿走一份文件",
    color: "#CDA9E5",
    projects: [
      {
        name: "awesome-design-md",
        owner: "VoltAgent",
        nameFontSize: 22,
        description:
          "把网站设计规则写进 DESIGN.md，coding agent 拿来就能做 UI。",
      },
      {
        name: "awesome-gpt-image-2",
        owner: "freestylefly",
        nameFontSize: 21,
        description:
          "案例和模板共用一份 style library，并生成可安装的 agent skill。",
      },
    ],
  },
  {
    number: "03",
    verb: "INSTALL",
    line: "交给工具安装",
    color: "#A6C2EA",
    projects: [
      {
        name: "skills",
        owner: "vercel-labs",
        description:
          "用 npx 搜索、安装或运行 skill。列表有了包管理语义。",
      },
      {
        name: "anthropics/skills",
        owner: "anthropics",
        nameFontSize: 22,
        description:
          "官方样例与规范。每项能力都是含说明、脚本和资源的文件夹。",
      },
    ],
  },
  {
    number: "04",
    verb: "OPERATE",
    line: "规定 agent 怎么做",
    color: "#9DD3BC",
    projects: [
      {
        name: "superpowers",
        owner: "obra",
        description:
          "把澄清需求、写计划、TDD 和评审做成自动触发的 skills。",
      },
      {
        name: "spec-kit",
        owner: "github",
        description:
          "先保存规格和验收条件，再让 agent 写代码。",
      },
    ],
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
  const box = slide.shapes.add({
    geometry: "textbox",
    name,
    position: { left, top, width, height },
    fill: "none",
    line: { style: "solid", fill: "none", width: 0 },
  });
  box.text = text;
  box.text.style = {
    fontSize,
    bold,
    color,
    typeface: FONT,
    alignment,
    verticalAlignment,
  };
  return box;
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

function addRule(slide, left, top, width, fill = RULE, height = 1.5) {
  return addRect(slide, {
    left,
    top,
    width,
    height,
    fill,
    name: "rule",
  });
}

async function writeBlob(outputPath, blob) {
  await fs.writeFile(outputPath, new Uint8Array(await blob.arrayBuffer()));
}

async function main() {
  const presentation = Presentation.create({
    slideSize: { width: 1280, height: 720 },
  });
  const slide = presentation.slides.add();
  slide.background.fill = "#FFFFFF";

  addText(slide, {
    text: "Awesome 仓库开始被 agent 直接使用",
    left: 44,
    top: 30,
    width: 920,
    height: 62,
    fontSize: 48,
    bold: true,
    name: "title",
  });
  addText(slide, {
    text: "8 个项目，看看一份“清单”怎样逐渐变成文件、安装入口和工作方法",
    left: 46,
    top: 94,
    width: 1020,
    height: 34,
    fontSize: 21,
    color: MUTED,
    name: "subtitle",
  });
  addRule(slide, 44, 137, 1192, INK, 3);

  const margin = 44;
  const gap = 20;
  const colWidth = 283;
  const headerTop = 158;
  const headerHeight = 76;
  const firstTop = 254;
  const entryHeight = 176;
  const secondTop = 453;

  columns.forEach((column, index) => {
    const left = margin + index * (colWidth + gap);

    addRect(slide, {
      left,
      top: headerTop,
      width: colWidth,
      height: headerHeight,
      fill: column.color,
      name: `stage-${column.verb.toLowerCase()}`,
    });
    addText(slide, {
      text: `${column.number}  ${column.verb}`,
      left: left + 14,
      top: headerTop + 10,
      width: colWidth - 28,
      height: 34,
      fontSize: 27,
      bold: true,
      name: `${column.verb}-title`,
    });
    addText(slide, {
      text: column.line,
      left: left + 14,
      top: headerTop + 45,
      width: colWidth - 28,
      height: 23,
      fontSize: 18,
      color: INK,
      name: `${column.verb}-subtitle`,
    });

    [firstTop, secondTop].forEach((top, projectIndex) => {
      const project = column.projects[projectIndex];
      addText(slide, {
        text: project.name,
        left,
        top,
        width: colWidth,
        height: 34,
        fontSize: project.nameFontSize ?? 26,
        bold: true,
        name: `project-${column.verb}-${projectIndex + 1}`,
      });
      addText(slide, {
        text: project.owner,
        left,
        top: top + 34,
        width: colWidth,
        height: 22,
        fontSize: 15,
        color: MUTED,
        name: `owner-${column.verb}-${projectIndex + 1}`,
      });
      addText(slide, {
        text: project.description,
        left,
        top: top + 67,
        width: colWidth,
        height: 96,
        fontSize: 20,
        color: MUTED,
        name: `description-${column.verb}-${projectIndex + 1}`,
      });
      if (projectIndex === 0) {
        addRule(slide, left, top + entryHeight + 10, colWidth);
      }
    });
  });

  slide.speakerNotes.textFrame.setText(
    [
      "这一页只讲一个观察：awesome 的用途正在变化。",
      "左边的经典列表仍然主要给人看。越往右，整理出来的知识越接近 agent 可以直接使用的东西：一份 Markdown、一个 skill 文件夹、一条安装命令，或者一整套工程方法。",
      "不要逐项念指标。每列挑一个例子讲清楚它实际解决什么问题。",
      "",
      "[Sources]",
      "- Local analysis: outputs/awesome-agentic-landscape-260729/data/editorial_shortlist.csv",
      "- https://github.com/sindresorhus/awesome",
      "- https://github.com/punkpeye/awesome-mcp-servers",
      "- https://github.com/VoltAgent/awesome-design-md",
      "- https://github.com/freestylefly/awesome-gpt-image-2",
      "- https://github.com/vercel-labs/skills",
      "- https://github.com/anthropics/skills",
      "- https://github.com/obra/superpowers",
      "- https://github.com/github/spec-kit",
      "[/Sources]",
    ].join("\n"),
  );

  const png = await presentation.export({ slide, format: "png", scale: 2 });
  await writeBlob(FINAL_PNG, png);
  const layout = await slide.export({ format: "layout" });
  await fs.writeFile(
    path.join(BUILD_DIR, "one-slide.layout.json"),
    await layout.text(),
  );
  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(FINAL_PPTX);

  console.log(FINAL_PPTX);
  console.log(FINAL_PNG);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
