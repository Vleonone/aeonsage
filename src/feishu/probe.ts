/**
 * Feishu/Lark Probe
 *
 * @module feishu/probe
 */

import { getBotInfo } from "./api.js";
import type { FeishuProbeResult } from "./types.js";

export async function probeFeishuBot(opts: {
  appId: string;
  appSecret: string;
  useLark?: boolean;
}): Promise<FeishuProbeResult> {
  const start = Date.now();

  try {
    const botInfo = await getBotInfo(opts);
    return {
      ok: true,
      elapsedMs: Date.now() - start,
      appName: botInfo.appName,
    };
  } catch (err) {
    return {
      ok: false,
      error: String(err),
      elapsedMs: Date.now() - start,
    };
  }
}
