/**
 * Bot Birth - Bot Onboarding Process
 *
 * Executed on first bot startup:
 * 1. Detect if it's the first run
 * 2. Generate core identity (local, no network needed)
 *    - God Key seed
 *    - Multi-chain wallets + private keys
 *    - DID seed
 * 3. Show authorization protocol
 * 4. Activate after user signing
 *
 * Security Principles:
 * - All keys generated locally, never uploaded
 * - DID generated offline, registered via VDID API later
 * - God Key set by user, system only stores hash
 *
 * VDID Format: did:vdid:[network]:[32-char-hex]
 * Supported networks: base, ethereum, polygon, arbitrum, optimism
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { homedir } from "node:os";
import { EventEmitter } from "node:events";
import { createVDIDClient } from "./vdid-client.js";

/** Supported VDID Networks */
export type VDIDNetwork = "base" | "ethereum" | "polygon" | "arbitrum" | "optimism";

/** Bot Identity */
export interface BotIdentity {
  id: string; // Unique identifier
  did: string; // DID identifier (did:vdid:base:xxx)
  network: VDIDNetwork; // VDID Network
  createdAt: string; // Creation time
  version: string; // System version
  wallets: WalletInfo[]; // Multi-chain wallets
  status: "pending" | "active" | "suspended";
  registrationStatus: "local" | "registered" | "failed"; // API registration status
}

/** Wallet Information */
export interface WalletInfo {
  chain: string; // Chain name (eth, sol, btc, etc.)
  address: string; // Address
  publicKey: string; // Public key
  privateKeyRef: string; // Private key reference (encrypted storage)
  createdAt: string;
}

/** Birth Ceremony Result */
export interface BirthCeremonyResult {
  success: boolean;
  identity?: BotIdentity;
  godKeySet: boolean;
  protocolSigned: boolean;
  error?: string;
}

/** Bot Birth Manager */
class BotBirthManager extends EventEmitter {
  private static instance: BotBirthManager;
  private identityPath: string;
  private keysPath: string;
  private identity: BotIdentity | null = null;

  private constructor() {
    super();
    const aeonsageDir = path.join(homedir(), ".aeonsage");
    this.identityPath = path.join(aeonsageDir, "identity.json");
    this.keysPath = path.join(aeonsageDir, ".keys"); // Hidden file
    this.loadIdentity();
  }

  static getInstance(): BotBirthManager {
    if (!BotBirthManager.instance) {
      BotBirthManager.instance = new BotBirthManager();
    }
    return BotBirthManager.instance;
  }

  /** Check if it's the first birth */
  isFirstBirth(): boolean {
    return this.identity === null;
  }

  /** Get current identity */
  getIdentity(): BotIdentity | null {
    return this.identity;
  }

