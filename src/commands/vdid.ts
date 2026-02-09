/**
 * VDID CLI Commands
 *
 * Manage VDID API configuration for AeonSage
 */

import type { Command } from "commander";
import * as readline from "node:readline";
import {
  saveVDIDConfig,
  loadVDIDConfig,
  createVDIDClient,
  maskKeyId,
} from "../security/vdid-client.js";

/**
 * Register VDID commands
 */
export function registerVDIDCommands(program: Command): void {
  const vdid = program.command("vdid").description("VDID identity management");

  // Configure VDID credentials
  vdid
    .command("configure")
    .description("Configure VDID API credentials")
    .option("--key-id <keyId>", "VDID API Key ID")
    .option("--secret-key <secretKey>", "VDID Secret Key")
    .option("--base-url <url>", "VDID API Base URL", "https://api.vdid.io")
    .action(async (options) => {
      console.log("╔══════════════════════════════════════════════════════════════╗");
      console.log("║            VDID API Configuration                            ║");
      console.log("╚══════════════════════════════════════════════════════════════╝");
      console.log();

      let keyId = options.keyId;
      let secretKey = options.secretKey;
      const baseUrl = options.baseUrl;

      // Interactive prompts if not provided
      if (!keyId || !secretKey) {
        const rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
        });

        const question = (prompt: string): Promise<string> =>
          new Promise((resolve) => rl.question(prompt, resolve));

        if (!keyId) {
          keyId = await question("Enter VDID_API_KEY: ");
        }
        if (!secretKey) {
          secretKey = await question("Enter VDID_SECRET_KEY: ");
        }

        rl.close();
      }

      if (!keyId || !secretKey) {
        console.error("❌ API Key and Secret Key are required");
        process.exit(1);
      }

      // Validate format
      if (!keyId.startsWith("vdid_")) {
        console.error("❌ Invalid API Key format (should start with 'vdid_')");
        process.exit(1);
      }

      if (secretKey.length < 32) {
        console.error("❌ Secret Key too short (should be at least 32 characters)");
        process.exit(1);
      }

      // Save configuration
      try {
        saveVDIDConfig({
          baseUrl,
          keyId,
          secretKey,
        });

        console.log();
        console.log("✅ VDID configuration saved successfully");
        console.log();
        console.log("   Base URL:  " + baseUrl);
        console.log("   API Key:   " + maskKeyId(keyId));
        console.log("   Secret:    ****" + secretKey.slice(-4));
        console.log();
        console.log("   Config saved to: ~/.aeonsage/.vdid_config (encrypted)");
        console.log();
      } catch (error) {
        console.error("❌ Failed to save configuration:", error);
        process.exit(1);
      }
    });

  // Show current VDID status
  vdid
    .command("status")
    .description("Show current VDID configuration status")
    .action(async () => {
      const config = loadVDIDConfig();

      console.log("=".repeat(64));
      console.log("               VDID Configuration Status                      ");
      console.log("=".repeat(64));
      console.log();

      if (!config) {
        console.log("   Status:    ❌ Not Configured");
        console.log();
        console.log("   Run: pnpm aeonsage vdid configure");
        return;
      }

      console.log("   Status:    ✅ Configured");
      console.log("   Base URL:  " + config.baseUrl);
      console.log("   API Key:   " + maskKeyId(config.keyId));
      console.log();

      // Test connection using new status endpoint
      console.log("   Checking activation status...");
      const client = createVDIDClient();
      if (client) {
        try {
          const status = await client.checkActivationStatus();
          if (status.activated) {
            console.log("   Activation: ✅ Activated");
            console.log("   VID:        " + status.vid);
            console.log("   Status:     " + status.status);
            console.log();
            // Get full identity info
            try {
              const identity = await client.getMyIdentity();
              console.log("   DID:        " + identity.did);
              console.log(
                "   V-Score:    " + identity.vscoreTotal + " (" + identity.vscoreLevel + ")",
              );
            } catch {
              // Identity details not available yet
            }
          } else {
            console.log("   Activation: ⚠️  Not Activated");
            console.log();
            console.log("   To activate, use VDID Dashboard or SDK:");
            if (status.action) {
              console.log("   " + status.action.method + " " + status.action.endpoint);
              console.log("   Body: " + JSON.stringify(status.action.exampleBody));
            }
          }
        } catch (error: any) {
          console.log("   Connection: ❌ Failed - " + error.message);
        }
      }
      console.log();
    });

  // Test VDID API connection
  vdid
    .command("test")
    .description("Test VDID API connection")
    .action(async () => {
      console.log("Testing VDID API connection...");
      console.log();

      const client = createVDIDClient();
      if (!client) {
        console.log("❌ VDID not configured");
        console.log("   Run: pnpm aeonsage vdid configure");
        return;
      }

      try {
        // Test public endpoint (no auth required)
        console.log("1. Testing public DID resolver...");
        try {
          await client.resolveDID("did:vdid:base:test");
        } catch (e: any) {
          if (e.status === 404) {
            console.log("   ✅ DID resolver accessible");
          } else {
            throw e;
          }
        }

        // Test authenticated endpoint
        console.log("2. Testing authenticated API...");
        try {
          await client.getMyIdentity();
          console.log("   ✅ Authentication successful");
        } catch (e: any) {
          if (e.status === 404) {
            console.log("   ✅ Authentication successful (identity not yet registered)");
          } else if (e.status === 401) {
            console.log("   ❌ Authentication failed - check API Key and Secret");
          } else {
            throw e;
          }
        }

        console.log();
        console.log("✅ VDID API connection test passed");
      } catch (error: any) {
        console.log();
        console.log("❌ Connection test failed:", error.message);
      }
    });
}
