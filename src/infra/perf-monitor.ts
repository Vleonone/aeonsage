/**
 * AeonSage Performance Monitoring Module
 *
 * Provides lightweight telemetry and performance tracking for local analysis.
 * No external dependencies - stores metrics locally.
 *
 * @module infra/perf-monitor
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

// ═══════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════

export interface PerfMetric {
  name: string;
  value: number;
  unit: "ms" | "bytes" | "count" | "percent";
  timestamp: number;
  tags?: Record<string, string>;
}

export interface TimingResult {
  duration: number;
  startTime: number;
  endTime: number;
}

interface MetricsStore {
  metrics: PerfMetric[];
  maxSize: number;
}

// ═══════════════════════════════════════════════════════════════
// Global State
// ═══════════════════════════════════════════════════════════════

const store: MetricsStore = {
  metrics: [],
  maxSize: 1000, // Keep last 1000 metrics in memory
};

// ═══════════════════════════════════════════════════════════════
// Timing Utilities
// ═══════════════════════════════════════════════════════════════

/**
 * Measure the execution time of an async function
 */
export async function timeAsync<T>(
  name: string,
  fn: () => Promise<T>,
  tags?: Record<string, string>,
): Promise<[T, TimingResult]> {
  const startTime = performance.now();
  const result = await fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  recordMetric({
    name,
    value: duration,
    unit: "ms",
    timestamp: Date.now(),
    tags,
  });

  return [result, { duration, startTime, endTime }];
}

/**
 * Measure the execution time of a sync function
 */
export function timeSync<T>(
  name: string,
  fn: () => T,
  tags?: Record<string, string>,
): [T, TimingResult] {
  const startTime = performance.now();
  const result = fn();
  const endTime = performance.now();
  const duration = endTime - startTime;

  recordMetric({
    name,
    value: duration,
    unit: "ms",
    timestamp: Date.now(),
    tags,
  });

  return [result, { duration, startTime, endTime }];
}

/**
 * Create a timing scope for manual start/stop
 */
export function createTimer(name: string, tags?: Record<string, string>) {
  const startTime = performance.now();
  return {
    stop: () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      recordMetric({
        name,
        value: duration,
        unit: "ms",
        timestamp: Date.now(),
        tags,
      });
      return { duration, startTime, endTime };
    },
  };
}

// ═══════════════════════════════════════════════════════════════
// Metric Recording
// ═══════════════════════════════════════════════════════════════

export function recordMetric(metric: PerfMetric): void {
  store.metrics.push(metric);

  // Trim if over max size
  if (store.metrics.length > store.maxSize) {
    store.metrics = store.metrics.slice(-store.maxSize);
  }
}

export function recordCount(name: string, value = 1, tags?: Record<string, string>): void {
  recordMetric({
    name,
    value,
    unit: "count",
    timestamp: Date.now(),
    tags,
  });
}

export function recordBytes(name: string, value: number, tags?: Record<string, string>): void {
  recordMetric({
    name,
    value,
    unit: "bytes",
    timestamp: Date.now(),
    tags,
  });
}

// ═══════════════════════════════════════════════════════════════
// System Metrics
// ═══════════════════════════════════════════════════════════════

export function captureSystemMetrics(): void {
  const memUsage = process.memoryUsage();

  recordMetric({
    name: "system.memory.heap_used",
    value: memUsage.heapUsed,
    unit: "bytes",
    timestamp: Date.now(),
  });

  recordMetric({
    name: "system.memory.heap_total",
    value: memUsage.heapTotal,
    unit: "bytes",
    timestamp: Date.now(),
  });

  recordMetric({
    name: "system.memory.rss",
    value: memUsage.rss,
    unit: "bytes",
    timestamp: Date.now(),
  });

  recordMetric({
    name: "system.cpu.load_avg_1m",
    value: os.loadavg()[0] * 100,
    unit: "percent",
    timestamp: Date.now(),
  });
}

// ═══════════════════════════════════════════════════════════════
// Reporting
// ═══════════════════════════════════════════════════════════════

export function getMetrics(filter?: { name?: string; since?: number }): PerfMetric[] {
  let results = store.metrics;

  if (filter?.name) {
    results = results.filter((m) => m.name === filter.name || m.name.startsWith(filter.name + "."));
  }

  if (filter?.since !== undefined) {
    results = results.filter((m) => m.timestamp >= filter.since!);
  }

  return results;
}

export function getMetricsSummary(name: string): {
  count: number;
  min: number;
  max: number;
  avg: number;
  p50: number;
  p95: number;
  p99: number;
} | null {
  const metrics = getMetrics({ name });
  if (metrics.length === 0) return null;

  const values = metrics.map((m) => m.value).sort((a, b) => a - b);
  const count = values.length;
  const sum = values.reduce((a, b) => a + b, 0);

  return {
    count,
    min: values[0],
    max: values[count - 1],
    avg: sum / count,
    p50: values[Math.floor(count * 0.5)],
    p95: values[Math.floor(count * 0.95)],
    p99: values[Math.floor(count * 0.99)],
  };
}

export function clearMetrics(): void {
  store.metrics = [];
}

// ═══════════════════════════════════════════════════════════════
// File Export
// ═══════════════════════════════════════════════════════════════

export function exportMetricsToFile(filePath?: string): string {
  const defaultPath = path.join(os.homedir(), ".aeonsage", "metrics.json");
  const targetPath = filePath ?? defaultPath;

  const dir = path.dirname(targetPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(targetPath, JSON.stringify(store.metrics, null, 2));
  return targetPath;
}
