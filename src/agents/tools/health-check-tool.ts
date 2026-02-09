/**
 * Health Check Tool
 *
 * Self-monitoring tool for 24/7 autonomous bot operation.
 * Checks CPU, memory, disk, network, and service health.
 */

import os from "node:os";
import fs from "node:fs/promises";
import path from "node:path";
// McpStyleTool inferred via return type
import type { AeonSageConfig } from "../../config/config.js";

export interface HealthCheckParams {
  config?: AeonSageConfig;
}

export interface HealthMetrics {
  cpu: {
    usage: number; // 0-100%
    cores: number;
    loadAvg: number[];
  };
  memory: {
    total: number; // bytes
    used: number;
    free: number;
    usagePercent: number;
  };
  disk: {
    total: number; // bytes
    used: number;
    free: number;
    usagePercent: number;
  };
  network: {
    connected: boolean;
    latencyMs: number;
  };
  services: {
    gateway: boolean;
    database: boolean;
    redis: boolean;
  };
  uptime: number; // seconds
  timestamp: string;
}

export interface HealthReport {
  score: number; // 0-100
  status: "healthy" | "degraded" | "critical";
  metrics: HealthMetrics;
  issues: HealthIssue[];
  recommendations: string[];
}

export interface HealthIssue {
  severity: "info" | "warning" | "critical";
  component: string;
  message: string;
  value?: number;
  threshold?: number;
}

// Default thresholds
const DEFAULT_THRESHOLDS = {
  cpu: { warning: 70, critical: 90 },
  memory: { warning: 75, critical: 90 },
  disk: { warning: 80, critical: 95 },
  networkLatency: { warning: 500, critical: 2000 }, // ms
};

/**
 * Get CPU usage percentage
 */
async function getCpuUsage(): Promise<number> {
  const cpus = os.cpus();
  let totalIdle = 0;
  let totalTick = 0;

  for (const cpu of cpus) {
    for (const type of Object.keys(cpu.times) as (keyof typeof cpu.times)[]) {
      totalTick += cpu.times[type];
    }
    totalIdle += cpu.times.idle;
  }

  // Wait 100ms and measure again for accurate usage
  await new Promise((resolve) => setTimeout(resolve, 100));

  const cpus2 = os.cpus();
  let totalIdle2 = 0;
  let totalTick2 = 0;

  for (const cpu of cpus2) {
    for (const type of Object.keys(cpu.times) as (keyof typeof cpu.times)[]) {
      totalTick2 += cpu.times[type];
    }
    totalIdle2 += cpu.times.idle;
  }

  const idleDiff = totalIdle2 - totalIdle;
  const tickDiff = totalTick2 - totalTick;

  return tickDiff > 0 ? Math.round(((tickDiff - idleDiff) / tickDiff) * 100) : 0;
}

/**
 * Get disk usage for root/home directory
 */
async function getDiskUsage(): Promise<{
  total: number;
  used: number;
  free: number;
  usagePercent: number;
}> {
  try {
    const homeDir = os.homedir();

    if (process.platform === "win32") {
      // Windows: use available space from fs.statfs (Node 18+)
      const stats = await fs.statfs(homeDir);
      const total = stats.bsize * stats.blocks;
      const free = stats.bsize * stats.bfree;
      const used = total - free;
      return {
        total,
        used,
        free,
        usagePercent: total > 0 ? Math.round((used / total) * 100) : 0,
      };
    } else {
      // Unix-like systems
      const stats = await fs.statfs(homeDir);
      const total = stats.bsize * stats.blocks;
      const free = stats.bsize * stats.bavail;
      const used = total - free;
      return {
        total,
        used,
        free,
        usagePercent: total > 0 ? Math.round((used / total) * 100) : 0,
      };
    }
  } catch {
    return { total: 0, used: 0, free: 0, usagePercent: 0 };
  }
}

/**
 * Check network connectivity
 */
async function checkNetwork(): Promise<{ connected: boolean; latencyMs: number }> {
  const start = Date.now();
  try {
    // Try to resolve DNS
    const dns = await import("node:dns/promises");
    await dns.resolve("google.com");
    const latencyMs = Date.now() - start;
    return { connected: true, latencyMs };
  } catch {
    return { connected: false, latencyMs: -1 };
  }
}

/**
 * Check service status
 */