  /**
   * Execute birth ceremony
   * ⚠️ Can only be executed once
   *
   * @param params.enableVDID - If true, register with VDID API; if false, skip VDID (local-only mode)
   */
  async performBirthCeremony(params: {
    systemVersion: string;
    enabledChains?: string[];
    enableVDID?: boolean; // Default: true (attempt VDID registration)
  }): Promise<BirthCeremonyResult> {
    if (this.identity) {
      return {
        success: false,
        error: "Bot already born, cannot repeat birth ceremony",
        godKeySet: false,
        protocolSigned: false,
      };
    }

    try {
      // Step 1: Generate unique ID
      const botId = this.generateBotId();

      // Step 2: Generate multi-chain wallets (local, secure)
      const chains = params.enabledChains ?? ["eth", "sol"];
      const wallets = await this.generateWallets(chains);

      // Step 3: Register DID via VDID API (or use local-only mode)
      const network: VDIDNetwork = "base";
      let did: string;
      let registrationStatus: "local" | "registered" | "failed";

      const enableVDID = params.enableVDID !== false; // Default: true

      if (enableVDID) {
        const vdidClient = createVDIDClient();
        if (vdidClient) {
          try {
            console.log("[BotBirth] Registering identity via VDID API...");
            const result = await vdidClient.registerIdentity("AeonSage", network);
            did = result.identity.did;
            registrationStatus = "registered";
            console.log(`[BotBirth] Identity registered: VID=${result.identity.vid}, DID=${did}`);
            console.log(
              `[BotBirth] V-Score: ${result.identity.vscoreTotal} (${result.identity.vscoreLevel})`,
            );
            console.log(
              "[BotBirth] ⚠️  VDID identity is permanent — this bot's history is now auditable",
            );
          } catch (err) {
            console.warn(`[BotBirth] VDID API registration failed: ${String(err)}`);
            console.log(
              "[BotBirth] Using pending status - can register later via 'identity register'",
            );
            did = `{{PENDING:${network}}}`;
            registrationStatus = "failed";
          }
        } else {
          console.log("[BotBirth] VDID API not configured - DID pending");
          console.log("         Configure with: pnpm aeonsage vdid configure");
          did = `{{PENDING:${network}}}`;
          registrationStatus = "local";
        }
      } else {
        // Local-only mode: no VDID registration
        console.log("[BotBirth] VDID disabled - running in local-only mode");
        console.log("[BotBirth] Note: Web3 wallet signing features will be restricted");
        did = `local:${this.generateBotId().slice(5, 21)}`;
        registrationStatus = "local";
      }

      // Step 4: Create identity
      this.identity = {
        id: botId,
        did,
        network,
        createdAt: new Date().toISOString(),
        version: params.systemVersion,
        wallets,
        status: "pending", // Waiting for user to sign protocol
        registrationStatus,
      };

      // Step 5: Save identity
      this.saveIdentity();

      // Step 6: Print welcome message and identity card
      this.printBirthCertificate();

      this.emit("birth-completed", this.identity);

      return {
        success: true,
        identity: this.identity,
        godKeySet: false, // Requires user setup
        protocolSigned: false, // Requires user signing
      };
    } catch (err) {
      return {
        success: false,
        error: `Birth ceremony failed: ${String(err)}`,
        godKeySet: false,
        protocolSigned: false,
      };
    }
  }

  /**
   * Activate identity (after user signs protocol)
   */
  activateIdentity(): { success: boolean; error?: string } {
    if (!this.identity) {
      return { success: false, error: "Identity not found" };
    }

    if (this.identity.status === "active") {
      return { success: true };
    }

    this.identity.status = "active";
    this.saveIdentity();

    this.emit("identity-activated", this.identity);
    return { success: true };
  }

  /**
   * Suspend identity
   */
  suspendIdentity(): void {
    if (this.identity) {
      this.identity.status = "suspended";
      this.saveIdentity();
      this.emit("identity-suspended", this.identity);
    }
  }

  /**
   * Generate unique Bot ID
   */
  private generateBotId(): string {
    const timestamp = Date.now().toString(36);
    const random = crypto.randomBytes(8).toString("hex");
    const machineId = this.getMachineFingerprint();

    const combined = `${timestamp}-${random}-${machineId}`;
    const hash = crypto.createHash("sha256").update(combined).digest("hex");

    return `aeon-${hash.slice(0, 16)}`;
  }

  /**
   * Generate DID identifier
   * Official format: did:vdid:[network]:[32-char-hex]
   * Regex: /^did:vdid:(base|ethereum|polygon|arbitrum|optimism):[a-f0-9]{32}$/
   */
  private generateDID(botId: string, network: VDIDNetwork = "base"): string {
    const seed = `${botId}-${Date.now()}-${crypto.randomBytes(16).toString("hex")}`;
    const hash = crypto.createHash("sha256").update(seed).digest("hex");
    // VDID requires exactly 32-char hex identifier
    return `did:vdid:${network}:${hash.slice(0, 32)}`;
  }

  /**
   * Generate multi-chain wallets
   */
  private async generateWallets(chains: string[]): Promise<WalletInfo[]> {
    const wallets: WalletInfo[] = [];

    for (const chain of chains) {
      const wallet = this.generateWallet(chain);
      wallets.push(wallet);
    }

    return wallets;
  }

