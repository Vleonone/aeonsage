#!/usr/bin/env node
/**
 * Chinese Comment Remover - Replaces Chinese comments with English equivalents
 * 
 * Scans TypeScript/JavaScript files and identifies Chinese text in comments.
 * Use for codebase internationalization and encoding consistency.
 * 
 * Usage:
 *   node scripts/chinese-to-english.ts              # Detect only
 *   node scripts/chinese-to-english.ts --fix        # Auto-translate (basic)
 */

import fs from "node:fs";
import path from "node:path";

// ============================================================================
// CONFIGURATION
// ============================================================================

const SCAN_EXTENSIONS = [".ts", ".tsx", ".js", ".jsx"];

const SKIP_DIRS = new Set([
    "node_modules", ".git", "dist", ".next", "coverage",
    ".antigravity", "__pycache__", ".turbo", "target", "i18n"
]);

// Common Chinese to English translations for comments
const TRANSLATIONS: Record<string, string> = {
    // File headers
    "功能：": "Features:",
    "用户查询": "User lookup",
    "请求签名": "Request signing",
    "资格检查": "Eligibility check",
    "加密存储": "Encrypted storage",
    "解密": "Decrypt",
    "加密": "Encrypt",
    "配置": "Configuration",
    "客户端": "Client",
    "错误": "Error",
    "信息": "Information",
    "查询": "Query",
    "更新": "Update",
    "保存": "Save",
    "加载": "Load",
    "获取": "Get",
    "创建": "Create",
    "派生": "Derive",
    "生成": "Generate",
    "发送": "Send",
    "缓存": "Cache",
    "用于日志": "For logging",
    "脱敏": "Mask/Redact",
    "公开": "Public",
    "无需签名": "No signature required",
    "需要": "Requires",
    "资源": "Resource",
    "申请": "Request",
    "系统": "System",
    "流程": "Flow",
    "发起请求": "Initiate request",
    "说明需要什么": "Describe what is needed",
    "为什么": "Why",
    "等待用户授权": "Wait for user authorization",
    "授权后执行": "Execute after authorization",
    "授权级别": "Authorization level",
    "每次操作需批准": "Each operation needs approval",
    "完全授权": "Full authorization",
    "自由行动": "Free operation",
    "资源类型": "Resource type",
    "资金": "Funds",
    "卡号": "Card number",
    "注册用": "For registration",
    "账户授权": "Account authorization",
    "权限": "Permission",
    "请求状态": "Request status",
    "等待审批": "Pending approval",
    "已批准": "Approved",
    "已拒绝": "Denied",
    "已过期": "Expired",
    "限制性": "Restricted",
    "随便用": "Unrestricted use",
    "集成": "Integration",
    "只存储时加密": "Encrypted when stored",
    "只需算一次": "Only needs to be calculated once",
};

// ============================================================================
// SCANNER
// ============================================================================

interface ChineseMatch {
    file: string;
    line: number;
    content: string;
    chineseText: string;
}

const CHINESE_REGEX = /[\u4e00-\u9fff\u3400-\u4dbf]+/g;

function findChineseInFile(filePath: string): ChineseMatch[] {
    const matches: ChineseMatch[] = [];

    try {
        const content = fs.readFileSync(filePath, "utf-8");
        const lines = content.split("\n");

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const lineNum = i + 1;

            // Reset regex
            CHINESE_REGEX.lastIndex = 0;

            let match;
            while ((match = CHINESE_REGEX.exec(line)) !== null) {
                matches.push({
                    file: filePath,
                    line: lineNum,
                    content: line.trim(),
                    chineseText: match[0],
                });
            }
        }
    } catch (err) {
        // Skip unreadable files
    }

    return matches;
}

function translateChinese(text: string): string {
    let result = text;

    for (const [chinese, english] of Object.entries(TRANSLATIONS)) {
        result = result.split(chinese).join(english);
    }

    return result;
}

function fixFile(filePath: string): boolean {
    try {
        let content = fs.readFileSync(filePath, "utf-8");
        const original = content;

        content = translateChinese(content);

        if (content !== original) {
            fs.writeFileSync(filePath, content, "utf-8");
            return true;
        }
        return false;
    } catch (err) {
        console.error(`  [ERR] Error fixing ${filePath}: ${err}`);
        return false;
    }
}

function walkDir(dir: string, matches: ChineseMatch[]): void {
    try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                if (!SKIP_DIRS.has(entry.name)) {
                    walkDir(fullPath, matches);
                }
            } else if (entry.isFile()) {
                const ext = path.extname(fullPath).toLowerCase();
                if (SCAN_EXTENSIONS.includes(ext)) {
                    matches.push(...findChineseInFile(fullPath));
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
    const rootDir = process.cwd();

    console.log("[SCAN] Chinese Text Detector");
    console.log("=".repeat(50));
    console.log(`Scanning: ${rootDir}`);
    console.log(`Mode: ${fixMode ? "Fix (translate)" : "Detect only"}`);
    console.log("");

    const matches: ChineseMatch[] = [];
    walkDir(path.join(rootDir, "src"), matches);

    if (matches.length === 0) {
        console.log("[OK] No Chinese text found in source files!");
        process.exit(0);
    }

    // Group by file
    const byFile = new Map<string, ChineseMatch[]>();
    for (const m of matches) {
        const existing = byFile.get(m.file) ?? [];
        existing.push(m);
        byFile.set(m.file, existing);
    }

    console.log(`[INFO] Found ${matches.length} Chinese text occurrence(s) in ${byFile.size} file(s):`);
    console.log("");

    let fixedCount = 0;

    for (const [file, fileMatches] of byFile) {
        const relPath = path.relative(rootDir, file);
        console.log(`[FILE] ${relPath}`);

        // Show unique Chinese strings
        const uniqueChinese = [...new Set(fileMatches.map(m => m.chineseText))].slice(0, 5);
        for (const chinese of uniqueChinese) {
            const translation = TRANSLATIONS[chinese] ?? "(no translation)";
            console.log(`   "${chinese}" -> "${translation}"`);
        }

        if (fileMatches.length > 5) {
            console.log(`   ... and ${fileMatches.length - 5} more`);
        }

        if (fixMode) {
            if (fixFile(file)) {
                console.log(`   [OK] Translated`);
                fixedCount++;
            }
        }

        console.log("");
    }

    console.log("=".repeat(50));

    if (fixMode) {
        console.log(`Translated: ${fixedCount}/${byFile.size} file(s)`);
        console.log("");
        console.log("[TIP] Run again to verify remaining Chinese text");
        console.log("[TIP] Some text may need manual translation");
    } else {
        console.log(`Total: ${matches.length} occurrence(s)`);
        console.log("");
        console.log("[TIP] Run with --fix to auto-translate common phrases");
    }

    process.exit(0);
}

main();
