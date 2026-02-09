import { afterEach, describe, expect, it, vi } from "vitest";

import {
  validateCommandName,
  registerPluginCommand,
  clearPluginCommands,
  clearPluginCommandsForPlugin,
  matchPluginCommand,
  executePluginCommand,
  listPluginCommands,
  getPluginCommandSpecs,
} from "./commands.js";
import type { AeonSageConfig } from "../config/config.js";

vi.mock("../globals.js", () => ({
  logVerbose: vi.fn(),
}));

// Clean up after each test so registrations don't leak
afterEach(() => {
  clearPluginCommands();
});

describe("plugins/commands", () => {
  describe("validateCommandName", () => {
    it("accepts valid command names", () => {
      expect(validateCommandName("ping")).toBeNull();
      expect(validateCommandName("my-cmd")).toBeNull();
      expect(validateCommandName("cmd_123")).toBeNull();
    });

    it("rejects empty names", () => {
      expect(validateCommandName("")).toEqual(expect.stringContaining("cannot be empty"));
      expect(validateCommandName("   ")).toEqual(expect.stringContaining("cannot be empty"));
    });

    it("rejects names starting with non-letter", () => {
      expect(validateCommandName("1cmd")).toEqual(
        expect.stringContaining("must start with a letter"),
      );
      expect(validateCommandName("-cmd")).toEqual(
        expect.stringContaining("must start with a letter"),
      );
    });

    it("rejects names with invalid characters", () => {
      expect(validateCommandName("cmd!")).toEqual(
        expect.stringContaining("must start with a letter"),
      );
      expect(validateCommandName("my cmd")).toEqual(
        expect.stringContaining("must start with a letter"),
      );
    });

    it("rejects reserved command names", () => {
      expect(validateCommandName("help")).toEqual(expect.stringContaining("reserved"));
      expect(validateCommandName("status")).toEqual(expect.stringContaining("reserved"));
      expect(validateCommandName("config")).toEqual(expect.stringContaining("reserved"));
      expect(validateCommandName("bash")).toEqual(expect.stringContaining("reserved"));
      expect(validateCommandName("exec")).toEqual(expect.stringContaining("reserved"));
      expect(validateCommandName("model")).toEqual(expect.stringContaining("reserved"));
    });

    it("is case-insensitive for reserved names", () => {
      expect(validateCommandName("HELP")).toEqual(expect.stringContaining("reserved"));
      expect(validateCommandName("Status")).toEqual(expect.stringContaining("reserved"));
    });
  });

  describe("registerPluginCommand", () => {
    it("registers a valid command", () => {
      const result = registerPluginCommand("test-plugin", {
        name: "greet",
        description: "Say hello",
        handler: async () => ({ text: "Hello!" }),
      });
      expect(result.ok).toBe(true);
    });

    it("rejects handler that is not a function", () => {
      const result = registerPluginCommand("test-plugin", {
        name: "bad",
        description: "Bad command",
        handler: "not a function" as unknown as () => Promise<{ text: string }>,
      });
      expect(result.ok).toBe(false);
      expect(result.error).toContain("function");
    });

    it("rejects invalid command names", () => {
      const result = registerPluginCommand("test-plugin", {
        name: "help",
        description: "Override help",
        handler: async () => ({ text: "nope" }),
      });
      expect(result.ok).toBe(false);
      expect(result.error).toContain("reserved");
    });

    it("rejects duplicate command registration", () => {
      registerPluginCommand("plugin-a", {
        name: "ping",
        description: "Ping",
        handler: async () => ({ text: "pong" }),
      });
      const result = registerPluginCommand("plugin-b", {
        name: "ping",
        description: "Ping again",
        handler: async () => ({ text: "pong2" }),
      });
      expect(result.ok).toBe(false);
      expect(result.error).toContain("already registered");
    });
  });

  describe("clearPluginCommands", () => {
    it("removes all registered commands", () => {
      registerPluginCommand("p1", {
        name: "cmd",
        description: "test",
        handler: async () => ({ text: "" }),
      });
      expect(listPluginCommands()).toHaveLength(1);
      clearPluginCommands();
      expect(listPluginCommands()).toHaveLength(0);
    });
  });

  describe("clearPluginCommandsForPlugin", () => {
    it("removes only commands for specified plugin", () => {
      registerPluginCommand("p1", {
        name: "cmda",
        description: "A",
        handler: async () => ({ text: "" }),
      });
      registerPluginCommand("p2", {
        name: "cmdb",
        description: "B",
        handler: async () => ({ text: "" }),
      });
      clearPluginCommandsForPlugin("p1");
      const remaining = listPluginCommands();
      expect(remaining).toHaveLength(1);
      expect(remaining[0].pluginId).toBe("p2");
    });
  });

  describe("matchPluginCommand", () => {
    it("matches a registered command", () => {
      registerPluginCommand("p1", {
        name: "ping",
        description: "Ping",
        acceptsArgs: true,
        handler: async () => ({ text: "pong" }),
      });
      const match = matchPluginCommand("/ping hello");
      expect(match).not.toBeNull();
      expect(match!.command.name).toBe("ping");
      expect(match!.args).toBe("hello");
    });

    it("returns null for unregistered commands", () => {
      expect(matchPluginCommand("/unknown")).toBeNull();
    });

    it("returns null for non-slash messages", () => {
      expect(matchPluginCommand("not a command")).toBeNull();
    });

    it("does not match command with args when acceptsArgs is false", () => {
      registerPluginCommand("p1", {
        name: "nope",
        description: "No args",
        acceptsArgs: false,
        handler: async () => ({ text: "" }),
      });
      expect(matchPluginCommand("/nope some args")).toBeNull();
    });

    it("matches command without args even when acceptsArgs is false", () => {
      registerPluginCommand("p1", {
        name: "simple",
        description: "Simple",
        handler: async () => ({ text: "ok" }),
      });
      const match = matchPluginCommand("/simple");
      expect(match).not.toBeNull();
      expect(match!.args).toBeUndefined();
    });

    it("is case-insensitive for matching", () => {
      registerPluginCommand("p1", {
        name: "greet",
        description: "Greet",
        handler: async () => ({ text: "hi" }),
      });
      expect(matchPluginCommand("/GREET")).not.toBeNull();
    });
  });

  describe("executePluginCommand", () => {
    const mockConfig = {} as AeonSageConfig;

    it("executes command handler and returns result", async () => {
      const cmd = {
        name: "test",
        description: "Test",
        pluginId: "p1",
        handler: async () => ({ text: "success" }),
      };
      const result = await executePluginCommand({
        command: cmd,
        channel: "telegram",
        isAuthorizedSender: true,
        commandBody: "/test",
        config: mockConfig,
      });
      expect(result.text).toBe("success");
    });

    it("blocks unauthorized sender by default", async () => {
      const cmd = {
        name: "secret",
        description: "Secret",
        pluginId: "p1",
        handler: async () => ({ text: "should not see" }),
      };
      const result = await executePluginCommand({
        command: cmd,
        channel: "telegram",
        isAuthorizedSender: false,
        commandBody: "/secret",
        config: mockConfig,
      });
      expect(result.text).toContain("authorization");
    });

    it("allows unauthorized sender when requireAuth is false", async () => {
      const cmd = {
        name: "public",
        description: "Public",
        pluginId: "p1",
        requireAuth: false,
        handler: async () => ({ text: "open" }),
      };
      const result = await executePluginCommand({
        command: cmd,
        channel: "telegram",
        isAuthorizedSender: false,
        commandBody: "/public",
        config: mockConfig,
      });
      expect(result.text).toBe("open");
    });

    it("returns safe error message when handler throws", async () => {
      const cmd = {
        name: "broken",
        description: "Broken",
        pluginId: "p1",
        handler: async () => {
          throw new Error("internal failure");
        },
      };
      const result = await executePluginCommand({
        command: cmd,
        channel: "telegram",
        isAuthorizedSender: true,
        commandBody: "/broken",
        config: mockConfig,
      });
      expect(result.text).toContain("failed");
      expect(result.text).not.toContain("internal failure");
    });

    it("passes sanitized args to handler", async () => {
      let receivedArgs: string | undefined;
      const cmd = {
        name: "echo",
        description: "Echo",
        pluginId: "p1",
        handler: async (ctx: { args?: string }) => {
          receivedArgs = ctx.args;
          return { text: "ok" };
        },
      };
      await executePluginCommand({
        command: cmd,
        args: "hello\x00world",
        channel: "telegram",
        isAuthorizedSender: true,
        commandBody: "/echo hello\x00world",
        config: mockConfig,
      });
      // Control character \x00 should be removed
      expect(receivedArgs).toBe("helloworld");
    });
  });

  describe("listPluginCommands", () => {
    it("lists all registered commands", () => {
      registerPluginCommand("p1", {
        name: "cmda",
        description: "Command A",
        handler: async () => ({ text: "" }),
      });
      registerPluginCommand("p2", {
        name: "cmdb",
        description: "Command B",
        handler: async () => ({ text: "" }),
      });
      const list = listPluginCommands();
      expect(list).toHaveLength(2);
      expect(list).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ name: "cmda", pluginId: "p1" }),
          expect.objectContaining({ name: "cmdb", pluginId: "p2" }),
        ]),
      );
    });
  });

  describe("getPluginCommandSpecs", () => {
    it("returns name and description without pluginId", () => {
      registerPluginCommand("p1", {
        name: "spec",
        description: "Spec desc",
        handler: async () => ({ text: "" }),
      });
      const specs = getPluginCommandSpecs();
      expect(specs).toEqual([{ name: "spec", description: "Spec desc" }]);
    });
  });
});
