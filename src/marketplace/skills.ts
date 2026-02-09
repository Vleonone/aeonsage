import {
  loadRegistry,
  searchSkills,
  syncRegistry,
  getRegistryStats,
} from "../skills/skill-registry.js";
import type { SkillMeta, SkillSearchOptions, RegistrySyncResult } from "../skills/skill-types.js";
import { evaluateMarketplaceRisk, type MarketplaceRiskReport } from "./risk.js";
import { findMarketplaceSource } from "./sources.js";
import { loadMarketplaceRegistry, needsMarketplaceSync, syncMarketplaceRegistry } from "./registry.js";
import { normalizeMarketplaceBranding } from "./branding.js";

export type MarketplaceSkill = SkillMeta & {
  risk: MarketplaceRiskReport;
  sourceId?: string;
};

export type MarketplaceSkillsSearchResult = {
  skills: MarketplaceSkill[];
  total: number;
  lastSync?: string;
  source?: string;
};

export type MarketplaceSkillsStats = {
  total: number;
  installed: number;
  categories: Record<string, number>;
  lastSync?: string;
  source?: string;
};

const DEFAULT_SOURCE_ID = "aeonsagehub";

function attachRisk(skill: SkillMeta, sourceId = DEFAULT_SOURCE_ID): MarketplaceSkill {
  const displayName = skill.displayName
    ? normalizeMarketplaceBranding(skill.displayName)
    : skill.displayName;
  const description = skill.description
    ? normalizeMarketplaceBranding(skill.description)
    : skill.description;
  return {
    ...skill,
    displayName,
    description,
    risk: evaluateMarketplaceRisk({
      name: skill.name,
      description,
      tags: skill.tags,
    }),
    sourceId,
  };
}

export async function syncMarketplaceSkills(): Promise<RegistrySyncResult> {
  const base = await syncRegistry();
  const marketplace = await syncMarketplaceRegistry();
  if (!marketplace.success) return marketplace;
  return {
    success: base.success && marketplace.success,
    skillsAdded: base.skillsAdded + marketplace.skillsAdded,
    skillsUpdated: base.skillsUpdated + marketplace.skillsUpdated,
    totalSkills: Math.max(base.totalSkills, marketplace.totalSkills),
    error: marketplace.error ?? base.error,
  };
}

export function searchMarketplaceSkills(
  options: SkillSearchOptions & { sourceId?: string } = {},
): MarketplaceSkillsSearchResult {
  const marketplace = loadMarketplaceRegistry();
  if (marketplace?.skills?.length) {
    const normalizedQuery = options.query?.toLowerCase();
    let skills = marketplace.skills;
    if (options.sourceId) {
      const source = findMarketplaceSource(options.sourceId);
      skills = source ? skills.filter((skill) => skill.sourceId === source.id) : [];
    }
    if (options.category) {
      skills = skills.filter((skill) => skill.category === options.category);
    }
    if (normalizedQuery) {
      skills = skills.filter((skill) => {
        const text = `${skill.name} ${skill.displayName ?? ""} ${skill.description ?? ""} ${
          skill.tags?.join(" ") ?? ""
        }`.toLowerCase();
        return text.includes(normalizedQuery);
      });
    }
    const total = skills.length;
    const offset = options.offset ?? 0;
    const limit = options.limit ?? 20;
    skills = skills.slice(offset, offset + limit);

    return {
      skills: skills.map((skill) => attachRisk(skill, skill.sourceId)),
      total,
      lastSync: marketplace.lastSync,
      source: "marketplace",
    };
  }

  const registry = loadRegistry();
  const result = searchSkills(options);
  let skills = result.skills.map((skill) => attachRisk(skill, DEFAULT_SOURCE_ID));
  if (options.sourceId) {
    const source = findMarketplaceSource(options.sourceId);
    skills = source ? skills.filter((skill) => skill.sourceId === source.id) : [];
  }
  return {
    skills,
    total: options.sourceId ? skills.length : result.total,
    lastSync: registry?.lastSync,
    source: registry?.source,
  };
}

export function getMarketplaceSkillsStats(): MarketplaceSkillsStats {
  const marketplace = loadMarketplaceRegistry();
  if (marketplace?.skills?.length) {
    const categories: Record<string, number> = {};
    for (const skill of marketplace.skills) {
      categories[skill.category] = (categories[skill.category] ?? 0) + 1;
    }
    return {
      total: marketplace.totalCount,
      installed: 0,
      categories,
      lastSync: marketplace.lastSync,
      source: "marketplace",
    };
  }
  const registry = loadRegistry();
  const stats = getRegistryStats();
  if (!stats) {
    return {
      total: 0,
      installed: 0,
      categories: {},
      lastSync: registry?.lastSync,
      source: registry?.source,
    };
  }
  return {
    total: stats.total,
    installed: stats.installed,
    categories: stats.categories as Record<string, number>,
    lastSync: registry?.lastSync,
    source: registry?.source,
  };
}

export function shouldSyncMarketplaceSkills(): boolean {
  return needsMarketplaceSync();
}
