/**
 * Doctor Plugins - Plugin Registry Health Check
 *
 * Checks:
 * - Installed plugins
 * - Plugin risk levels
 * - Permission audits
 *
 * @module commands/doctor-plugins
 */

import type { AeonSageConfig } from "../config/config.js";
import { note } from "../terminal/note.js";
import { formatCliCommand } from "../cli/command-format.js";

type PluginRiskLevel = "low" | "medium" | "high" | "critical";

interface PluginManifest {
  id: string;
  name: string;
  version: string;
  riskLevel: PluginRiskLevel;
  permissions: string[];
  enabled: boolean;
}

/**
 * Check plugin registry health
 */
export async function notePluginsHealth(cfg: AeonSageConfig): Promise<void> {
  const info: string[] = [];
  const warnings: string[] = [];

  // Check if plugins are enabled
  const pluginsConfig = (cfg as Record<string, unknown>).plugins as
    | {
        enabled?: boolean;
        installed?: PluginManifest[];
      }
    | undefined;

  if (!pluginsConfig?.enabled) {
    info.push("- Plugins: Disabled");
    info.push(`  Enable: ${formatCliCommand("aeonsage config set plugins.enabled true")}`);
    note(info.join("\n"), "Plugins");
    return;
  }

  const installed = pluginsConfig.installed ?? [];

  if (installed.length === 0) {
    info.push("- Plugins: No plugins installed");
    note(info.join("\n"), "Plugins");
    return;
  }

  info.push(`- Plugins: ${installed.length} installed`);

  // Count by risk level
  const byRisk: Record<PluginRiskLevel, number> = {
    low: 0,
    medium: 0,
    high: 0,
    critical: 0,
  };

  const highRiskPlugins: string[] = [];
  const criticalPlugins: string[] = [];

  for (const plugin of installed) {
    byRisk[plugin.riskLevel]++;

    if (plugin.enabled) {
      if (plugin.riskLevel === "high") {
        highRiskPlugins.push(plugin.name);
      } else if (plugin.riskLevel === "critical") {
        criticalPlugins.push(plugin.name);
      }
    }
  }

  info.push(
    `  Risk breakdown: ${byRisk.low} low, ${byRisk.medium} medium, ${byRisk.high} high, ${byRisk.critical} critical`,
  );

  // Warn about high/critical risk plugins
  if (criticalPlugins.length > 0) {
    warnings.push(`- CRITICAL risk plugins enabled: ${criticalPlugins.join(", ")}`);
    warnings.push("  These plugins have extensive system access. Review their permissions.");
  }

  if (highRiskPlugins.length > 0) {
    warnings.push(`- HIGH risk plugins enabled: ${highRiskPlugins.join(", ")}`);
  }

  // Audit dangerous permissions
  const dangerousPermissions = ["security:scan", "security:assess", "network:external"];
  const pluginsWithDangerousPerms: string[] = [];

  for (const plugin of installed) {
    if (!plugin.enabled) continue;
    for (const perm of plugin.permissions) {
      if (dangerousPermissions.includes(perm)) {
        pluginsWithDangerousPerms.push(`${plugin.name} (${perm})`);
      }
    }
  }

  if (pluginsWithDangerousPerms.length > 0) {
    warnings.push(`- Dangerous permissions detected:`);
    for (const entry of pluginsWithDangerousPerms) {
      warnings.push(`  • ${entry}`);
    }
  }

  // Output
  if (warnings.length > 0) {
    note(warnings.join("\n"), "Plugins Security");
  }
  note(info.join("\n"), "Plugins");
}

/**
 * Audit a specific plugin's permissions
 */
export function auditPluginPermissions(plugin: PluginManifest): {
  allowed: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];

  // Check for dangerous permission combinations
  const hasNetworkExternal = plugin.permissions.includes("network:external");
  const hasSecurityScan = plugin.permissions.includes("security:scan");
  const hasFilesystemWrite = plugin.permissions.includes("filesystem:write");

  if (hasNetworkExternal && hasSecurityScan) {
    warnings.push("Plugin can scan external networks - ensure authorization model is enforced");
  }

  if (hasNetworkExternal && hasFilesystemWrite) {
    warnings.push("Plugin can download and write files - review for potential malware risk");
  }

  // High/critical risk always require explicit acknowledgment
  const allowed = plugin.riskLevel !== "critical" || warnings.length === 0;

  return { allowed, warnings };
}
