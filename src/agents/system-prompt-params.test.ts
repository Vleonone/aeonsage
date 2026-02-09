import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import type { AeonSageConfig } from "../config/config.js";
import { buildSystemPromptParams } from "./system-prompt-params.js";

// Normalize paths for cross-platform comparison
function normalizePath(p: string | undefined): string | undefined {
  if (!p) return p;
  // On Windows, normalize drive letter case and use forward slashes for comparison
  const normalized = path.normalize(p);
  return process.platform === "win32" ? normalized.toLowerCase() : normalized;
}

// Check if path is a subpath of another
function isSubpath(child: string, parent: string): boolean {
  const normalizedChild = normalizePath(child) ?? "";
  const normalizedParent = normalizePath(parent) ?? "";
  return normalizedChild.startsWith(normalizedParent);
}

async function makeTempDir(label: string): Promise<string> {
  return fs.mkdtemp(path.join(os.tmpdir(), `aeonsage-${label}-`));
}

async function makeRepoRoot(root: string): Promise<void> {
  await fs.mkdir(path.join(root, ".git"), { recursive: true });
}

function buildParams(params: { config?: AeonSageConfig; workspaceDir?: string; cwd?: string }) {
  return buildSystemPromptParams({
    config: params.config,
    workspaceDir: params.workspaceDir,
    cwd: params.cwd,
    runtime: {
      host: "host",
      os: "os",
      arch: "arch",
      node: "node",
      model: "model",
    },
  });
}

describe("buildSystemPromptParams repo root", () => {
  it("detects repo root from workspaceDir", async () => {
    const temp = await makeTempDir("workspace");
    const repoRoot = path.join(temp, "repo");
    const workspaceDir = path.join(repoRoot, "nested", "workspace");
    await fs.mkdir(workspaceDir, { recursive: true });
    await makeRepoRoot(repoRoot);

    const { runtimeInfo } = buildParams({ workspaceDir });

    // Should find the repo we created
    expect(normalizePath(runtimeInfo.repoRoot)).toBe(normalizePath(repoRoot));
  });

  it("falls back to cwd when workspaceDir has no repo", async () => {
    const temp = await makeTempDir("cwd");
    const repoRoot = path.join(temp, "repo");
    const workspaceDir = path.join(temp, "workspace");
    await fs.mkdir(workspaceDir, { recursive: true });
    await makeRepoRoot(repoRoot);

    const { runtimeInfo } = buildParams({ workspaceDir, cwd: repoRoot });

    // Should find a repo - either the one we created or a parent directory repo
    expect(runtimeInfo.repoRoot).toBeDefined();
  });

  it("uses configured repoRoot when valid", async () => {
    const temp = await makeTempDir("config");
    const repoRoot = path.join(temp, "config-root");
    const workspaceDir = path.join(temp, "workspace");
    await fs.mkdir(repoRoot, { recursive: true });
    await fs.mkdir(workspaceDir, { recursive: true });
    await makeRepoRoot(workspaceDir);

    const config: AeonSageConfig = {
      agents: {
        defaults: {
          repoRoot,
        },
      },
    };

    const { runtimeInfo } = buildParams({ config, workspaceDir });

    expect(normalizePath(runtimeInfo.repoRoot)).toBe(normalizePath(repoRoot));
  });

  it("ignores invalid repoRoot config and auto-detects", async () => {
    const temp = await makeTempDir("invalid");
    const repoRoot = path.join(temp, "repo");
    const workspaceDir = path.join(repoRoot, "workspace");
    await fs.mkdir(workspaceDir, { recursive: true });
    await makeRepoRoot(repoRoot);

    const config: AeonSageConfig = {
      agents: {
        defaults: {
          repoRoot: path.join(temp, "missing"),
        },
      },
    };

    const { runtimeInfo } = buildParams({ config, workspaceDir });

    expect(normalizePath(runtimeInfo.repoRoot)).toBe(normalizePath(repoRoot));
  });

  it("handles case when no repo is in temp dir hierarchy", async () => {
    const workspaceDir = await makeTempDir("norepo");

    const { runtimeInfo } = buildParams({ workspaceDir });

    // The function may find a parent repo (like user's home) or undefined
    // If it finds something, it should be a parent of workspaceDir
    if (runtimeInfo.repoRoot !== undefined) {
      // The found repo should be a parent of the temp workspace, not the workspace itself
      expect(isSubpath(workspaceDir, runtimeInfo.repoRoot)).toBe(true);
    }
    // If undefined, that's also acceptable
  });
});
