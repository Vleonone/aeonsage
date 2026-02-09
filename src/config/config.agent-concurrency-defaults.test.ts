import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { withTempHome } from "./test-helpers.js";

// Global mock: Always be Enterprise for these logic tests
vi.mock("./capabilities.js", () => ({
  getCapabilities: async () => ({
    type: "pro_enterprise",
    features: { maxWorkers: 999 },
    message: "Mock Enterprise"
  }),
  LicenseType: { OPEN_SOURCE: "oss" }
}));

describe("agent concurrency defaults", () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it("resolves defaults when unset", async () => {
    const {
      DEFAULT_AGENT_MAX_CONCURRENT,
      DEFAULT_SUBAGENT_MAX_CONCURRENT,
      resolveAgentMaxConcurrent,
      resolveSubagentMaxConcurrent,
    } = await import("./agent-limits.js");

    expect(await resolveAgentMaxConcurrent({})).toBe(DEFAULT_AGENT_MAX_CONCURRENT);
    expect(await resolveSubagentMaxConcurrent({})).toBe(DEFAULT_SUBAGENT_MAX_CONCURRENT);
  });

  it("resolves configured values", async () => {
    const { resolveAgentMaxConcurrent, resolveSubagentMaxConcurrent } = await import("./agent-limits.js");

    const cfg = {
      agents: {
        defaults: {
          maxConcurrent: 6,
          subagents: { maxConcurrent: 9 },
        },
      },
    };
    expect(await resolveAgentMaxConcurrent(cfg)).toBe(6);
    expect(await resolveSubagentMaxConcurrent(cfg)).toBe(9);
  });

  it("clamps invalid values to at least 1", async () => {
    const { resolveAgentMaxConcurrent, resolveSubagentMaxConcurrent } = await import("./agent-limits.js");

    const cfg = {
      agents: {
        defaults: {
          maxConcurrent: 0,
          subagents: { maxConcurrent: -3 },
        },
      },
    };
    expect(await resolveAgentMaxConcurrent(cfg)).toBe(1);
    expect(await resolveSubagentMaxConcurrent(cfg)).toBe(1);
  });

  it("injects defaults on load", async () => {
    const {
      DEFAULT_AGENT_MAX_CONCURRENT,
      DEFAULT_SUBAGENT_MAX_CONCURRENT,
    } = await import("./agent-limits.js");

    await withTempHome(async (home) => {
      const configDir = path.join(home, ".aeonsage");
      await fs.mkdir(configDir, { recursive: true });
      await fs.writeFile(
        path.join(configDir, "aeonsage.json"),
        JSON.stringify({}, null, 2),
        "utf-8",
      );

      const { loadConfig } = await import("./config.js");
      const cfg = loadConfig();

      expect(cfg.agents?.defaults?.maxConcurrent).toBe(DEFAULT_AGENT_MAX_CONCURRENT);
      expect(cfg.agents?.defaults?.subagents?.maxConcurrent).toBe(DEFAULT_SUBAGENT_MAX_CONCURRENT);
    });
  });
});
