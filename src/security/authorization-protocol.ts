/**
 * Authorization Protocol Generator
 *
 * Generates a formal authorization document when:
 * 1. Bot first establishes communication with a user
 * 2. User requests new permissions
 * 3. Configuration changes require re-authorization
 *
 * The protocol document includes:
 * - Risk level assessment for each permission
 * - Clear authorization/revocation instructions
 * - Digital signature placeholder
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { homedir } from "node:os";

/** Permission categories */
export type PermissionCategory =
  | "messaging"
  | "email"
  | "browser"
  | "system"
  | "wallet"
  | "data"
  | "network";

/** Risk level */
export type RiskLevel = "low" | "medium" | "high" | "critical";

/** Permission definition */
export interface Permission {
  id: string;
  name: string;
  category: PermissionCategory;
  description: string;
  riskLevel: RiskLevel;
  enabled: boolean;
  configured: boolean;
  platform?: string;
  configKeys?: string[];
}

/** Authorization protocol document */
export interface AuthorizationProtocol {
  version: string;
  generatedAt: string;
  systemVersion: string;
  applicant: string;
  permissions: Permission[];
  dataProtection: DataProtectionSection;
  securityMeasures: SecurityMeasure[];
  signature?: {
    signed: boolean;
    signedAt?: string;
    signedBy?: string;
    method?: "pin" | "voice" | "biometric";
  };
}

interface DataProtectionSection {
  piiTypes: string[];
  credentialTypes: string[];
  storageLocation: string;
  retentionDays: number;
}

interface SecurityMeasure {
  id: string;
  name: string;
  enabled: boolean;
  recommended: boolean;
}

/** Default permissions list */
const DEFAULT_PERMISSIONS: Permission[] = [
  // Messaging Platforms
  {
    id: "telegram",
    name: "Telegram",
    category: "messaging",
    description: "Read/send messages, Group management",
    riskLevel: "medium",
    enabled: false,
    configured: false,
    platform: "cross-platform",
  },
  {
    id: "whatsapp",
    name: "WhatsApp",
    category: "messaging",
    description: "Read/send messages, Contact access",
    riskLevel: "high",
    enabled: false,
    configured: false,
    platform: "cross-platform",
  },
  {
    id: "discord",
    name: "Discord",
    category: "messaging",
    description: "Read/send messages, Server management",
    riskLevel: "medium",
    enabled: false,
    configured: false,
    platform: "cross-platform",
  },
  {
    id: "slack",
    name: "Slack",
    category: "messaging",
    description: "Read/send messages, Workspace management",
    riskLevel: "medium",
    enabled: false,
    configured: false,
    platform: "cross-platform",
  },
  {
    id: "webchat",
    name: "WebChat",
    category: "messaging",
    description: "Gateway built-in (No external auth needed)",
    riskLevel: "low",
    enabled: true,
    configured: true,
    platform: "cross-platform",
  },
  // Email
  {
    id: "gmail",
    name: "Gmail",
    category: "email",
    description: "Read emails, Send emails, Label management",
    riskLevel: "high",
    enabled: false,
    configured: false,
    platform: "cross-platform",
  },
  // Browser
  {
    id: "browser",
    name: "Browser Tool",
    category: "browser",
    description: "Start Chrome/Chromium, Automation ops",
    riskLevel: "medium",
    enabled: false,
    configured: false,
    platform: "cross-platform",
  },
  // System
  {
    id: "exec",
    name: "Shell Execution",
    category: "system",
    description: "Execute Shell commands",
    riskLevel: "critical",
    enabled: false,
    configured: false,
    platform: "cross-platform",
  },
  {
    id: "file_write",
    name: "File Write",
    category: "system",
    description: "Create and modify files",
    riskLevel: "medium",
    enabled: true,
    configured: true,
    platform: "cross-platform",
  },
  {
    id: "file_delete",
    name: "File Delete",
    category: "system",
    description: "Delete files and directories",
    riskLevel: "high",
    enabled: false,
    configured: false,
    platform: "cross-platform",
  },
  // Network
  {
    id: "web_search",
    name: "Web Search",
    category: "network",
    description: "Web search (Requires Brave API)",
    riskLevel: "low",
    enabled: false,
    configured: false,
    platform: "cross-platform",
  },
  {
    id: "web_fetch",
    name: "Web Fetch",
    category: "network",
    description: "Fetch web content",
    riskLevel: "low",
    enabled: true,
    configured: true,
    platform: "cross-platform",
  },
  // Wallet
  {
    id: "wallet",
    name: "Wallet Operations",
    category: "wallet",
    description: "Wallet transactions, Transfer, Signing",
    riskLevel: "critical",
    enabled: false,
    configured: false,
    platform: "cross-platform",
  },
];

