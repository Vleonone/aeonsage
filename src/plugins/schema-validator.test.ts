import { describe, expect, it } from "vitest";

import { validateJsonSchemaValue } from "./schema-validator.js";

describe("plugins/schema-validator", () => {
  describe("validateJsonSchemaValue", () => {
    it("validates a correct value against a simple schema", () => {
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
          port: { type: "number" },
        },
        required: ["name"],
      };
      const result = validateJsonSchemaValue({
        schema,
        cacheKey: "test-simple",
        value: { name: "hello", port: 8080 },
      });
      expect(result).toEqual({ ok: true });
    });

    it("rejects value missing required field", () => {
      const schema = {
        type: "object",
        properties: {
          name: { type: "string" },
        },
        required: ["name"],
      };
      const result = validateJsonSchemaValue({
        schema,
        cacheKey: "test-required",
        value: {},
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });

    it("rejects value with wrong type", () => {
      const schema = {
        type: "object",
        properties: {
          port: { type: "number" },
        },
      };
      const result = validateJsonSchemaValue({
        schema,
        cacheKey: "test-type",
        value: { port: "not-a-number" },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.includes("port"))).toBe(true);
      }
    });

    it("collects all errors (allErrors mode)", () => {
      const schema = {
        type: "object",
        properties: {
          a: { type: "number" },
          b: { type: "number" },
        },
      };
      const result = validateJsonSchemaValue({
        schema,
        cacheKey: "test-all-errors",
        value: { a: "x", b: "y" },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.length).toBeGreaterThanOrEqual(2);
      }
    });

    it("caches compiled validators for the same cacheKey", () => {
      const schema = { type: "string" };
      // First call compiles; second should use cache
      const r1 = validateJsonSchemaValue({ schema, cacheKey: "test-cache", value: "hello" });
      const r2 = validateJsonSchemaValue({ schema, cacheKey: "test-cache", value: "world" });
      expect(r1).toEqual({ ok: true });
      expect(r2).toEqual({ ok: true });
    });

    it("recompiles when schema changes for the same cacheKey", () => {
      const schema1 = { type: "string" };
      const schema2 = { type: "number" };

      const r1 = validateJsonSchemaValue({
        schema: schema1,
        cacheKey: "test-recompile",
        value: "text",
      });
      expect(r1).toEqual({ ok: true });

      const r2 = validateJsonSchemaValue({
        schema: schema2,
        cacheKey: "test-recompile",
        value: "text",
      });
      expect(r2.ok).toBe(false);
    });

    it("validates nested object schemas", () => {
      const schema = {
        type: "object",
        properties: {
          server: {
            type: "object",
            properties: {
              host: { type: "string" },
              port: { type: "number" },
            },
          },
        },
      };
      const valid = validateJsonSchemaValue({
        schema,
        cacheKey: "test-nested",
        value: { server: { host: "localhost", port: 3000 } },
      });
      expect(valid).toEqual({ ok: true });

      const invalid = validateJsonSchemaValue({
        schema,
        cacheKey: "test-nested",
        value: { server: { host: 123 } },
      });
      expect(invalid.ok).toBe(false);
    });

    it("formats error paths as dot notation", () => {
      const schema = {
        type: "object",
        properties: {
          config: {
            type: "object",
            properties: {
              port: { type: "number" },
            },
          },
        },
      };
      const result = validateJsonSchemaValue({
        schema,
        cacheKey: "test-dot-path",
        value: { config: { port: "abc" } },
      });
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.errors.some((e) => e.includes("config.port"))).toBe(true);
      }
    });

    it("does not remove additional properties", () => {
      const schema = {
        type: "object",
        properties: { a: { type: "string" } },
      };
      const value = { a: "ok", extra: true };
      const result = validateJsonSchemaValue({
        schema,
        cacheKey: "test-additional",
        value,
      });
      expect(result).toEqual({ ok: true });
      // Value should not be mutated
      expect(value).toHaveProperty("extra");
    });
  });
});
