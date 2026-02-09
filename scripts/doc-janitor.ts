
/**
 * Doc Janitor - Automated Documentation Organizer & Cleaner
 * 
 * Functions:
 * 1. Identifies "Update Logs" (e.g., CHANGELOG, ROADMAP, dated logs)
 * 2. Identifies "Garbage" (temp files, backups, empty files)
 * 3. Reports status
 * 4. Cleans up garbage (optional flag)
 */

import * as fs from 'node:fs';
import * as path from 'node:path';

const DOCS_DIR = path.join(process.cwd(), 'docs');
const GARBAGE_PATTERNS = [
    /^temp_.*$/,
    /^tmp_.*$/,
    /^.*\.bak$/,
    /^.*\.old$/,
    /^.*\.tmp$/,
    /^debug_.*\.log$/
];

const LOG_PATTERNS = [
    /^CHANGELOG.*\.md$/i,
    /^ROADMAP.*\.md$/i,
    /^UPDATE.*\.md$/i,
    /^.*_log\.md$/i
];

interface FileScanResult {
    file: string;
    type: 'log' | 'doc' | 'garbage' | 'other';
    reason: string;
}

function scanDocs(dir: string): FileScanResult[] {
    const results: FileScanResult[] = [];

    if (!fs.existsSync(dir)) {
        console.error(`Directory not found: ${dir}`);
        return [];
    }

    const files = fs.readdirSync(dir);

    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            // Recursively scan subdirectories if needed, or skip
            // For now, let's focus on root docs folder for logs
            continue;
        }

        let type: FileScanResult['type'] = 'doc'; // Default
        let reason = 'Standard document';

        // Check Garbage
        if (GARBAGE_PATTERNS.some(p => p.test(file))) {
            type = 'garbage';
            reason = 'Matches garbage pattern';
        }
        // Zero byte files are garbage
        else if (stat.size === 0) {
            type = 'garbage';
            reason = 'Empty file';
        }
        // Check Logs
        else if (LOG_PATTERNS.some(p => p.test(file))) {
            type = 'log';
            reason = 'Matches log pattern';
        }

        results.push({ file, type, reason });
    }

    return results;
}

function run() {
    console.log(`🧹 Doc Janitor running in: ${DOCS_DIR}\n`);

    const results = scanDocs(DOCS_DIR);

    const logs = results.filter(r => r.type === 'log');
    const garbage = results.filter(r => r.type === 'garbage');
    const docs = results.filter(r => r.type === 'doc');

    console.log(`📝 Update Logs Found (${logs.length}):`);
    logs.forEach(l => console.log(`   - ${l.file}`));

    console.log(`\n📚 Standard Docs (${docs.length}):`);
    // docs.forEach(d => console.log(`   - ${d.file}`)); // Too noisy
    console.log(`   (Hidden for brevity)`);

    console.log(`\n🗑️  Garbage / To Clean (${garbage.length}):`);
    if (garbage.length === 0) {
        console.log(`   (None found - Clean!)`);
    } else {
        garbage.forEach(g => console.log(`   - ${g.file} [${g.reason}]`));
    }

    // Auto-clean logic (if argument provided)
    if (process.argv.includes('--clean')) {
        console.log(`\nDeleting garbage files...`);
        garbage.forEach(g => {
            const p = path.join(DOCS_DIR, g.file);
            fs.unlinkSync(p);
            console.log(`Deleted: ${g.file}`);
        });
        console.log(`Cleanup complete.`);
    } else if (garbage.length > 0) {
        console.log(`\nRun with --clean to delete garbage files.`);
    }
}

run();
