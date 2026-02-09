#!/usr/bin/env node
/**
 * Encoding Fix Script - UTF-8 Encoding Integrity Checker & Fixer
 * 
 * Scans codebase for files with encoding issues (mojibake/乱码)
 * and provides options to detect or fix them.
 * 
 * Usage:
 *   node scripts/encoding-fix.ts              # Detect only
 *   node scripts/encoding-fix.ts --fix        # Detect and fix
 *   node scripts/encoding-fix.ts --dir <path> # Scan specific directory
 * 
 * Exit codes:
 *   0 - No issues found (or all fixed)
 *   1 - Issues found (detection mode) or fix failed
 */

import fs from "node:fs";
import path from "node:path";

// ============================================================================
// CONFIGURATION
// ============================================================================

/** File extensions to scan for encoding issues */
const SCAN_EXTENSIONS = [
    ".ts", ".tsx", ".js", ".jsx", ".mjs", ".cjs",
    ".md", ".mdx",
    ".json", ".yaml", ".yml",
    ".swift",
    ".sh", ".bash",
    ".html", ".css", ".scss",
    ".txt",
];

/** Directories to skip */
const SKIP_DIRS = new Set([
    "node_modules",
    ".git",
    "dist",
    ".next",
    "coverage",
    ".antigravity",
    "__pycache__",
    ".turbo",
    "target",
]);

/** Common mojibake patterns - specific sequences only */
const MOJIBAKE_PATTERNS = [
    // Replacement character (actual encoding error marker)
    { pattern: /\uFFFD/g, name: "Replacement character (U+FFFD)" },
    // Specific known mojibake from UTF-8 -> Windows terminal
    { pattern: /━/g, name: "Mojibake box drawing" },
    { pattern: /馃挕/g, name: "Mojibake emoji (tip)" },
    { pattern: /馃攷/g, name: "Mojibake emoji (search)" },
    { pattern: /✓/g, name: "Mojibake check mark" },
    { pattern: /❌/g, name: "Mojibake X mark" },
    { pattern: /→/g, name: "Mojibake arrow" },
    // BOM in middle of file only (not at start)
    { pattern: /(?<=.)\uFEFF/g, name: "Misplaced BOM" },
];

/** Known mojibake to correct character mappings */
const MOJIBAKE_FIXES: Array<{ from: string | RegExp; to: string }> = [
    // Box drawing characters
    { from: "━", to: "━" },
    { from: "━", to: "━" },
    // Arrows
    { from: "→", to: "→" },
    // Check marks
    { from: "✓", to: "✓" },
    { from: "❌", to: "❌" },
    // Quotation marks
    { from: "\u201c", to: "\"" },
    // Emoji prefixes (usually part of multi-byte emoji)
    { from: /\uD83C[\x80-\xBF]/g, to: "" }, // Remove broken emoji
    // Common UTF-8 double-encoding fixes
    { from: "é", to: "é" },
    { from: "è", to: "è" },
    { from: "à", to: "à" },
    { from: "â", to: "â" },
    { from: "ô", to: "ô" },
    { from: "î", to: "î" },
    { from: "ï", to: "ï" },
    { from: "û", to: "û" },
    { from: "ü", to: "ü" },
    { from: "ç", to: "ç" },
    // Misplaced BOM
    { from: /(?<!^)\uFEFF/gm, to: "" },
];

// ============================================================================
// SCANNER
// ============================================================================

interface EncodingIssue {
    file: string;
    line: number;
    pattern: string;
    context: string;
}

function detectMojibake(content: string): Array<{ pattern: string; line: number; context: string }> {
    const issues: Array<{ pattern: string; line: number; context: string }> = [];
    const lines = content.split("\n");

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const lineNum = i + 1;

        for (const { pattern, name } of MOJIBAKE_PATTERNS) {
            if (pattern.test(line)) {
                issues.push({
                    pattern: name,
                    line: lineNum,
                    context: line.slice(0, 80),
                });
                // Reset regex lastIndex for global patterns
                pattern.lastIndex = 0;
            }
        }
    }

    return issues;
}

