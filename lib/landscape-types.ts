export type StageId = "application" | "framework" | "runtime" | "model";

export type LandscapeProject = {
  id: string;
  repo: string;
  owner: string;
  name: string;
  description: string;
  stars: number;
  openrank: number | null;
  participants: number;
  language: string;
  topics: string[];
  categories: string[];
  trend: Array<number | null>;
  stage: StageId;
  zone: string;
};
