/**
 * Feishu/Lark Webhook Signature Verification
 *
 * @module feishu/signature
 */

import { createHash, createDecipheriv } from "node:crypto";

/**
 * Decrypt encrypted webhook payload
 */
export function decryptWebhookPayload(encrypt: string, encryptKey: string): string {
  const key = createHash("sha256").update(encryptKey).digest();
  const encryptBuffer = Buffer.from(encrypt, "base64");

  const iv = encryptBuffer.subarray(0, 16);
  const encrypted = encryptBuffer.subarray(16);

  const decipher = createDecipheriv("aes-256-cbc", key, iv);
  let decrypted = decipher.update(encrypted);
  decrypted = Buffer.concat([decrypted, decipher.final()]);

  return decrypted.toString("utf8");
}

/**
 * Verify webhook signature (v2 events)
 */
export function verifyWebhookSignature(
  timestamp: string,
  nonce: string,
  body: string,
  signature: string,
  encryptKey: string,
): boolean {
  const content = timestamp + nonce + encryptKey + body;
  const hash = createHash("sha256").update(content).digest("hex");
  return hash === signature;
}

/**
 * Verify verification token (v1 events)
 */
export function verifyToken(receivedToken: string, expectedToken: string): boolean {
  return receivedToken === expectedToken;
}
