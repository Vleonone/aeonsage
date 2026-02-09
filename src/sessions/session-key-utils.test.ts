import { describe, expect, it } from "vitest";

import {
  parseAgentSessionKey,
  isSubagentSessionKey,
  isAcpSessionKey,
  resolveThreadParentSessionKey,
} from "./session-key-utils.js";

describe("session-key-utils", () => {
  describe("parseAgentSessionKey", () => {
    it("parses a valid agent session key", () => {
      const result = parseAgentSessionKey("agent:myAgent:telegram:123");
      expect(result).toEqual({ agentId: "myAgent", rest: "telegram:123" });
    });

    it("returns null for null/undefined input", () => {
      expect(parseAgentSessionKey(null)).toBeNull();
      expect(parseAgentSessionKey(undefined)).toBeNull();
    });

    it("returns null for empty string", () => {
      expect(parseAgentSessionKey("")).toBeNull();
      expect(parseAgentSessionKey("   ")).toBeNull();
    });

    it("returns null for keys with fewer than 3 parts", () => {
      expect(parseAgentSessionKey("agent:foo")).toBeNull();
      expect(parseAgentSessionKey("agent")).toBeNull();
    });

    it("returns null if prefix is not 'agent'", () => {
      expect(parseAgentSessionKey("session:foo:bar")).toBeNull();
    });

    it("joins remaining parts as rest", () => {
      const result = parseAgentSessionKey("agent:id:a:b:c");
      expect(result).toEqual({ agentId: "id", rest: "a:b:c" });
    });

    it("trims whitespace", () => {
      const result = parseAgentSessionKey("  agent:id:rest  ");
      expect(result).toEqual({ agentId: "id", rest: "rest" });
    });

    it("filters empty parts from split", () => {
      // Double colon results in empty parts that are filtered
      expect(parseAgentSessionKey("agent::rest")).toBeNull();
    });
  });

  describe("isSubagentSessionKey", () => {
    it("returns true for direct subagent prefix", () => {
      expect(isSubagentSessionKey("subagent:abc:123")).toBe(true);
    });

    it("returns true for agent key with subagent rest", () => {
      expect(isSubagentSessionKey("agent:myAgent:subagent:child")).toBe(true);
    });

    it("is case-insensitive", () => {
      expect(isSubagentSessionKey("Subagent:test")).toBe(true);
      expect(isSubagentSessionKey("SUBAGENT:test")).toBe(true);
    });

    it("returns false for non-subagent keys", () => {
      expect(isSubagentSessionKey("telegram:user:123")).toBe(false);
    });

    it("returns false for null/undefined/empty", () => {
      expect(isSubagentSessionKey(null)).toBe(false);
      expect(isSubagentSessionKey(undefined)).toBe(false);
      expect(isSubagentSessionKey("")).toBe(false);
    });
  });

  describe("isAcpSessionKey", () => {
    it("returns true for direct acp prefix", () => {
      expect(isAcpSessionKey("acp:session:data")).toBe(true);
    });

    it("returns true for agent key with acp rest", () => {
      expect(isAcpSessionKey("agent:myAgent:acp:peer")).toBe(true);
    });

    it("is case-insensitive", () => {
      expect(isAcpSessionKey("ACP:test")).toBe(true);
    });

    it("returns false for non-acp keys", () => {
      expect(isAcpSessionKey("telegram:user:123")).toBe(false);
    });

    it("returns false for null/undefined/empty", () => {
      expect(isAcpSessionKey(null)).toBe(false);
      expect(isAcpSessionKey(undefined)).toBe(false);
      expect(isAcpSessionKey("")).toBe(false);
    });
  });

  describe("resolveThreadParentSessionKey", () => {
    it("extracts parent from :thread: marker", () => {
      expect(resolveThreadParentSessionKey("telegram:chat:thread:123")).toBe("telegram:chat");
    });

    it("extracts parent from :topic: marker", () => {
      expect(resolveThreadParentSessionKey("discord:guild:topic:456")).toBe("discord:guild");
    });

    it("uses last occurrence of marker", () => {
      expect(resolveThreadParentSessionKey("a:thread:b:thread:c")).toBe("a:thread:b");
    });

    it("returns null if no marker found", () => {
      expect(resolveThreadParentSessionKey("telegram:user:123")).toBeNull();
    });

    it("returns null if marker at position 0", () => {
      expect(resolveThreadParentSessionKey(":thread:123")).toBeNull();
    });

    it("returns null for null/undefined/empty", () => {
      expect(resolveThreadParentSessionKey(null)).toBeNull();
      expect(resolveThreadParentSessionKey(undefined)).toBeNull();
      expect(resolveThreadParentSessionKey("")).toBeNull();
    });

    it("trims whitespace from the result", () => {
      expect(resolveThreadParentSessionKey("  parent :thread:child")).toBe("parent");
    });
  });
});