  /**
   * Generate single wallet
   * Note: This is a simplified implementation; use professional libraries in production.
   */
  private generateWallet(chain: string): WalletInfo {
    // Generate key pair
    const privateKey = crypto.randomBytes(32);
    const privateKeyHex = privateKey.toString("hex");

    // Simplified pubkey/address generation (production uses ethers.js / @solana/web3.js)
    const publicKeyHash = crypto.createHash("sha256").update(privateKey).digest();
    const address = this.deriveAddress(chain, publicKeyHash);
    const publicKey = publicKeyHash.toString("hex");

    // Encrypt and store private key
    const keyRef = this.storePrivateKey(chain, privateKeyHex);

    return {
      chain,
      address,
      publicKey,
      privateKeyRef: keyRef,
      createdAt: new Date().toISOString(),
    };
  }

  /**
   * Derive address based on chain type
   */
  private deriveAddress(chain: string, publicKeyHash: Buffer): string {
    const addressHash = publicKeyHash.slice(0, 20).toString("hex");

    switch (chain.toLowerCase()) {
      case "eth":
      case "bsc":
      case "polygon":
      case "arb":
        return `0x${addressHash}`;
      case "sol":
        return crypto.createHash("sha256").update(publicKeyHash).digest("base64").slice(0, 44);
      case "btc":
        return `bc1${addressHash.slice(0, 38)}`;
      default:
        return `0x${addressHash}`;
    }
  }

  /**
   * Store private key (encrypted)
   */
  private storePrivateKey(chain: string, privateKey: string): string {
    const keyRef = `key-${chain}-${Date.now()}`;

    // encrypt with system key (simplified implementation)
    const cipher = crypto.createCipheriv(
      "aes-256-gcm",
      this.getSystemKey(),
      crypto.randomBytes(12),
    );

    // Production should use more secure key management
    const keysDir = path.dirname(this.keysPath);
    if (!fs.existsSync(keysDir)) {
      fs.mkdirSync(keysDir, { recursive: true });
    }

    // Store encrypted private key
    const keyFile = path.join(keysDir, `.${keyRef}`);
    const encrypted = Buffer.concat([cipher.update(privateKey, "utf8"), cipher.final()]);

    fs.writeFileSync(keyFile, encrypted, { mode: 0o600 });

    return keyRef;
  }

