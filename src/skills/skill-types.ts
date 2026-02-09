/**
 * AeonSage Skill Registry Types
 * Defines the structure for skill metadata and registry
 */

/** Skill category identifiers */
export type SkillCategory =
  | "web-frontend"
  | "coding-agents"
  | "git-github"
  | "devops-cloud"
  | "browser-automation"
  | "image-video"
  | "search-research"
  | "ai-llms"
  | "cli-utilities"
  | "finance"
  | "productivity"
  | "communication"
  | "security"
  | "other";

/** Skill metadata structure */
export interface SkillMeta {
  /** Unique skill identifier (slug) */
  name: string;

  /** Display name */
  displayName?: string;

  /** Category */
  category: SkillCategory;

  /** Short description */
  description: string;

  /** Author GitHub username */
  author: string;

  /** URL to SKILL.md on GitHub */
  url: string;

  /** Repository path (e.g., "skills/author/skill-name") */
  repoPath: string;

  /** Search tags */
  tags?: string[];

  /** Whether skill is installed locally */
  installed?: boolean;

  /** Local installation path */
  localPath?: string;

  /** Last updated timestamp */
  updatedAt?: string;
}

/** Registry index structure */
export interface SkillRegistry {
  /** Registry format version */
  version: string;

  /** Last sync timestamp */
  lastSync: string;

  /** Source repository */
  source: string;

  /** Total skill count */
  totalCount: number;

  /** Skills by category */
  categories: Record<SkillCategory, number>;

  /** All skills */
  skills: SkillMeta[];
}

/** Search options */
export interface SkillSearchOptions {
  /** Search query */
  query?: string;

  /** Filter by category */
  category?: SkillCategory;

  /** Only installed skills */
  installedOnly?: boolean;

  /** Maximum results */
  limit?: number;

  /** Skip first N results */
  offset?: number;
}

/** Search result */
export interface SkillSearchResult {
  /** Matching skills */
  skills: SkillMeta[];

  /** Total matches (before limit) */
  total: number;

  /** Applied filters */
  filters: SkillSearchOptions;
}

/** Skill installation result */
export interface SkillInstallResult {
  success: boolean;
  skill: SkillMeta;
  localPath?: string;
  error?: string;
}

/** Registry sync result */
export interface RegistrySyncResult {
  success: boolean;
  skillsAdded: number;
  skillsUpdated: number;
  totalSkills: number;
  error?: string;
}

/** Category display info */
export const SKILL_CATEGORIES: Record<SkillCategory, { label: string; icon: string }> = {
  "web-frontend": { label: "Web & Frontend Development", icon: "🌐" },
  "coding-agents": { label: "Coding Agents & IDEs", icon: "🤖" },
  "git-github": { label: "Git & GitHub", icon: "📦" },
  "devops-cloud": { label: "DevOps & Cloud", icon: "☁️" },
  "browser-automation": { label: "Browser & Automation", icon: "🔄" },
  "image-video": { label: "Image & Video Generation", icon: "🎨" },
  "search-research": { label: "Search & Research", icon: "🔍" },
  "ai-llms": { label: "AI & LLMs", icon: "🧠" },
  "cli-utilities": { label: "CLI Utilities", icon: "⌨️" },
  finance: { label: "Finance", icon: "💰" },
  productivity: { label: "Productivity & Tasks", icon: "📋" },
  communication: { label: "Communication", icon: "💬" },
  security: { label: "Security & Passwords", icon: "🔐" },
  other: { label: "Other", icon: "📁" },
};

/** Map category names from README to our categories */
export function mapCategory(readmeCategory: string): SkillCategory {
  const lower = readmeCategory.toLowerCase();
  if (lower.includes("web") || lower.includes("frontend")) return "web-frontend";
  if (lower.includes("coding") || lower.includes("ide")) return "coding-agents";
  if (lower.includes("git") || lower.includes("github")) return "git-github";
  if (
    lower.includes("devops") ||
    lower.includes("cloud") ||
    lower.includes("docker") ||
    lower.includes("aws") ||
    lower.includes("azure")
  )
    return "devops-cloud";
  if (lower.includes("browser") || lower.includes("automation")) return "browser-automation";
  if (lower.includes("image") || lower.includes("video")) return "image-video";
  if (lower.includes("search") || lower.includes("research")) return "search-research";
  if (lower.includes("ai") || lower.includes("llm") || lower.includes("agent")) return "ai-llms";
  if (lower.includes("cli") || lower.includes("terminal") || lower.includes("utilities"))
    return "cli-utilities";
  if (lower.includes("finance") || lower.includes("trading") || lower.includes("crypto"))
    return "finance";
  if (lower.includes("productivity") || lower.includes("task")) return "productivity";
  if (lower.includes("communication") || lower.includes("chat") || lower.includes("email"))
    return "communication";
  if (lower.includes("security") || lower.includes("password")) return "security";
  return "other";
}

/** Core Skill Interfaces */
export interface SkillContext {
  user: {
    id: string;
  };
  platform: string;
}

export interface SkillResponse {
  content: string;
  metadata?: {
    type: string;
    confidence: number;
  };
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  triggers: string[];
  execute: (context: SkillContext) => Promise<SkillResponse>;
}
