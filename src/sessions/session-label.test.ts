import { describe, expect, it } from "vitest";

import { parseSessionLabel, SESSION_LABEL_MAX_LENGTH } from "./session-label.js";

describe("session-label", () => {
  describe("SESSION_LABEL_MAX_LENGTH", () => {
    it("is 64", () => {
      expect(SESSION_LABEL_MAX_LENGTH).toBe(64);
    });
  });

  describe("parseSessionLabel", () => {
    it("accepts a valid label", () => {
      const result = parseSessionLabel("My Session");
      expect(result).toEqual({ ok: true, label: "My Session" });
    });

    it("trims whitespace from label", () => {
      const result = parseSessionLabel("  trimmed  ");
      expect(result).toEqual({ ok: true, label: "trimmed" });
    });

    it("rejects non-string inputs", () => {
      expect(parseSessionLabel(123)).toEqual({
        ok: false,
        error: expect.stringContaining("must be a string"),
      });
      expect(parseSessionLabel(null)).toEqual({
        ok: false,
        error: expect.stringContaining("must be a string"),
      });
      expect(parseSessionLabel(undefined)).toEqual({
        ok: false,
        error: expect.stringContaining("must be a string"),
      });
      expect(parseSessionLabel(true)).toEqual({
        ok: false,
        error: expect.stringContaining("must be a string"),
      });
      expect(parseSessionLabel({})).toEqual({
        ok: false,
        error: expect.stringContaining("must be a string"),
      });
      expect(parseSessionLabel([])).toEqual({
        ok: false,
        error: expect.stringContaining("must be a string"),
      });
    });

    it("rejects empty string", () => {
      expect(parseSessionLabel("")).toEqual({ ok: false, error: expect.stringContaining("empty") });
    });

    it("rejects whitespace-only string", () => {
      expect(parseSessionLabel("   ")).toEqual({
        ok: false,
        error: expect.stringContaining("empty"),
      });
    });

    it("accepts label at exactly max length", () => {
      const label = "a".repeat(64);
      expect(parseSessionLabel(label)).toEqual({ ok: true, label });
    });

    it("rejects label exceeding max length", () => {
      const label = "a".repeat(65);
      expect(parseSessionLabel(label)).toEqual({
        ok: false,
        error: expect.stringContaining("too long"),
      });
    });

    it("handles unicode characters", () => {
      const result = parseSessionLabel("会话测试");
      expect(result).toEqual({ ok: true, label: "会话测试" });
    });
  });
});
