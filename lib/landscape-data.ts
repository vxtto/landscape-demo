import { readFileSync } from "node:fs";
import path from "node:path";

import type { LandscapeProject, StageId } from "./landscape-types";

type Placement = {
  repo: string;
  stage: StageId;
  zone: string;
  name?: string;
};

const PLACEMENTS: Placement[] = [
  { repo: "anthropics/claude-code", stage: "application", zone: "Agentic coding", name: "Claude Code" },
  { repo: "openai/codex", stage: "application", zone: "Agentic coding", name: "Codex" },
  { repo: "anomalyco/opencode", stage: "application", zone: "Agentic coding", name: "OpenCode" },
  { repo: "google-gemini/gemini-cli", stage: "application", zone: "Agentic coding", name: "Gemini CLI" },
  { repo: "earendil-works/pi", stage: "application", zone: "Agentic coding", name: "Pi" },
  { repo: "Kilo-Org/kilocode", stage: "application", zone: "Agentic coding", name: "Kilo Code" },
  { repo: "aaif-goose/goose", stage: "application", zone: "Agentic coding", name: "Goose" },
  { repo: "QwenLM/qwen-code", stage: "application", zone: "Agentic coding", name: "Qwen Code" },
  { repo: "warpdotdev/warp", stage: "application", zone: "Agentic coding", name: "Warp" },
  { repo: "cline/cline", stage: "application", zone: "Agentic coding", name: "Cline" },
  { repo: "github/copilot-cli", stage: "application", zone: "Agentic coding", name: "Copilot CLI" },
  { repo: "OpenHands/OpenHands", stage: "application", zone: "Agentic coding", name: "OpenHands" },
  { repo: "continuedev/continue", stage: "application", zone: "Agentic coding", name: "Continue" },
  { repo: "charmbracelet/crush", stage: "application", zone: "Agentic coding", name: "Crush" },
  { repo: "Gitlawb/openclaude", stage: "application", zone: "Agentic coding", name: "OpenClaude" },
  { repo: "obra/superpowers", stage: "application", zone: "Coding harnesses", name: "Superpowers" },
  {
    repo: "affaan-m/everything-claude-code",
    stage: "application",
    zone: "Coding harnesses",
    name: "Everything Claude Code",
  },
  {
    repo: "code-yeongyu/oh-my-openagent",
    stage: "application",
    zone: "Coding harnesses",
    name: "Oh My OpenAgent",
  },
  { repo: "Yeachan-Heo/oh-my-codex", stage: "application", zone: "Coding harnesses", name: "Oh My Codex" },
  { repo: "openclaw/openclaw", stage: "application", zone: "Personal AI assistants", name: "OpenClaw" },
  { repo: "NousResearch/hermes-agent", stage: "application", zone: "Personal AI assistants", name: "Hermes Agent" },
  { repo: "agentscope-ai/QwenPaw", stage: "application", zone: "Personal AI assistants", name: "QwenPaw" },
  { repo: "HKUDS/nanobot", stage: "application", zone: "Personal AI assistants", name: "nanobot" },
  { repo: "zeroclaw-labs/zeroclaw", stage: "application", zone: "Personal AI assistants", name: "ZeroClaw" },
  { repo: "AstrBotDevs/AstrBot", stage: "application", zone: "Personal AI assistants", name: "AstrBot" },
  { repo: "CherryHQ/cherry-studio", stage: "application", zone: "Chatbot workspaces", name: "Cherry Studio" },
  { repo: "open-webui/open-webui", stage: "application", zone: "Chatbot workspaces", name: "Open WebUI" },
  { repo: "danny-avila/LibreChat", stage: "application", zone: "Chatbot workspaces", name: "LibreChat" },

  { repo: "bytedance/deer-flow", stage: "framework", zone: "Multi-agent orchestration", name: "DeerFlow" },
  { repo: "mastra-ai/mastra", stage: "framework", zone: "Multi-agent orchestration", name: "Mastra" },
  { repo: "paperclipai/paperclip", stage: "framework", zone: "Multi-agent orchestration", name: "Paperclip" },
  { repo: "multica-ai/multica", stage: "framework", zone: "Multi-agent orchestration", name: "Multica" },
  { repo: "n8n-io/n8n", stage: "framework", zone: "Workflow & agent builders", name: "n8n" },
  { repo: "langgenius/dify", stage: "framework", zone: "Workflow & agent builders", name: "Dify" },
  {
    repo: "activepieces/activepieces",
    stage: "framework",
    zone: "Workflow & agent builders",
    name: "Activepieces",
  },
  { repo: "langflow-ai/langflow", stage: "framework", zone: "Workflow & agent builders", name: "Langflow" },
  { repo: "Comfy-Org/ComfyUI", stage: "framework", zone: "Workflow & agent builders", name: "ComfyUI" },
  { repo: "vercel/ai", stage: "framework", zone: "Code-first frameworks", name: "AI SDK" },
  { repo: "pydantic/pydantic-ai", stage: "framework", zone: "Code-first frameworks", name: "Pydantic AI" },
  { repo: "livekit/agents", stage: "framework", zone: "Code-first frameworks", name: "LiveKit Agents" },
  { repo: "pipecat-ai/pipecat", stage: "framework", zone: "Code-first frameworks", name: "Pipecat" },
  { repo: "google/adk-python", stage: "framework", zone: "Code-first frameworks", name: "Google ADK" },
  { repo: "langchain-ai/langchain", stage: "framework", zone: "Code-first frameworks", name: "LangChain" },
  { repo: "CopilotKit/CopilotKit", stage: "framework", zone: "Code-first frameworks", name: "CopilotKit" },
  { repo: "crewAIInc/crewAI", stage: "framework", zone: "Code-first frameworks", name: "crewAI" },
  { repo: "RightNow-AI/openfang", stage: "framework", zone: "Code-first frameworks", name: "OpenFang" },

  { repo: "infiniflow/ragflow", stage: "runtime", zone: "Memory, knowledge & context", name: "RAGFlow" },
  { repo: "MemPalace/mempalace", stage: "runtime", zone: "Memory, knowledge & context", name: "MemPalace" },
  { repo: "mem0ai/mem0", stage: "runtime", zone: "Memory, knowledge & context", name: "mem0" },
  { repo: "supabase/supabase", stage: "runtime", zone: "Memory, knowledge & context", name: "Supabase" },
  { repo: "oceanbase/seekdb", stage: "runtime", zone: "Memory, knowledge & context", name: "seekdb" },
  { repo: "NevaMind-AI/memU", stage: "runtime", zone: "Memory, knowledge & context", name: "memU" },
  { repo: "vectorize-io/hindsight", stage: "runtime", zone: "Memory, knowledge & context", name: "Hindsight" },
  {
    repo: "modelcontextprotocol/servers",
    stage: "runtime",
    zone: "Protocols & interoperability",
    name: "Model Context Protocol",
  },
  { repo: "anthropics/skills", stage: "runtime", zone: "Protocols & interoperability", name: "Agent Skills" },
  { repo: "a2aproject/A2A", stage: "runtime", zone: "Protocols & interoperability", name: "A2A" },
  { repo: "vercel-labs/agent-browser", stage: "runtime", zone: "Tool & browser use", name: "Agent Browser" },
  { repo: "browser-use/browser-use", stage: "runtime", zone: "Tool & browser use", name: "Browser Use" },
  { repo: "alibaba/page-agent", stage: "runtime", zone: "Tool & browser use", name: "page-agent" },
  { repo: "browser-use/browser-harness", stage: "runtime", zone: "Tool & browser use", name: "Browser Harness" },
  { repo: "comet-ml/opik", stage: "runtime", zone: "Observability & evaluation", name: "Opik" },
  { repo: "langfuse/langfuse", stage: "runtime", zone: "Observability & evaluation", name: "Langfuse" },
  { repo: "Arize-ai/phoenix", stage: "runtime", zone: "Observability & evaluation", name: "Arize Phoenix" },
  { repo: "promptfoo/promptfoo", stage: "runtime", zone: "Observability & evaluation", name: "promptfoo" },
  { repo: "BerriAI/litellm", stage: "runtime", zone: "Model API gateways", name: "LiteLLM" },
  { repo: "higress-group/higress", stage: "runtime", zone: "Model API gateways", name: "Higress" },
  { repo: "QuantumNous/new-api", stage: "runtime", zone: "Model API gateways", name: "New API" },
  { repo: "songquanpeng/one-api", stage: "runtime", zone: "Model API gateways", name: "One API" },
  { repo: "rtk-ai/rtk", stage: "runtime", zone: "Model API gateways", name: "rtk" },
  { repo: "farion1231/cc-switch", stage: "runtime", zone: "Model API gateways", name: "cc-switch" },
  { repo: "coder/coder", stage: "runtime", zone: "Development sandboxes", name: "Coder" },
  { repo: "alibaba/OpenSandbox", stage: "runtime", zone: "Development sandboxes", name: "OpenSandbox" },
  { repo: "daytonaio/daytona", stage: "runtime", zone: "Development sandboxes", name: "Daytona" },
];

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
    Object.fromEntries(headers.map((header, index) => [header, record[index] ?? ""])),
  );
}

