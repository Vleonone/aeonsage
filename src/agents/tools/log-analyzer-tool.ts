/**
 * Log Analyzer Tool
 *
 * Analyze log files to identify errors, patterns, and insights.
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
// MCP-style tool - type inferred
import type { AeonSageConfig } from "../../config/config.js";

export interface LogAnalyzerParams {
  config?: AeonSageConfig;
}

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  source?: string;
  metadata?: Record<string, unknown>;
}

export interface LogPattern {
  pattern: string;
  count: number;
  firstSeen: string;
  lastSeen: string;
  examples: string[];
}

export interface LogAnalysis {
  totalLines: number;
  timeRange: { start: string; end: string } | null;
  levelCounts: Record<LogLevel, number>;
  errorPatterns: LogPattern[];
  topErrors: Array<{ message: string; count: number }>;
  anomalies: string[];
  summary: string;
}

// Common log patterns to detect
const ERROR_PATTERNS = [
  { pattern: /error|exception|failed/i, level: "error" as LogLevel },
  { pattern: /warn|warning/i, level: "warn" as LogLevel },
  { pattern: /critical|fatal|panic/i, level: "fatal" as LogLevel },
];

// Timestamp patterns
const TIMESTAMP_PATTERNS = [
  /^(\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2})/,
  /^\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]/,
  /^(\d{2}:\d{2}:\d{2}\.\d{3})/,
];

/**
 * Parse a log line
 */
function parseLogLine(line: string): LogEntry | null {
  if (!line.trim()) return null;

  let timestamp = new Date().toISOString();
  let level: LogLevel = "info";
  let message = line;

  // Try to extract timestamp
  for (const pattern of TIMESTAMP_PATTERNS) {
    const match = line.match(pattern);
    if (match) {
      timestamp = match[1] ?? timestamp;
      message = line.slice(match[0].length).trim();
      break;
    }
  }

  // Detect log level
  const upperLine = line.toUpperCase();
  if (upperLine.includes("[ERROR]") || upperLine.includes(" ERROR ")) {
    level = "error";
  } else if (upperLine.includes("[WARN]") || upperLine.includes(" WARN ")) {
    level = "warn";
  } else if (upperLine.includes("[DEBUG]") || upperLine.includes(" DEBUG ")) {
    level = "debug";
  } else if (upperLine.includes("[FATAL]") || upperLine.includes(" FATAL ")) {
    level = "fatal";
  } else if (upperLine.includes("[INFO]") || upperLine.includes(" INFO ")) {
    level = "info";
  } else {
    // Check for error patterns in content
    for (const { pattern, level: patternLevel } of ERROR_PATTERNS) {
      if (pattern.test(line)) {
        level = patternLevel;
        break;
      }
    }
  }

  return { timestamp, level, message };
}

/**
 * Read and parse log file
 */
async function readLogFile(
  filePath: string,
  maxLines = 10000,
): Promise<{ lines: LogEntry[]; truncated: boolean }> {
  const lines: LogEntry[] = [];
  let truncated = false;

  try {
    const content = await fs.readFile(filePath, "utf-8");
    const rawLines = content.split("\n");

    if (rawLines.length > maxLines) {
      truncated = true;
      // Take last N lines (most recent)
      rawLines.splice(0, rawLines.length - maxLines);
    }

    for (const line of rawLines) {
      const parsed = parseLogLine(line);
      if (parsed) {
        lines.push(parsed);
      }
    }
  } catch {
    // File doesn't exist or can't be read
  }

  return { lines, truncated };
}

/**
 * Analyze log entries
 */
function analyzeLogs(entries: LogEntry[]): LogAnalysis {
  const levelCounts: Record<LogLevel, number> = {
    debug: 0,
    info: 0,
    warn: 0,
    error: 0,
    fatal: 0,
  };

  const errorMessages: Map<string, number> = new Map();
  const patternMap: Map<string, LogPattern> = new Map();
  const anomalies: string[] = [];

  let firstTimestamp: string | null = null;
  let lastTimestamp: string | null = null;

  for (const entry of entries) {
    // Count levels
    levelCounts[entry.level]++;

    // Track timestamps
    if (!firstTimestamp || entry.timestamp < firstTimestamp) {
      firstTimestamp = entry.timestamp;
    }
    if (!lastTimestamp || entry.timestamp > lastTimestamp) {
      lastTimestamp = entry.timestamp;
    }

    // Track error messages
    if (entry.level === "error" || entry.level === "fatal") {
      // Normalize message for grouping
      const normalized = entry.message
        .replace(/\d+/g, "N")
        .replace(/[a-f0-9]{8,}/gi, "HASH")
        .substring(0, 100);

      const count = errorMessages.get(normalized) ?? 0;
      errorMessages.set(normalized, count + 1);

      // Track pattern
      const existing = patternMap.get(normalized);
      if (existing) {
        existing.count++;
        existing.lastSeen = entry.timestamp;
        if (existing.examples.length < 3) {
          existing.examples.push(entry.message);
        }
      } else {
        patternMap.set(normalized, {
          pattern: normalized,
          count: 1,
          firstSeen: entry.timestamp,
          lastSeen: entry.timestamp,
          examples: [entry.message],
        });
      }
    }
  }

  // Detect anomalies
  const errorRate =
    entries.length > 0 ? (levelCounts.error + levelCounts.fatal) / entries.length : 0;
  if (errorRate > 0.1) {
    anomalies.push(`High error rate: ${(errorRate * 100).toFixed(1)}% of log entries are errors`);
  }

  if (levelCounts.fatal > 0) {
    anomalies.push(`${levelCounts.fatal} fatal error(s) detected`);
  }

  // Find repeated errors
  for (const [msg, count] of errorMessages) {
    if (count > 10) {
      anomalies.push(`Repeated error (${count}x): ${msg.substring(0, 50)}...`);
    }
  }

  // Sort top errors
  const topErrors = Array.from(errorMessages.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([message, count]) => ({ message, count }));

  // Sort patterns
  const errorPatterns = Array.from(patternMap.values())
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Generate summary
  const summary = generateSummary(entries.length, levelCounts, anomalies, topErrors);

  return {
    totalLines: entries.length,
    timeRange:
      firstTimestamp && lastTimestamp ? { start: firstTimestamp, end: lastTimestamp } : null,
    levelCounts,
    errorPatterns,
    topErrors,
    anomalies,
    summary,
  };
}

