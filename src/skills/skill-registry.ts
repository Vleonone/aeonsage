/**
 * AeonSage Skill Registry
 * Fetches and caches skill index from GitHub
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import {
  SkillRegistry,
  SkillMeta,
  SkillSearchOptions,
  SkillSearchResult,
  RegistrySyncResult,
  SkillCategory,
  mapCategory,
} from "./skill-types.js";

const REGISTRY_VERSION = "1.0.0";
const GITHUB_RAW_BASE = "https://raw.githubusercontent.com";
const AEONSAGE_SKILL_REPO = "Vleonone/aeonsage-skills";
const README_PATH = "main/README.md";
const _COMMUNITY_SKILL_BASE_URL = "https://github.com/openclaw/skills/tree/main/skills"; // external community source (URL preserved)

/** Default skills directory */
function getSkillsDir(): string {
  return path.join(os.homedir(), ".aeonsage", "skills");
}

/** Get registry cache path */
function getRegistryPath(): string {
  return path.join(getSkillsDir(), "registry.json");
}

/** Ensure skills directory exists */
function ensureSkillsDir(): void {
  const dir = getSkillsDir();
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  const installed = path.join(dir, "installed");
  if (!fs.existsSync(installed)) {
    fs.mkdirSync(installed, { recursive: true });
  }
}

/** Load cached registry */
export function loadRegistry(): SkillRegistry | null {
  try {
    const regPath = getRegistryPath();
    if (fs.existsSync(regPath)) {
      const data = fs.readFileSync(regPath, "utf-8");
      return JSON.parse(data) as SkillRegistry;
    }
  } catch {
    // Ignore errors, will sync fresh
  }
  return null;
}

/** Save registry to cache */
function saveRegistry(registry: SkillRegistry): void {
  ensureSkillsDir();
  const regPath = getRegistryPath();
  fs.writeFileSync(regPath, JSON.stringify(registry, null, 2), "utf-8");
}

/** Parse skill link from markdown */
function parseSkillLink(line: string, currentCategory: string): SkillMeta | null {
  // Pattern: - [skill-name](url) - description
  const match = line.match(/^-\s*\[([^\]]+)\]\(([^)]+)\)(?:\s*-\s*(.+))?$/);
  if (!match) return null;

  const [, name, url, description = ""] = match;

  // Extract author from URL
  // URL format: https://github.com/{org}/skills/tree/main/skills/author/skill-name/SKILL.md
  const authorMatch = url.match(/skills\/([^/]+)\/[^/]+\/SKILL\.md/);
  const author = authorMatch ? authorMatch[1] : "unknown";

  // Extract repo path
  const pathMatch = url.match(/skills\/(.+)\/SKILL\.md/);
  const repoPath = pathMatch ? `skills/${pathMatch[1]}` : "";

  return {
    name: name.toLowerCase().replace(/\s+/g, "-"),
    displayName: name,
    category: mapCategory(currentCategory),
    description: description.trim(),
    author,
    url,
    repoPath,
    tags: extractTags(name, description),
  };
}

/** Extract search tags from name and description */
function extractTags(name: string, description: string): string[] {
  const text = `${name} ${description}`.toLowerCase();
  const tags: string[] = [];

  // Common keywords
  const keywords = [
    "browser",
    "automation",
    "ai",
    "llm",
    "agent",
    "docker",
    "aws",
    "azure",
    "github",
    "git",
    "api",
    "cli",
    "terminal",
    "web",
    "search",
    "memory",
    "email",
    "telegram",
    "slack",
    "discord",
    "crypto",
    "trading",
    "finance",
    "image",
    "video",
    "audio",
    "transcription",
    "translation",
    "database",
  ];

  for (const kw of keywords) {
    if (text.includes(kw)) {
      tags.push(kw);
    }
  }

  return tags;
}