function fixMojibake(content: string): string {
    let fixed = content;

    for (const { from, to } of MOJIBAKE_FIXES) {
        if (typeof from === "string") {
            fixed = fixed.split(from).join(to);
        } else {
            fixed = fixed.replace(from, to);
        }
    }

    return fixed;
}

function shouldScanFile(filePath: string): boolean {
    const ext = path.extname(filePath).toLowerCase();
    return SCAN_EXTENSIONS.includes(ext);
}

function scanFile(filePath: string): EncodingIssue[] {
    const issues: EncodingIssue[] = [];

    try {
        const content = fs.readFileSync(filePath, "utf-8");
        const detected = detectMojibake(content);

        for (const d of detected) {
            issues.push({
                file: filePath,
                line: d.line,
                pattern: d.pattern,
                context: d.context,
            });
        }
    } catch (err) {
        // Skip unreadable files
    }

    return issues;
}

function fixFile(filePath: string): boolean {
    try {
        const content = fs.readFileSync(filePath, "utf-8");
        const fixed = fixMojibake(content);

        if (content !== fixed) {
            fs.writeFileSync(filePath, fixed, "utf-8");
            return true;
        }
        return false;
    } catch (err) {
        console.error(`  ❌ Error fixing ${filePath}: ${err}`);
        return false;
    }
}

function walkDir(dir: string, issues: EncodingIssue[]): void {
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                if (!SKIP_DIRS.has(entry.name)) {
                    walkDir(fullPath, issues);
                }
            } else if (entry.isFile()) {
                if (shouldScanFile(fullPath)) {
                    issues.push(...scanFile(fullPath));
                }
            }
        }
    } catch (err) {
        // Skip unreadable directories
    }
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
    const fixMode = process.argv.includes("--fix");
    const dirIndex = process.argv.indexOf("--dir");
    const rootDir = dirIndex !== -1 && process.argv[dirIndex + 1]
        ? path.resolve(process.argv[dirIndex + 1])
        : process.cwd();

    console.log("[SCAN] AeonSage Encoding Checker");
    console.log("=".repeat(50));
    console.log(`Scanning: ${rootDir}`);
    console.log(`Mode: ${fixMode ? "Fix" : "Detect only"}`);
    console.log("");

    const issues: EncodingIssue[] = [];
    walkDir(rootDir, issues);

    if (issues.length === 0) {
        console.log("[OK] No encoding issues found!");
        console.log("");
        console.log("Checked for:");
        for (const { name } of MOJIBAKE_PATTERNS) {
            console.log(`  - ${name}`);
        }
        process.exit(0);
    }

    // Group by file
    const byFile = new Map<string, EncodingIssue[]>();
    for (const issue of issues) {
        const existing = byFile.get(issue.file) ?? [];
        existing.push(issue);
        byFile.set(issue.file, existing);
    }

    console.log(`[WARN] Found ${issues.length} issue(s) in ${byFile.size} file(s):`);
    console.log("");

    let fixedCount = 0;

    for (const [file, fileIssues] of byFile) {
        const relPath = path.relative(rootDir, file);
        console.log(`[FILE] ${relPath}`);

        for (const issue of fileIssues.slice(0, 5)) {
            console.log(`   L${issue.line}: ${issue.pattern}`);
            console.log(`   ${issue.context.slice(0, 60)}...`);
        }

        if (fileIssues.length > 5) {
            console.log(`   ... and ${fileIssues.length - 5} more`);
        }

        if (fixMode) {
            if (fixFile(file)) {
                console.log(`   [OK] Fixed`);
                fixedCount++;
            }
        }

        console.log("");
    }

    console.log("=".repeat(50));

    if (fixMode) {
        console.log(`Fixed: ${fixedCount}/${byFile.size} file(s)`);
        console.log("");
        console.log("[TIP] Run again without --fix to verify");
        process.exit(fixedCount === byFile.size ? 0 : 1);
    } else {
        console.log(`Total: ${issues.length} issue(s)`);
        console.log("");
        console.log("[TIP] Run with --fix to attempt automatic repair");
        process.exit(1);
    }
}

main();
