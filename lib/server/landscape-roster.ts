import "server-only";

import { readFileSync } from "node:fs";
import path from "node:path";

/**
 * The roster is the list of projects the landscape currently claims, read
 * straight from the CSV. Ask AI treats it as the authority on membership so
 * that a data refresh landing before the next card generation degrades the
 * answer quality instead of hiding projects or citing departed ones.
 *
 * Column names are resolved by shape, not by literal name: OpenRank and
 * participant columns carry the month they were cut (openrank_2606), and
 * `categories` became a landscape_layer/landscape_section pair.
 */
export type RosterEntry = {
  repo: string;
  description: string;
  categories: string[];
  topics: string[];
  stars: number | null;
  language: string | null;
};

function parseCsv(source: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    const next = source[index + 1];

    if (character === '"') {
      if (quoted && next === '"') {
        cell += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && next === "\n") index += 1;
      row.push(cell);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  const [headers, ...records] = rows;
  return records.map((record) =>
    Object.fromEntries(
      headers.map((header, index) => [header, record[index] ?? ""]),
    ),
  );
}

function categoriesOf(row: Record<string, string>): string[] {
  if (row.categories) {
    return row.categories.split("|").filter(Boolean);
  }
  return [row.landscape_layer, row.landscape_section]
    .map((value) => (value ?? "").trim())
    .filter(Boolean);
}

let rosterCache: RosterEntry[] | null = null;

export function getLandscapeRoster(): RosterEntry[] {
  if (rosterCache) return rosterCache;

  const csvPath = path.join(process.cwd(), "data", "agentic-ai-projects.csv");
  const rows = parseCsv(readFileSync(csvPath, "utf8"));

  rosterCache = rows
    .filter((row) => row.repo_name)
    .map((row) => ({
      repo: row.repo_name,
      description: (row.description ?? "").trim(),
      categories: categoriesOf(row),
      topics: (row.topics ?? "").split(",").filter(Boolean),
      stars: Number(row.stars) || null,
      language: row.language || null,
    }));

  return rosterCache;
}
