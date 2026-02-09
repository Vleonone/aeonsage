/**
 * Feishu/Lark Provider Monitor
 *
 * Manages Feishu bot lifecycle, webhook handling, and message routing.
 *
 * @module feishu/monitor
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { AeonSageConfig } from "../config/config.js";
import { danger, logVerbose } from "../globals.js";
import type { RuntimeEnv } from "../runtime.js";
import { normalizePluginHttpPath } from "../plugins/http-path.js";
import { registerPluginHttpRoute } from "../plugins/http-registry.js";
import { decryptWebhookPayload, verifyToken } from "./signature.js";
import { replyMessage, sendTextMessage } from "./api.js";
import { buildFeishuMessageContext } from "./message-context.js";
import type { ResolvedFeishuAccount, FeishuWebhookEvent } from "./types.js";
import { dispatchReplyWithBufferedBlockDispatcher } from "../auto-reply/reply/provider-dispatcher.js";
import { resolveEffectiveMessagesConfig } from "../agents/identity.js";

export interface MonitorFeishuProviderOptions {
  account: ResolvedFeishuAccount;
  config: AeonSageConfig;
  runtime: RuntimeEnv;
  abortSignal?: AbortSignal;
}

export interface FeishuProviderMonitor {
  account: ResolvedFeishuAccount;
  stop: () => void;
}

// Runtime state tracking
const runtimeState = new Map<
  string,
  {
    running: boolean;
    lastStartAt: number | null;
    lastStopAt: number | null;
    lastError: string | null;
    lastInboundAt?: number | null;
    lastOutboundAt?: number | null;
  }
>();

function recordChannelRuntimeState(params: {
  channel: string;
  accountId: string;
  state: Partial<{
    running: boolean;
    lastStartAt: number | null;
    lastStopAt: number | null;
    lastError: string | null;
    lastInboundAt: number | null;
    lastOutboundAt: number | null;
  }>;
}): void {
  const key = `${params.channel}:${params.accountId}`;
  const existing = runtimeState.get(key) ?? {
    running: false,
    lastStartAt: null,
    lastStopAt: null,
    lastError: null,
  };
  runtimeState.set(key, { ...existing, ...params.state });
}

export function getFeishuRuntimeState(accountId: string) {
  return runtimeState.get(`feishu:${accountId}`);
}

async function readRequestBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf-8")));
    req.on("error", reject);
  });
}

export async function monitorFeishuProvider(
  opts: MonitorFeishuProviderOptions,
): Promise<FeishuProviderMonitor> {
  const { account, config, runtime, abortSignal } = opts;

  // Record starting state
  recordChannelRuntimeState({
    channel: "feishu",
    accountId: account.accountId,
    state: {
      running: true,
      lastStartAt: Date.now(),
    },
  });

  // Normalize webhook path
  const normalizedPath =
    normalizePluginHttpPath(account.webhookPath, `/feishu/webhook/${account.accountId}`) ??
    `/feishu/webhook/${account.accountId}`;

  // Register HTTP webhook handler
  const unregisterHttp = registerPluginHttpRoute({
    path: normalizedPath,
    pluginId: "feishu",
    accountId: account.accountId,
    log: (msg) => logVerbose(msg),
    handler: async (req: IncomingMessage, res: ServerResponse) => {
      // Handle GET requests for verification
      if (req.method === "GET") {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        res.end("OK");
        return;
      }

      // Only accept POST requests
      if (req.method !== "POST") {
        res.statusCode = 405;
        res.setHeader("Allow", "GET, POST");
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ error: "Method Not Allowed" }));
        return;
      }

      try {
        const rawBody = await readRequestBody(req);
        let event: FeishuWebhookEvent;

        try {
          const parsed = JSON.parse(rawBody) as { encrypt?: string } & FeishuWebhookEvent;

          // Handle encrypted payload
          if (parsed.encrypt && account.encryptKey) {
            const decrypted = decryptWebhookPayload(parsed.encrypt, account.encryptKey);
            event = JSON.parse(decrypted) as FeishuWebhookEvent;
          } else {
            event = parsed;
          }
        } catch (parseErr) {
          logVerbose(`feishu: failed to parse webhook body: ${String(parseErr)}`);
          res.statusCode = 400;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Invalid JSON" }));
          return;
        }

        // Handle URL verification challenge
        if (event.challenge) {
          logVerbose("feishu: responding to URL verification challenge");
          res.statusCode = 200;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ challenge: event.challenge }));
          return;
        }

        // Verify token if configured
        if (account.verificationToken && event.header?.token) {
          if (!verifyToken(event.header.token, account.verificationToken)) {
            logVerbose("feishu: verification token mismatch");
            res.statusCode = 401;
            res.setHeader("Content-Type", "application/json");
            res.end(JSON.stringify({ error: "Invalid token" }));
            return;
          }
        }

        // Respond immediately to avoid timeout
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        res.end(JSON.stringify({ code: 0 }));

        // Process message events asynchronously
        if (event.header?.event_type === "im.message.receive_v1") {
          await handleMessageEvent(event, account, config, runtime);
        }
      } catch (err) {
        runtime.error?.(danger(`feishu webhook error: ${String(err)}`));
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ error: "Internal server error" }));
        }
      }
    },
  });

  logVerbose(`feishu: registered webhook handler at ${normalizedPath}`);

  // Handle abort signal
  const stopHandler = () => {
    logVerbose(`feishu: stopping provider for account ${account.accountId}`);
    unregisterHttp();
    recordChannelRuntimeState({
      channel: "feishu",
      accountId: account.accountId,
      state: {
        running: false,
        lastStopAt: Date.now(),
      },
    });
  };

  abortSignal?.addEventListener("abort", stopHandler);

  return {
    account,
    stop: () => {
      stopHandler();
      abortSignal?.removeEventListener("abort", stopHandler);
    },
  };
}

async function handleMessageEvent(
  event: FeishuWebhookEvent,
  account: ResolvedFeishuAccount,
  config: AeonSageConfig,
  runtime: RuntimeEnv,
): Promise<void> {
  const ctx = buildFeishuMessageContext(event, account.accountId);
  if (!ctx) {
    logVerbose("feishu: could not build message context from event");
    return;
  }

  recordChannelRuntimeState({
    channel: "feishu",
    accountId: account.accountId,
    state: { lastInboundAt: Date.now() },
  });

  logVerbose(`feishu: received message from ${ctx.From} in ${ctx.ChatType}`);

  const effectiveConfig = resolveEffectiveMessagesConfig(config, "");
  const prefix = effectiveConfig.responsePrefix ?? "";

  try {
    await dispatchReplyWithBufferedBlockDispatcher({
      ctx,
      cfg: config,
      dispatcherOptions: {
        responsePrefix: prefix,
        deliver: async (payload) => {
          const text = payload.text ?? "";

          if (ctx.ReplyToken) {
            await replyMessage({
              appId: account.appId,
              appSecret: account.appSecret,
              messageId: ctx.ReplyToken,
              text,
            });
          } else {
            await sendTextMessage({
              appId: account.appId,
              appSecret: account.appSecret,
              receiveId: ctx.ChatId,
              receiveIdType: "chat_id",
              text,
            });
          }

          recordChannelRuntimeState({
            channel: "feishu",
            accountId: account.accountId,
            state: { lastOutboundAt: Date.now() },
          });
        },
        onError: (err: unknown, info: { kind: string }) => {
          runtime.error?.(danger(`feishu ${info.kind} reply failed: ${String(err)}`));
        },
      },
      replyOptions: {},
    });
  } catch (err) {
    runtime.error?.(danger(`feishu: auto-reply failed: ${String(err)}`));

    // Send error message
    try {
      await sendTextMessage({
        appId: account.appId,
        appSecret: account.appSecret,
        receiveId: ctx.ChatId,
        receiveIdType: "chat_id",
        text: "抱歉，处理消息时出现错误。",
      });
    } catch (sendErr) {
      runtime.error?.(danger(`feishu: error reply failed: ${String(sendErr)}`));
    }
  }
}
