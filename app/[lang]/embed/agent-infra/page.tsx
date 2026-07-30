import type { Metadata } from "next";

import LandscapeExplorer from "@/app/components/landscape-explorer";
import { getLandscapeProjects } from "@/lib/landscape-data";

import { getDictionary, hasLocale } from "../../dictionaries";

export async function generateMetadata({
  params,
}: PageProps<"/[lang]/embed/agent-infra">): Promise<Metadata> {
  const { lang } = await params;
  if (!hasLocale(lang)) return {};

  const dict = await getDictionary(lang);
  return {
    title: dict.embed.agentTitle,
    description: dict.embed.agentDescription,
  };
}

export default function AgentInfraEmbedPage() {
  return (
    <LandscapeExplorer
      projects={getLandscapeProjects()}
      embedOnly="agent"
      standalone
    />
  );
}