async function checkServices(
  config?: AeonSageConfig,
): Promise<{ gateway: boolean; database: boolean; redis: boolean }> {
  const services = { gateway: false, database: false, redis: false };

  // Check Gateway
  try {
    const gatewayPort = config?.gateway?.port ?? 4242;
    const response = await fetch(`http://localhost:${gatewayPort}/health`, {
      method: "GET",
      signal: AbortSignal.timeout(2000),
    });
    services.gateway = response.ok;
  } catch {
    services.gateway = false;
  }

  // Check SQLite database file exists
  try {
    const dbPath = path.join(os.homedir(), ".aeonsage", "data", "aeonsage.db");
    await fs.access(dbPath);
    services.database = true;
  } catch {
    services.database = false;
  }

  // Redis check (if configured)
  // TODO: Implement Redis health check when redis-tool is available
  services.redis = true; // Assume healthy if not configured

  return services;
}

/**
 * Analyze metrics and generate health report
 */
function analyzeHealth(metrics: HealthMetrics): HealthReport {
  const issues: HealthIssue[] = [];
  const recommendations: string[] = [];
  let score = 100;

  // Check CPU
  if (metrics.cpu.usage >= DEFAULT_THRESHOLDS.cpu.critical) {
    issues.push({
      severity: "critical",
      component: "cpu",
      message: `CPU usage critical: ${metrics.cpu.usage}%`,
      value: metrics.cpu.usage,
      threshold: DEFAULT_THRESHOLDS.cpu.critical,
    });
    score -= 30;
    recommendations.push("Consider scaling up or reducing workload");
  } else if (metrics.cpu.usage >= DEFAULT_THRESHOLDS.cpu.warning) {
    issues.push({
      severity: "warning",
      component: "cpu",
      message: `CPU usage high: ${metrics.cpu.usage}%`,
      value: metrics.cpu.usage,
      threshold: DEFAULT_THRESHOLDS.cpu.warning,
    });
    score -= 10;
  }

  // Check Memory
  if (metrics.memory.usagePercent >= DEFAULT_THRESHOLDS.memory.critical) {
    issues.push({
      severity: "critical",
      component: "memory",
      message: `Memory usage critical: ${metrics.memory.usagePercent}%`,
      value: metrics.memory.usagePercent,
      threshold: DEFAULT_THRESHOLDS.memory.critical,
    });
    score -= 30;
    recommendations.push("Restart services or add more memory");
  } else if (metrics.memory.usagePercent >= DEFAULT_THRESHOLDS.memory.warning) {
    issues.push({
      severity: "warning",
      component: "memory",
      message: `Memory usage high: ${metrics.memory.usagePercent}%`,
      value: metrics.memory.usagePercent,
      threshold: DEFAULT_THRESHOLDS.memory.warning,
    });
    score -= 10;
  }

  // Check Disk
  if (metrics.disk.usagePercent >= DEFAULT_THRESHOLDS.disk.critical) {
    issues.push({
      severity: "critical",
      component: "disk",
      message: `Disk usage critical: ${metrics.disk.usagePercent}%`,
      value: metrics.disk.usagePercent,
      threshold: DEFAULT_THRESHOLDS.disk.critical,
    });
    score -= 30;
    recommendations.push("Clear disk space immediately");
  } else if (metrics.disk.usagePercent >= DEFAULT_THRESHOLDS.disk.warning) {
    issues.push({
      severity: "warning",
      component: "disk",
      message: `Disk usage high: ${metrics.disk.usagePercent}%`,
      value: metrics.disk.usagePercent,
      threshold: DEFAULT_THRESHOLDS.disk.warning,
    });
    score -= 10;
  }

  // Check Network
  if (!metrics.network.connected) {
    issues.push({
      severity: "critical",
      component: "network",
      message: "Network connectivity lost",
    });
    score -= 30;
    recommendations.push("Check network connection");
  } else if (metrics.network.latencyMs >= DEFAULT_THRESHOLDS.networkLatency.critical) {
    issues.push({
      severity: "warning",
      component: "network",
      message: `Network latency high: ${metrics.network.latencyMs}ms`,
      value: metrics.network.latencyMs,
      threshold: DEFAULT_THRESHOLDS.networkLatency.critical,
    });
    score -= 10;
  }

  // Check Services
  if (!metrics.services.gateway) {
    issues.push({
      severity: "critical",
      component: "gateway",
      message: "Gateway service is not responding",
    });
    score -= 20;
    recommendations.push("Restart Gateway service");
  }

  // Ensure score is within bounds
  score = Math.max(0, Math.min(100, score));

  // Determine overall status
  let status: "healthy" | "degraded" | "critical";
  if (score >= 80) {
    status = "healthy";
  } else if (score >= 50) {
    status = "degraded";
  } else {
    status = "critical";
  }

  return { score, status, metrics, issues, recommendations };
}

