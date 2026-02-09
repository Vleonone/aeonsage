/**
 * PIN Verification - Simple authentication for MEDIUM risk operations
 *
 * Provides PIN-based verification as the minimum security layer.
 * PIN is stored as a salted hash, never in plaintext.
 */

import * as crypto from "node:crypto";
import * as fs from "node:fs";
import * as path from "node:path";
import { homedir } from "node:os";

/** PIN configuration */
interface PinConfig {
  hash: string;
  salt: string;
  createdAt: string;
  attempts: number;
  lockedUntil?: string;
}

/** PIN verification result */
export interface PinVerifyResult {
  success: boolean;
  error?: string;
  attemptsRemaining?: number;
  lockedUntil?: string;
}

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 5 * 60 * 1000; // 5 minutes
const PIN_MIN_LENGTH = 4;
const PIN_MAX_LENGTH = 8;

/** PIN Manager */
class PinManager {
  private static instance: PinManager;
  private configPath: string;
  private config: PinConfig | null = null;

  private constructor() {
    const aeonsageDir = path.join(homedir(), ".aeonsage");
    this.configPath = path.join(aeonsageDir, ".pin");
    this.loadConfig();
  }

  static getInstance(): PinManager {
    if (!PinManager.instance) {
      PinManager.instance = new PinManager();
    }
    return PinManager.instance;
  }

  /** Check if PIN is configured */
  isConfigured(): boolean {
    return this.config !== null;
  }

  /** Set new PIN */
  setPin(pin: string): { success: boolean; error?: string } {
    // Validate PIN
    if (pin.length < PIN_MIN_LENGTH || pin.length > PIN_MAX_LENGTH) {
      return {
        success: false,
        error: `PIN must be ${PIN_MIN_LENGTH}-${PIN_MAX_LENGTH} digits`,
      };
    }

    if (!/^\d+$/.test(pin)) {
      return { success: false, error: "PIN must contain only digits" };
    }

    // Generate salt and hash
    const salt = crypto.randomBytes(16).toString("hex");
    const hash = this.hashPin(pin, salt);

    this.config = {
      hash,
      salt,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    this.saveConfig();
    return { success: true };
  }

  /** Verify PIN */
  verify(pin: string): PinVerifyResult {
    if (!this.config) {
      return { success: false, error: "PIN not configured" };
    }

    // Check lockout
    if (this.config.lockedUntil) {
      const lockedUntil = new Date(this.config.lockedUntil);
      if (new Date() < lockedUntil) {
        return {
          success: false,
          error: "Too many failed attempts. Try again later.",
          lockedUntil: this.config.lockedUntil,
        };
      } else {
        // Lockout expired, reset
        this.config.lockedUntil = undefined;
        this.config.attempts = 0;
      }
    }

    // Verify hash
    const hash = this.hashPin(pin, this.config.salt);
    if (hash === this.config.hash) {
      // Success - reset attempts
      this.config.attempts = 0;
      this.saveConfig();
      return { success: true };
    }

    // Failed attempt
    this.config.attempts += 1;
    const remaining = MAX_ATTEMPTS - this.config.attempts;

    if (remaining <= 0) {
      // Lock out
      this.config.lockedUntil = new Date(Date.now() + LOCKOUT_DURATION_MS).toISOString();
      this.saveConfig();
      return {
        success: false,
        error: "Too many failed attempts. Account locked.",
        lockedUntil: this.config.lockedUntil,
      };
    }

    this.saveConfig();
    return {
      success: false,
      error: "Invalid PIN",
      attemptsRemaining: remaining,
    };
  }

  /** Change PIN (requires old PIN verification) */
  changePin(oldPin: string, newPin: string): { success: boolean; error?: string } {
    const verifyResult = this.verify(oldPin);
    if (!verifyResult.success) {
      return { success: false, error: verifyResult.error };
    }

    return this.setPin(newPin);
  }

  /** Reset PIN (for recovery - should require higher auth) */
  resetPin(): void {
    this.config = null;
    try {
      if (fs.existsSync(this.configPath)) {
        fs.unlinkSync(this.configPath);
      }
    } catch {
      // Ignore
    }
  }

  /** Hash PIN with salt */
  private hashPin(pin: string, salt: string): string {
    return crypto.pbkdf2Sync(pin, salt, 100000, 64, "sha512").toString("hex");
  }

  /** Load config from file */
  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, "utf-8");
        this.config = JSON.parse(content);
      }
    } catch {
      this.config = null;
    }
  }

  /** Save config to file */
  private saveConfig(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.configPath,
        JSON.stringify(this.config, null, 2),
        { mode: 0o600 }, // Read/write only by owner
      );
    } catch (err) {
      console.error("[PIN] Failed to save config:", err);
    }
  }
}

// Export singleton
export const pinManager = PinManager.getInstance();

/**
 * Quick verify function
 */
export function verifyPin(pin: string): PinVerifyResult {
  return pinManager.verify(pin);
}

/**
 * Check if PIN is set up
 */
export function isPinConfigured(): boolean {
  return pinManager.isConfigured();
}
