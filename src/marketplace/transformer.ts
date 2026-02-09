/**
 * AeonSage Skill Transformer
 * Converts external skills to AeonSage format
 */

import type { SkillMeta } from "../skills/skill-types.js";

export interface AeonSageSkill {
    // Core identity
    id: string;
    name: string;
    displayName: string;
    version: string;

    // Attribution
    author: string;
    originalSource: string;
    adaptedBy: "aeonsage";

    // Content
    description: string;
    category: string;
    tags: string[];

    // URLs
    url: string;
    documentationUrl?: string;
    repositoryUrl?: string;

    // Metadata
    addedAt: string;
    updatedAt: string;
    verified: boolean;
    vdidCertified: boolean;

    // Quality
    qualityScore: number;
    securityReviewed: boolean;
}

/**
 * Transform external skill to AeonSage format
 */
export function transformToAeonSageSkill(
    skill: SkillMeta & { sourceId: string },
    options?: { verified?: boolean; vdidCertified?: boolean }
): AeonSageSkill {
    const now = new Date().toISOString();

    return {
        // Core identity
        id: `aeonsage-${skill.name.toLowerCase().replace(/[^a-z0-9]/g, "-")}`,
        name: skill.name,
        displayName: skill.displayName || formatDisplayName(skill.name),
        version: "1.0.0",

        // Attribution - credit original author
        author: skill.author || "unknown",
        originalSource: skill.sourceId,
        adaptedBy: "aeonsage",

        // Content
        description: skill.description || `${formatDisplayName(skill.name)} skill adapted for AeonSage`,
        category: mapCategory(skill.category),
        tags: [...(skill.tags || []), "aeonsage", "adapted"],

        // URLs
        url: skill.url,
        repositoryUrl: skill.repoPath?.startsWith("http") ? skill.repoPath : undefined,

        // Metadata
        addedAt: now,
        updatedAt: now,
        verified: options?.verified ?? false,
        vdidCertified: options?.vdidCertified ?? false,

        // Quality - needs review
        qualityScore: 0,
        securityReviewed: false,
    };
}

/**
 * Format skill name for display
 */
function formatDisplayName(name: string): string {
    return name
        .split(/[-_]/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
}

/**
 * Map external categories to AeonSage categories
 */
function mapCategory(category?: string): string {
    const categoryMap: Record<string, string> = {
        "automation": "automation",
        "ai": "intelligence",
        "ml": "intelligence",
        "developer": "developer-tools",
        "dev": "developer-tools",
        "productivity": "productivity",
        "communication": "channels",
        "messaging": "channels",
        "data": "data-management",
        "database": "data-management",
        "security": "security",
        "finance": "finance",
        "trading": "trading",
        "web3": "web3",
        "crypto": "web3",
    };

    const normalized = (category || "").toLowerCase();
    return categoryMap[normalized] || "other";
}

/**
 * Filter and deduplicate skills
 */
export function filterAndDedupeSkills(
    skills: Array<SkillMeta & { sourceId: string }>
): Array<SkillMeta & { sourceId: string }> {
    const seen = new Map<string, SkillMeta & { sourceId: string }>();

    // Priority order for sources (higher = preferred)
    const sourcePriority: Record<string, number> = {
        "aeonsagehub": 100,
        "aeonsage-github": 90,
        "community-skills-github": 30,
        "community-skills-awesome": 25,
        "skillsmp": 35,
    };

    for (const skill of skills) {
        const key = skill.name.toLowerCase();
        const existing = seen.get(key);

        if (!existing) {
            seen.set(key, skill);
            continue;
        }

        // Keep higher priority source
        const existingPriority = sourcePriority[existing.sourceId] ?? 10;
        const newPriority = sourcePriority[skill.sourceId] ?? 10;

        if (newPriority > existingPriority) {
            seen.set(key, skill);
        }
    }

    return [...seen.values()];
}

/**
 * Transform batch of skills to AeonSage format
 */
export function transformBatch(
    skills: Array<SkillMeta & { sourceId: string }>
): AeonSageSkill[] {
    const filtered = filterAndDedupeSkills(skills);
    return filtered.map(skill => transformToAeonSageSkill(skill));
}
