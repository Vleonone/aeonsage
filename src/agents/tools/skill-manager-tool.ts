/**
 * Skill Manager Tool
 * MCP-style tool for AI agents to manage AeonSage skills
 */

import { Type, type Static } from "@sinclair/typebox";
import {
  syncRegistry,
  searchSkills,
  getPopularSkills,
  getRegistryStats,
  needsSync,
} from "../../skills/skill-registry.js";
import {
  installSkill,
  uninstallSkill,
  listInstalledSkills,
  updateSkill,
  getSkillContent,
} from "../../skills/skill-installer.js";
import { SKILL_CATEGORIES, type SkillCategory } from "../../skills/skill-types.js";

const SkillManagerParams = Type.Object({
  action: Type.Union(
    [
      Type.Literal("search"),
      Type.Literal("install"),
      Type.Literal("uninstall"),
      Type.Literal("list"),
      Type.Literal("update"),
      Type.Literal("sync"),
      Type.Literal("stats"),
      Type.Literal("categories"),
      Type.Literal("popular"),
      Type.Literal("read"),
    ],
    { description: "Action to perform" },
  ),

  query: Type.Optional(
    Type.String({
      description: "Search query (for search action)",
    }),
  ),

  skillName: Type.Optional(
    Type.String({
      description: "Skill name (for install/uninstall/update/read actions)",
    }),
  ),

  category: Type.Optional(
    Type.String({
      description: "Filter by category (for search/list actions)",
    }),
  ),

  limit: Type.Optional(
    Type.Number({
      description: "Maximum results to return (default: 20)",
      default: 20,
    }),
  ),

  installedOnly: Type.Optional(
    Type.Boolean({
      description: "Only show installed skills (for search/list actions)",
      default: false,
    }),
  ),
});

type SkillManagerParamsType = Static<typeof SkillManagerParams>;

/** Format skill for display */
function formatSkill(skill: {
  name: string;
  displayName?: string;
  category: string;
  description: string;
  installed?: boolean;
}): string {
  const status = skill.installed ? "✅" : "⬜";
  return `${status} **${skill.displayName || skill.name}** [${skill.category}]\n   ${skill.description}`;
}