/**
 * Create the health check tool
 */
export function createHealthCheckTool(params: HealthCheckParams = {}) {
  return {
    name: "health_check",
    description: `Check system health status including CPU, memory, disk, network, and service health. 
Returns a health score (0-100), status (healthy/degraded/critical), detailed metrics, and any issues detected.
Use this tool to monitor the bot's operational status and detect problems before they cause failures.`,
    inputSchema: {
      type: "object",
      properties: {
        component: {
          type: "string",
          enum: ["all", "cpu", "memory", "disk", "network", "services"],
          description: "Which component to check. Default is 'all' for full system health.",
        },
        verbose: {
          type: "boolean",
          description: "If true, include detailed metrics in the response.",
        },
      },
      required: [],
    },
    call: async (input: { component?: string; verbose?: boolean }) => {
      const _component = input.component ?? "all";
      const verbose = input.verbose ?? true;

      try {
        // Collect metrics
        const [cpuUsage, disk, network, services] = await Promise.all([
          getCpuUsage(),
          getDiskUsage(),
          checkNetwork(),
          checkServices(params.config),
        ]);

        const totalMem = os.totalmem();
        const freeMem = os.freemem();
        const usedMem = totalMem - freeMem;

        const metrics: HealthMetrics = {
          cpu: {
            usage: cpuUsage,
            cores: os.cpus().length,
            loadAvg: os.loadavg(),
          },
          memory: {
            total: totalMem,
            used: usedMem,
            free: freeMem,
            usagePercent: Math.round((usedMem / totalMem) * 100),
          },
          disk,
          network,
          services,
          uptime: os.uptime(),
          timestamp: new Date().toISOString(),
        };

        // Generate report
        const report = analyzeHealth(metrics);

        // Format response based on verbosity
        if (verbose) {
          return {
            success: true,
            ...report,
            formatted: formatHealthReport(report),
          };
        } else {
          return {
            success: true,
            score: report.score,
            status: report.status,
            issueCount: report.issues.length,
            summary:
              report.issues.length > 0
                ? `${report.issues.length} issue(s) detected`
                : "All systems operational",
          };
        }
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Health check failed",
        };
      }
    },
  };
}

/**
 * Format health report as readable text
 */
function formatHealthReport(report: HealthReport): string {
  const lines: string[] = [];

  // Header
  const statusEmoji =
    report.status === "healthy" ? "✅" : report.status === "degraded" ? "⚠️" : "🔴";
  lines.push(
    `${statusEmoji} System Health: ${report.status.toUpperCase()} (Score: ${report.score}/100)`,
  );
  lines.push("");

  // Metrics summary
  lines.push("📊 Metrics:");
  lines.push(`  • CPU: ${report.metrics.cpu.usage}% (${report.metrics.cpu.cores} cores)`);
  lines.push(
    `  • Memory: ${report.metrics.memory.usagePercent}% (${formatBytes(report.metrics.memory.used)}/${formatBytes(report.metrics.memory.total)})`,
  );
  lines.push(
    `  • Disk: ${report.metrics.disk.usagePercent}% (${formatBytes(report.metrics.disk.free)} free)`,
  );
  lines.push(
    `  • Network: ${report.metrics.network.connected ? `Connected (${report.metrics.network.latencyMs}ms)` : "Disconnected"}`,
  );
  lines.push(`  • Uptime: ${formatUptime(report.metrics.uptime)}`);
  lines.push("");

  // Services
  lines.push("🔧 Services:");
  lines.push(`  • Gateway: ${report.metrics.services.gateway ? "✅ Running" : "❌ Down"}`);
  lines.push(`  • Database: ${report.metrics.services.database ? "✅ Available" : "⚠️ Not found"}`);
  lines.push("");

  // Issues
  if (report.issues.length > 0) {
    lines.push("⚠️ Issues:");
    for (const issue of report.issues) {
      const icon =
        issue.severity === "critical" ? "🔴" : issue.severity === "warning" ? "🟠" : "🔵";
      lines.push(`  ${icon} ${issue.message}`);
    }
    lines.push("");
  }

  // Recommendations
  if (report.recommendations.length > 0) {
    lines.push("💡 Recommendations:");
    for (const rec of report.recommendations) {
      lines.push(`  • ${rec}`);
    }
  }

  return lines.join("\n");
}

function formatBytes(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  let value = bytes;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}
