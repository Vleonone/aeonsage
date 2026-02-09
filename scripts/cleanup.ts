/**
 * AeonsagePro Cleanup — Cache & Bloat Scanner
 *
 * SAFETY: This script is SAFE BY DEFAULT.
 *   - Without --apply: ONLY scans and reports (dry-run)
 *   - With --apply: Removes only safe, regenerable caches
 *   - NEVER deletes source code, config, or user data
 *   - NEVER deletes node_modules (use `pnpm install` to rebuild)
 *
 * Usage:
 *   pnpm cleanup              # dry-run: scan and report only
 *   pnpm cleanup -- --apply   # actually clean safe targets
 */

import { existsSync, statSync, rmSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const args = process.argv.slice(2);
const apply = args.includes("--apply");

interface CleanTarget {
  path: string;
  label: string;
  sizeMB: number;
  safe: boolean; // true = regenerable cache, safe to delete
}

function getDirSizeMB(dir: string): number {
  if (!existsSync(dir)) return 0;
  let total = 0;
  function walk(d: string) {
    try {
      for (const entry of readdirSync(d, { withFileTypes: true })) {
        const p = join(d, entry.name);
        if (entry.isDirectory()) walk(p);
        else total += statSync(p).size;
      }
    } catch { /* skip */ }
  }
  walk(dir);
  return Math.round((total / 1024 / 1024) * 10) / 10;
}

function getFileSizeMB(file: string): number {
  if (!existsSync(file)) return 0;
  return Math.round((statSync(file).size / 1024 / 1024) * 10) / 10;
}

console.log(`\n  AeonsagePro Cleanup Scanner${apply ? " (APPLY MODE)" : " (DRY RUN)"}`);
console.log("  ===========================\n");

// ── Define safe cleanup targets (only regenerable caches) ──

const targets: CleanTarget[] = [
  { path: join(ROOT, "dist"), label: "Build output (pnpm build regenerates)", sizeMB: 0, safe: true },
  { path: join(ROOT, "coverage"), label: "Test coverage data", sizeMB: 0, safe: true },
  { path: join(ROOT, "docs", "api"), label: "TypeDoc output (pnpm docs:api regenerates)", sizeMB: 0, safe: true },
  { path: join(ROOT, ".pnpm-store"), label: "pnpm content-addressable store", sizeMB: 0, safe: true },
  { path: join(ROOT, "tsconfig.tsbuildinfo"), label: "TS incremental build cache", sizeMB: 0, safe: true },
];

// Scan for stale log files in reports/
const reportsDir = join(ROOT, "reports");
if (existsSync(reportsDir)) {
  targets.push({ path: reportsDir, label: "Generated reports", sizeMB: 0, safe: true });
}

// Scan for temp files
const tempPatterns = ["diff_report.json", "sync-check.json", "lint_errors.txt"];
for (const pattern of tempPatterns) {
  const p = join(ROOT, pattern);
  if (existsSync(p)) {
    targets.push({ path: p, label: `Temp file: ${pattern}`, sizeMB: 0, safe: true });
  }
}

// ── Calculate sizes ──

let totalCleanable = 0;

for (const target of targets) {
  if (existsSync(target.path)) {
    const stat = statSync(target.path);
    target.sizeMB = stat.isDirectory() ? getDirSizeMB(target.path) : getFileSizeMB(target.path);
    totalCleanable += target.sizeMB;
  }
}

// ── Also report (but NEVER clean) these for awareness ──

const nodeModulesMB = getDirSizeMB(join(ROOT, "node_modules"));
const uiNodeModulesMB = getDirSizeMB(join(ROOT, "ui", "node_modules"));

console.log("  Cleanable caches (safe to delete, all regenerable):\n");

for (const target of targets) {
  if (target.sizeMB > 0) {
    const status = apply ? "[CLEAN]" : "[FOUND]";
    console.log(`  ${status} ${target.sizeMB}MB  ${target.label}`);
    console.log(`          ${target.path}`);
  }
}

if (totalCleanable === 0) {
  console.log("  (no cleanable caches found)\n");
}

console.log("\n  Read-only info (NOT cleaned — use pnpm install to rebuild):\n");
console.log(`  [INFO] ${nodeModulesMB}MB  node_modules/`);
if (uiNodeModulesMB > 0) {
  console.log(`  [INFO] ${uiNodeModulesMB}MB  ui/node_modules/`);
}

console.log(`\n  Total cleanable: ${totalCleanable}MB`);
console.log(`  Total node_modules: ${nodeModulesMB + uiNodeModulesMB}MB (not touched)\n`);

// ── Apply if requested ──

if (apply && totalCleanable > 0) {
  console.log("  Cleaning...\n");
  for (const target of targets) {
    if (target.sizeMB > 0 && existsSync(target.path)) {
      try {
        rmSync(target.path, { recursive: true, force: true });
        console.log(`  [OK] Removed: ${target.label} (${target.sizeMB}MB)`);
      } catch (err) {
        console.log(`  [ERR] Failed to remove: ${target.path} — ${err}`);
      }
    }
  }
  console.log(`\n  Freed: ~${totalCleanable}MB`);
  console.log("  Run 'pnpm build' and 'pnpm docs:api' to regenerate.\n");
} else if (!apply && totalCleanable > 0) {
  console.log("  To actually clean, run: pnpm cleanup -- --apply\n");
}
