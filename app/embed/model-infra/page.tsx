import type { Metadata } from "next";

import LandscapeExplorer from "@/app/components/landscape-explorer";
import { getLandscapeProjects } from "@/lib/landscape-data";

export const metadata: Metadata = {
  title: "Model Infra Landscape 2026",
  description:
    "A standalone 16:9 canvas of the Model Infra open-source landscape.",
};

export default function ModelInfraEmbedPage() {
  return (
    <LandscapeExplorer
      projects={getLandscapeProjects()}
      embedOnly="model"
      standalone
    />
  );
}