/** Default security measures */
const DEFAULT_SECURITY_MEASURES: SecurityMeasure[] = [
  { id: "dm_pairing", name: "DM Pairing Mode", enabled: true, recommended: true },
  { id: "allowlist", name: "Access Allowlist", enabled: true, recommended: true },
  { id: "local_storage", name: "Local Storage", enabled: true, recommended: true },
  { id: "gateway_auth", name: "Gateway Auth", enabled: true, recommended: true },
  { id: "data_encryption", name: "Data Encryption", enabled: false, recommended: true },
  { id: "audit_log", name: "Audit Log", enabled: false, recommended: true },
  { id: "command_whitelist", name: "Command Whitelist", enabled: false, recommended: true },
  { id: "network_isolation", name: "Network Isolation", enabled: false, recommended: false },
];

/**
 * Generate authorization protocol document
 */
export function generateAuthorizationProtocol(options?: {
  applicant?: string;
  systemVersion?: string;
}): AuthorizationProtocol {
  const now = new Date();

  return {
    version: "2.0",
    generatedAt: now.toISOString(),
    systemVersion: options?.systemVersion ?? "AeonSage v2026.1.31",
    applicant: options?.applicant ?? "User",
    permissions: [...DEFAULT_PERMISSIONS],
    dataProtection: {
      piiTypes: ["Name/Phone/Email", "Location", "Device Info", "Chat History"],
      credentialTypes: ["API Keys", "Bot Tokens", "OAuth Tokens", "Gateway Token"],
      storageLocation: path.join(homedir(), ".aeonsage"),
      retentionDays: 0, // Perpetual
    },
    securityMeasures: [...DEFAULT_SECURITY_MEASURES],
    signature: {
      signed: false,
    },
  };
}

/**
 * Render protocol as markdown
 */
