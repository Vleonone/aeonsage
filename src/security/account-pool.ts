/**
 * Account Pool - Account Pool Management
 *
 * Bot can only use authorized accounts within the pool. Rules are hardcoded:
 * - Accounts in pool -> Directly usable
 * - Accounts outside pool -> Access denied
 * - Bot self-registered accounts -> Auto-join pool
 */

import * as fs from "node:fs";
import * as path from "node:path";
import { homedir } from "node:os";
import { EventEmitter } from "node:events";

/** Account Type */
export type AccountType =
  | "wallet" // Wallet
  | "exchange" // Exchange
  | "social" // Social Platform
  | "email" // Email
  | "service" // Service Account
  | "other";

/** Account Status */
export type AccountStatus =
  | "active" // Available
  | "suspended" // Suspended
  | "revoked"; // Revoked

/** Pool Account Definition */
export interface PoolAccount {
  id: string;
  type: AccountType;
  name: string;
  platform: string;
  credentials?: {
    encrypted: boolean;
    keyRef?: string; // Reference to encrypted storage
  };
  permissions: string[]; // Allowed operations
  createdAt: string;
  createdBy: "user" | "bot";
  status: AccountStatus;
  lastUsed?: string;
  usageCount: number;
}

/** Account Pool */
class AccountPoolManager extends EventEmitter {
  private static instance: AccountPoolManager;
  private accounts: Map<string, PoolAccount> = new Map();
  private configPath: string;

  private constructor() {
    super();
    this.configPath = path.join(homedir(), ".aeonsage", "account_pool.json");
    this.loadAccounts();
  }

  static getInstance(): AccountPoolManager {
    if (!AccountPoolManager.instance) {
      AccountPoolManager.instance = new AccountPoolManager();
    }
    return AccountPoolManager.instance;
  }

  /**
   * Check if account is in the pool and available.
   * ⚠️ Hardcoded: Only active accounts in the pool can be used.
   */
  canUseAccount(accountId: string): boolean {
    const account = this.accounts.get(accountId);
    return account !== undefined && account.status === "active";
  }

  /**
   * Get account (Only available pool accounts)
   */
  getAccount(accountId: string): PoolAccount | undefined {
    const account = this.accounts.get(accountId);
    if (!account || account.status !== "active") {
      return undefined;
    }
    return account;
  }

  /**
   * Use account (Record usage)
   */
  useAccount(accountId: string, operation: string): { success: boolean; error?: string } {
    const account = this.accounts.get(accountId);

    // ⚠️ Hardcoded: Denial of access for accounts outside the pool
    if (!account) {
      return { success: false, error: "Account not in pool, access denied" };
    }

    if (account.status !== "active") {
      return { success: false, error: `Account status is ${account.status}, cannot use` };
    }

    // Check operation permissions
    if (!account.permissions.includes("*") && !account.permissions.includes(operation)) {
      return { success: false, error: `Account not authorized for ${operation} operation` };
    }

    // Record usage
    account.lastUsed = new Date().toISOString();
    account.usageCount += 1;
    this.saveAccounts();

    this.emit("account-used", { accountId, operation });
    return { success: true };
  }

  /**
   * User authorizes account to join the pool
   */
  authorizeAccount(account: Omit<PoolAccount, "id" | "createdAt" | "usageCount">): PoolAccount {
    const newAccount: PoolAccount = {
      ...account,
      id: `acc-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
      usageCount: 0,
    };

    this.accounts.set(newAccount.id, newAccount);
    this.saveAccounts();
    this.emit("account-authorized", newAccount);

    return newAccount;
  }

  /**
   * Bot self-registered accounts (Auto-join pool)
   */
  registerBotAccount(
    type: AccountType,
    name: string,
    platform: string,
    permissions: string[] = ["*"],
  ): PoolAccount {
    const account: PoolAccount = {
      id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type,
      name,
      platform,
      permissions,
      createdAt: new Date().toISOString(),
      createdBy: "bot",
      status: "active",
      usageCount: 0,
    };

    this.accounts.set(account.id, account);
    this.saveAccounts();
    this.emit("bot-account-registered", account);

    return account;
  }

  /**
   * Revoke account authorization
   */
  revokeAccount(accountId: string): void {
    const account = this.accounts.get(accountId);
    if (account) {
      account.status = "revoked";
      this.saveAccounts();
      this.emit("account-revoked", account);
    }
  }

  /**
   * Suspend account
   */
  suspendAccount(accountId: string): void {
    const account = this.accounts.get(accountId);
    if (account) {
      account.status = "suspended";
      this.saveAccounts();
      this.emit("account-suspended", account);
    }
  }

  /**
   * Activate/Restore account
   */
  activateAccount(accountId: string): void {
    const account = this.accounts.get(accountId);
    if (account && account.status === "suspended") {
      account.status = "active";
      this.saveAccounts();
      this.emit("account-activated", account);
    }
  }

  /**
   * Get all accounts
   */
  getAllAccounts(): PoolAccount[] {
    return Array.from(this.accounts.values());
  }

  /**
   * Get accounts by type
   */
  getAccountsByType(type: AccountType): PoolAccount[] {
    return this.getAllAccounts().filter((a) => a.type === type && a.status === "active");
  }

  /** Load accounts */
  private loadAccounts(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, "utf-8");
        const data = JSON.parse(content);
        for (const account of data.accounts ?? []) {
          this.accounts.set(account.id, account);
        }
      }
    } catch {
      // ignore
    }
  }

  /** Save accounts */
  private saveAccounts(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.configPath,
        JSON.stringify({ accounts: Array.from(this.accounts.values()) }, null, 2),
        { mode: 0o600 },
      );
    } catch (err) {
      console.error("[AccountPool] Save failed:", err);
    }
  }
}

// 导出单例
export const accountPool = AccountPoolManager.getInstance();

/**
 * Account Access Guard
 * ⚠️ Hardcoded: Directly refuse accounts outside the pool
 */
export function assertAccountAccess(accountId: string, operation: string): void {
  const result = accountPool.useAccount(accountId, operation);
  if (!result.success) {
    throw new AccountPoolError(result.error ?? "Account access denied", accountId);
  }
}

/**
 * Account Pool Error
 */
export class AccountPoolError extends Error {
  accountId: string;

  constructor(message: string, accountId: string) {
    super(message);
    this.name = "AccountPoolError";
    this.accountId = accountId;
  }
}