function numberOrZero(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function nullableNumber(value: string) {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseTrend(value: string): Array<number | null> {
  try {
    const parsed = JSON.parse(value) as unknown[];
    return parsed.map((item) => (typeof item === "number" ? item : null));
  } catch {
    return [];
  }
}

export function getLandscapeProjects(): LandscapeProject[] {
  const csvPath = path.join(process.cwd(), "data", "agentic-ai-projects.csv");
  const records = parseCsv(readFileSync(csvPath, "utf8"));
  const byRepo = new Map(records.map((record) => [record.repo_name.toLowerCase(), record]));

  return PLACEMENTS.flatMap((placement) => {
    const record = byRepo.get(placement.repo.toLowerCase());
    if (!record) return [];

    const [owner, repoName] = record.repo_name.split("/");
    return [
      {
        id: record.repo_id,
        repo: record.repo_name,
        owner,
        name: placement.name ?? repoName,
        description: record.description,
        stars: numberOrZero(record.stars),
        openrank: nullableNumber(record.openrank_2604),
        participants: numberOrZero(record.participants_2604),
        language: record.language || "—",
        topics: record.topics.split(",").filter(Boolean),
        categories: record.categories.split("|").filter(Boolean),
        trend: parseTrend(record.openrank_trend),
        stage: placement.stage,
        zone: placement.zone,
      },
    ];
  });
}
