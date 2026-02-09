/**
 * AeonSage Doctor - Enhanced Common Issues Detection & Auto-Fix
 *
 * This module provides additional diagnostic checks for common issues
 * that users frequently encounter, with auto-fix capabilities.
 *
 */

import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import type { AeonSageConfig } from "../config/config.js";
import { note } from "../terminal/note.js";
import { formatCliCommand } from "../cli/command-format.js";
import { theme } from "../terminal/theme.js";
import { cliT, detectCliLocale, type CliLocale } from "../cli/cli-i18n.js";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface DiagnosticResult {
  id: string;
  category: "critical" | "warning" | "info";
  title: string;
  description: string;
  autoFixable: boolean;
  fix?: () => Promise<FixResult>;
}

export interface FixResult {
  success: boolean;
  message: string;
}

export interface EnhancedDoctorOptions {
  locale?: CliLocale;
  autoFix?: boolean;
  verbose?: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Diagnostic Checks
// ═══════════════════════════════════════════════════════════════

/**
 * Check for excessive node_modules size (> 500MB)
 */
async function checkNodeModulesSize(rootDir: string): Promise<DiagnosticResult | null> {
  const nodeModulesPath = path.join(rootDir, "node_modules");
  if (!fs.existsSync(nodeModulesPath)) return null;

  try {
    const stats = await getDirectorySize(nodeModulesPath);
    const sizeMB = stats / (1024 * 1024);

    if (sizeMB > 500) {
      return {
        id: "node-modules-size",
        category: "warning",
        title: "Large node_modules",
        description: `node_modules is ${sizeMB.toFixed(0)}MB. Consider running "pnpm store prune" to reduce disk usage.`,
        autoFixable: false,
      };
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Check for orphaned lock files
 */
async function checkOrphanedLockFiles(rootDir: string): Promise<DiagnosticResult | null> {
  const lockFiles = ["package-lock.json", "yarn.lock"];
  const orphanedFiles: string[] = [];

  // If using pnpm, other lock files may be orphaned
  if (fs.existsSync(path.join(rootDir, "pnpm-lock.yaml"))) {
    for (const lockFile of lockFiles) {
      const lockPath = path.join(rootDir, lockFile);
      if (fs.existsSync(lockPath)) {
        orphanedFiles.push(lockFile);
      }
    }
  }

  if (orphanedFiles.length > 0) {
    return {
      id: "orphaned-lock-files",
      category: "info",
      title: "Orphaned lock files",
      description: `Found ${orphanedFiles.join(", ")} while using pnpm. These can be safely removed.`,
      autoFixable: true,
      fix: async () => {
        try {
          for (const file of orphanedFiles) {
            fs.unlinkSync(path.join(rootDir, file));
          }
          return { success: true, message: `Removed: ${orphanedFiles.join(", ")}` };
        } catch (e) {
          return {
            success: false,
            message: `Failed to remove files: ${e instanceof Error ? e.message : String(e)}`,
          };
        }
      },
    };
  }
  return null;
}

/**
 * Check for .env file security issues
 */
async function checkEnvFileSecurity(rootDir: string): Promise<DiagnosticResult | null> {
  const envPath = path.join(rootDir, ".env");
  if (!fs.existsSync(envPath)) return null;

  try {
    const content = fs.readFileSync(envPath, "utf-8");
    const issues: string[] = [];

    // Check for hardcoded secrets that look like real tokens
    if (/sk-[a-zA-Z0-9_-]{32,}/.test(content)) {
      issues.push("OpenAI API key found");
    }
    if (/sk-or-v1-[a-zA-Z0-9]{64}/.test(content)) {
      issues.push("OpenRouter API key found");
    }
    if (/ghp_[a-zA-Z0-9]{36}/.test(content)) {
      issues.push("GitHub token found");
    }

    // Check if .env is in .gitignore
    const gitignorePath = path.join(rootDir, ".gitignore");
    const gitignoreContent = fs.existsSync(gitignorePath)
      ? fs.readFileSync(gitignorePath, "utf-8")
      : "";

    if (!gitignoreContent.includes(".env")) {
      issues.push(".env not in .gitignore");
    }

    if (issues.length > 0) {
      return {
        id: "env-security",
        category: issues.includes(".env not in .gitignore") ? "critical" : "warning",
        title: "Environment file security",
        description: issues.join("; "),
        autoFixable: issues.includes(".env not in .gitignore"),
        fix: async () => {
          try {
            const currentContent = fs.existsSync(gitignorePath)
              ? fs.readFileSync(gitignorePath, "utf-8")
              : "";
            if (!currentContent.includes(".env")) {
              fs.appendFileSync(
                gitignorePath,
                "\n# Environment files\n.env\n.env.local\n.env.*.local\n",
              );
              return { success: true, message: "Added .env to .gitignore" };
            }
            return { success: true, message: ".env already in .gitignore" };
          } catch (e) {
            return {
              success: false,
              message: `Failed: ${e instanceof Error ? e.message : String(e)}`,
            };
          }
        },
      };
    }
  } catch {
    // Ignore read errors
  }
  return null;
}

/**
 * Check for disk space issues
 */
async function checkDiskSpace(): Promise<DiagnosticResult | null> {
  try {
    const _homeDir = os.homedir();
    // Use a simple heuristic - check if temp directory has space
    const tempDir = os.tmpdir();
    const stats = fs.statfsSync(tempDir);
    const freeGB = (stats.bfree * stats.bsize) / (1024 * 1024 * 1024);

    if (freeGB < 1) {
      return {
        id: "low-disk-space",
        category: "critical",
        title: "Low disk space",
        description: `Only ${freeGB.toFixed(2)}GB free on disk. AeonSage may not function properly.`,
        autoFixable: false,
      };
    } else if (freeGB < 5) {
      return {
        id: "low-disk-space-warning",
        category: "warning",
        title: "Disk space warning",
        description: `${freeGB.toFixed(1)}GB free on disk. Consider freeing up space.`,
        autoFixable: false,
      };
    }
  } catch {
    // statfsSync not available on all platforms
  }
  return null;
}

/**
 * Check for stale session files (older than 30 days)
 */
async function checkStaleSessions(_cfg: AeonSageConfig): Promise<DiagnosticResult | null> {
  // Default sessions directory (cfg doesn't have state property, use default)
  const stateDir = path.join(os.homedir(), ".aeonsage", "state");
  const sessionsDir = path.join(stateDir, "sessions");

  if (!fs.existsSync(sessionsDir)) return null;

  try {
    const files = fs.readdirSync(sessionsDir);
    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    let staleCount = 0;
    let totalSizeMB = 0;

    for (const file of files) {
      const filePath = path.join(sessionsDir, file);
      const stats = fs.statSync(filePath);
      if (stats.mtimeMs < thirtyDaysAgo) {
        staleCount++;
        totalSizeMB += stats.size / (1024 * 1024);
      }
    }

    if (staleCount > 10 && totalSizeMB > 10) {
      return {
        id: "stale-sessions",
        category: "info",
        title: "Stale session files",
        description: `${staleCount} session files older than 30 days (${totalSizeMB.toFixed(1)}MB). Consider cleanup.`,
        autoFixable: true,
        fix: async () => {
          let cleaned = 0;
          for (const file of files) {
            const filePath = path.join(sessionsDir, file);
            const stats = fs.statSync(filePath);
            if (stats.mtimeMs < thirtyDaysAgo) {
              try {
                fs.unlinkSync(filePath);
                cleaned++;
              } catch {
                // Continue on error
              }
            }
          }
          return { success: true, message: `Cleaned ${cleaned} stale session files.` };
        },
      };
    }
  } catch {
    // Ignore errors
  }
  return null;
}

/**
 * Check for corrupted config backup files
 */
async function checkConfigBackups(_rootDir: string): Promise<DiagnosticResult | null> {
  const configDir = path.join(os.homedir(), ".aeonsage");
  if (!fs.existsSync(configDir)) return null;

  try {
    const files = fs.readdirSync(configDir);
    const backupFiles = files.filter((f) => f.endsWith(".bak") || f.includes(".backup"));

    if (backupFiles.length > 10) {
      let totalSize = 0;
      for (const file of backupFiles) {
        try {
          totalSize += fs.statSync(path.join(configDir, file)).size;
        } catch {
          // Ignore
        }
      }
      const sizeMB = totalSize / (1024 * 1024);

      return {
        id: "excess-backups",
        category: "info",
        title: "Excess backup files",
        description: `${backupFiles.length} backup files found (${sizeMB.toFixed(1)}MB). Consider cleanup.`,
        autoFixable: true,
        fix: async () => {
          // Keep the 5 most recent, delete the rest
          const sorted = backupFiles
            .map((f) => ({
              name: f,
              mtime: fs.statSync(path.join(configDir, f)).mtimeMs,
            }))
            .sort((a, b) => b.mtime - a.mtime);

          let deleted = 0;
          for (const file of sorted.slice(5)) {
            try {
              fs.unlinkSync(path.join(configDir, file.name));
              deleted++;
            } catch {
              // Continue
            }
          }
          return { success: true, message: `Removed ${deleted} old backup files.` };
        },
      };
    }
  } catch {
    // Ignore
  }
  return null;
}

/**
 * Check Node.js version compatibility
 */
async function checkNodeVersion(): Promise<DiagnosticResult | null> {
  const nodeVersion = process.versions.node;
  const major = parseInt(nodeVersion.split(".")[0], 10);

  if (major < 18) {
    return {
      id: "node-version-old",
      category: "critical",
      title: "Node.js version too old",
      description: `Node.js ${nodeVersion} is not supported. Please upgrade to Node.js 18 or later.`,
      autoFixable: false,
    };
  } else if (major < 20) {
    return {
      id: "node-version-legacy",
      category: "info",
      title: "Node.js version",
      description: `Node.js ${nodeVersion} is supported but consider upgrading to Node.js 20+ for best performance.`,
      autoFixable: false,
    };
  }
  return null;
}

/**
 * Check GPU availability for local inference
 */
async function checkGpuAvailability(): Promise<DiagnosticResult | null> {
  // Check for NVIDIA GPU via nvidia-smi
  const isWindows = os.platform() === "win32";
  const nvidiaPath = isWindows ? "C:\\Windows\\System32\\nvidia-smi.exe" : "/usr/bin/nvidia-smi";

  const hasNvidia = fs.existsSync(nvidiaPath);

  // Check for Apple Silicon (M1/M2/M3)
  const isAppleSilicon = os.platform() === "darwin" && os.arch() === "arm64";

  if (hasNvidia) {
    return {
      id: "gpu-nvidia-available",
      category: "info",
      title: "NVIDIA GPU detected",
      description:
        "NVIDIA GPU available for local inference. Configure Colab/Vast.ai integration for remote GPU access.",
      autoFixable: false,
    };
  } else if (isAppleSilicon) {
    return {
      id: "gpu-apple-silicon",
      category: "info",
      title: "Apple Silicon detected",
      description:
        "Apple Silicon GPU available. MLX and Metal acceleration supported for local inference.",
      autoFixable: false,
    };
  }

  return {
    id: "gpu-not-available",
    category: "info",
    title: "No local GPU detected",
    description:
      "No local GPU available. Consider Colab GPU integration for accelerated inference.",
    autoFixable: false,
  };
}

/**
 * Check platform compatibility
 */
async function checkPlatformCompatibility(): Promise<DiagnosticResult | null> {
  const platform = os.platform();
  const release = os.release();

  if (platform === "win32") {
    // Check Windows version
    const version = parseInt(release.split(".")[0], 10);
    if (version < 10) {
      return {
        id: "platform-windows-old",
        category: "warning",
        title: "Windows version",
        description: `Windows ${release} may have limited compatibility. Windows 10+ recommended.`,
        autoFixable: false,
      };
    }
  }

  return null;
}

/**
 * Check if VDID is configured
 */
async function checkVDIDReady(cfg: AeonSageConfig): Promise<DiagnosticResult | null> {
  const vdid = (cfg as any).vdid;
  if (!vdid?.enabled) {
    return {
      id: "vdid-disabled",
      category: "info",
      title: "VDID not enabled",
      description:
        "Sovereign identity (VDID) is disabled. Enable to unlock advanced network features.",
      autoFixable: false,
    };
  }
  return null;
}

/**
 * Check if UI assets are built
 */
async function checkUIAssets(rootDir: string): Promise<DiagnosticResult | null> {
  const uiDist = path.join(rootDir, "ui", "dist");
  if (!fs.existsSync(uiDist)) {
    return {
      id: "ui-assets-missing",
      category: "warning",
      title: "UI Assets Missing",
      description:
        "UI build artifacts not found in ui/dist. Dashboard may not load. Run 'pnpm build:ui'.",
      autoFixable: false,
    };
  }
  return null;
}

// ═══════════════════════════════════════════════════════════════
// Helpers
// ═══════════════════════════════════════════════════════════════

async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  const walkDir = (dir: string) => {
    try {
      const files = fs.readdirSync(dir);
      for (const file of files.slice(0, 1000)) {
        // Limit for performance
        const filePath = path.join(dir, file);
        try {
          const stats = fs.lstatSync(filePath);
          if (stats.isFile()) {
            totalSize += stats.size;
          } else if (stats.isDirectory() && !stats.isSymbolicLink()) {
            walkDir(filePath);
          }
        } catch {
          // Ignore permission errors
        }
      }
    } catch {
      // Ignore errors
    }
  };

  walkDir(dirPath);
  return totalSize;
}

// ═══════════════════════════════════════════════════════════════
// Main API
// ═══════════════════════════════════════════════════════════════

/**
 * Run enhanced diagnostic checks
 */
export async function runEnhancedDiagnostics(
  cfg: AeonSageConfig,
  rootDir: string,
  _options: EnhancedDoctorOptions = {},
): Promise<DiagnosticResult[]> {
  const results: DiagnosticResult[] = [];

  // Run all checks
  const checks = await Promise.all([
    checkNodeVersion(),
    checkDiskSpace(),
    checkNodeModulesSize(rootDir),
    checkOrphanedLockFiles(rootDir),
    checkEnvFileSecurity(rootDir),
    checkStaleSessions(cfg),
    checkConfigBackups(rootDir),
    checkGpuAvailability(),
    checkPlatformCompatibility(),
    checkVDIDReady(cfg), // Added VDID check
    checkUIAssets(rootDir), // Added UI assets check
  ]);

  for (const result of checks) {
    if (result) {
      results.push(result);
    }
  }

  return results;
}

/**
 * Print diagnostic results in a formatted way
 */
export function printDiagnosticResults(
  results: DiagnosticResult[],
  options: EnhancedDoctorOptions = {},
): void {
  const locale = options.locale ?? detectCliLocale();
  const _texts = cliT(locale);

  if (results.length === 0) {
    note("✓ No common issues detected", "Enhanced Diagnostics");
    return;
  }

  const critical = results.filter((r) => r.category === "critical");
  const warnings = results.filter((r) => r.category === "warning");
  const info = results.filter((r) => r.category === "info");

  const lines: string[] = [];

  if (critical.length > 0) {
    lines.push(theme.error("■ Critical Issues:"));
    for (const r of critical) {
      lines.push(`  ${theme.error("✗")} ${r.title}: ${r.description}`);
    }
  }

  if (warnings.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push(theme.warn("■ Warnings:"));
    for (const r of warnings) {
      lines.push(`  ${theme.warn("!")} ${r.title}: ${r.description}`);
    }
  }

  if (info.length > 0) {
    if (lines.length > 0) lines.push("");
    lines.push(theme.info("■ Suggestions:"));
    for (const r of info) {
      lines.push(`  ${theme.muted("·")} ${r.title}: ${r.description}`);
    }
  }

  const fixableCount = results.filter((r) => r.autoFixable).length;
  if (fixableCount > 0) {
    lines.push("");
    lines.push(
      `${fixableCount} issues are auto-fixable. Run: ${formatCliCommand("aeonsage doctor --fix")}`,
    );
  }

  note(lines.join("\n"), "Enhanced Diagnostics");
}

/**
 * Auto-fix all fixable issues
 */
export async function autoFixIssues(
  results: DiagnosticResult[],
  options: EnhancedDoctorOptions = {},
): Promise<{ fixed: number; failed: number; messages: string[] }> {
  const _locale = options.locale ?? detectCliLocale();
  const messages: string[] = [];
  let fixed = 0;
  let failed = 0;

  for (const result of results) {
    if (result.autoFixable && result.fix) {
      try {
        const fixResult = await result.fix();
        if (fixResult.success) {
          fixed++;
          messages.push(`✓ ${result.title}: ${fixResult.message}`);
        } else {
          failed++;
          messages.push(`✗ ${result.title}: ${fixResult.message}`);
        }
      } catch (e) {
        failed++;
        messages.push(`✗ ${result.title}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
  }

  return { fixed, failed, messages };
}

export { checkNodeVersion, checkDiskSpace, checkEnvFileSecurity };
