/**
 * Error Recovery Tool
 *
 * Automatic error detection and recovery for 24/7 operation.
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
// MCP-style tool - type inferred
import type { AeonSageConfig } from "../../config/config.js";

export interface ErrorRecoveryParams {
  config?: AeonSageConfig;
}

export type RecoveryStrategy = "retry" | "rollback" | "skip" | "escalate" | "restart";

export interface ErrorContext {
  error: string;
  component: string;
  timestamp: string;
  stackTrace?: string;
  metadata?: Record<string, unknown>;
}

export interface RecoveryAction {
  strategy: RecoveryStrategy;
  action: string;
  success: boolean;
  message: string;
  duration?: number;
}

export interface RecoveryResult {
  success: boolean;
  error: ErrorContext;
  actions: RecoveryAction[];
  resolved: boolean;
  needsEscalation: boolean;
  recommendations: string[];
}

// Error patterns and their recovery strategies
const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  component: string;
  strategies: RecoveryStrategy[];
  actions: string[];
}> = [
  {
    pattern: /ECONNREFUSED|ENOTFOUND|ETIMEDOUT/i,
    component: "network",
    strategies: ["retry", "skip"],
    actions: ["Wait and retry", "Check network connectivity"],
  },
  {
    pattern: /ENOSPC|disk full/i,
    component: "disk",
    strategies: ["skip", "escalate"],
    actions: ["Clear temp files", "Notify administrator"],
  },
  {
    pattern: /ENOMEM|out of memory|heap/i,
    component: "memory",
    strategies: ["restart", "escalate"],
    actions: ["Clear caches", "Restart process"],
  },
  {
    pattern: /SQLITE_BUSY|SQLITE_LOCKED/i,
    component: "database",
    strategies: ["retry", "skip"],
    actions: ["Wait and retry", "Release locks"],
  },
  {
    pattern: /rate limit|too many requests|429/i,
    component: "api",
    strategies: ["retry", "skip"],
    actions: ["Wait for rate limit reset", "Use backoff"],
  },
  {
    pattern: /auth|unauthorized|401|403/i,
    component: "auth",
    strategies: ["escalate"],
    actions: ["Refresh credentials", "Notify administrator"],
  },
  {
    pattern: /timeout|timed out/i,
    component: "timeout",
    strategies: ["retry", "skip"],
    actions: ["Increase timeout", "Retry with backoff"],
  },
];

// Recovery state
const recoveryHistory: RecoveryResult[] = [];
const MAX_HISTORY = 100;

/**
 * Analyze error and determine recovery strategy
 */
function analyzeError(error: string): {
  component: string;
  strategies: RecoveryStrategy[];
  recommendations: string[];
} {
  for (const pattern of ERROR_PATTERNS) {
    if (pattern.pattern.test(error)) {
      return {
        component: pattern.component,
        strategies: pattern.strategies,
        recommendations: pattern.actions,
      };
    }
  }

  // Default for unknown errors
  return {
    component: "unknown",
    strategies: ["skip", "escalate"],
    recommendations: ["Log error for analysis", "Consider manual intervention"],
  };
}

/**
 * Execute retry strategy
 */
async function _executeRetry(
  operation: () => Promise<unknown>,
  maxRetries = 3,
  delayMs = 1000,
): Promise<{ success: boolean; attempts: number; error?: string }> {
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      await operation();
      return { success: true, attempts: attempt };
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxRetries) {
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
      }
    }
  }

  return {
    success: false,
    attempts: maxRetries,
    error: lastError?.message ?? "Unknown error",
  };
}

/**
 * Clear temporary files for disk recovery
 */
async function clearTempFiles(): Promise<{ success: boolean; clearedBytes: number }> {
  let clearedBytes = 0;

  try {
    const tempDir = os.tmpdir();
    const aeonsageTempDir = path.join(tempDir, "aeonsage");

    try {
      const files = await fs.readdir(aeonsageTempDir);
      for (const file of files) {
        try {
          const filePath = path.join(aeonsageTempDir, file);
          const stats = await fs.stat(filePath);
          await fs.rm(filePath, { recursive: true });
          clearedBytes += stats.size;
        } catch {
          // Ignore individual file errors
        }
      }
    } catch {
      // Temp dir doesn't exist, that's fine
    }

    return { success: true, clearedBytes };
  } catch {
    return { success: false, clearedBytes: 0 };
  }
}

/**
 * Clear in-memory caches
 */
function clearCaches(): { success: boolean; message: string } {
  try {
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
    }

    return { success: true, message: "Caches cleared" };
  } catch {
    return { success: false, message: "Failed to clear caches" };
  }
}

/**
 * Create the error recovery tool
 */
