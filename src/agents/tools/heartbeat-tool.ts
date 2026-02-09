/**
 * Heartbeat Tool
 *
 * Periodic heartbeat for 24/7 bot monitoring.
 * Reports bot status to external monitoring endpoints.
 */

import os from "node:os";
// MCP-style tool - type inferred
import type { AeonSageConfig } from "../../config/config.js";

export interface HeartbeatParams {
  config?: AeonSageConfig;
}

export interface HeartbeatPayload {
  botId: string;
  status: "alive" | "degraded" | "starting" | "stopping";
  timestamp: string;
  uptime: number;
  version: string;
  hostname: string;
  platform: string;
  nodeVersion: string;
  memoryUsage: {
    heapUsed: number;
    heapTotal: number;
    rss: number;
  };
  metadata?: Record<string, unknown>;
}

export interface HeartbeatResult {
  success: boolean;
  endpoint?: string;
  responseTime?: number;
  error?: string;
}

// In-memory heartbeat state
let lastHeartbeat: Date | null = null;
let heartbeatCount = 0;

/**
 * Create heartbeat payload
 */
function createHeartbeatPayload(
  status: HeartbeatPayload["status"] = "alive",
  metadata?: Record<string, unknown>,
): HeartbeatPayload {
  const memUsage = process.memoryUsage();

  return {
    botId: process.env.AEONSAGE_BOT_ID ?? `aeonsage-${os.hostname()}`,
    status,
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version ?? "unknown",
    hostname: os.hostname(),
    platform: process.platform,
    nodeVersion: process.version,
    memoryUsage: {
      heapUsed: memUsage.heapUsed,
      heapTotal: memUsage.heapTotal,
      rss: memUsage.rss,
    },
    metadata,
  };
}

/**
 * Send heartbeat to endpoint
 */
async function sendHeartbeat(
  endpoint: string,
  payload: HeartbeatPayload,
  timeout = 5000,
): Promise<HeartbeatResult> {
  const start = Date.now();

  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "AeonSage-Bot/1.0",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(timeout),
    });

    const responseTime = Date.now() - start;

    if (!response.ok) {
      return {
        success: false,
        endpoint,
        responseTime,
        error: `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    lastHeartbeat = new Date();
    heartbeatCount++;

    return {
      success: true,
      endpoint,
      responseTime,
    };
  } catch (error) {
    return {
      success: false,
      endpoint,
      responseTime: Date.now() - start,
      error: error instanceof Error ? error.message : "Failed to send heartbeat",
    };
  }
}

/**
 * Create the heartbeat tool
 */
export function createHeartbeatTool(params: HeartbeatParams = {}) {
  return {
    name: "heartbeat",
    description: `Send a heartbeat signal to monitoring endpoints to indicate the bot is alive and operational.
Use this tool to:
- Report bot status to external monitoring systems
- Track uptime and availability
- Detect and alert on bot failures

The heartbeat includes: botId, status, uptime, memory usage, and custom metadata.`,
    inputSchema: {
      type: "object",
      properties: {
        endpoint: {
          type: "string",
          description: "URL to send heartbeat to. If not provided, uses configured default.",
        },
        status: {
          type: "string",
          enum: ["alive", "degraded", "starting", "stopping"],
          description: "Current bot status. Default is 'alive'.",
        },
        metadata: {
          type: "object",
          description: "Additional metadata to include in the heartbeat.",
        },
        timeout: {
          type: "number",
          description: "Request timeout in milliseconds. Default is 5000.",
        },
      },
      required: [],
    },
    call: async (input: {
      endpoint?: string;
      status?: HeartbeatPayload["status"];
      metadata?: Record<string, unknown>;
      timeout?: number;
    }) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const endpoint =
        input.endpoint ??
        (params.config?.tools as any)?.heartbeat?.endpoint ??
        process.env.AEONSAGE_HEARTBEAT_ENDPOINT;

      if (!endpoint) {
        // If no endpoint configured, just record locally
        lastHeartbeat = new Date();
        heartbeatCount++;

        const payload = createHeartbeatPayload(input.status, input.metadata);

        return {
          success: true,
          mode: "local",
          message: "Heartbeat recorded locally (no endpoint configured)",
          payload,
          stats: {
            lastHeartbeat: lastHeartbeat.toISOString(),
            totalHeartbeats: heartbeatCount,
          },
        };
      }

      // Create and send heartbeat
      const payload = createHeartbeatPayload(input.status, input.metadata);
      const result = await sendHeartbeat(endpoint, payload, input.timeout);

      return {
        ...result,
        payload,
        stats: {
          lastHeartbeat: lastHeartbeat?.toISOString() ?? null,
          totalHeartbeats: heartbeatCount,
        },
      };
    },
  };
}

/**
 * Get heartbeat statistics
 */
export function getHeartbeatStats() {
  return {
    lastHeartbeat: lastHeartbeat?.toISOString() ?? null,
    totalHeartbeats: heartbeatCount,
    uptimeSeconds: process.uptime(),
  };
}
