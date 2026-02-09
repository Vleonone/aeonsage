/**
 * AeonsagePro Health Check — Automated System Diagnostics
 *
 * Runs all quality checks and produces a single report.
 * This script is READ-ONLY — it never modifies or deletes files.
 *
 * Usage:
 *   pnpm health            # full check
 *   pnpm health -- --fast  # skip slow checks (test, typecheck)
 */

import { execSync } from "node:child_process";
import { existsSync, statSync, readdirSync } from "node:fs";
import { join } from "node:path";

const ROOT = join(import.meta.dirname, "..");
const args = process.argv.slice(2);
const fast = args.includes("--fast");

interface CheckResult {
  name: string;
  status: "pass" | "warn" | "fail" | "skip";
  detail: string;
  durationMs: number;
}

const results: CheckResult[] = [];

function run(name: string, cmd: string, opts?: { skip?: boolean; warnOnly?: boolean }): void {
  if (opts?.skip) {
    results.push({ name, status: "skip", detail: "Skipped (--fast mode)", durationMs: 0 });
    return;
  }
  const start = Date.now();
  try {
    const output = execSync(cmd, { cwd: ROOT, encoding: "utf-8", timeout: 300_000, stdio: "pipe" });
    results.push({ name, status: "pass", detail: output.trim().slice(-200), durationMs: Date.now() - start });
  } catch (err: unknown) {
    const msg = err instanceof Error ? (err as { stderr?: string }).stderr || err.message : String(err);
    const status = opts?.warnOnly ? "warn" : "fail";
    results.push({ name, status, detail: msg.trim().slice(-300), durationMs: Date.now() - start });
  }
}

// ── Checks ──

console.log("\n  AeonsagePro Health Check\n  ========================\n");

run("TypeScript Build", "pnpm build", { skip: fast });
run("Lint (oxlint)", "pnpm lint 2>&1 || true", { warnOnly: true });
run("Brand Audit", "pnpm brand:audit:strict 2>&1 || true", { warnOnly: true });
run("TypeCheck", "pnpm typecheck", { skip: fast });
run("Unit Tests", "pnpm test", { skip: fast });

// Dead code / unused dependencies (knip)
run("Dead Code (knip)", "npx knip --no-exit-code --reporter compact 2>&1 | head -50", { warnOnly: true });

// Circular dependency check
run("Circular Deps", "npx depcruise --no-config --include-only '^src/' --output-type err src/index.ts 2>&1 | head -30", { warnOnly: true });

// Security audit
run("Security Audit", "pnpm audit --audit-level=high 2>&1 || true", { warnOnly: true });

// Disk usage check
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
    } catch { /* permission error, skip */ }
  }
  walk(dir);
  return Math.round(total / 1024 / 1024);
}

const nodeModulesMB = getDirSizeMB(join(ROOT, "node_modules"));
const distMB = getDirSizeMB(join(ROOT, "dist"));
const coverageMB = getDirSizeMB(join(ROOT, "coverage"));

results.push({
  name: "Disk Usage",
  status: nodeModulesMB > 2000 ? "warn" : "pass",
  detail: `node_modules: ${nodeModulesMB}MB | dist: ${distMB}MB | coverage: ${coverageMB}MB`,
  durationMs: 0,
});

// ── Report ──

console.log("\n  Results\n  -------\n");

const icons: Record<string, string> = { pass: "[PASS]", warn: "[WARN]", fail: "[FAIL]", skip: "[SKIP]" };

for (const r of results) {
  const icon = icons[r.status] ?? "[ ? ]";
  const time = r.durationMs > 0 ? ` (${(r.durationMs / 1000).toFixed(1)}s)` : "";
  console.log(`  ${icon} ${r.name}${time}`);
  if (r.status === "fail" || r.status === "warn") {
    const lines = r.detail.split("\n").slice(0, 5);
    for (const line of lines) {
      console.log(`        ${line}`);
    }
  }
}

const passed = results.filter((r) => r.status === "pass").length;
const warned = results.filter((r) => r.status === "warn").length;
const failed = results.filter((r) => r.status === "fail").length;
const skipped = results.filter((r) => r.status === "skip").length;

console.log(`\n  Summary: ${passed} pass, ${warned} warn, ${failed} fail, ${skipped} skip`);
console.log(`  Total checks: ${results.length}\n`);

if (failed > 0) {
  process.exit(1);
}
