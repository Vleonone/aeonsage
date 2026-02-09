/**
 * AeonSage Skill Installer
 * Downloads and installs skills from GitHub
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { SkillMeta, SkillInstallResult } from "./skill-types.js";
import { loadRegistry, syncRegistry } from "./skill-registry.js";

const AEONSAGE_SKILLS_RAW_BASE = "https://raw.githubusercontent.com/Vleonone/aeonsage-skills/main";
const _COMMUNITY_SKILLS_RAW_BASE = "https://raw.githubusercontent.com/openclaw/skills/main"; // external community source (URL preserved)

/** Get installed skills directory */
function getInstalledDir(): string {
  return path.join(os.homedir(), ".aeonsage", "skills", "installed");
}

/** Ensure directory exists */
function ensureDir(dir: string): void {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

/** Extract raw URL from GitHub tree URL */
function extractRawUrl(treeUrl: string): string {
  // Convert GitHub tree/blob URL to raw.githubusercontent.com format
  // e.g. github.com/.../tree/main/... → raw.githubusercontent.com/.../main/...
  return treeUrl
    .replace("github.com", "raw.githubusercontent.com")
    .replace("/tree/", "/")
    .replace("/blob/", "/");
}

/** Fetch SKILL.md content from GitHub */
async function fetchSkillContent(skillUrl: string): Promise<string> {
  const url = extractRawUrl(skillUrl);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch SKILL.md: ${response.status}`);
  }
  return response.text();
}

/** Try to fetch optional script files */
async function fetchScripts(repoPath: string): Promise<Map<string, string>> {
  const scripts = new Map<string, string>();

  // Common script names to try
  const scriptNames = ["install.sh", "run.sh", "setup.sh", "main.py", "index.js"];

  for (const scriptName of scriptNames) {
    try {
      const url = `${AEONSAGE_SKILLS_RAW_BASE}/${repoPath}/scripts/${scriptName}`;
      const response = await fetch(url);
      if (response.ok) {
        scripts.set(scriptName, await response.text());
      }
    } catch {
      // Script not found, skip
    }
  }

  return scripts;
}

/** Parse SKILL.md frontmatter */
function parseSkillFrontmatter(content: string): Record<string, string> {
  const frontmatter: Record<string, string> = {};

  // Check for YAML frontmatter
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (match) {
    const yaml = match[1];
    const lines = yaml.split("\n");
    for (const line of lines) {
      const [key, ...valueParts] = line.split(":");
      if (key && valueParts.length > 0) {
        frontmatter[key.trim()] = valueParts.join(":").trim();
      }
    }
  }

  return frontmatter;
}

/** Install a skill */
export async function installSkill(skillName: string): Promise<SkillInstallResult> {
  try {
    // Load registry
    let registry = loadRegistry();
    if (!registry) {
      await syncRegistry();
      registry = loadRegistry();
    }

    if (!registry) {
      return {
        success: false,
        skill: {
          name: skillName,
          category: "other",
          description: "",
          author: "",
          url: "",
          repoPath: "",
        },
        error: "Failed to load skill registry",
      };
    }

    // Find skill
    const skill = registry.skills.find(
      (s) => s.name === skillName || s.name === skillName.toLowerCase(),
    );
    if (!skill) {
      return {
        success: false,
        skill: {
          name: skillName,
          category: "other",
          description: "",
          author: "",
          url: "",
          repoPath: "",
        },
        error: `Skill "${skillName}" not found in registry`,
      };
    }

    // Check if already installed
    const installDir = path.join(getInstalledDir(), skill.name);
    if (fs.existsSync(installDir)) {
      return {
        success: true,
        skill: { ...skill, installed: true, localPath: installDir },
        localPath: installDir,
      };
    }

    // Fetch SKILL.md using the URL from registry
    const skillContent = await fetchSkillContent(skill.url);

    // Fetch optional scripts
    const scripts = await fetchScripts(skill.repoPath);

    // Create installation directory
    ensureDir(installDir);

    // Write SKILL.md
    fs.writeFileSync(path.join(installDir, "SKILL.md"), skillContent, "utf-8");

    // Write scripts if any
    if (scripts.size > 0) {
      const scriptsDir = path.join(installDir, "scripts");
      ensureDir(scriptsDir);
      for (const [name, content] of scripts) {
        fs.writeFileSync(path.join(scriptsDir, name), content, "utf-8");
      }
    }

    // Write metadata
    const metadata = {
      ...skill,
      installed: true,
      localPath: installDir,
      installedAt: new Date().toISOString(),
      frontmatter: parseSkillFrontmatter(skillContent),
    };
    fs.writeFileSync(
      path.join(installDir, "metadata.json"),
      JSON.stringify(metadata, null, 2),
      "utf-8",
    );

    return {
      success: true,
      skill: metadata,
      localPath: installDir,
    };
  } catch (error) {
    return {
      success: false,
      skill: {
        name: skillName,
        category: "other",
        description: "",
        author: "",
        url: "",
        repoPath: "",
      },
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Uninstall a skill */
export async function uninstallSkill(
  skillName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const installDir = path.join(getInstalledDir(), skillName);

    if (!fs.existsSync(installDir)) {
      return { success: false, error: `Skill "${skillName}" is not installed` };
    }

    // Remove directory recursively
    fs.rmSync(installDir, { recursive: true, force: true });

    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/** Get installed skill content */
export function getSkillContent(skillName: string): string | null {
  const skillPath = path.join(getInstalledDir(), skillName, "SKILL.md");
  if (fs.existsSync(skillPath)) {
    return fs.readFileSync(skillPath, "utf-8");
  }
  return null;
}

/** List all installed skills */
export function listInstalledSkills(): SkillMeta[] {
  const installedDir = getInstalledDir();
  if (!fs.existsSync(installedDir)) {
    return [];
  }

  const skills: SkillMeta[] = [];
  const entries = fs.readdirSync(installedDir, { withFileTypes: true });

  for (const entry of entries) {
    if (entry.isDirectory()) {
      const metadataPath = path.join(installedDir, entry.name, "metadata.json");
      if (fs.existsSync(metadataPath)) {
        try {
          const metadata = JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
          skills.push(metadata);
        } catch {
          // Invalid metadata, skip
        }
      }
    }
  }

  return skills;
}

/** Update an installed skill */
export async function updateSkill(skillName: string): Promise<SkillInstallResult> {
  // Uninstall first
  const uninstallResult = await uninstallSkill(skillName);
  if (!uninstallResult.success) {
    return {
      success: false,
      skill: {
        name: skillName,
        category: "other",
        description: "",
        author: "",
        url: "",
        repoPath: "",
      },
      error: uninstallResult.error,
    };
  }

  // Reinstall
  return installSkill(skillName);
}

/** Update all installed skills */
export async function updateAllSkills(): Promise<{
  updated: number;
  failed: number;
  errors: string[];
}> {
  const installed = listInstalledSkills();
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const skill of installed) {
    const result = await updateSkill(skill.name);
    if (result.success) {
      updated++;
    } else {
      failed++;
      errors.push(`${skill.name}: ${result.error}`);
    }
  }

  return { updated, failed, errors };
}