/** Fetch and parse README.md from GitHub */
async function fetchReadme(): Promise<string> {
  const url = `${GITHUB_RAW_BASE}/${AEONSAGE_SKILL_REPO}/${README_PATH}`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch README: ${response.status}`);
  }
  return response.text();
}

/** Parse skills from README content */
function parseSkillsFromReadme(content: string): SkillMeta[] {
  const skills: SkillMeta[] = [];
  const lines = content.split("\n");

  let currentCategory = "Other";

  for (const line of lines) {
    // Detect category headers (### Category Name)
    const categoryMatch = line.match(/^###\s+(.+)$/);
    if (categoryMatch) {
      currentCategory = categoryMatch[1].trim();
      continue;
    }

    // Parse skill links
    if (line.startsWith("- [")) {
      const skill = parseSkillLink(line, currentCategory);
      if (skill) {
        skills.push(skill);
      }
    }
  }

  return skills;
}

/** Calculate category counts */
function calculateCategoryCounts(skills: SkillMeta[]): Record<SkillCategory, number> {
  const counts: Record<SkillCategory, number> = {
    "web-frontend": 0,
    "coding-agents": 0,
    "git-github": 0,
    "devops-cloud": 0,
    "browser-automation": 0,
    "image-video": 0,
    "search-research": 0,
    "ai-llms": 0,
    "cli-utilities": 0,
    finance: 0,
    productivity: 0,
    communication: 0,
    security: 0,
    other: 0,
  };

  for (const skill of skills) {
    counts[skill.category]++;
  }

  return counts;
}

/** Sync registry from GitHub */
export async function syncRegistry(): Promise<RegistrySyncResult> {
  try {
    const existingRegistry = loadRegistry();
    const existingSkillNames = new Set(existingRegistry?.skills.map((s) => s.name) || []);

    // Fetch and parse README
    const readme = await fetchReadme();
    const skills = parseSkillsFromReadme(readme);

    // Check installed status
    const installedDir = path.join(getSkillsDir(), "installed");
    for (const skill of skills) {
      const skillDir = path.join(installedDir, skill.name);
      if (fs.existsSync(skillDir)) {
        skill.installed = true;
        skill.localPath = skillDir;
      }
    }

    // Calculate stats
    const skillsAdded = skills.filter((s) => !existingSkillNames.has(s.name)).length;
    const skillsUpdated = existingRegistry ? skills.length - skillsAdded : 0;

    // Build registry
    const registry: SkillRegistry = {
      version: REGISTRY_VERSION,
      lastSync: new Date().toISOString(),
      source: `https://github.com/${AEONSAGE_SKILL_REPO}`,
      totalCount: skills.length,
      categories: calculateCategoryCounts(skills),
      skills,
    };

    // Save to cache
    saveRegistry(registry);

    return {
      success: true,
      skillsAdded,
      skillsUpdated,
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

/** Search skills */
export function searchSkills(options: SkillSearchOptions = {}): SkillSearchResult {
  const registry = loadRegistry();
  if (!registry) {
    return { skills: [], total: 0, filters: options };
  }

  let results = registry.skills;

  // Filter by category
  if (options.category) {
    results = results.filter((s) => s.category === options.category);
  }

  // Filter installed only
  if (options.installedOnly) {
    results = results.filter((s) => s.installed);
  }

  // Search by query (fuzzy match)
  if (options.query) {
    const query = options.query.toLowerCase();
    results = results.filter((s) => {
      const searchText =
        `${s.name} ${s.displayName || ""} ${s.description} ${s.tags?.join(" ") || ""}`.toLowerCase();
      return searchText.includes(query);
    });

    // Sort by relevance (name match first)
    results.sort((a, b) => {
      const aNameMatch = a.name.includes(query) ? 0 : 1;
      const bNameMatch = b.name.includes(query) ? 0 : 1;
      return aNameMatch - bNameMatch;
    });
  }

  const total = results.length;

  // Apply pagination
  const offset = options.offset || 0;
  const limit = options.limit || 20;
  results = results.slice(offset, offset + limit);

  return { skills: results, total, filters: options };
}

/** Get skills by category */
export function getSkillsByCategory(category: SkillCategory, limit = 20): SkillMeta[] {
  return searchSkills({ category, limit }).skills;
}

/** Get popular/recommended skills */
export function getPopularSkills(limit = 10): SkillMeta[] {
  const registry = loadRegistry();
  if (!registry) return [];

  // Prioritize certain categories and skills
  const priorityCategories: SkillCategory[] = [
    "ai-llms",
    "browser-automation",
    "coding-agents",
    "devops-cloud",
  ];
  const priorityKeywords = ["agent-memory", "browser-use", "coding-agent", "docker", "github"];

  // Score skills
  const scored = registry.skills.map((skill) => {
    let score = 0;
    if (priorityCategories.includes(skill.category)) score += 10;
    if (priorityKeywords.some((kw) => skill.name.includes(kw))) score += 20;
    if (skill.installed) score += 5;
    return { skill, score };
  });

  // Sort by score and return top N
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((s) => s.skill);
}

/** Get registry stats */
export function getRegistryStats(): {
  total: number;
  installed: number;
  categories: Record<SkillCategory, number>;
} | null {
  const registry = loadRegistry();
  if (!registry) return null;

  const installed = registry.skills.filter((s) => s.installed).length;

  return {
    total: registry.totalCount,
    installed,
    categories: registry.categories,
  };
}

/** Check if registry needs sync */
export function needsSync(maxAgeHours = 24): boolean {
  const registry = loadRegistry();
  if (!registry) return true;

  const lastSync = new Date(registry.lastSync);
  const now = new Date();
  const hoursSinceSync = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60);

  return hoursSinceSync > maxAgeHours;
}
