import { describe, expect, it } from "vitest";
import { createHash, createCipheriv, randomBytes } from "node:crypto";

import { decryptWebhookPayload, verifyWebhookSignature, verifyToken } from "./signature.js";

describe("feishu/signature", () => {
  describe("decryptWebhookPayload", () => {
    it("decrypts a payload encrypted with AES-256-CBC", () => {
      const encryptKey = "test-encrypt-key-1234";
      const plaintext = JSON.stringify({ challenge: "abc123" });

      // Encrypt the payload the same way Feishu does
      const key = createHash("sha256").update(encryptKey).digest();
      const iv = randomBytes(16);
      const cipher = createCipheriv("aes-256-cbc", key, iv);
      let encrypted = cipher.update(plaintext, "utf8");
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      const payload = Buffer.concat([iv, encrypted]).toString("base64");

      const result = decryptWebhookPayload(payload, encryptKey);
      expect(result).toBe(plaintext);
    });

    it("throws on invalid encryptKey", () => {
      const encryptKey = "correct-key";
      const plaintext = "hello";
      const key = createHash("sha256").update(encryptKey).digest();
      const iv = randomBytes(16);
      const cipher = createCipheriv("aes-256-cbc", key, iv);
      let encrypted = cipher.update(plaintext, "utf8");
      encrypted = Buffer.concat([encrypted, cipher.final()]);
      const payload = Buffer.concat([iv, encrypted]).toString("base64");

      expect(() => decryptWebhookPayload(payload, "wrong-key")).toThrow();
    });

    it("throws on malformed base64 payload", () => {
      expect(() => decryptWebhookPayload("not-valid", "key")).toThrow();
    });
  });

  describe("verifyWebhookSignature", () => {
    it("returns true for valid signature", () => {
      const timestamp = "1700000000";
      const nonce = "abc123";
      const encryptKey = "my-encrypt-key";
      const body = '{"event":"test"}';

      const content = timestamp + nonce + encryptKey + body;
      const expectedSig = createHash("sha256").update(content).digest("hex");

      expect(verifyWebhookSignature(timestamp, nonce, body, expectedSig, encryptKey)).toBe(true);
    });

    it("returns false for tampered body", () => {
      const timestamp = "1700000000";
      const nonce = "abc123";
      const encryptKey = "my-encrypt-key";
      const body = '{"event":"test"}';

      const content = timestamp + nonce + encryptKey + body;
      const sig = createHash("sha256").update(content).digest("hex");

      expect(
        verifyWebhookSignature(timestamp, nonce, '{"event":"tampered"}', sig, encryptKey),
      ).toBe(false);
    });

    it("returns false for wrong encryptKey", () => {
      const timestamp = "1700000000";
      const nonce = "abc123";
      const body = "{}";
      const content = timestamp + nonce + "correct-key" + body;
      const sig = createHash("sha256").update(content).digest("hex");

      expect(verifyWebhookSignature(timestamp, nonce, body, sig, "wrong-key")).toBe(false);
    });
  });

  describe("verifyToken", () => {
    it("returns true for matching tokens", () => {
      expect(verifyToken("secret-token", "secret-token")).toBe(true);
    });

    it("returns false for non-matching tokens", () => {
      expect(verifyToken("token-a", "token-b")).toBe(false);
    });

    it("is case-sensitive", () => {
      expect(verifyToken("Token", "token")).toBe(false);
    });
  });
});
