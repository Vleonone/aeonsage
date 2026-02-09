/**
 * AeonSage Skill Quality Checker
 * Validates and scores skills before publishing to Skill Hub
 */

export interface SkillQualityReport {
    passed: boolean;
    score: number; // 0-100

    // Checks
    checks: {
        hasSkillMd: boolean;
        hasDescription: boolean;
        hasAuthor: boolean;
        descriptionLength: number;
        hasExamples: boolean;
        hasMetadata: boolean;
    };

    // Security
    security: {
        passed: boolean;
        flags: string[];
        dangerousPatterns: string[];
    };

    // Duplicate detection
    duplicate: {
        isDuplicate: boolean;
        duplicateOf?: string;
        similarity?: number;
    };

    // Recommendations
    recommendations: string[];
}

// Dangerous patterns to flag in skills
const DANGEROUS_PATTERNS = [
    // System destruction
    /rm\s+-rf\s+\//i,                    // destructive delete
    /sudo\s+chmod\s+777/i,               // insecure permissions
    /format\s+c:/i,                      // disk format

    // Remote code execution
    /curl.*\|\s*bash/i,                  // pipe to bash
    /wget.*\|\s*sh/i,                    // wget pipe to shell
    /eval\s*\(/i,                        // eval execution
    /exec\s*\(/i,                        // exec execution
    /new\s+Function\s*\(/i,              // dynamic function creation
    /__import__\s*\(/i,                  // python dynamic import
    /os\.system\s*\(/i,                  // python os.system
    /subprocess\.(call|run|Popen)/i,    // python subprocess

    // Credential stealing
    /process\.env\.(PASSWORD|SECRET|TOKEN|KEY|PRIVATE)/i,
    /\.env\s+file/i,
    /keychain|keyring/i,

    // WALLET & CRYPTO STEALING (CRITICAL)
    /private.?key/i,                     // private key access
    /seed.?phrase/i,                     // seed phrase access
    /mnemonic/i,                         // mnemonic access
    /wallet\.json/i,                     // wallet file
    /keystore/i,                         // keystore access
    /\.wallet/i,                         // wallet files
    /metamask/i,                         // MetaMask targeting
    /phantom/i,                          // Phantom targeting
    /ledger.*key/i,                      // Ledger key access
    /trezor.*key/i,                      // Trezor key access
    /eth_sign|personal_sign.*private/i,  // Ethereum signing
    /signTransaction.*private/i,         // Transaction signing
    /exportPrivateKey/i,                 // Key export
    /decrypt.*wallet/i,                  // Wallet decryption
    /solana.*keypair/i,                  // Solana keypair
    /bitcoin.*wif/i,                     // Bitcoin WIF
    /send.*to.*0x[a-f0-9]{40}/i,        // Hardcoded ETH address
    /transfer.*funds.*external/i,        // Fund transfer

    // Data exfiltration
    /upload.*credentials/i,
    /send.*server.*key/i,
    /post.*external.*secret/i,
    /base64\.encode.*password/i,
    /fetch\(.*secret/i,

    // Obfuscation (suspicious)
    /base64\.decode/i,                   // obfuscated code
    /\\x[0-9a-f]{2}/gi,                  // hex encoded strings
    /atob\s*\(/i,                        // base64 decode
    /String\.fromCharCode/i,             // character code obfuscation
    /unescape\s*\(/i,                    // unescape obfuscation
];

// Suspicious keywords with severity
const SUSPICIOUS_KEYWORDS: Array<{ word: string; severity: "critical" | "high" | "medium" }> = [
    // Critical - immediate block
    { word: "steal", severity: "critical" },
    { word: "drain", severity: "critical" },
    { word: "siphon", severity: "critical" },
    { word: "exfiltrate", severity: "critical" },
    { word: "private_key", severity: "critical" },
    { word: "seed_phrase", severity: "critical" },

    // High - likely malicious
    { word: "hack", severity: "high" },
    { word: "exploit", severity: "high" },
    { word: "bypass", severity: "high" },
    { word: "crack", severity: "high" },
    { word: "phish", severity: "high" },
    { word: "malware", severity: "high" },
    { word: "backdoor", severity: "high" },
    { word: "trojan", severity: "high" },
    { word: "keylog", severity: "high" },
    { word: "spyware", severity: "high" },
    { word: "ransomware", severity: "high" },

    // Medium - needs review
    { word: "password", severity: "medium" },
    { word: "credential", severity: "medium" },
    { word: "secret", severity: "medium" },
    { word: "token", severity: "medium" },
];

/**
 * Check skill quality and security
 */
export async function checkSkillQuality(params: {
    name: string;
    description: string;
    content?: string;
    author?: string;
    url?: string;
    existingSkills?: string[];
}): Promise<SkillQualityReport> {
    const { name, description, content, author, existingSkills } = params;

    // Basic checks
    const checks = {
        hasSkillMd: !!content,
        hasDescription: description.length > 10,
        hasAuthor: !!author && author !== "unknown",
        descriptionLength: description.length,
        hasExamples: content?.includes("```") ?? false,
        hasMetadata: content?.includes("---") ?? false,
    };

    // Security checks
    const securityFlags: string[] = [];
    const dangerousPatterns: string[] = [];

    const textToCheck = `${description} ${content || ""}`.toLowerCase();

    // Check for dangerous patterns
    for (const pattern of DANGEROUS_PATTERNS) {
        if (pattern.test(textToCheck)) {
            dangerousPatterns.push(pattern.source);
            securityFlags.push(`dangerous pattern: ${pattern.source.slice(0, 30)}...`);
        }
    }

    // Check for suspicious keywords
    for (const { word, severity } of SUSPICIOUS_KEYWORDS) {
        if (textToCheck.includes(word)) {
            const prefix = severity === "critical" ? "CRITICAL" : severity === "high" ? "HIGH" : "MEDIUM";
            securityFlags.push(`[${prefix}] suspicious keyword: ${word}`);
        }
    }

    const securityPassed = dangerousPatterns.length === 0;

    // Duplicate detection
    const normalizedName = name.toLowerCase().replace(/[-_\s]/g, "");
    let isDuplicate = false;
    let duplicateOf: string | undefined;

    if (existingSkills) {
        for (const existing of existingSkills) {
            const normalizedExisting = existing.toLowerCase().replace(/[-_\s]/g, "");
            if (normalizedExisting === normalizedName) {
                isDuplicate = true;
                duplicateOf = existing;
                break;
            }
            // Check for similar names (Levenshtein would be better)
            if (normalizedExisting.includes(normalizedName) || normalizedName.includes(normalizedExisting)) {
                isDuplicate = true;
                duplicateOf = existing;
                break;
            }
        }
    }

    // Calculate score
    let score = 0;
    if (checks.hasDescription) score += 20;
    if (checks.hasAuthor) score += 15;
    if (checks.hasExamples) score += 20;
    if (checks.hasMetadata) score += 15;
    if (checks.descriptionLength > 50) score += 10;
    if (checks.descriptionLength > 100) score += 10;
    if (securityPassed) score += 10;

    // Penalties
    if (isDuplicate) score -= 30;
    if (securityFlags.length > 0) score -= securityFlags.length * 10;

    score = Math.max(0, Math.min(100, score));

    // Recommendations
    const recommendations: string[] = [];
    if (!checks.hasDescription) recommendations.push("Add a description");
    if (!checks.hasAuthor) recommendations.push("Specify author information");
    if (!checks.hasExamples) recommendations.push("Add code examples");
    if (checks.descriptionLength < 50) recommendations.push("Expand description");
    if (securityFlags.length > 0) recommendations.push("Review security concerns");
    if (isDuplicate) recommendations.push(`May duplicate: ${duplicateOf}`);

    const passed = score >= 50 && securityPassed && !isDuplicate;

    return {
        passed,
        score,
        checks,
        security: {
            passed: securityPassed,
            flags: securityFlags,
            dangerousPatterns,
        },
        duplicate: {
            isDuplicate,
            duplicateOf,
        },
        recommendations,
    };
}

/**
 * Batch check multiple skills
 */
export async function batchCheckSkills(
    skills: Array<{ name: string; description: string; content?: string; author?: string }>,
    existingSkills: string[] = []
): Promise<Map<string, SkillQualityReport>> {
    const results = new Map<string, SkillQualityReport>();
    const processedNames: string[] = [...existingSkills];

    for (const skill of skills) {
        const report = await checkSkillQuality({
            ...skill,
            existingSkills: processedNames,
        });
        results.set(skill.name, report);
        processedNames.push(skill.name);
    }

    return results;
}

/**
 * Filter skills by quality threshold
 */
export function filterByQuality(
    reports: Map<string, SkillQualityReport>,
    minScore = 50
): string[] {
    const passed: string[] = [];
    for (const [name, report] of reports) {
        if (report.passed && report.score >= minScore) {
            passed.push(name);
        }
    }
    return passed;
}
