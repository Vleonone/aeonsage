/**
 * Doctor Hooks - Hook Execution Health Check
 *
 * Checks:
 * - Hook registry status
 * - Execution statistics
 * - Error rates
 *
 * @module commands/doctor-hooks
 */

import fs from "node:fs";
import path from "node:path";
import type { AeonSageConfig } from "../config/config.js";
import { note } from "../terminal/note.js";
import { resolveStateDir } from "../config/paths.js";

interface HookStats {
  hookId: string;
  executions: number;
  errors: number;
  lastExecution?: string;
  lastError?: string;
}

/**
 * Check hook execution health
 */
export async function noteHooksHealth(cfg: AeonSageConfig): Promise<void> {
  const info: string[] = [];
  const warnings: string[] = [];

  // Check hooks configuration
  const hooksConfig = cfg.hooks;
  if (!hooksConfig) {
    info.push("- Hooks: Not configured");
    note(info.join("\n"), "Hooks");
    return;
  }

  // List enabled hooks
  const enabledHooks: string[] = [];
  if (hooksConfig.gmail?.model) {
    enabledHooks.push("gmail");
  }

  if (enabledHooks.length === 0) {
    info.push("- Hooks: No hooks enabled");
    note(info.join("\n"), "Hooks");
    return;
  }

  info.push(`- Hooks enabled: ${enabledHooks.join(", ")}`);

  // Check hook execution stats (from state dir)
  const stateDir = resolveStateDir({ defaultAgentId: "default" });
  const hooksStatsPath = path.join(stateDir, "hooks-stats.json");

  if (fs.existsSync(hooksStatsPath)) {
    try {
      const statsRaw = fs.readFileSync(hooksStatsPath, "utf-8");
      const stats = JSON.parse(statsRaw) as Record<string, HookStats>;

      for (const [hookId, hookStats] of Object.entries(stats)) {
        const errorRate =
          hookStats.executions > 0
            ? ((hookStats.errors / hookStats.executions) * 100).toFixed(1)
            : "0";

        info.push(
          `- ${hookId}: ${hookStats.executions} executions, ${hookStats.errors} errors (${errorRate}%)`,
        );

        if (hookStats.errors > 0 && parseFloat(errorRate) > 10) {
          warnings.push(
            `- ${hookId}: High error rate (${errorRate}%). Last error: ${hookStats.lastError ?? "unknown"}`,
          );
        }

        if (hookStats.lastExecution) {
          const lastExec = new Date(hookStats.lastExecution);
          const now = new Date();
          const hoursSinceExec = Math.floor(
            (now.getTime() - lastExec.getTime()) / (1000 * 60 * 60),
          );
          if (hoursSinceExec > 24) {
            info.push(`  Last execution: ${hoursSinceExec} hours ago`);
          }
        }
      }
    } catch {
      info.push("- Hooks stats: Unable to read (first run?)");
    }
  } else {
    info.push("- Hooks stats: No execution history yet");
  }

  // Output
  if (warnings.length > 0) {
    note(warnings.join("\n"), "Hooks Warning");
  }
  note(info.join("\n"), "Hooks");
}

/**
 * Log hook execution for stats collection
 */
export function logHookExecution(params: {
  hookId: string;
  success: boolean;
  error?: string;
  stateDir: string;
}): void {
  const statsPath = path.join(params.stateDir, "hooks-stats.json");

  let stats: Record<string, HookStats> = {};

  if (fs.existsSync(statsPath)) {
    try {
      stats = JSON.parse(fs.readFileSync(statsPath, "utf-8")) as Record<string, HookStats>;
    } catch {
      stats = {};
    }
  }

  if (!stats[params.hookId]) {
    stats[params.hookId] = {
      hookId: params.hookId,
      executions: 0,
      errors: 0,
    };
  }

  stats[params.hookId].executions++;
  stats[params.hookId].lastExecution = new Date().toISOString();

  if (!params.success) {
    stats[params.hookId].errors++;
    stats[params.hookId].lastError = params.error ?? "Unknown error";
  }

  try {
    fs.writeFileSync(statsPath, JSON.stringify(stats, null, 2));
  } catch {
    // Silently fail - stats are not critical
  }
}
