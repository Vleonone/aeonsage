import type { IncomingMessage, ServerResponse } from "node:http";
import { loadConfig } from "../config/config.js";
import { getCommonMessages, resolveUiLocale } from "../i18n/ui.js";

function sendJson(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(body));
}

export function handleApiLocaleRequest(req: IncomingMessage, res: ServerResponse): boolean {
  const url = new URL(req.url ?? "/", "http://localhost");
  if (url.pathname !== "/api/locale") return false;

  if (req.method !== "GET" && req.method !== "POST") {
    res.statusCode = 405;
    res.setHeader("Allow", "GET, POST");
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.end("Method Not Allowed");
    return true;
  }

  const configSnapshot = loadConfig();
  const locale = resolveUiLocale({
    acceptLanguageHeader: req.headers["accept-language"],
    configLocale: configSnapshot.ui?.locale,
    fallbackLocale: configSnapshot.ui?.fallbackLocale,
  });

  const common = getCommonMessages(locale);

  sendJson(res, 200, {
    ok: true,
    locale,
    common,
  });

  return true;
}
