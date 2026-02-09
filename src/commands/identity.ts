/**
 * CLI Command: identity
 *
 * View and export bot identity, DID, and wallet information.
 *
 * Commands:
 * - show: Display identity summary (safe)
 * - export-keys: Export wallet private keys (requires confirmation)
 * - export-did: Export DID document
 */

import { Command } from "commander";
import * as readline from "node:readline";
import {
  getIdentitySummary,
  exportDIDDocument,
  exportPrivateKey,
  exportAllWalletSecrets,
  needsBirthCeremony,
} from "../security/bot-birth.js";

export function registerIdentityCommand(program: Command): void {
  const identity = program
    .command("identity")
    .description("Manage bot sovereign identity, DID, and wallets");

  // Show identity summary (safe)
  identity
    .command("show")
    .description("Display identity summary (addresses only, no private keys)")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      if (needsBirthCeremony()) {
        console.log("⚠️  Identity not yet created.");
        console.log("Run 'pnpm aeonsage onboard' to trigger Birth Ceremony.");
        return;
      }

      const summary = getIdentitySummary();
      if (!summary) {
        console.log("❌ Failed to load identity");
        return;
      }

      if (opts.json) {
        console.log(JSON.stringify(summary, null, 2));
        return;
      }

      const id = summary as {
        id: string;
        did: string;
        network: string;
        status: string;
        createdAt: string;
        wallets: Array<{ chain: string; address: string }>;
      };

      console.log("\n◈ AeonSage Sovereign Identity\n");
      console.log(`  Bot ID:    ${id.id}`);
      console.log(`  DID:       ${id.did}`);
      console.log(`  Network:   ${id.network}`);
      console.log(`  Status:    ${id.status}`);
      console.log(`  Created:   ${id.createdAt}`);
      console.log("\n  Wallets:");
      for (const w of id.wallets) {
        console.log(`    ${w.chain.toUpperCase()}: ${w.address}`);
      }
      console.log("");
    });

  // Export DID document
  identity
    .command("export-did")
    .description("Export DID document (W3C standard format)")
    .option("--json", "Output as JSON (default)")
    .action(async () => {
      if (needsBirthCeremony()) {
        console.log("⚠️  Identity not yet created.");
        return;
      }

      const doc = exportDIDDocument();
      if (!doc) {
        console.log("❌ Failed to export DID document");
        return;
      }

      console.log(JSON.stringify(doc, null, 2));
    });

  // Export single private key
  identity
    .command("export-key <chain>")
    .description("Export private key for a specific chain (ETH, SOL, etc.)")
    .option("--yes", "Skip confirmation prompt")
    .action(async (chain: string, opts) => {
      if (needsBirthCeremony()) {
        console.log("⚠️  Identity not yet created.");
        return;
      }

      if (!opts.yes) {
        const confirmed = await confirmDangerousAction(
          `⚠️  SECURITY WARNING: This will display your ${chain.toUpperCase()} private key.\n` +
            `   Anyone with this key can access your funds.\n\n` +
            `   Type "EXPORT" to confirm: `,
        );
        if (!confirmed) {
          console.log("Cancelled.");
          return;
        }
      }

      const result = exportPrivateKey(chain);
      if (!result.success) {
        console.log(`❌ ${result.error}`);
        return;
      }

      console.log(`\n${chain.toUpperCase()} Private Key:\n`);
      console.log(`  ${result.privateKey}`);
      console.log("\n⚠️  Store this securely. Never share it.\n");
    });

  // Export all wallet secrets
  identity
    .command("export-all-keys")
    .description("Export all wallet private keys (DANGEROUS)")
    .option("--yes", "Skip confirmation prompt")
    .option("--json", "Output as JSON")
    .action(async (opts) => {
      if (needsBirthCeremony()) {
        console.log("⚠️  Identity not yet created.");
        return;
      }

      if (!opts.yes) {
        const confirmed = await confirmDangerousAction(
          `⚠️  SECURITY WARNING: This will display ALL your private keys.\n` +
            `   Anyone with these keys can access ALL your funds.\n\n` +
            `   Type "EXPORT ALL" to confirm: `,
          "EXPORT ALL",
        );
        if (!confirmed) {
          console.log("Cancelled.");
          return;
        }
      }

      const result = exportAllWalletSecrets();
      if (!result.success) {
        console.log(`❌ ${result.error}`);
        return;
      }

      if (opts.json) {
        console.log(JSON.stringify(result.wallets, null, 2));
        return;
      }

      console.log("\n◈ All Wallet Private Keys\n");
      for (const w of result.wallets ?? []) {
        console.log(`  ${w.chain.toUpperCase()}:`);
        console.log(`    Address:     ${w.address}`);
        console.log(`    Private Key: ${w.privateKey}`);
        console.log("");
      }
      console.log("⚠️  Store these securely. Never share them.\n");
    });
}

async function confirmDangerousAction(
  prompt: string,
  expectedInput: string = "EXPORT",
): Promise<boolean> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer.trim() === expectedInput);
    });
  });
}
