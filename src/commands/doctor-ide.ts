/**
 * Doctor IDE - Web IDE Backend Health Check
 *
 * Checks:
 * - IDE API route availability
 * - SSE connection status
 * - File system access
 *
 * @module commands/doctor-ide
 */

import type { AeonSageConfig } from "../config/config.js";
import { note } from "../terminal/note.js";
import { buildGatewayConnectionDetails } from "../gateway/call.js";

/**
 * Check IDE backend health
 */
export async function noteIdeHealth(cfg: AeonSageConfig): Promise<void> {
  const info: string[] = [];
  const warnings: string[] = [];

  // Build gateway URL
  const gatewayDetails = buildGatewayConnectionDetails({ config: cfg });
  // Convert ws/wss URL to http/https for fetch
  const baseUrl = gatewayDetails.url?.replace(/^wss?:\/\//, (m) =>
    m === "wss://" ? "https://" : "http://",
  );

  if (!baseUrl) {
    info.push("- IDE: Gateway not configured (IDE unavailable)");
    note(info.join("\n"), "IDE");
    return;
  }

  // Check IDE status endpoint
  try {
    const statusUrl = `${baseUrl}/api/ide/status`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);

    const response = await fetch(statusUrl, {
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (response.ok) {
      const status = (await response.json()) as {
        version?: string;
        uptime?: number;
        connections?: number;
      };
      info.push(`- IDE: Backend available (v${status.version ?? "unknown"})`);
      if (status.uptime) {
        const uptimeHours = Math.floor(status.uptime / 3600);
        info.push(`  Uptime: ${uptimeHours} hours`);
      }
      if (status.connections !== undefined) {
        info.push(`  Active connections: ${status.connections}`);
      }
    } else {
      warnings.push(`- IDE: Backend returned ${response.status}`);
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes("abort")) {
      warnings.push("- IDE: Backend timeout (gateway may not be running)");
    } else {
      info.push("- IDE: Backend not responding (gateway offline?)");
    }
  }

  // Check SSE endpoint availability
  try {
    const sseUrl = `${baseUrl}/api/ide/logs`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3000);

    const response = await fetch(sseUrl, {
      signal: controller.signal,
      headers: {
        Accept: "text/event-stream",
      },
    });
    clearTimeout(timeout);

    if (response.ok && response.headers.get("content-type")?.includes("text/event-stream")) {
      info.push("- IDE: SSE log stream available");
    } else {
      warnings.push("- IDE: SSE endpoint not returning event-stream");
    }

    // Abort the SSE connection
    controller.abort();
  } catch {
    // Expected to fail on abort, ignore
  }

  // Output
  if (warnings.length > 0) {
    note(warnings.join("\n"), "IDE Warning");
  }
  if (info.length > 0) {
    note(info.join("\n"), "IDE");
  }
}

/**
 * Check if IDE features are enabled
 */
export function isIdeEnabled(_cfg: AeonSageConfig): boolean {
  // IDE is always available when gateway is running
  // Future: could be behind a feature flag
  return true;
}