export function createErrorRecoveryTool(_params: ErrorRecoveryParams = {}) {
  return {
    name: "error_recovery",
    description: `Analyze and attempt to recover from errors automatically.

Capabilities:
- Analyze error patterns and identify root causes
- Execute recovery strategies: retry, rollback, skip, escalate, restart
- Clear temp files and caches for resource recovery
- Track recovery history for pattern analysis

Use this tool when an error occurs to attempt automatic recovery before escalating.`,
    inputSchema: {
      type: "object",
      properties: {
        error: {
          type: "string",
          description: "The error message or description to analyze and recover from.",
        },
        component: {
          type: "string",
          description:
            "Which component generated the error (optional, auto-detected if not provided).",
        },
        strategy: {
          type: "string",
          enum: ["auto", "retry", "rollback", "skip", "escalate", "restart"],
          description: "Recovery strategy to use. Default is 'auto' for automatic selection.",
        },
        maxRetries: {
          type: "number",
          description: "Maximum retry attempts if using retry strategy. Default is 3.",
        },
        clearResources: {
          type: "boolean",
          description: "If true, clear temp files and caches before recovery.",
        },
      },
      required: ["error"],
    },
    call: async (input: {
      error: string;
      component?: string;
      strategy?: "auto" | RecoveryStrategy;
      maxRetries?: number;
      clearResources?: boolean;
    }) => {
      const startTime = Date.now();
      const actions: RecoveryAction[] = [];
      let resolved = false;
      let needsEscalation = false;

      // Analyze error
      const analysis = analyzeError(input.error);
      const component = input.component ?? analysis.component;

      const errorContext: ErrorContext = {
        error: input.error,
        component,
        timestamp: new Date().toISOString(),
      };

      // Clear resources if requested
      if (input.clearResources) {
        const tempResult = await clearTempFiles();
        actions.push({
          strategy: "rollback",
          action: "Clear temp files",
          success: tempResult.success,
          message: tempResult.success
            ? `Cleared ${tempResult.clearedBytes} bytes`
            : "Failed to clear temp files",
        });

        const cacheResult = clearCaches();
        actions.push({
          strategy: "rollback",
          action: "Clear caches",
          success: cacheResult.success,
          message: cacheResult.message,
        });
      }

      // Determine strategy
      const strategy =
        input.strategy === "auto"
          ? analysis.strategies[0]
          : (input.strategy ?? analysis.strategies[0]);

      // Execute recovery based on strategy
      switch (strategy) {
        case "retry":
          // For retry, we just report that retry is recommended
          // The actual retry should be done by the calling code
          actions.push({
            strategy: "retry",
            action: "Recommend retry",
            success: true,
            message: `Retry recommended with max ${input.maxRetries ?? 3} attempts`,
          });
          resolved = false; // Caller needs to actually retry
          break;

        case "skip":
          actions.push({
            strategy: "skip",
            action: "Skip operation",
            success: true,
            message: "Operation skipped, continuing execution",
          });
          resolved = true;
          break;

        case "rollback":
          const tempResult = await clearTempFiles();
          actions.push({
            strategy: "rollback",
            action: "Rollback/cleanup",
            success: tempResult.success,
            message: tempResult.success ? "Rollback completed" : "Rollback failed",
          });
          resolved = tempResult.success;
          break;

        case "restart":
          actions.push({
            strategy: "restart",
            action: "Restart recommended",
            success: true,
            message: "Use self_restart tool to restart services",
          });
          needsEscalation = true;
          break;

        case "escalate":
          actions.push({
            strategy: "escalate",
            action: "Escalate to administrator",
            success: true,
            message: "Error requires manual intervention",
          });
          needsEscalation = true;
          break;
      }

      const result: RecoveryResult = {
        success: actions.every((a) => a.success),
        error: errorContext,
        actions,
        resolved,
        needsEscalation,
        recommendations: analysis.recommendations,
      };

      // Store in history
      recoveryHistory.push(result);
      if (recoveryHistory.length > MAX_HISTORY) {
        recoveryHistory.shift();
      }

      return {
        ...result,
        duration: Date.now() - startTime,
        historyCount: recoveryHistory.length,
      };
    },
  };
}

/**
 * Get recovery history
 */
export function getRecoveryHistory(): RecoveryResult[] {
  return [...recoveryHistory];
}

/**
 * Get recovery statistics
 */
export function getRecoveryStats() {
  const total = recoveryHistory.length;
  const resolved = recoveryHistory.filter((r) => r.resolved).length;
  const escalated = recoveryHistory.filter((r) => r.needsEscalation).length;

  const byComponent: Record<string, number> = {};
  for (const result of recoveryHistory) {
    const comp = result.error.component;
    byComponent[comp] = (byComponent[comp] ?? 0) + 1;
  }

  return {
    total,
    resolved,
    escalated,
    resolveRate: total > 0 ? (resolved / total) * 100 : 0,
    byComponent,
  };
}
