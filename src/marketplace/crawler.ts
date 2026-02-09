import type { SkillMeta } from "../skills/skill-types.js";
import type { MarketplaceSource } from "./sources.js";

// Skill link patterns for different sources
const SKILL_PATTERNS = [
  // AeonSage official skills
  /https?:\/\/github\.com\/Vleonone\/aeonsage-skills\/(?:tree|blob)\/[^"'\s)]+\/SKILL\.md/gi,
  // External community skill sources (brand-guard exemption: external URL matching)
  /https?:\/\/github\.com\/openclaw\/skills\/(?:tree|blob)\/[^"'\s)]+\/SKILL\.md/gi,
  /https?:\/\/raw\.githubusercontent\.com\/openclaw\/skills\/[^"'\s)]+\/SKILL\.md/gi,
  // Generic GitHub SKILL.md
  /https?:\/\/github\.com\/[^"'\s)]+\/SKILL\.md/gi,
  // MCP server links
  /https?:\/\/github\.com\/[^"'\s)]+\/mcp-server[^"'\s)]*/gi,
  // NPM package links (for MCP servers)
  /@[a-z0-9-]+\/[a-z0-9-]+-mcp/gi,
];

// JSON API patterns for structured skill data
const _JSON_SKILL_KEYS = ["name", "title", "slug", "package"];

type MarketplaceSkillSeed = SkillMeta & { sourceId: string };

function toTreeUrl(url: string): string {
  if (url.includes("raw.githubusercontent.com")) {
    return url.replace("raw.githubusercontent.com", "github.com").replace(/\/main\//, "/tree/main/");
  }
  if (url.includes("/blob/")) {
    return url.replace("/blob/", "/tree/");
  }
  return url;
}

function extractLinks(content: string, patterns: RegExp[] = SKILL_PATTERNS): string[] {
  const matches = new Set<string>();
  for (const pattern of patterns) {
    for (const match of content.matchAll(new RegExp(pattern.source, "gi"))) {
      matches.add(match[0]);
    }
  }
  return [...matches];
}

function parseSkillFromUrl(url: string, _sourceId: string): Pick<SkillMeta, "name" | "author" | "repoPath" | "url"> | null {
  const normalized = toTreeUrl(url);

  // Community style: skills/{author}/{name}/SKILL.md
  let match = normalized.match(/skills\/([^/]+)\/([^/]+)\/SKILL\.md/i);
  if (match) {
    const [, author, name] = match;
    return { name: name.toLowerCase(), author, repoPath: `skills/${author}/${name}`, url: normalized };
  }

  // Generic GitHub: {owner}/{repo}/...
  match = normalized.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (match) {
    const [, owner, repo] = match;
    return { name: repo.toLowerCase(), author: owner, repoPath: `${owner}/${repo}`, url: normalized };
  }

  // NPM package style
  match = url.match(/@([^/]+)\/([^/\s]+)/);
  if (match) {
    const [, scope, pkg] = match;
    return { name: pkg.toLowerCase(), author: scope, repoPath: `npm:@${scope}/${pkg}`, url };
  }

  return null;
}

async function fetchText(url: string): Promise<string> {
  const response = await fetch(url, {
    signal: AbortSignal.timeout(15000),
    headers: { "User-Agent": "AeonSage-SkillCrawler/1.0" },
  });
  if (!response.ok) {
    throw new Error(`fetch failed (${response.status})`);
  }
  return response.text();
}

async function crawlJsonSource(source: MarketplaceSource): Promise<MarketplaceSkillSeed[]> {
  const content = await fetchText(source.url);
  const data = JSON.parse(content);
  const skills: MarketplaceSkillSeed[] = [];

  // Handle array of skills
  const items = Array.isArray(data) ? data : data.skills || data.items || [];
  for (const item of items) {
    const name = item.name || item.title || item.slug || "";
    if (!name) continue;
    skills.push({
      name: name.toLowerCase(),
      displayName: item.displayName || name,
      author: item.author || "unknown",
      repoPath: item.repoPath || item.repo || `aeonsage/${name}`,
      url: item.url || source.url,
      category: item.category || "other",
      description: item.description || "",
      tags: item.tags || [],
      sourceId: source.id,
    });
  }
  return skills;
}

async function crawlHtmlSource(source: MarketplaceSource): Promise<MarketplaceSkillSeed[]> {
  const content = await fetchText(source.url);
  const links = extractLinks(content);
  const seeds: MarketplaceSkillSeed[] = [];

  for (const link of links) {
    const parsed = parseSkillFromUrl(link, source.id);
    if (!parsed) continue;
    seeds.push({
      ...parsed,
      displayName: parsed.name,
      category: "other",
      description: "",
      tags: [],
      sourceId: source.id,
    });
  }

  return seeds;
}

async function crawlGithubSource(source: MarketplaceSource): Promise<MarketplaceSkillSeed[]> {
  // For GitHub repos, try to fetch README and parse skill links
  const readmeUrl = source.url.replace("github.com", "raw.githubusercontent.com") + "/main/README.md";
  try {
    const content = await fetchText(readmeUrl);
    const links = extractLinks(content);
    const seeds: MarketplaceSkillSeed[] = [];

    for (const link of links) {
      const parsed = parseSkillFromUrl(link, source.id);
      if (!parsed) continue;
      seeds.push({
        ...parsed,
        displayName: parsed.name,
        category: "other",
        description: "",
        tags: [],
        sourceId: source.id,
      });
    }
    return seeds;
  } catch {
    return crawlHtmlSource(source);
  }
}

export async function crawlMarketplaceSource(source: MarketplaceSource): Promise<MarketplaceSkillSeed[]> {
  switch (source.kind) {
    case "json":
      return crawlJsonSource(source);
    case "github":
      return crawlGithubSource(source);
    case "html":
    default:
      return crawlHtmlSource(source);
  }
}