/** Create the skill manager tool */
export function createSkillManagerTool() {
  return {
    name: "skill_manager",
    description: `Manage AeonSage skills - a collection of 1800+ AI agent skills.

Actions:
- **search**: Search skills by keyword
- **install**: Install a skill by name
- **uninstall**: Remove an installed skill
- **list**: List installed skills
- **update**: Update an installed skill
- **sync**: Sync skill registry from GitHub
- **stats**: Get registry statistics
- **categories**: List available categories
- **popular**: Get popular/recommended skills
- **read**: Read installed skill content

Examples:
- Search for browser automation: { action: "search", query: "browser automation" }
- Install a skill: { action: "install", skillName: "agent-memory" }
- List installed: { action: "list" }`,

    inputSchema: SkillManagerParams,

    async call(
      params: SkillManagerParamsType,
    ): Promise<{ content: Array<{ type: "text"; text: string }> }> {
      try {
        let result: string;

        switch (params.action) {
          case "sync": {
            const syncResult = await syncRegistry();
            if (syncResult.success) {
              result =
                `✅ Registry synced successfully!\n\n` +
                `📊 **Statistics:**\n` +
                `- Total skills: ${syncResult.totalSkills}\n` +
                `- New skills: ${syncResult.skillsAdded}\n` +
                `- Updated: ${syncResult.skillsUpdated}`;
            } else {
              result = `❌ Sync failed: ${syncResult.error}`;
            }
            break;
          }

          case "search": {
            // Auto-sync if needed
            if (needsSync()) {
              await syncRegistry();
            }

            const searchResult = searchSkills({
              query: params.query,
              category: params.category as SkillCategory | undefined,
              installedOnly: params.installedOnly,
              limit: params.limit || 20,
            });

            if (searchResult.skills.length === 0) {
              result = `🔍 No skills found for "${params.query || "all"}"`;
            } else {
              const skillList = searchResult.skills.map(formatSkill).join("\n\n");
              result = `🔍 **Found ${searchResult.total} skills** (showing ${searchResult.skills.length}):\n\n${skillList}`;
            }
            break;
          }

          case "install": {
            if (!params.skillName) {
              result = "❌ Please specify skillName to install";
              break;
            }

            const installResult = await installSkill(params.skillName);
            if (installResult.success) {
              result =
                `✅ Skill "${params.skillName}" installed successfully!\n\n` +
                `📁 Location: ${installResult.localPath}\n` +
                `📝 Use \`skill_manager read\` to view the skill content.`;
            } else {
              result = `❌ Installation failed: ${installResult.error}`;
            }
            break;
          }

          case "uninstall": {
            if (!params.skillName) {
              result = "❌ Please specify skillName to uninstall";
              break;
            }

            const uninstallResult = await uninstallSkill(params.skillName);
            if (uninstallResult.success) {
              result = `✅ Skill "${params.skillName}" uninstalled successfully!`;
            } else {
              result = `❌ Uninstall failed: ${uninstallResult.error}`;
            }
            break;
          }

          case "list": {
            const installed = listInstalledSkills();
            if (installed.length === 0) {
              result =
                "📦 No skills installed yet.\n\nUse `skill_manager search` to find skills, then `skill_manager install` to add them.";
            } else {
              const skillList = installed.map(formatSkill).join("\n\n");
              result = `📦 **${installed.length} Installed Skills:**\n\n${skillList}`;
            }
            break;
          }

          case "update": {
            if (!params.skillName) {
              result = "❌ Please specify skillName to update";
              break;
            }

            const updateResult = await updateSkill(params.skillName);
            if (updateResult.success) {
              result = `✅ Skill "${params.skillName}" updated successfully!`;
            } else {
              result = `❌ Update failed: ${updateResult.error}`;
            }
            break;
          }

          case "stats": {
            // Auto-sync if needed
            if (needsSync()) {
              await syncRegistry();
            }

            const stats = getRegistryStats();
            if (!stats) {
              result = "❌ Failed to load registry. Run `skill_manager sync` first.";
            } else {
              const categoryList = Object.entries(stats.categories)
                .filter(([, count]: [string, number]) => count > 0)
                .sort(([, a]: [string, number], [, b]: [string, number]) => b - a)
                .map(([cat, count]: [string, number]) => {
                  const info = SKILL_CATEGORIES[cat as SkillCategory];
                  return `${info?.icon || "📁"} ${info?.label || cat}: ${count}`;
                })
                .join("\n");

              result =
                `📊 **Skill Registry Statistics:**\n\n` +
                `- Total skills: ${stats.total}\n` +
                `- Installed: ${stats.installed}\n\n` +
                `**Categories:**\n${categoryList}`;
            }
            break;
          }

          case "categories": {
            const categoryList = Object.entries(SKILL_CATEGORIES)
              .map(
                ([key, info]: [string, { label: string; icon: string }]) =>
                  `${info.icon} **${info.label}** (\`${key}\`)`,
              )
              .join("\n");

            result =
              `📂 **Available Categories:**\n\n${categoryList}\n\n` +
              `Use \`skill_manager search category="category-key"\` to browse.`;
            break;
          }

          case "popular": {
            // Auto-sync if needed
            if (needsSync()) {
              await syncRegistry();
            }

            const popular = getPopularSkills(params.limit || 10);
            if (popular.length === 0) {
              result = "❌ Failed to load popular skills. Run `skill_manager sync` first.";
            } else {
              const skillList = popular.map(formatSkill).join("\n\n");
              result = `⭐ **Popular Skills:**\n\n${skillList}`;
            }
            break;
          }

          case "read": {
            if (!params.skillName) {
              result = "❌ Please specify skillName to read";
              break;
            }

            const content = getSkillContent(params.skillName);
            if (!content) {
              result = `❌ Skill "${params.skillName}" is not installed. Install it first with \`skill_manager install\`.`;
            } else {
              // Truncate if too long
              const maxLength = 4000;
              const truncated =
                content.length > maxLength
                  ? content.slice(0, maxLength) + "\n\n... (truncated)"
                  : content;
              result = `📄 **Skill: ${params.skillName}**\n\n\`\`\`markdown\n${truncated}\n\`\`\``;
            }
            break;
          }

          default:
            result = `❌ Unknown action: ${String(params.action)}`;
        }

        return { content: [{ type: "text", text: result }] };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `❌ Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    },
  };
}
