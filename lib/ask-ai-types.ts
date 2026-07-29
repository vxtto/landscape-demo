export type AskVerdict = "exact_match" | "closest_only" | "not_in_landscape";

export type AskCandidate = {
  repo: string;
  reason: string;
};

export type AskStreamEvent =
  | { type: "meta"; verdict: AskVerdict; candidates: AskCandidate[] }
  | { type: "delta"; text: string }
  | { type: "done" }
  | { type: "error"; message: string };
