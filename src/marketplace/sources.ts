export type MarketplaceSourceKind = "html" | "json" | "github";
export type MarketplaceSourceTrust = "official" | "community" | "untrusted";

export type MarketplaceSource = {
  id: string;
  name: string;
  url: string;
  kind: MarketplaceSourceKind;
  trust: MarketplaceSourceTrust;
  notes?: string;
};

// AeonSage Official Sources (Highest Priority)
const AEONSAGE_SOURCES: MarketplaceSource[] = [
  {
    id: "aeonsagehub",
    name: "AeonSageHub Official",
    url: "https://aeonskills-production.up.railway.app/api/skills.json",
    kind: "json",
    trust: "official",
  },

  {
    id: "aeonsage-github",
    name: "AeonSage Skills GitHub",
    url: "https://github.com/Vleonone/aeonsage-skills",
    kind: "github",
    trust: "official",
  },
];

// External Community Skill Sources (Crawl & Convert)
const COMMUNITY_EXTERNAL_SOURCES: MarketplaceSource[] = [
  {
    id: "community-skills-github",
    name: "Community Skills (GitHub)",
    url: "https://github.com/openclaw/skills",
    kind: "github",
    trust: "community",
  },
  {
    id: "community-skills-awesome",
    name: "Community Skills Collection",
    url: "https://github.com/VoltAgent/awesome-openclaw-skills",
    kind: "github",
    trust: "community",
  },
  {
    id: "community-skillai",
    name: "Community Skill Hub",
    url: "https://openclawskill.ai/",
    kind: "html",
    trust: "community",
  },
  {
    id: "community-skillsio",
    name: "Community Skills Directory",
    url: "https://openclawskills.io/",
    kind: "html",
    trust: "community",
  },
  {
    id: "community-skillsorg",
    name: "Community Skills Search",
    url: "https://openclawskills.org/",
    kind: "html",
    trust: "community",
  },
  {
    id: "community-clawhub",
    name: "Community Marketplace",
    url: "https://clawhub.ai/skills",
    kind: "html",
    trust: "untrusted",
    notes: "community marketplace; requires security review",
  },
  {
    id: "mcp-so",
    name: "MCP.so Skills",
    url: "https://mcp.so/skills",
    kind: "html",
    trust: "community",
  },
  {
    id: "smithery-ai",
    name: "Smithery AI",
    url: "https://smithery.ai/",
    kind: "html",
    trust: "community",
  },
  {
    id: "glama-mcp",
    name: "Glama MCP Directory",
    url: "https://glama.ai/mcp/servers",
    kind: "html",
    trust: "community",
  },
  {
    id: "punkpeye-mcp",
    name: "Punkpeye MCP",
    url: "https://github.com/punkpeye/awesome-mcp-servers",
    kind: "github",
    trust: "community",
  },
  {
    id: "skillsmp",
    name: "SkillsMP Daily",
    url: "https://skillsmp.com/",
    kind: "html",
    trust: "community",
    notes: "daily updated AI skills aggregator",
  },
];

// Combined Sources (AeonSage first, then external)
export const MARKETPLACE_SOURCES: MarketplaceSource[] = [
  ...AEONSAGE_SOURCES,
  ...COMMUNITY_EXTERNAL_SOURCES,
];

export function listMarketplaceSources(): MarketplaceSource[] {
  return [...MARKETPLACE_SOURCES];
}

export function findMarketplaceSource(id: string): MarketplaceSource | undefined {
  return MARKETPLACE_SOURCES.find((source) => source.id === id);
}

export function getOfficialSources(): MarketplaceSource[] {
  return MARKETPLACE_SOURCES.filter((s) => s.trust === "official");
}

export function getCommunitySources(): MarketplaceSource[] {
  return MARKETPLACE_SOURCES.filter((s) => s.trust === "community");
}
