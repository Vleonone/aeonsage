import { describe, expect, it } from "vitest";

import {
  DEFAULT_ACCOUNT_ID,
  listFeishuAccountIds,
  resolveDefaultFeishuAccountId,
  resolveFeishuAccount,
  normalizeAccountId,
} from "./accounts.js";
import type { AeonSageConfig } from "../config/config.js";

function makeConfig(feishu?: Record<string, unknown>): AeonSageConfig {
  return {
    channels: feishu ? { feishu } : {},
  } as AeonSageConfig;
}

describe("feishu/accounts", () => {
  describe("DEFAULT_ACCOUNT_ID", () => {
    it("is 'default'", () => {
      expect(DEFAULT_ACCOUNT_ID).toBe("default");
    });
  });

  describe("listFeishuAccountIds", () => {
    it("returns empty array when feishu not configured", () => {
      expect(listFeishuAccountIds(makeConfig())).toEqual([]);
    });

    it("returns account IDs from multi-account config", () => {
      const config = makeConfig({
        accounts: {
          main: { appId: "a", appSecret: "b" },
          dev: { appId: "c", appSecret: "d" },
        },
      });
      const ids = listFeishuAccountIds(config);
      expect(ids).toContain("main");
      expect(ids).toContain("dev");
      expect(ids).toHaveLength(2);
    });

    it("returns ['default'] for single-account config", () => {
      const config = makeConfig({ appId: "a", appSecret: "b" });
      expect(listFeishuAccountIds(config)).toEqual(["default"]);
    });

    it("returns empty when no appId and no accounts", () => {
      const config = makeConfig({});
      expect(listFeishuAccountIds(config)).toEqual([]);
    });
  });

  describe("resolveDefaultFeishuAccountId", () => {
    it("returns first account ID", () => {
      const config = makeConfig({
        accounts: { primary: { appId: "a", appSecret: "b" } },
      });
      expect(resolveDefaultFeishuAccountId(config)).toBe("primary");
    });

    it("returns null when no accounts", () => {
      expect(resolveDefaultFeishuAccountId(makeConfig())).toBeNull();
    });
  });

  describe("resolveFeishuAccount", () => {
    it("resolves account from multi-account config", () => {
      const config = makeConfig({
        accounts: {
          main: { appId: "app1", appSecret: "secret1" },
        },
      });
      const account = resolveFeishuAccount(config, "main");
      expect(account).not.toBeNull();
      expect(account!.appId).toBe("app1");
      expect(account!.appSecret).toBe("secret1");
      expect(account!.accountId).toBe("main");
    });

    it("falls back to root-level config for 'default' account", () => {
      const config = makeConfig({
        appId: "rootApp",
        appSecret: "rootSecret",
        encryptKey: "ek",
        verificationToken: "vt",
      });
      const account = resolveFeishuAccount(config);
      expect(account).not.toBeNull();
      expect(account!.appId).toBe("rootApp");
      expect(account!.encryptKey).toBe("ek");
    });

    it("generates default webhook path", () => {
      const config = makeConfig({
        accounts: { test: { appId: "a", appSecret: "b" } },
      });
      const account = resolveFeishuAccount(config, "test");
      expect(account!.webhookPath).toBe("/feishu/webhook/test");
    });

    it("uses custom webhookPath when specified", () => {
      const config = makeConfig({
        accounts: {
          test: { appId: "a", appSecret: "b", webhookPath: "/custom/hook" },
        },
      });
      const account = resolveFeishuAccount(config, "test");
      expect(account!.webhookPath).toBe("/custom/hook");
    });

    it("defaults dmPolicy to 'allow'", () => {
      const config = makeConfig({
        accounts: { test: { appId: "a", appSecret: "b" } },
      });
      const account = resolveFeishuAccount(config, "test");
      expect(account!.dmPolicy).toBe("allow");
    });

    it("returns null when appId or appSecret missing", () => {
      const config = makeConfig({
        accounts: { bad: { appId: "a" } },
      });
      expect(resolveFeishuAccount(config, "bad")).toBeNull();
    });

    it("returns null when feishu not configured", () => {
      expect(resolveFeishuAccount(makeConfig())).toBeNull();
    });

    it("returns null for unknown accountId", () => {
      const config = makeConfig({
        accounts: { main: { appId: "a", appSecret: "b" } },
      });
      expect(resolveFeishuAccount(config, "unknown")).toBeNull();
    });
  });

  describe("normalizeAccountId", () => {
    it("returns provided accountId", () => {
      expect(normalizeAccountId("custom")).toBe("custom");
    });

    it("returns 'default' when undefined", () => {
      expect(normalizeAccountId()).toBe("default");
      expect(normalizeAccountId(undefined)).toBe("default");
    });
  });
});
