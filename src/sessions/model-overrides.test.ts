import { describe, expect, it } from "vitest";

import { applyModelOverrideToSessionEntry } from "./model-overrides.js";
import type { SessionEntry } from "../config/sessions.js";

function makeEntry(overrides: Partial<SessionEntry> = {}): SessionEntry {
  return { ...overrides } as SessionEntry;
}

describe("model-overrides", () => {
  describe("applyModelOverrideToSessionEntry", () => {
    it("sets provider and model when isDefault is false", () => {
      const entry = makeEntry();
      const result = applyModelOverrideToSessionEntry({
        entry,
        selection: { provider: "openai", model: "gpt-4" },
      });
      expect(result.updated).toBe(true);
      expect(entry.providerOverride).toBe("openai");
      expect(entry.modelOverride).toBe("gpt-4");
    });

    it("removes provider and model when isDefault is true", () => {
      const entry = makeEntry({ providerOverride: "openai", modelOverride: "gpt-4" });
      const result = applyModelOverrideToSessionEntry({
        entry,
        selection: { provider: "openai", model: "gpt-4", isDefault: true },
      });
      expect(result.updated).toBe(true);
      expect(entry.providerOverride).toBeUndefined();
      expect(entry.modelOverride).toBeUndefined();
    });

    it("sets authProfileOverride when profileOverride provided", () => {
      const entry = makeEntry();
      const result = applyModelOverrideToSessionEntry({
        entry,
        selection: { provider: "anthropic", model: "claude" },
        profileOverride: "work",
      });
      expect(result.updated).toBe(true);
      expect(entry.authProfileOverride).toBe("work");
      expect(entry.authProfileOverrideSource).toBe("user");
    });

    it("respects profileOverrideSource param", () => {
      const entry = makeEntry();
      applyModelOverrideToSessionEntry({
        entry,
        selection: { provider: "a", model: "b" },
        profileOverride: "auto-profile",
        profileOverrideSource: "auto",
      });
      expect(entry.authProfileOverrideSource).toBe("auto");
    });

    it("clears authProfile fields when profileOverride is absent", () => {
      const entry = makeEntry({
        authProfileOverride: "old",
        authProfileOverrideSource: "user" as "auto" | "user",
        authProfileOverrideCompactionCount: 3,
      });
      const result = applyModelOverrideToSessionEntry({
        entry,
        selection: { provider: "x", model: "y" },
      });
      expect(result.updated).toBe(true);
      expect(entry.authProfileOverride).toBeUndefined();
      expect(entry.authProfileOverrideSource).toBeUndefined();
      expect(entry.authProfileOverrideCompactionCount).toBeUndefined();
    });

    it("removes compactionCount when setting new profile", () => {
      const entry = makeEntry({
        authProfileOverrideCompactionCount: 5,
      });
      applyModelOverrideToSessionEntry({
        entry,
        selection: { provider: "a", model: "b" },
        profileOverride: "new",
      });
      expect(entry.authProfileOverrideCompactionCount).toBeUndefined();
    });

    it("returns updated=false when nothing changes", () => {
      const entry = makeEntry({ providerOverride: "openai", modelOverride: "gpt-4" });
      const result = applyModelOverrideToSessionEntry({
        entry,
        selection: { provider: "openai", model: "gpt-4" },
      });
      expect(result.updated).toBe(false);
    });

    it("sets updatedAt timestamp when changes occur", () => {
      const entry = makeEntry();
      applyModelOverrideToSessionEntry({
        entry,
        selection: { provider: "a", model: "b" },
      });
      expect(entry.updatedAt).toBeTypeOf("number");
      expect(entry.updatedAt).toBeGreaterThan(0);
    });

    it("does not set updatedAt when no changes", () => {
      const entry = makeEntry({ providerOverride: "a", modelOverride: "b" });
      applyModelOverrideToSessionEntry({
        entry,
        selection: { provider: "a", model: "b" },
      });
      expect(entry.updatedAt).toBeUndefined();
    });
  });
});
