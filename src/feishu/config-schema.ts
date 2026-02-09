/**
 * Feishu/Lark Configuration Schema
 *
 * @module feishu/config-schema
 */

import { z } from "zod";

export const FeishuAccountConfigSchema = z.object({
  enabled: z.boolean().optional().default(true),
  appId: z.string().optional(),
  appSecret: z.string().optional(),
  encryptKey: z.string().optional(),
  verificationToken: z.string().optional(),
  webhookPath: z.string().optional(),
  name: z.string().optional(),
  allowFrom: z.array(z.string()).optional(),
  dmPolicy: z.enum(["allow", "block", "allowlist"]).optional().default("allow"),
});

export const FeishuConfigSchema = z.object({
  enabled: z.boolean().optional().default(false),
  accounts: z.record(z.string(), FeishuAccountConfigSchema).optional(),
  // Fallback for single-account setup
  appId: z.string().optional(),
  appSecret: z.string().optional(),
  encryptKey: z.string().optional(),
  verificationToken: z.string().optional(),
  webhookPath: z.string().optional(),
});

export type FeishuConfigSchemaType = z.infer<typeof FeishuConfigSchema>;
