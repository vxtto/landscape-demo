import type { Metadata } from "next";

import LandscapeExplorer from "@/app/components/landscape-explorer";
import { getLandscapeProjects } from "@/lib/landscape-data";

export const metadata: Metadata = {
  title: "Agent Infra Landscape 2026",
  description:
    "A standalone 16:9 canvas of the Agent Infra open-source landscape.",
};

export default function AgentInfraEmbedPage() {
  return (
    <LandscapeExplorer
      projects={getLandscapeProjects()}
      embedOnly="agent"
      standalone
    />
  );
}
