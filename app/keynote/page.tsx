import type { Metadata } from "next";

import { getLandscapeProjects } from "@/lib/landscape-data";

import KeynoteExperience from "./keynote-experience";

export const metadata: Metadata = {
  title: "Agentic AI 新趋势下，开放生态的那些老规矩",
  description:
    "CommunityOverCode China 2026 keynote 的交互式研究页面：生态图、Apache、InclusionAI、开放模型许可证与社区治理。",
};

export default function KeynotePage() {
  const projects = getLandscapeProjects();

  return <KeynoteExperience projects={projects} />;
}