export function renderProtocolMarkdown(protocol: AuthorizationProtocol): string {
  const lines: string[] = [];

  // Header
  lines.push("# 📋 AeonSage Authorization Protocol");
  lines.push("");
  lines.push(`**Generated At**: ${new Date(protocol.generatedAt).toLocaleString("en-US")}`);
  lines.push(`**Applicant**: ${protocol.applicant}`);
  lines.push(`**System Version**: ${protocol.systemVersion}`);
  lines.push("");
  lines.push("---");
  lines.push("");

  // Permission summary by risk
  const byRisk = groupByRisk(protocol.permissions);

  // Low risk
  if (byRisk.low.length > 0) {
    lines.push("## 🟢 Low Risk Permissions (Recommended to authorize immediately)");
    lines.push("");
    lines.push("| Feature | Description | Status |");
    lines.push("|------|------|------|");
    for (const p of byRisk.low) {
      lines.push(
        `| **${p.name}** | ${p.description} | ${p.enabled ? "✅ Enabled" : "⬜ Disabled"} |`,
      );
    }
    lines.push("");
  }

  // Medium risk
  if (byRisk.medium.length > 0) {
    lines.push("## 🟡 Medium Risk Permissions (Recommended to authorize item by item)");
    lines.push("");
    lines.push("| Feature | Description | Status |");
    lines.push("|------|------|------|");
    for (const p of byRisk.medium) {
      lines.push(
        `| **${p.name}** | ${p.description} | ${p.enabled ? "✅ Enabled" : "⬜ Disabled"} |`,
      );
    }
    lines.push("");
  }

  // High risk
  if (byRisk.high.length > 0) {
    lines.push("## 🟠 High Risk Permissions (Explicit authorization required)");
    lines.push("");
    lines.push("| Feature | Description | Status |");
    lines.push("|------|------|------|");
    for (const p of byRisk.high) {
      lines.push(
        `| **${p.name}** | ${p.description} | ${p.enabled ? "✅ Enabled" : "⬜ Disabled"} |`,
      );
    }
    lines.push("");
  }

  // Critical risk
  if (byRisk.critical.length > 0) {
    lines.push("## 🔴 Critical Risk Permissions (Requires MFA)");
    lines.push("");
    lines.push(
      "> ⚠️ The following permissions may lead to serious consequences, requires biometrics or 2FA",
    );
    lines.push("");
    lines.push("| Feature | Description | Status |");
    lines.push("|------|------|------|");
    for (const p of byRisk.critical) {
      lines.push(
        `| **${p.name}** | ${p.description} | ${p.enabled ? "✅ Enabled" : "🔒 Locked"} |`,
      );
    }
    lines.push("");
  }

  // Security measures
  lines.push("---");
  lines.push("");
  lines.push("## 🛡️ Security Measures");
  lines.push("");
  for (const m of protocol.securityMeasures) {
    const status = m.enabled ? "✅" : "⬜";
    const rec = m.recommended ? " (Recommended)" : "";
    lines.push(`- ${status} ${m.name}${rec}`);
  }
  lines.push("");

  // Signature
  lines.push("---");
  lines.push("");
  lines.push("## ✍️ Authorization Signature");
  lines.push("");
  if (protocol.signature?.signed) {
    lines.push(`**Status**: ✅ Signed`);
    lines.push(`**Signed At**: ${protocol.signature.signedAt}`);
    lines.push(`**Method**: ${protocol.signature.method}`);
  } else {
    lines.push("**Status**: ⏳ Pending Signature");
    lines.push("");
    lines.push("```");
    lines.push(
      "I confirm that I have read and understood the above permission descriptions and agree to authorize AeonSage to access selected permissions.",
    );
    lines.push("");
    lines.push("Signature: _____________");
    lines.push(`Date: ${new Date().toISOString().split("T")[0]}`);
    lines.push("```");
  }
  lines.push("");

  // Revocation
  lines.push("---");
  lines.push("");
  lines.push("## 🔄 Revocation Method");
  lines.push("");
  lines.push("1. Modify configuration file: `~/.aeonsage/aeonsage.json`");
  lines.push("2. Use Kill Switch: `aeonsage kill`");
  lines.push("3. Web UI: Access localhost:18789/settings");
  lines.push("");

  return lines.join("\n");
}

/**
 * Save protocol to file
 */
export function saveProtocol(protocol: AuthorizationProtocol, filePath?: string): string {
  const targetPath = filePath ?? path.join(homedir(), ".aeonsage", "authorization_protocol.md");
  const dir = path.dirname(targetPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const content = renderProtocolMarkdown(protocol);
  fs.writeFileSync(targetPath, content, "utf-8");

  return targetPath;
}

/** Group permissions by risk level */
function groupByRisk(permissions: Permission[]): Record<RiskLevel, Permission[]> {
  return {
    low: permissions.filter((p) => p.riskLevel === "low"),
    medium: permissions.filter((p) => p.riskLevel === "medium"),
    high: permissions.filter((p) => p.riskLevel === "high"),
    critical: permissions.filter((p) => p.riskLevel === "critical"),
  };
}

/**
 * Check if authorization is needed for first-time setup
 */
export function isFirstTimeSetup(): boolean {
  const protocolPath = path.join(homedir(), ".aeonsage", "authorization_protocol.md");
  return !fs.existsSync(protocolPath);
}

/**
 * Sign the protocol (requires authentication)
 */
export function signProtocol(
  protocol: AuthorizationProtocol,
  authData: { method: "pin" | "voice" | "biometric"; verified: boolean },
): { success: boolean; error?: string } {
  if (!authData.verified) {
    return { success: false, error: "Authentication not verified" };
  }

  protocol.signature = {
    signed: true,
    signedAt: new Date().toISOString(),
    signedBy: protocol.applicant,
    method: authData.method,
  };

  return { success: true };
}
