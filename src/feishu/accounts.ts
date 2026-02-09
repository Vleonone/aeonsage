/**
 * Feishu/Lark Account Resolution
 *
 * @module feishu/accounts
 */

import type { AeonSageConfig } from "../config/config.js";
import type { ResolvedFeishuAccount, FeishuAccountConfig } from "./types.js";

export const DEFAULT_ACCOUNT_ID = "default";

export function listFeishuAccountIds(config: AeonSageConfig): string[] {
  const feishu = config.channels?.feishu;
  if (!feishu) return [];

  const accounts = feishu.accounts as Record<string, FeishuAccountConfig> | undefined;
  if (accounts && Object.keys(accounts).length > 0) {
    return Object.keys(accounts);
  }

  // Single account fallback
  if (feishu.appId) {
    return [DEFAULT_ACCOUNT_ID];
  }

  return [];
}

export function resolveDefaultFeishuAccountId(config: AeonSageConfig): string | null {
  const ids = listFeishuAccountIds(config);
  return ids[0] ?? null;
}

export function resolveFeishuAccount(
  config: AeonSageConfig,
  accountId?: string,
): ResolvedFeishuAccount | null {
  const feishu = config.channels?.feishu;
  if (!feishu) return null;

  const resolvedId = accountId ?? DEFAULT_ACCOUNT_ID;
  const accounts = feishu.accounts as Record<string, FeishuAccountConfig> | undefined;

  let accountConfig: FeishuAccountConfig | null = null;

  if (accounts && accounts[resolvedId]) {
    accountConfig = accounts[resolvedId];
  } else if (resolvedId === DEFAULT_ACCOUNT_ID && feishu.appId) {
    // Fallback to root-level config
    accountConfig = {
      appId: feishu.appId as string,
      appSecret: feishu.appSecret as string,
      encryptKey: feishu.encryptKey as string | undefined,
      verificationToken: feishu.verificationToken as string | undefined,
      webhookPath: feishu.webhookPath as string | undefined,
    };
  }

  if (!accountConfig?.appId || !accountConfig?.appSecret) {
    return null;
  }

  return {
    accountId: resolvedId,
    name: accountConfig.name,
    appId: accountConfig.appId,
    appSecret: accountConfig.appSecret,
    encryptKey: accountConfig.encryptKey,
    verificationToken: accountConfig.verificationToken,
    webhookPath: accountConfig.webhookPath ?? `/feishu/webhook/${resolvedId}`,
    allowFrom: accountConfig.allowFrom,
    dmPolicy: accountConfig.dmPolicy ?? "allow",
  };
}

export function normalizeAccountId(accountId?: string): string {
  return accountId ?? DEFAULT_ACCOUNT_ID;
}
