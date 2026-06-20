import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildAreaPrompt, getArea } from "./areas.js";
import { loadHathrConfig } from "./config.js";
import { createBrowserSession } from "./browser-session.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUTPUT_DIR = path.join(__dirname, "..", "..", "output", "hathr");

/** @typedef {import('./areas.js').HathrAreaId} HathrAreaId */

/**
 * @typedef {Object} RunAreaRequest
 * @property {HathrAreaId} areaId
 * @property {Record<string, string>} input
 * @property {boolean} [newChat]
 */

/**
 * @typedef {Object} RunAreaResult
 * @property {HathrAreaId} areaId
 * @property {string} label
 * @property {string} prompt
 * @property {string} summary
 * @property {string} savedTo
 * @property {string} completedAt
 */

/** @type {Awaited<ReturnType<typeof createBrowserSession>> | null} */
let sharedSession = null;

/** @type {Promise<unknown> | null} */
let activeRun = null;

/**
 * @param {(event: string, detail?: Record<string, unknown>) => void} [onStatus]
 */
async function getSession(onStatus) {
  if (!sharedSession) {
    const config = loadHathrConfig();
    sharedSession = await createBrowserSession({ config, onStatus });
  }
  return sharedSession;
}

/**
 * @param {RunAreaRequest} request
 * @param {(event: string, detail?: Record<string, unknown>) => void} [onStatus]
 * @returns {Promise<RunAreaResult>}
 */
export async function runArea(request, onStatus) {
  const area = getArea(request.areaId);
  if (!area) {
    throw new Error(`Unknown area: ${request.areaId}`);
  }

  const config = loadHathrConfig();
  const prompt = buildAreaPrompt(request.areaId, request.input);
  const session = await getSession(onStatus);

  onStatus?.("status", { message: `Starting ${area.label}…`, areaId: area.id });

  if (request.newChat) {
    onStatus?.("status", { message: "Starting fresh chat context…" });
  }

  const page = await session.submitPrompt(prompt);
  const summary = await session.waitForAssistantReply(page);

  mkdirSync(OUTPUT_DIR, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const fileName = `${area.id}-${stamp}.md`;
  const savedTo = path.join(OUTPUT_DIR, fileName);

  const fileBody = [
    `# ${area.label} Summary`,
    "",
    `Completed: ${new Date().toISOString()}`,
    "",
    "## Summary",
    "",
    summary,
    "",
    "## Prompt Sent",
    "",
    "```text",
    prompt,
    "```",
    "",
  ].join("\n");

  writeFileSync(savedTo, fileBody, "utf8");

  onStatus?.("complete", {
    areaId: area.id,
    label: area.label,
    summary,
    savedTo,
  });

  return {
    areaId: area.id,
    label: area.label,
    prompt,
    summary,
    savedTo,
    completedAt: new Date().toISOString(),
  };
}

/**
 * Queues area runs so only one Hathr interaction happens at a time.
 * @param {RunAreaRequest} request
 * @param {(event: string, detail?: Record<string, unknown>) => void} [onStatus]
 */
export function queueAreaRun(request, onStatus) {
  const run = (async () => {
    await activeRun;
    return runArea(request, onStatus);
  })();

  activeRun = run.catch(() => undefined);
  return run;
}

export async function closeRunner() {
  if (sharedSession) {
    await sharedSession.close();
    sharedSession = null;
  }
}

/**
 * @param {(event: string, detail?: Record<string, unknown>) => void} [onStatus]
 */
export async function openSetupBrowser(onStatus) {
  const config = loadHathrConfig();
  const session = await createBrowserSession({
    config,
    onStatus: (event, detail) => onStatus?.(event, detail),
  });
  sharedSession = session;
  await session.openChat();
  onStatus?.("status", {
    message: "Browser open — log in manually, then return to the control panel.",
  });
}