  /**
   * Get system key (for private key encryption)
   */
  private getSystemKey(): Buffer {
    const keyPath = path.join(homedir(), ".aeonsage", ".system_key");

    if (fs.existsSync(keyPath)) {
      return fs.readFileSync(keyPath);
    }

    // Initial generation
    const key = crypto.randomBytes(32);
    const dir = path.dirname(keyPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(keyPath, key, { mode: 0o600 });

    return key;
  }

  /**
   * Get machine fingerprint
   */
  private getMachineFingerprint(): string {
    const os = require("node:os");
    const data = [os.hostname(), os.platform(), os.arch(), os.cpus()[0]?.model ?? "unknown"].join(
      "-",
    );

    return crypto.createHash("md5").update(data).digest("hex").slice(0, 8);
  }

  /**
   * Export DID Document
   */
  exportDIDDocument(): object | null {
    if (!this.identity) return null;

    return {
      "@context": ["https://www.w3.org/ns/did/v1"],
      id: this.identity.did,
      controller: this.identity.did,
      created: this.identity.createdAt,
      updated: new Date().toISOString(),
      verificationMethod: this.identity.wallets.map((w, i) => ({
        id: `${this.identity!.did}#key-${i}`,
        type: "EcdsaSecp256k1VerificationKey2019",
        controller: this.identity!.did,
        publicKeyHex: w.publicKey,
      })),
      authentication: this.identity.wallets.map((_, i) => `${this.identity!.did}#key-${i}`),
    };
  }

  /** Load identity */
  private loadIdentity(): void {
    try {
      if (fs.existsSync(this.identityPath)) {
        const content = fs.readFileSync(this.identityPath, "utf-8");
        this.identity = JSON.parse(content);
      }
    } catch {
      this.identity = null;
    }
  }

  /** Save identity */
  private saveIdentity(): void {
    try {
      const dir = path.dirname(this.identityPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(this.identityPath, JSON.stringify(this.identity, null, 2), { mode: 0o600 });
    } catch (err) {
      console.error("[BotBirth] Failed to save identity:", err);
    }
  }

  /**
   * Print birth certificate - welcome message and identity card
   * Called after successful birth ceremony
   * Generates both console output and MD file
   */
  private printBirthCertificate(): void {
    if (!this.identity) return;

    // Generate markdown content
    const mdContent = this.generateBirthCertificateMD();

    // Save to file
    const certPath = this.saveBirthCertificate(mdContent);

    // Console output (abbreviated version)
    const divider = "═".repeat(60);

    console.log("\n" + divider);
    console.log("◈  AEONSAGE BIRTH CERTIFICATE  ◈");
    console.log(divider + "\n");

    console.log(`  Bot ID:   ${this.identity.id}`);
    console.log(`  DID:      ${this.identity.did}`);
    console.log(`  Network:  ${this.identity.network}`);
    console.log(`  Created:  ${this.identity.createdAt}\n`);

    console.log("  Wallets:");
    for (const w of this.identity.wallets) {
      console.log(`    ${w.chain.toUpperCase()}: ${w.address}`);
    }

    console.log("\n" + divider);
    console.log(`  📄 Full certificate saved to:`);
    console.log(`     ${certPath}`);
    console.log(divider);
    console.log("\n  Quick Commands:");
    console.log("    pnpm aeonsage identity show");
    console.log("    pnpm aeonsage gateway");
    console.log("    pnpm aeonsage dashboard\n");
    console.log("  Sovereign Intelligence at your service.\n");
  }

  /**
   * Generate Birth Certificate as Markdown
   */
  private generateBirthCertificateMD(): string {
    if (!this.identity) return "";

    const created = new Date(this.identity.createdAt);
    const formattedDate = created.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

    return `# ◈ AeonSage Birth Certificate

---

## Sovereign Identity Profile

| Field | Value |
|:------|:------|
| **Bot ID** | \`${this.identity.id}\` |
| **DID** | \`${this.identity.did}\` |
| **Network** | ${this.identity.network} |
| **Status** | ${this.identity.status} |
| **Created** | ${formattedDate} |
| **Version** | ${this.identity.version} |

---

## Wallet Addresses

| Chain | Address |
|:------|:--------|
${this.identity.wallets.map((w) => `| **${w.chain.toUpperCase()}** | \`${w.address}\` |`).join("\n")}

> ⚠️ **Private keys are stored securely in** \`~/.aeonsage/.key-*\`
> Never share your private keys with anyone.

---

## Quick Start Guide

### View Your Identity
\`\`\`bash
pnpm aeonsage identity show
\`\`\`

### Export DID Document
\`\`\`bash
pnpm aeonsage identity export-did
\`\`\`

### Export Private Key (ETH)
\`\`\`bash
pnpm aeonsage identity export-key eth
\`\`\`

### Start Gateway
\`\`\`bash
pnpm aeonsage gateway
\`\`\`

### Open Dashboard
\`\`\`bash
pnpm aeonsage dashboard
\`\`\`

### System Health Check
\`\`\`bash
pnpm aeonsage doctor
\`\`\`

---

## Security Notes

- 🔐 **Private keys** are encrypted with AES-256-GCM
- 📁 **Identity file**: \`~/.aeonsage/identity.json\`
- 🔑 **Keys directory**: \`~/.aeonsage/.key-*\`
- 💾 **Backup**: Securely backup your \`~/.aeonsage\` directory

---

*Sovereign Intelligence at your service.*

**AeonSage** — Cognitive OS v${this.identity.version}
`;
  }

