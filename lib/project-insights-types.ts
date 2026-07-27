export type ProjectTrendPoint = {
  month: string;
  monthLabel: string;
  openrank: number | null;
  participants: number | null;
};

export type ContributorTrendPoint = {
  month: string;
  monthLabel: string;
  openrank: number;
};

export type ProjectContributor = {
  rank: number;
  id: string;
  login: string;
  name: string | null;
  avatarUrl: string;
  openrank: number;
  share: number;
  company: string | null;
  location: string | null;
  bio: string | null;
  trend: ContributorTrendPoint[];
};

export type ProjectInsights = {
  repo: string;
  dataYear: number;
  generatedAt: string;
  metrics: {
    openrank: number | null;
    openrankMonth: string | null;
    stars: number | null;
    starsUpdatedAt: string | null;
    participants: number | null;
    participantsMonth: string | null;
    language: string | null;
  };
  trends: ProjectTrendPoint[];
  arena: {
    month: string | null;
    totalOpenrank: number;
    contributors: ProjectContributor[];
  };
};
