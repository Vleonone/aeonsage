/**
 * Feishu/Lark API Client
 *
 * Handles authentication and API calls to Feishu Open Platform.
 *
 * @module feishu/api
 */

import { logVerbose } from "../globals.js";

const FEISHU_API_BASE = "https://open.feishu.cn/open-apis";
const LARK_API_BASE = "https://open.larksuite.com/open-apis";

// Token cache
const tokenCache = new Map<string, { token: string; expiresAt: number }>();

export interface FeishuApiOptions {
  appId: string;
  appSecret: string;
  useLark?: boolean; // Use Lark (international) instead of Feishu
}

function getApiBase(useLark?: boolean): string {
  return useLark ? LARK_API_BASE : FEISHU_API_BASE;
}

/**
 * Get tenant access token (app-level token)
 */
export async function getTenantAccessToken(opts: FeishuApiOptions): Promise<string> {
  const cacheKey = `${opts.appId}:tenant`;
  const cached = tokenCache.get(cacheKey);

  if (cached && cached.expiresAt > Date.now() + 60_000) {
    return cached.token;
  }

  const base = getApiBase(opts.useLark);
  const res = await fetch(`${base}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      app_id: opts.appId,
      app_secret: opts.appSecret,
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to get tenant access token: ${res.status}`);
  }

  const data = (await res.json()) as {
    code: number;
    msg: string;
    tenant_access_token?: string;
    expire?: number;
  };

  if (data.code !== 0 || !data.tenant_access_token) {
    throw new Error(`Feishu API error: ${data.msg}`);
  }

  const token = data.tenant_access_token;
  const expiresAt = Date.now() + (data.expire ?? 7200) * 1000;

  tokenCache.set(cacheKey, { token, expiresAt });
  logVerbose(`feishu: obtained tenant access token, expires in ${data.expire}s`);

  return token;
}

/**
 * Send a text message
 */
export async function sendTextMessage(opts: {
  appId: string;
  appSecret: string;
  receiveId: string;
  receiveIdType: "open_id" | "user_id" | "chat_id";
  text: string;
  useLark?: boolean;
}): Promise<{ messageId: string }> {
  const token = await getTenantAccessToken(opts);
  const base = getApiBase(opts.useLark);

  const res = await fetch(`${base}/im/v1/messages?receive_id_type=${opts.receiveIdType}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      receive_id: opts.receiveId,
      msg_type: "text",
      content: JSON.stringify({ text: opts.text }),
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to send message: ${res.status}`);
  }

  const data = (await res.json()) as {
    code: number;
    msg: string;
    data?: { message_id: string };
  };

  if (data.code !== 0) {
    throw new Error(`Feishu send error: ${data.msg}`);
  }

  return { messageId: data.data?.message_id ?? "" };
}

/**
 * Reply to a message
 */
export async function replyMessage(opts: {
  appId: string;
  appSecret: string;
  messageId: string;
  text: string;
  useLark?: boolean;
}): Promise<{ messageId: string }> {
  const token = await getTenantAccessToken(opts);
  const base = getApiBase(opts.useLark);

  const res = await fetch(`${base}/im/v1/messages/${opts.messageId}/reply`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      msg_type: "text",
      content: JSON.stringify({ text: opts.text }),
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to reply message: ${res.status}`);
  }

  const data = (await res.json()) as {
    code: number;
    msg: string;
    data?: { message_id: string };
  };

  if (data.code !== 0) {
    throw new Error(`Feishu reply error: ${data.msg}`);
  }

  return { messageId: data.data?.message_id ?? "" };
}

/**
 * Send an interactive card message
 */
export async function sendCardMessage(opts: {
  appId: string;
  appSecret: string;
  receiveId: string;
  receiveIdType: "open_id" | "user_id" | "chat_id";
  card: unknown;
  useLark?: boolean;
}): Promise<{ messageId: string }> {
  const token = await getTenantAccessToken(opts);
  const base = getApiBase(opts.useLark);

  const res = await fetch(`${base}/im/v1/messages?receive_id_type=${opts.receiveIdType}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      receive_id: opts.receiveId,
      msg_type: "interactive",
      content: JSON.stringify(opts.card),
    }),
  });

  if (!res.ok) {
    throw new Error(`Failed to send card: ${res.status}`);
  }

  const data = (await res.json()) as {
    code: number;
    msg: string;
    data?: { message_id: string };
  };

  if (data.code !== 0) {
    throw new Error(`Feishu card error: ${data.msg}`);
  }

  return { messageId: data.data?.message_id ?? "" };
}

/**
 * Get bot info for probing
 */
export async function getBotInfo(opts: FeishuApiOptions): Promise<{
  appName: string;
  avatarUrl?: string;
}> {
  const token = await getTenantAccessToken(opts);
  const base = getApiBase(opts.useLark);

  const res = await fetch(`${base}/bot/v3/info`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) {
    throw new Error(`Failed to get bot info: ${res.status}`);
  }

  const data = (await res.json()) as {
    code: number;
    msg: string;
    bot?: { app_name: string; avatar_url?: string };
  };

  if (data.code !== 0) {
    throw new Error(`Feishu bot info error: ${data.msg}`);
  }

  return {
    appName: data.bot?.app_name ?? "Unknown",
    avatarUrl: data.bot?.avatar_url,
  };
}
