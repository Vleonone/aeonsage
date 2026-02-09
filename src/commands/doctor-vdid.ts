/**
 * Doctor VDID - Verifiable Digital Identity Check
 *
 * Checks:
 * - VDID registration status
 * - Certificate validity
 * - Identity binding health
 *
 * @module commands/doctor-vdid
 */

import type { AeonSageConfig } from "../config/config.js";
import { note } from "../terminal/note.js";
import { formatCliCommand } from "../cli/command-format.js";

/**
 * Check VDID registration and certificate health
 */
export async function noteVdidHealth(cfg: AeonSageConfig): Promise<void> {
  const warnings: string[] = [];
  const info: string[] = [];

  // Check if VDID is configured
  const vdidConfig = (cfg as Record<string, unknown>).vdid as
    | {
        enabled?: boolean;
        botId?: string;
        certificate?: string;
        registeredAt?: string;
      }
    | undefined;

  if (!vdidConfig?.enabled) {
    info.push("- VDID: Not enabled (bot operates in local-only mode)");
    info.push(`  Enable: ${formatCliCommand("aeonsage vdid register")}`);
    note(info.join("\n"), "VDID");
    return;
  }

  // Check bot ID
  if (!vdidConfig.botId) {
    warnings.push("- VDID: Enabled but no botId registered");
    warnings.push(`  Fix: ${formatCliCommand("aeonsage vdid register")}`);
  } else {
    info.push(`- VDID Bot ID: ${vdidConfig.botId.slice(0, 16)}...`);
  }

  // Check certificate
  if (!vdidConfig.certificate) {
    warnings.push("- VDID: No certificate found (identity unverified)");
  } else {
    // Check certificate expiry
    try {
      const certData = JSON.parse(Buffer.from(vdidConfig.certificate, "base64").toString()) as {
        exp?: number;
      };
      if (certData.exp) {
        const expDate = new Date(certData.exp * 1000);
        const now = new Date();
        const daysUntilExpiry = Math.floor(
          (expDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );

        if (daysUntilExpiry < 0) {
          warnings.push(`- VDID: Certificate EXPIRED (${expDate.toISOString()})`);
          warnings.push(`  Renew: ${formatCliCommand("aeonsage vdid renew")}`);
        } else if (daysUntilExpiry < 30) {
          warnings.push(`- VDID: Certificate expires in ${daysUntilExpiry} days`);
          warnings.push(`  Renew: ${formatCliCommand("aeonsage vdid renew")}`);
        } else {
          info.push(`- VDID: Certificate valid (expires in ${daysUntilExpiry} days)`);
        }
      }
    } catch {
      warnings.push("- VDID: Certificate format invalid");
    }
  }

  // Check registration timestamp
  if (vdidConfig.registeredAt) {
    const regDate = new Date(vdidConfig.registeredAt);
    info.push(`- VDID: Registered ${regDate.toLocaleDateString()}`);
  }

  // Output
  if (warnings.length > 0) {
    note(warnings.join("\n"), "VDID Warning");
  }
  if (info.length > 0) {
    note(info.join("\n"), "VDID");
  }
}

/**
 * Check if VDID registration is required for current features
 */
export function isVdidRequired(cfg: AeonSageConfig): boolean {
  // VDID is required for:
  // - Web3 wallet operations
  // - Payment processing
  // - Cross-agent communication

  const features = (cfg as Record<string, unknown>).features as
    | { web3?: boolean; payments?: boolean; crossAgent?: boolean }
    | undefined;

  return Boolean(features?.web3 || features?.payments || features?.crossAgent);
}
