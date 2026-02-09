/**
 * Self-Restart Tool
 *
 * Safely restart bot services for recovery from errors.
 */

import { spawn } from "node:child_process";
// MCP-style tool - type inferred
import type { AeonSageConfig } from "../../config/config.js";

export interface SelfRestartParams {
  config?: AeonSageConfig;
  onBeforeRestart?: () => Promise<void>;
}

export type RestartMode = "gateway" | "process" | "graceful";

export interface RestartResult {
  success: boolean;
  mode: RestartMode;
  message: string;
  scheduledAt?: string;
  error?: string;
}

// Restart state
let restartScheduled = false;
let restartCount = 0;
let lastRestart: Date | null = null;

// Rate limiting: max 3 restarts per hour
const MAX_RESTARTS_PER_HOUR = 3;
const restartHistory: Date[] = [];

/**
 * Check if restart is allowed (rate limiting)
 */
function canRestart(): { allowed: boolean; reason?: string } {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentRestarts = restartHistory.filter((d) => d.getTime() > oneHourAgo);

  if (recentRestarts.length >= MAX_RESTARTS_PER_HOUR) {
    return {
      allowed: false,
      reason: `Rate limited: ${MAX_RESTARTS_PER_HOUR} restarts allowed per hour`,
    };
  }

  if (restartScheduled) {
    return {
      allowed: false,
      reason: "A restart is already scheduled",
    };
  }

  return { allowed: true };
}

/**
 * Schedule a graceful restart
 */
async function scheduleGracefulRestart(
  delayMs: number,
  onBeforeRestart?: () => Promise<void>,
): Promise<void> {
  restartScheduled = true;
  restartHistory.push(new Date());
  restartCount++;

  console.log(`[SelfRestart] Graceful restart scheduled in ${delayMs}ms`);

  setTimeout(async () => {
    try {
      // Run cleanup callback
      if (onBeforeRestart) {
        console.log("[SelfRestart] Running pre-restart cleanup...");
        await onBeforeRestart();
      }

      console.log("[SelfRestart] Initiating restart...");
      lastRestart = new Date();

      // Spawn a detached process to restart
      const isWindows = process.platform === "win32";
      const restartScript = isWindows
        ? `timeout /t 2 && node "${process.argv[1]}"`
        : `sleep 2 && node "${process.argv[1]}"`;

      const shell = isWindows ? "cmd.exe" : "/bin/sh";
      const args = isWindows ? ["/c", restartScript] : ["-c", restartScript];

      const child = spawn(shell, args, {
        detached: true,
        stdio: "ignore",
        cwd: process.cwd(),
        env: process.env,
      });

      child.unref();

      // Exit current process
      process.exit(0);
    } catch (error) {
      console.error("[SelfRestart] Restart failed:", error);
      restartScheduled = false;
    }
  }, delayMs);
}

/**
 * Restart only the Gateway service
 */
async function restartGateway(config?: AeonSageConfig): Promise<RestartResult> {
  try {
    const gatewayPort = config?.gateway?.port ?? 4242;

    // Send shutdown signal to Gateway
    const response = await fetch(`http://localhost:${gatewayPort}/admin/restart`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ graceful: true }),
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      return {
        success: false,
        mode: "gateway",
        message: "Failed to restart Gateway",
        error: `HTTP ${response.status}`,
      };
    }

    restartHistory.push(new Date());
    restartCount++;
    lastRestart = new Date();

    return {
      success: true,
      mode: "gateway",
      message: "Gateway restart initiated",
      scheduledAt: new Date().toISOString(),
    };
  } catch (error) {
    return {
      success: false,
      mode: "gateway",
      message: "Failed to restart Gateway",
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Create the self-restart tool
 */
export function createSelfRestartTool(params: SelfRestartParams = {}) {
  return {
    name: "self_restart",
    description: `Restart bot services to recover from errors or apply configuration changes.
    
Modes:
- 'gateway': Restart only the Gateway service
- 'graceful': Schedule a graceful full process restart
- 'process': Immediate process restart (use with caution)

Safety features:
- Rate limited to 3 restarts per hour
- Pre-restart cleanup hooks
- Confirmation required for process restart

WARNING: Use this tool only when necessary for recovery, not for routine operations.`,
    inputSchema: {
      type: "object",
      properties: {
        mode: {
          type: "string",
          enum: ["gateway", "graceful", "process"],
          description: "Restart mode. Default is 'graceful'.",
        },
        delay: {
          type: "number",
          description: "Delay in milliseconds before restart. Default is 3000.",
        },
        reason: {
          type: "string",
          description: "Reason for restart (logged for auditing).",
        },
        confirm: {
          type: "boolean",
          description: "Must be true to execute restart. Safety check.",
        },
      },
      required: ["confirm"],
    },
    call: async (input: {
      mode?: RestartMode;
      delay?: number;
      reason?: string;
      confirm?: boolean;
    }) => {
      // Safety check
      if (input.confirm !== true) {
        return {
          success: false,
          error: "Restart not confirmed. Set confirm: true to proceed.",
          hint: "This is a safety check to prevent accidental restarts.",
        };
      }

      // Rate limiting check
      const canRestartResult = canRestart();
      if (!canRestartResult.allowed) {
        return {
          success: false,
          error: canRestartResult.reason,
          stats: getRestartStats(),
        };
      }

      const mode = input.mode ?? "graceful";
      const delay = input.delay ?? 3000;
      const reason = input.reason ?? "Manual restart requested";

      console.log(`[SelfRestart] Restart requested. Mode: ${mode}, Reason: ${reason}`);

      switch (mode) {
        case "gateway":
          return restartGateway(params.config);

        case "graceful":
          await scheduleGracefulRestart(delay, params.onBeforeRestart);
          return {
            success: true,
            mode: "graceful",
            message: `Graceful restart scheduled in ${delay}ms`,
            scheduledAt: new Date().toISOString(),
            reason,
          };

        case "process":
          // Immediate restart - most disruptive
          restartHistory.push(new Date());
          restartCount++;

          console.log("[SelfRestart] Immediate process restart...");

          // Give a moment for the response to be sent
          setTimeout(() => {
            process.exit(0);
          }, 100);

          return {
            success: true,
            mode: "process",
            message: "Process restart initiated",
            scheduledAt: new Date().toISOString(),
            reason,
          };

        default:
          return {
            success: false,
            error: `Unknown restart mode: ${String(mode)}`,
          };
      }
    },
  };
}

/**
 * Get restart statistics
 */
export function getRestartStats() {
  const oneHourAgo = Date.now() - 60 * 60 * 1000;
  const recentRestarts = restartHistory.filter((d) => d.getTime() > oneHourAgo);

  return {
    totalRestarts: restartCount,
    restartsLastHour: recentRestarts.length,
    maxRestartsPerHour: MAX_RESTARTS_PER_HOUR,
    lastRestart: lastRestart?.toISOString() ?? null,
    restartScheduled,
  };
}