/**
 * Generate human-readable summary
 */
function generateSummary(
  totalLines: number,
  levelCounts: Record<LogLevel, number>,
  anomalies: string[],
  topErrors: Array<{ message: string; count: number }>,
): string {
  const lines: string[] = [];

  lines.push(`📊 Log Analysis Summary`);
  lines.push(`Total entries: ${totalLines}`);
  lines.push("");

  lines.push("📈 Level Distribution:");
  lines.push(`  • Debug: ${levelCounts.debug}`);
  lines.push(`  • Info: ${levelCounts.info}`);
  lines.push(`  • Warn: ${levelCounts.warn}`);
  lines.push(`  • Error: ${levelCounts.error}`);
  lines.push(`  • Fatal: ${levelCounts.fatal}`);
  lines.push("");

  if (anomalies.length > 0) {
    lines.push("⚠️ Anomalies Detected:");
    for (const anomaly of anomalies) {
      lines.push(`  • ${anomaly}`);
    }
    lines.push("");
  }

  if (topErrors.length > 0) {
    lines.push("🔴 Top Errors:");
    for (const error of topErrors.slice(0, 5)) {
      lines.push(`  • (${error.count}x) ${error.message.substring(0, 60)}...`);
    }
  }

  return lines.join("\n");
}

/**
 * Create the log analyzer tool
 */
export function createLogAnalyzerTool() {
  return {
    name: "log_analyzer",
    description: `Analyze log files to identify errors, patterns, and anomalies.

Capabilities:
- Parse and analyze log files
- Detect error patterns and frequencies
- Identify anomalies (high error rates, repeated errors)
- Generate diagnostic summaries

Use this tool to:
- Diagnose issues from log files
- Monitor for recurring problems
- Prepare incident reports`,
    inputSchema: {
      type: "object",
      properties: {
        logPath: {
          type: "string",
          description: "Path to log file. If not provided, analyzes default AeonSage logs.",
        },
        maxLines: {
          type: "number",
          description: "Maximum lines to analyze. Default is 5000.",
        },
        level: {
          type: "string",
          enum: ["all", "error", "warn", "info"],
          description: "Filter by log level. Default is 'all'.",
        },
        pattern: {
          type: "string",
          description: "Search for specific pattern in logs.",
        },
        timeRange: {
          type: "object",
          properties: {
            start: { type: "string" },
            end: { type: "string" },
          },
          description: "Filter by time range (ISO format).",
        },
      },
      required: [],
    },
    call: async (input: {
      logPath?: string;
      maxLines?: number;
      level?: "all" | "error" | "warn" | "info";
      pattern?: string;
      timeRange?: { start?: string; end?: string };
    }) => {
      // Resolve log path
      const logPath = input.logPath ?? path.join(os.homedir(), ".aeonsage", "logs", "aeonsage.log");

      const maxLines = input.maxLines ?? 5000;

      try {
        // Check if file exists
        await fs.access(logPath);
      } catch {
        return {
          success: false,
          error: `Log file not found: ${logPath}`,
          hint: "Specify a valid log path or ensure AeonSage logging is enabled.",
        };
      }

      try {
        // Read and parse log file
        const { lines, truncated } = await readLogFile(logPath, maxLines);

        // Filter by level
        let filteredLines = lines;
        if (input.level && input.level !== "all") {
          const levelFilter = input.level;
          filteredLines = lines.filter((l) => {
            if (levelFilter === "error") return l.level === "error" || l.level === "fatal";
            if (levelFilter === "warn")
              return l.level === "warn" || l.level === "error" || l.level === "fatal";
            return true;
          });
        }

        // Filter by pattern
        if (input.pattern) {
          const regex = new RegExp(input.pattern, "i");
          filteredLines = filteredLines.filter((l) => regex.test(l.message));
        }

        // Filter by time range
        if (input.timeRange) {
          const { start, end } = input.timeRange;
          filteredLines = filteredLines.filter((l) => {
            if (start && l.timestamp < start) return false;
            if (end && l.timestamp > end) return false;
            return true;
          });
        }

        // Analyze
        const analysis = analyzeLogs(filteredLines);

        return {
          success: true,
          logPath,
          truncated,
          filtered: filteredLines.length !== lines.length,
          ...analysis,
        };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : "Failed to analyze logs",
        };
      }
    },
  };
}
