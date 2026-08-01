import type { Metadata } from "next";

import { getLandscapeProjects } from "@/lib/landscape-data";

import KeynotePresentation from "./presentation";

export const metadata: Metadata = {
  title: "演讲播放｜Agentic AI 新趋势下，开放生态的那些老规矩",
  description:
    "Community Over Code Asia 2026 keynote 的 16:9 舞台播放模式。方向键或翻页笔控制前后，Enter 进入全屏，Esc 退出。",
};

export default function KeynotePresentationPage() {
  const projects = getLandscapeProjects();

  return <KeynotePresentation projects={projects} />;
}
