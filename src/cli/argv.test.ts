import { describe, expect, it } from "vitest";

import {
  buildParseArgv,
  getFlagValue,
  getCommandPath,
  getPrimaryCommand,
  getPositiveIntFlagValue,
  getVerboseFlag,
  hasHelpOrVersion,
  hasFlag,
  shouldMigrateState,
  shouldMigrateStateFromPath,
} from "./argv.js";

describe("argv helpers", () => {
  it("detects help/version flags", () => {
    expect(hasHelpOrVersion(["node", "aeonsage", "--help"])).toBe(true);
    expect(hasHelpOrVersion(["node", "aeonsage", "-V"])).toBe(true);
    expect(hasHelpOrVersion(["node", "aeonsage", "status"])).toBe(false);
  });

  it("extracts command path ignoring flags and terminator", () => {
    expect(getCommandPath(["node", "aeonsage", "status", "--json"], 2)).toEqual(["status"]);
    expect(getCommandPath(["node", "aeonsage", "agents", "list"], 2)).toEqual(["agents", "list"]);
    expect(getCommandPath(["node", "aeonsage", "status", "--", "ignored"], 2)).toEqual(["status"]);
  });

  it("returns primary command", () => {
    expect(getPrimaryCommand(["node", "aeonsage", "agents", "list"])).toBe("agents");
    expect(getPrimaryCommand(["node", "aeonsage"])).toBeNull();
  });

  it("parses boolean flags and ignores terminator", () => {
    expect(hasFlag(["node", "aeonsage", "status", "--json"], "--json")).toBe(true);
    expect(hasFlag(["node", "aeonsage", "--", "--json"], "--json")).toBe(false);
  });

  it("extracts flag values with equals and missing values", () => {
    expect(getFlagValue(["node", "aeonsage", "status", "--timeout", "5000"], "--timeout")).toBe(
      "5000",
    );
    expect(getFlagValue(["node", "aeonsage", "status", "--timeout=2500"], "--timeout")).toBe(
      "2500",
    );
    expect(getFlagValue(["node", "aeonsage", "status", "--timeout"], "--timeout")).toBeNull();
    expect(getFlagValue(["node", "aeonsage", "status", "--timeout", "--json"], "--timeout")).toBe(
      null,
    );
    expect(getFlagValue(["node", "aeonsage", "--", "--timeout=99"], "--timeout")).toBeUndefined();
  });

  it("parses verbose flags", () => {
    expect(getVerboseFlag(["node", "aeonsage", "status", "--verbose"])).toBe(true);
    expect(getVerboseFlag(["node", "aeonsage", "status", "--debug"])).toBe(false);
    expect(getVerboseFlag(["node", "aeonsage", "status", "--debug"], { includeDebug: true })).toBe(
      true,
    );
  });

  it("parses positive integer flag values", () => {
    expect(getPositiveIntFlagValue(["node", "aeonsage", "status"], "--timeout")).toBeUndefined();
    expect(
      getPositiveIntFlagValue(["node", "aeonsage", "status", "--timeout"], "--timeout"),
    ).toBeNull();
    expect(
      getPositiveIntFlagValue(["node", "aeonsage", "status", "--timeout", "5000"], "--timeout"),
    ).toBe(5000);
    expect(
      getPositiveIntFlagValue(["node", "aeonsage", "status", "--timeout", "nope"], "--timeout"),
    ).toBeUndefined();
  });

  it("builds parse argv from raw args", () => {
    const nodeArgv = buildParseArgv({
      programName: "aeonsage",
      rawArgs: ["node", "aeonsage", "status"],
    });
    expect(nodeArgv).toEqual(["node", "aeonsage", "status"]);

    const versionedNodeArgv = buildParseArgv({
      programName: "aeonsage",
      rawArgs: ["node-22", "aeonsage", "status"],
    });
    expect(versionedNodeArgv).toEqual(["node-22", "aeonsage", "status"]);

    const versionedNodeWindowsArgv = buildParseArgv({
      programName: "aeonsage",
      rawArgs: ["node-22.2.0.exe", "aeonsage", "status"],
    });
    expect(versionedNodeWindowsArgv).toEqual(["node-22.2.0.exe", "aeonsage", "status"]);

    const versionedNodePatchlessArgv = buildParseArgv({
      programName: "aeonsage",
      rawArgs: ["node-22.2", "aeonsage", "status"],
    });
    expect(versionedNodePatchlessArgv).toEqual(["node-22.2", "aeonsage", "status"]);

    const versionedNodeWindowsPatchlessArgv = buildParseArgv({
      programName: "aeonsage",
      rawArgs: ["node-22.2.exe", "aeonsage", "status"],
    });
    expect(versionedNodeWindowsPatchlessArgv).toEqual(["node-22.2.exe", "aeonsage", "status"]);

    const versionedNodeWithPathArgv = buildParseArgv({
      programName: "aeonsage",
      rawArgs: ["/usr/bin/node-22.2.0", "aeonsage", "status"],
    });
    expect(versionedNodeWithPathArgv).toEqual(["/usr/bin/node-22.2.0", "aeonsage", "status"]);

    const nodejsArgv = buildParseArgv({
      programName: "aeonsage",
      rawArgs: ["nodejs", "aeonsage", "status"],
    });
    expect(nodejsArgv).toEqual(["nodejs", "aeonsage", "status"]);

    const nonVersionedNodeArgv = buildParseArgv({
      programName: "aeonsage",
      rawArgs: ["node-dev", "aeonsage", "status"],
    });
    expect(nonVersionedNodeArgv).toEqual(["node", "aeonsage", "node-dev", "aeonsage", "status"]);

    const directArgv = buildParseArgv({
      programName: "aeonsage",
      rawArgs: ["aeonsage", "status"],
    });
    expect(directArgv).toEqual(["node", "aeonsage", "status"]);

    const bunArgv = buildParseArgv({
      programName: "aeonsage",
      rawArgs: ["bun", "src/entry.ts", "status"],
    });
    expect(bunArgv).toEqual(["bun", "src/entry.ts", "status"]);
  });

  it("builds parse argv from fallback args", () => {
    const fallbackArgv = buildParseArgv({
      programName: "aeonsage",
      fallbackArgv: ["status"],
    });
    expect(fallbackArgv).toEqual(["node", "aeonsage", "status"]);
  });

  it("decides when to migrate state", () => {
    expect(shouldMigrateState(["node", "aeonsage", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "aeonsage", "health"])).toBe(false);
    expect(shouldMigrateState(["node", "aeonsage", "sessions"])).toBe(false);
    expect(shouldMigrateState(["node", "aeonsage", "memory", "status"])).toBe(false);
    expect(shouldMigrateState(["node", "aeonsage", "agent", "--message", "hi"])).toBe(false);
    expect(shouldMigrateState(["node", "aeonsage", "agents", "list"])).toBe(true);
    expect(shouldMigrateState(["node", "aeonsage", "message", "send"])).toBe(true);
  });

  it("reuses command path for migrate state decisions", () => {
    expect(shouldMigrateStateFromPath(["status"])).toBe(false);
    expect(shouldMigrateStateFromPath(["agents", "list"])).toBe(true);
  });
});
