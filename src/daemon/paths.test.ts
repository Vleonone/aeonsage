import path from "node:path";

import { describe, expect, it } from "vitest";

import { resolveGatewayStateDir } from "./paths.js";

describe("resolveGatewayStateDir", () => {
  it("uses the default state dir when no overrides are set", () => {
    const env = { HOME: "/Users/test" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".aeonsage"));
  });

  it("appends the profile suffix when set", () => {
    const env = { HOME: "/Users/test", AEONSAGE_PROFILE: "rescue" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".aeonsage-rescue"));
  });

  it("treats default profiles as the base state dir", () => {
    const env = { HOME: "/Users/test", AEONSAGE_PROFILE: "Default" };
    expect(resolveGatewayStateDir(env)).toBe(path.join("/Users/test", ".aeonsage"));
  });

  it("uses AEONSAGE_STATE_DIR when provided", () => {
    const env = { HOME: "/Users/test", AEONSAGE_STATE_DIR: "/var/lib/aeonsage" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/var/lib/aeonsage"));
  });

  it("expands ~ in AEONSAGE_STATE_DIR", () => {
    const env = { HOME: "/Users/test", AEONSAGE_STATE_DIR: "~/aeonsage-state" };
    expect(resolveGatewayStateDir(env)).toBe(path.resolve("/Users/test/aeonsage-state"));
  });

  it("preserves Windows absolute paths without HOME", () => {
    const env = { AEONSAGE_STATE_DIR: "C:\\State\\aeonsage" };
    expect(resolveGatewayStateDir(env)).toBe("C:\\State\\aeonsage");
  });
});