  /**
   * Save birth certificate to file
   */
  private saveBirthCertificate(content: string): string {
    const certPath = path.join(homedir(), ".aeonsage", "BIRTH_CERTIFICATE.md");

    try {
      fs.writeFileSync(certPath, content, { encoding: "utf-8" });
    } catch (err) {
      console.error("[BotBirth] Failed to save certificate:", err);
    }

    return certPath;
  }

  /**
   * Export private key for a specific chain (decrypted)
   * ⚠️ SECURITY: Only call when user explicitly requests
   */
  exportPrivateKey(chain: string): { success: boolean; privateKey?: string; error?: string } {
    if (!this.identity) {
      return { success: false, error: "Identity not found" };
    }

    const wallet = this.identity.wallets.find((w) => w.chain.toLowerCase() === chain.toLowerCase());
    if (!wallet) {
      return { success: false, error: `Wallet for chain '${chain}' not found` };
    }

    try {
      const keyFile = path.join(homedir(), ".aeonsage", `.${wallet.privateKeyRef}`);
      if (!fs.existsSync(keyFile)) {
        return { success: false, error: "Private key file not found" };
      }

      const encrypted = fs.readFileSync(keyFile);
      const systemKey = this.getSystemKey();

      // Note: This is a simplified implementation
      // AES-GCM requires storing IV and auth tag separately for proper decryption
      // For production, use a proper key management system
      const decipher = crypto.createDecipheriv(
        "aes-256-gcm",
        systemKey,
        encrypted.slice(0, 12), // IV
      );
      decipher.setAuthTag(encrypted.slice(-16)); // Auth tag

      const privateKey = Buffer.concat([
        decipher.update(encrypted.slice(12, -16)),
        decipher.final(),
      ]).toString("utf8");

      return { success: true, privateKey };
    } catch (err) {
      return { success: false, error: `Failed to decrypt: ${String(err)}` };
    }
  }

  /**
   * Export all wallet secrets (for backup)
   * ⚠️ SECURITY: Returns sensitive data - handle with extreme care
   */
  exportAllWalletSecrets(): {
    success: boolean;
    wallets?: Array<{ chain: string; address: string; privateKey: string }>;
    error?: string;
  } {
    if (!this.identity) {
      return { success: false, error: "Identity not found" };
    }

    const wallets: Array<{ chain: string; address: string; privateKey: string }> = [];

    for (const wallet of this.identity.wallets) {
      const result = this.exportPrivateKey(wallet.chain);
      if (result.success && result.privateKey) {
        wallets.push({
          chain: wallet.chain,
          address: wallet.address,
          privateKey: result.privateKey,
        });
      }
    }

    return { success: true, wallets };
  }

  /**
   * Get identity summary (safe to display)
   */
  getIdentitySummary(): object | null {
    if (!this.identity) return null;

    return {
      id: this.identity.id,
      did: this.identity.did,
      network: this.identity.network,
      status: this.identity.status,
      createdAt: this.identity.createdAt,
      wallets: this.identity.wallets.map((w) => ({
        chain: w.chain,
        address: w.address,
        // Private key NOT included
      })),
    };
  }
}

// Export singleton
export const botBirth = BotBirthManager.getInstance();

/** Check if birth ceremony is needed */
export function needsBirthCeremony(): boolean {
  return botBirth.isFirstBirth();
}

/** Get Bot Identity */
export function getBotIdentity(): BotIdentity | null {
  return botBirth.getIdentity();
}

/** Export DID Document */
export function exportDIDDocument(): object | null {
  return botBirth.exportDIDDocument();
}

/** Export private key for chain */
export function exportPrivateKey(chain: string): {
  success: boolean;
  privateKey?: string;
  error?: string;
} {
  return botBirth.exportPrivateKey(chain);
}

/** Export all wallet secrets (for backup) */
export function exportAllWalletSecrets(): {
  success: boolean;
  wallets?: Array<{ chain: string; address: string; privateKey: string }>;
  error?: string;
} {
  return botBirth.exportAllWalletSecrets();
}

/** Get identity summary (safe to display) */
export function getIdentitySummary(): object | null {
  return botBirth.getIdentitySummary();
}
