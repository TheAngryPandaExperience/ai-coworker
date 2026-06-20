import { mkdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";
import { createHumanTiming } from "./human-timing.js";
import { getChatUrl } from "./config.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PROFILE_DIR = path.join(__dirname, "..", "..", ".hathr-browser-profile");

/** @typedef {import('./config.js').HathrConfig} HathrConfig */

/**
 * @typedef {Object} BrowserSessionOptions
 * @property {HathrConfig} config
 * @property {string} [profileDir]
 * @property {(event: string, detail?: Record<string, unknown>) => void} [onStatus]
 */

/**
 * @param {BrowserSessionOptions} options
 */
export async function createBrowserSession(options) {
  const { config, onStatus } = options;
  const profileDir = options.profileDir ?? DEFAULT_PROFILE_DIR;
  mkdirSync(profileDir, { recursive: true });

  const timing = createHumanTiming();

  /** @type {import('playwright').BrowserContext | null} */
  let context = null;
  /** @type {import('playwright').Page | null} */
  let page = null;

  /**
   * @param {string} message
   * @param {Record<string, unknown>} [detail]
   */
  function status(message, detail) {
    onStatus?.("status", { message, ...detail });
  }

  async function ensureBrowser() {
    if (context && page && !page.isClosed()) {
      return page;
    }

    status("Opening browser session…");

    context = await chromium.launchPersistentContext(profileDir, {
      channel: "chrome",
      headless: config.browser.headless,
      slowMo: config.browser.slowMo,
      viewport: config.browser.viewport,
      locale: "en-US",
      timezoneId: "America/New_York",
      args: [
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage",
      ],
      ignoreDefaultArgs: ["--enable-automation"],
    });

    page = context.pages()[0] ?? (await context.newPage());

    await page.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => undefined,
      });
    });

    return page;
  }

  async function openChat() {
    const activePage = await ensureBrowser();
    const chatUrl = getChatUrl(config);

    status("Navigating to Hathr chat…", { url: chatUrl });
    await timing.thinkPause(config.timing.thinkPauseMs);
    await activePage.goto(chatUrl, { waitUntil: "domcontentloaded" });
    await timing.pause(config.timing.minPauseMs, config.timing.maxPauseMs);
    await timing.maybeHesitate();

    return activePage;
  }

  /**
   * @param {import('playwright').Page} activePage
   * @param {string} selector
   */
  async function findFirstVisible(activePage, selector) {
    const candidates = selector.split(",").map((part) => part.trim());
    for (const candidate of candidates) {
      const locator = activePage.locator(candidate).first();
      if ((await locator.count()) > 0 && (await locator.isVisible())) {
        return locator;
      }
    }
    throw new Error(`No visible element matched selectors: ${selector}`);
  }

  /**
   * @param {import('playwright').Locator} locator
   * @param {string} text
   */
  async function humanType(locator, text) {
    await locator.click();
    await timing.pause(config.timing.minPauseMs, config.timing.maxPauseMs);

    for (const char of text) {
      await locator.press(char, {
        delay: timing.typingDelay(
          config.timing.minTypingDelayMs,
          config.timing.maxTypingDelayMs
        ),
      });

      if (char === "\n" || char === ".") {
        await timing.maybeHesitate(0.08);
      }
    }
  }

  /**
   * @param {string} prompt
   */
  async function submitPrompt(prompt) {
    const activePage = await openChat();
    const { selectors, timing: timingConfig } = config;

    status("Locating message input…");
    await timing.thinkPause(timingConfig.thinkPauseMs);

    const input = await findFirstVisible(activePage, selectors.messageInput);
    await input.scrollIntoViewIfNeeded();
    await timing.pause(timingConfig.minPauseMs, timingConfig.maxPauseMs);

    status("Entering prompt with human rhythm…", { length: prompt.length });
    await humanType(input, prompt);
    await timing.thinkPause(timingConfig.thinkPauseMs);

    status("Sending message…");
    try {
      const sendButton = await findFirstVisible(activePage, selectors.sendButton);
      await sendButton.click({ delay: timing.intBetween(40, 120) });
    } catch {
      await input.press("Enter", { delay: timing.intBetween(50, 140) });
    }

    await timing.pause(timingConfig.minPauseMs, timingConfig.maxPauseMs);
    return activePage;
  }

  /**
   * @param {import('playwright').Page} activePage
   */
  async function waitForAssistantReply(activePage) {
    const { selectors, timing: timingConfig } = config;
    const deadline = Date.now() + timingConfig.responseTimeoutMs;
    let lastText = "";
    let stableCount = 0;

    status("Waiting for Hathr response…");

    while (Date.now() < deadline) {
      await timing.pause(timingConfig.responsePollMs, timingConfig.responsePollMs + 400);

      const messages = activePage.locator(selectors.assistantMessage);
      const count = await messages.count();
      if (count === 0) {
        continue;
      }

      const latest = messages.nth(count - 1);
      const text = ((await latest.innerText()) ?? "").trim();
      if (!text) {
        continue;
      }

      if (text === lastText) {
        stableCount += 1;
        if (stableCount >= 2) {
          status("Response captured.");
          return text;
        }
      } else {
        lastText = text;
        stableCount = 0;
      }
    }

    if (lastText) {
      status("Response timeout reached; returning partial text.");
      return lastText;
    }

    throw new Error(
      "Timed out waiting for Hathr response. Adjust selectors in config/hathr.config.json."
    );
  }

  async function close() {
    if (context) {
      await context.close();
      context = null;
      page = null;
    }
  }

  return {
    ensureBrowser,
    openChat,
    submitPrompt,
    waitForAssistantReply,
    close,
  };
}

/**
 * Opens the browser for manual login only.
 * @param {HathrConfig} config
 */
export async function openLoginBrowser(config) {
  const session = await createBrowserSession({ config });
  const page = await session.openChat();
  return { page, close: () => session.close() };
}
