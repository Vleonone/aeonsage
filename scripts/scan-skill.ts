import * as fs from 'fs';
import * as path from 'path';
import { SkillScanner } from '../src/security/scanner';

// Usage: npx ts-node scripts/scan-skill.ts <file>

const filePath = process.argv[2];

if (!filePath) {
    console.error("❌ Usage: npx ts-node scripts/scan-skill.ts <path-to-skill-file>");
    process.exit(1);
}

const absolutePath = path.resolve(process.cwd(), filePath);

if (!fs.existsSync(absolutePath)) {
    console.error(`❌ File not found: ${absolutePath}`);
    process.exit(1);
}

console.log(`🔍 Scanning: ${path.basename(absolutePath)}...`);

try {
    const code = fs.readFileSync(absolutePath, 'utf-8');
    const result = SkillScanner.scan(code);

    console.log("---------------------------------------------------");
    console.log(`🛡️  Security Verdict: ${result.isSafe ? '✅ SAFE' : '🚫 RISKY'}`);
    console.log(`📊 Safety Score:      ${result.score}/100`);

    if (result.risks.length > 0) {
        console.log("\n⚠️  Detected Risks:");
        result.risks.forEach(r => console.log(`   - ${r}`));
    }
    console.log("---------------------------------------------------");

    if (!result.isSafe) {
        process.exit(1); // Fail for CI/CD
    }

} catch (err) {
    console.error("❌ Error reading file:", err);
    process.exit(1);
}
