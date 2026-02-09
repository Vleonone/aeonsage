import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { detectLegacyWorkspaceDirs } from "./doctor-workspace.js";

const isWin = os.platform() === "win32";

describe("detectLegacyWorkspaceDirs", () => {
  it("ignores ~/aeonsage when it doesn't look like a workspace (e.g. install dir)", () => {
    const home = isWin ? "C:\\Users\\user" : "/home/user";
    const workspaceDir = path.join(home, "aeonsage");
    const candidate = path.join(home, "aeonsage");

    const detection = detectLegacyWorkspaceDirs({
      workspaceDir,
      homedir: () => home,
      exists: (value) => value === candidate,
    });

    expect(detection.activeWorkspace).toBe(path.resolve(workspaceDir));
    expect(detection.legacyDirs).toEqual([]);
  });

  it("flags ~/aeonsage when it contains workspace markers", () => {
    const home = isWin ? "C:\\Users\\user" : "/home/user";
    const workspaceDir = path.join(home, "aeonsage");
    const candidate = path.join(home, "aeonsage");
    const agentsPath = path.join(candidate, "AGENTS.md");

    const detection = detectLegacyWorkspaceDirs({
      workspaceDir,
      homedir: () => home,
      exists: (value) => value === candidate || value === agentsPath,
    });

    expect(detection.legacyDirs).toEqual([candidate]);
  });
});
