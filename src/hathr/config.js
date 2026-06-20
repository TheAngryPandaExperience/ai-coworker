import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_CONFIG_PATH = path.join(__dirname, "..", "..", "config", "hathr.config.json");

/**
 * @typedef {Object} HathrConfig
 * @property {string} appUrl
 * @property {string} chatPath
 * @property {{ messageInput: string, sendButton: string, assistantMessage: string, newChatButton: string }} selectors
 * @property {{ minPauseMs: number, maxPauseMs: number, minTypingDelayMs: number, maxTypingDelayMs: number, thinkPauseMs: [number, number], responsePollMs: number, responseTimeoutMs: number }} timing
 * @property {{ headless: boolean, slowMo: number, viewport: { width: number, height: number } }} browser
 */

/**
 * @param {string} [configPath]
 * @returns {HathrConfig}
 */
export function loadHathrConfig(configPath = DEFAULT_CONFIG_PATH) {
  const raw = readFileSync(configPath, "utf8");
  return /** @type {HathrConfig} */ (JSON.parse(raw));
}

/**
 * @param {HathrConfig} config
 */
export function getChatUrl(config) {
  const base = config.appUrl.replace(/\/$/, "");
  const chatPath = config.chatPath.startsWith("/")
    ? config.chatPath
    : `/${config.chatPath}`;
  return `${base}${chatPath}`;
}
