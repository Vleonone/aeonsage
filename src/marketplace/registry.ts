import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import type { RegistrySyncResult, SkillMeta } from "../skills/skill-types.js";
import { crawlMarketplaceSource } from "./crawler.js";
import { MARKETPLACE_SOURCES } from "./sources.js";

export type MarketplaceSkillRecord = SkillMeta & { sourceId: string };

export type MarketplaceRegistry = {
  version: string;
  lastSync: string;
  sources: Array<{ id: string; url: string; total: number; error?: string }>;
  totalCount: number;
  skills: MarketplaceSkillRecord[];
};

const REGISTRY_VERSION = "1.0.0";

function getRegistryPath(): string {
  return path.join(os.homedir(), ".aeonsage", "marketplace", "skills.json");
}

function ensureRegistryDir(): void {
  const dir = path.dirname(getRegistryPath());
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

export function loadMarketplaceRegistry(): MarketplaceRegistry | null {
  try {
    const filePath = getRegistryPath();
    if (!fs.existsSync(filePath)) return null;
    const data = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(data) as MarketplaceRegistry;
  } catch {
    return null;
  }
}

function saveMarketplaceRegistry(registry: MarketplaceRegistry): void {
  ensureRegistryDir();
  fs.writeFileSync(getRegistryPath(), JSON.stringify(registry, null, 2), "utf-8");
}

function buildKey(skill: MarketplaceSkillRecord): string {
  return `${skill.name}::${skill.author}::${skill.repoPath}::${skill.sourceId}`;
}

export function needsMarketplaceSync(maxAgeHours = 24): boolean {
  const registry = loadMarketplaceRegistry();
  if (!registry) return true;
  const lastSync = new Date(registry.lastSync);
  if (Number.isNaN(lastSync.getTime())) return true;
  const hoursSinceSync = (Date.now() - lastSync.getTime()) / (1000 * 60 * 60);
  return hoursSinceSync > maxAgeHours;
}

export async function syncMarketplaceRegistry(): Promise<RegistrySyncResult> {
  try {
    const previous = loadMarketplaceRegistry();
    const existingKeys = new Set(previous?.skills.map(buildKey) ?? []);

    const allSkills: MarketplaceSkillRecord[] = [];
    const sources: MarketplaceRegistry["sources"] = [];

    for (const source of MARKETPLACE_SOURCES) {
      try {
        const skills = await crawlMarketplaceSource(source);
        for (const skill of skills) {
          allSkills.push(skill);
        }
        sources.push({ id: source.id, url: source.url, total: skills.length });
      } catch (error) {
        sources.push({
          id: source.id,
          url: source.url,
          total: 0,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const unique = new Map<string, MarketplaceSkillRecord>();
    for (const skill of allSkills) {
      unique.set(buildKey(skill), skill);
    }
    const skills = [...unique.values()];

    const registry: MarketplaceRegistry = {
      version: REGISTRY_VERSION,
      lastSync: new Date().toISOString(),
      sources,
      totalCount: skills.length,
      skills,
    };
    saveMarketplaceRegistry(registry);

    const added = skills.filter((skill) => !existingKeys.has(buildKey(skill))).length;
    const updated = previous ? Math.max(skills.length - added, 0) : 0;

    return {
      success: true,
      skillsAdded: added,
      skillsUpdated: updated,
      totalSkills: skills.length,
    };
  } catch (error) {
    return {
      success: false,
      skillsAdded: 0,
      skillsUpdated: 0,
      totalSkills: 0,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
