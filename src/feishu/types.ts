/**
 * Feishu/Lark Channel Types
 *
 * @module feishu/types
 */

export type FeishuTokenSource = "config" | "env";

export interface FeishuConfig {
  enabled?: boolean;
  appId?: string;
  appSecret?: string;
  encryptKey?: string;
  verificationToken?: string;
  webhookPath?: string;
}

export interface FeishuAccountConfig extends FeishuConfig {
  accountId?: string;
  name?: string;
  allowFrom?: string[];
  dmPolicy?: "allow" | "block" | "allowlist";
}

export interface ResolvedFeishuAccount {
  accountId: string;
  name?: string;
  appId: string;
  appSecret: string;
  encryptKey?: string;
  verificationToken?: string;
  webhookPath: string;
  allowFrom?: string[];
  dmPolicy: "allow" | "block" | "allowlist";
}

export interface FeishuProbeResult {
  ok: boolean;
  status?: number;
  error?: string;
  elapsedMs?: number;
  appName?: string;
}

export interface FeishuSendResult {
  ok: boolean;
  messageId?: string;
  error?: string;
}

export interface FeishuWebhookEvent {
  schema?: string;
  header?: {
    event_id: string;
    event_type: string;
    create_time: string;
    token: string;
    app_id: string;
    tenant_key: string;
  };
  event?: {
    sender?: {
      sender_id?: {
        open_id?: string;
        user_id?: string;
        union_id?: string;
      };
      sender_type?: string;
      tenant_key?: string;
    };
    message?: {
      message_id: string;
      root_id?: string;
      parent_id?: string;
      create_time: string;
      chat_id: string;
      chat_type: string;
      message_type: string;
      content: string;
      mentions?: Array<{
        key: string;
        id: {
          open_id?: string;
          user_id?: string;
          union_id?: string;
        };
        name: string;
        tenant_key?: string;
      }>;
    };
  };
  challenge?: string;
  token?: string;
  type?: string;
}

export interface FeishuMessageContext {
  From: string;
  FromName?: string;
  Channel: "feishu";
  ChannelMessageId: string;
  ChatId: string;
  ChatType: "p2p" | "group";
  Text: string;
  Mentions?: string[];
  ReplyToken?: string;
}

export interface FeishuChannelData {
  cardContent?: unknown;
  cardHeader?: {
    title?: string;
    template?: string;
  };
}
