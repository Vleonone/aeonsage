/**
 * Feishu/Lark Channel Configuration Types
 *
 * @module config/types.feishu
 */

export interface FeishuAccountConfig {
  /** Human-readable account name */
  name?: string;
  /** Feishu App ID */
  appId?: string;
  /** Feishu App Secret */
  appSecret?: string;
  /** Encrypt Key for event decryption */
  encryptKey?: string;
  /** Verification Token for webhook validation */
  verificationToken?: string;
  /** Webhook path for this account */
  webhookPath?: string;
  /** Allowlist of user IDs that can interact */
  allowFrom?: string[];
  /** DM policy: allow, block, or allowlist */
  dmPolicy?: "allow" | "block" | "allowlist";
}

export interface FeishuConfig {
  /** Enable Feishu channel */
  enabled?: boolean;
  /** Single-account legacy config: App ID */
  appId?: string;
  /** Single-account legacy config: App Secret */
  appSecret?: string;
  /** Single-account legacy config: Encrypt Key */
  encryptKey?: string;
  /** Single-account legacy config: Verification Token */
  verificationToken?: string;
  /** Single-account legacy config: Webhook Path */
  webhookPath?: string;
  /** Multi-account configuration */
  accounts?: Record<string, FeishuAccountConfig>;
}
