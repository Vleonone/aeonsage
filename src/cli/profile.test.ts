import path from "node:path";
import { describe, expect, it } from "vitest";
import { formatCliCommand } from "./command-format.js";
import { applyCliProfileEnv, parseCliProfileArgs } from "./profile.js";

describe("parseCliProfileArgs", () => {
  it("leaves gateway --dev for subcommands", () => {
    const res = parseCliProfileArgs([
      "node",
      "aeonsage",
      "gateway",
      "--dev",
      "--allow-unconfigured",
    ]);
    if (!res.ok) throw new Error(res.error);
    expect(res.profile).toBeNull();
    expect(res.argv).toEqual(["node", "aeonsage", "gateway", "--dev", "--allow-unconfigured"]);
  });

  it("still accepts global --dev before subcommand", () => {
    const res = parseCliProfileArgs(["node", "aeonsage", "--dev", "gateway"]);
    if (!res.ok) throw new Error(res.error);
    expect(res.profile).toBe("dev");
    expect(res.argv).toEqual(["node", "aeonsage", "gateway"]);
  });

  it("parses --profile value and strips it", () => {
    const res = parseCliProfileArgs(["node", "aeonsage", "--profile", "work", "status"]);
    if (!res.ok) throw new Error(res.error);
    expect(res.profile).toBe("work");
    expect(res.argv).toEqual(["node", "aeonsage", "status"]);
  });

  it("rejects missing profile value", () => {
    const res = parseCliProfileArgs(["node", "aeonsage", "--profile"]);
    expect(res.ok).toBe(false);
  });

  it("rejects combining --dev with --profile (dev first)", () => {
    const res = parseCliProfileArgs(["node", "aeonsage", "--dev", "--profile", "work", "status"]);
    expect(res.ok).toBe(false);
  });

  it("rejects combining --dev with --profile (profile first)", () => {
    const res = parseCliProfileArgs(["node", "aeonsage", "--profile", "work", "--dev", "status"]);
    expect(res.ok).toBe(false);
  });
});

describe("applyCliProfileEnv", () => {
  it("fills env defaults for dev profile", () => {
    const env: Record<string, string | undefined> = {};
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    const expectedStateDir = path.join("/home/peter", ".aeonsage-dev");
    expect(env.AEONSAGE_PROFILE).toBe("dev");
    expect(env.AEONSAGE_STATE_DIR).toBe(expectedStateDir);
    expect(env.AEONSAGE_CONFIG_PATH).toBe(path.join(expectedStateDir, "aeonsage.json"));
    expect(env.AEONSAGE_GATEWAY_PORT).toBe("19001");
  });

  it("does not override explicit env values", () => {
    const env: Record<string, string | undefined> = {
      AEONSAGE_STATE_DIR: "/custom",
      AEONSAGE_GATEWAY_PORT: "19099",
    };
    applyCliProfileEnv({
      profile: "dev",
      env,
      homedir: () => "/home/peter",
    });
    expect(env.AEONSAGE_STATE_DIR).toBe("/custom");
    expect(env.AEONSAGE_GATEWAY_PORT).toBe("19099");
    expect(env.AEONSAGE_CONFIG_PATH).toBe(path.join("/custom", "aeonsage.json"));
  });
});

describe("formatCliCommand", () => {
  it("returns command unchanged when no profile is set", () => {
    expect(formatCliCommand("aeonsage doctor --fix", {})).toBe("aeonsage doctor --fix");
  });

  it("returns command unchanged when profile is default", () => {
    expect(formatCliCommand("aeonsage doctor --fix", { AEONSAGE_PROFILE: "default" })).toBe(
      "aeonsage doctor --fix",
    );
  });

  it("returns command unchanged when profile is Default (case-insensitive)", () => {
    expect(formatCliCommand("aeonsage doctor --fix", { AEONSAGE_PROFILE: "Default" })).toBe(
      "aeonsage doctor --fix",
    );
  });

  it("returns command unchanged when profile is invalid", () => {
    expect(formatCliCommand("aeonsage doctor --fix", { AEONSAGE_PROFILE: "bad profile" })).toBe(
      "aeonsage doctor --fix",
    );
  });

  it("returns command unchanged when --profile is already present", () => {
    expect(
      formatCliCommand("aeonsage --profile work doctor --fix", { AEONSAGE_PROFILE: "work" }),
    ).toBe("aeonsage --profile work doctor --fix");
  });

  it("returns command unchanged when --dev is already present", () => {
    expect(formatCliCommand("aeonsage --dev doctor", { AEONSAGE_PROFILE: "dev" })).toBe(
      "aeonsage --dev doctor",
    );
  });

  it("inserts --profile flag when profile is set", () => {
    expect(formatCliCommand("aeonsage doctor --fix", { AEONSAGE_PROFILE: "work" })).toBe(
      "aeonsage --profile work doctor --fix",
    );
  });

  it("trims whitespace from profile", () => {
    expect(formatCliCommand("aeonsage doctor --fix", { AEONSAGE_PROFILE: "  jbaeonsage  " })).toBe(
      "aeonsage --profile jbaeonsage doctor --fix",
    );
  });

  it("handles command with no args after aeonsage", () => {
    expect(formatCliCommand("aeonsage", { AEONSAGE_PROFILE: "test" })).toBe(
      "aeonsage --profile test",
    );
  });

  it("handles pnpm wrapper", () => {
    expect(formatCliCommand("pnpm aeonsage doctor", { AEONSAGE_PROFILE: "work" })).toBe(
      "pnpm aeonsage --profile work doctor",
    );
  });
});
