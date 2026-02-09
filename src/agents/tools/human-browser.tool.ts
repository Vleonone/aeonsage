import { Type } from "@sinclair/typebox";
import { type AnyAgentTool, jsonResult, readStringParam } from "./common.js";

// Lazy imports for optional dependencies
let puppeteerExtra: any = null;
let _stealthPlugin: any = null;

async function loadPuppeteerExtra() {
  if (!puppeteerExtra) {
    const pExtra = await import("puppeteer-extra");
    const stealth = await import("puppeteer-extra-plugin-stealth");
    puppeteerExtra = pExtra.default;
    puppeteerExtra.use(stealth.default());
  }
  return puppeteerExtra;
}

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15",
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

async function humanDelay(minMs: number, maxMs: number): Promise<void> {
  const delay = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  await new Promise((resolve) => setTimeout(resolve, delay));
}

const HumanBrowserToolSchema = Type.Object({
  action: Type.String(),
  url: Type.Optional(Type.String()),
  headless: Type.Optional(Type.Boolean()),
});

// Store active browser instance
let activeBrowser: any = null;
let activePage: any = null;

export function createHumanBrowserTool(): AnyAgentTool {
  return {
    label: "Human Browser",
    name: "human_browser",
    description: `Launch a stealth browser with anti-detection features.

Actions:
- launch: Start a stealth browser with randomized fingerprint
- navigate: Navigate to URL with human-like delays
- close: Close the browser

This browser bypasses Cloudflare, reCAPTCHA, and other bot detection.`,
    parameters: HumanBrowserToolSchema,
    execute: async (_toolCallId, rawArgs) => {
      const args = rawArgs as Record<string, unknown>;
      const action = readStringParam(args, "action");

      switch (action) {
        case "launch": {
          const puppeteer = await loadPuppeteerExtra();
          const headless = args.headless === true;

          activeBrowser = await puppeteer.launch({
            headless: headless ? "new" : false,
            args: [
              "--no-sandbox",
              "--disable-setuid-sandbox",
              "--disable-blink-features=AutomationControlled",
              "--disable-infobars",
              `--window-size=${1920 + Math.floor(Math.random() * 100)},${1080 + Math.floor(Math.random() * 100)}`,
            ],
            defaultViewport: null,
          });

          activePage = await activeBrowser.newPage();

          // Set random user agent
          await activePage.setUserAgent(getRandomUserAgent());

          // Override navigator.webdriver
          await activePage.evaluateOnNewDocument(() => {
            Object.defineProperty(navigator, "webdriver", {
              get: () => undefined,
            });
            // Add more fingerprint spoofing
            Object.defineProperty(navigator, "plugins", {
              get: () => [1, 2, 3, 4, 5],
            });
          });

          return jsonResult({
            success: true,
            message: "Stealth browser launched successfully",
            userAgent: await activePage.evaluate(() => navigator.userAgent),
          });
        }

        case "navigate": {
          if (!activePage) {
            return jsonResult({ success: false, error: "Browser not launched" });
          }

          const url = readStringParam(args, "url");

          // Human-like delay before navigation
          await humanDelay(500, 1500);

          await activePage.goto(url, {
            waitUntil: "networkidle2",
            timeout: 30000,
          });

          // Random delay after page load
          await humanDelay(1000, 3000);

          const title = await activePage.title();

          return jsonResult({
            success: true,
            url,
            title,
            message: `Navigated to ${url}`,
          });
        }

        case "close": {
          if (activeBrowser) {
            await activeBrowser.close();
            activeBrowser = null;
            activePage = null;
          }
          return jsonResult({ success: true, message: "Browser closed" });
        }

        default:
          return jsonResult({ success: false, error: `Unknown action: ${action}` });
      }
    },
  };
}
