/**
 * Feishu/Lark Channel Module
 *
 * @module feishu
 */

export {
  monitorFeishuProvider,
  getFeishuRuntimeState,
  type MonitorFeishuProviderOptions,
  type FeishuProviderMonitor,
} from "./monitor.js";

export {
  getTenantAccessToken,
  sendTextMessage,
  replyMessage,
  sendCardMessage,
  getBotInfo,
  type FeishuApiOptions,
} from "./api.js";

export {
  resolveFeishuAccount,
  listFeishuAccountIds,
  resolveDefaultFeishuAccountId,
  normalizeAccountId,
  DEFAULT_ACCOUNT_ID,
} from "./accounts.js";

export { probeFeishuBot } from "./probe.js";
export { buildFeishuMessageContext } from "./message-context.js";
export { FeishuConfigSchema, type FeishuConfigSchemaType } from "./config-schema.js";
export { decryptWebhookPayload, verifyWebhookSignature, verifyToken } from "./signature.js";

export type {
  FeishuConfig,
  FeishuAccountConfig,
  ResolvedFeishuAccount,
  FeishuTokenSource,
  FeishuProbeResult,
  FeishuSendResult,
  FeishuWebhookEvent,
  FeishuMessageContext,
  FeishuChannelData,
} from "./types.js";
