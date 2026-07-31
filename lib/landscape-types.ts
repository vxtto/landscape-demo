export type StageId = "application" | "framework" | "runtime" | "model";

export type LandscapeProject = {
  id: string;
  repo: string;
  owner: string;
  name: string;
  description: string;
  stars: number;
  forks: number;
  openIssues: number;
  license: string;
  openrank: number | null;
  participants: number | null;
  language: string;
  createdAt: string;
  pushedAt: string;
  selectionReason: string;
  selectionCaveat: string;
  landscapeAction: "keep" | "add";
  trendSignal: "new" | "rising" | null;
  trendSignalReason: string;
  topics: string[];
  categories: string[];
  trend: Array<number | null>;
  stage: StageId;
  zone: string;
};
