#!/usr/bin/env -S node --import tsx
/**
 * Source Format Validator
 * Ensures consistent code formatting across the codebase
 * 
 * Run: pnpm format:validate
 */

import { resolve } from "node:path";
import { execSync } from "node:child_process";

const ROOT = resolve(import.meta.dirname, "..");


function main() {
    // First run standard oxfmt check
    let ok = true;
    try {
        execSync("pnpm exec oxfmt --check src test", {
            stdio: "inherit",
            cwd: ROOT
        });
    } catch {
        ok = false;
    }

    if (!ok) process.exit(1);

    console.log("\x1b[32m✓ Format validation passed\x1b[0m");
}

main();
