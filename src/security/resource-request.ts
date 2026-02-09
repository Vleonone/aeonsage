/**
 * Resource Request - Resource Application System
 *
 * Process for Bot active resource requests:
 * 1. Initiate request, explaining What + Why
 * 2. Await user authorization
 * 3. Execute after authorization
 *
 * Authorization Levels:
 * - restricted: Every operation requires approval
 * - full: Fully authorized, free action
 */

import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import * as path from "node:path";
import { homedir } from "node:os";

/** Resource Type */
export type ResourceType =
  | "funds" // Funds (ETH, USDT, etc.)
  | "card" // Card number (for registration)
  | "account" // Account authorization
  | "permission" // Permission
  | "api_key" // API Key
  | "other";

/** Authorization Level */
export type AuthorizationLevel =
  | "restricted" // Restricted: Requires approval every time
  | "full"; // Full: Fully authorized

/** Request Status */
export type RequestStatus =
  | "pending" // Awaiting approval
  | "approved" // Approved
  | "denied" // Denied
  | "expired"; // Expired

/** Resource Grant */
export interface ResourceGrant {
  id: string;
  type: ResourceType;
  name: string;
  amount?: number; // Fund limit
  unit?: string; // Unit (ETH, USDT, USD)
  level: AuthorizationLevel;
  scope?: string[]; // Restricted scope (e.g., only for specific project)
  grantedAt: string;
  grantedBy: string;
  expiresAt?: string; // Expiry time (null = perpetual)
  usedAmount?: number; // Used limit
}

/** Resource Request */
export interface ResourceRequest {
  id: string;
  type: ResourceType;
  name: string;
  amount?: number;
  unit?: string;
  reason: string; // Why it's needed
  expectedOutcome: string; // Expected outcome
  riskAssessment?: string; // Risk assessment
  createdAt: string;
  status: RequestStatus;
  response?: {
    decidedAt: string;
    decidedBy: string;
    level?: AuthorizationLevel;
    note?: string;
  };
}

/** Resource Manager */
class ResourceManager extends EventEmitter {
  private static instance: ResourceManager;
  private grants: Map<string, ResourceGrant> = new Map();
  private requests: Map<string, ResourceRequest> = new Map();
  private configPath: string;

  private constructor() {
    super();
    this.configPath = path.join(homedir(), ".aeonsage", "resource_grants.json");
    this.loadGrants();
  }

  static getInstance(): ResourceManager {
    if (!ResourceManager.instance) {
      ResourceManager.instance = new ResourceManager();
    }
    return ResourceManager.instance;
  }

  /**
   * Check if there is resource usage right
   */
  canUseResource(
    type: ResourceType,
    amount?: number,
  ): {
    allowed: boolean;
    grant?: ResourceGrant;
    reason?: string;
  } {
    // 查找匹配的授权
    for (const grant of Array.from(this.grants.values())) {
      if (grant.type !== type) continue;

      // 检查过期
      if (grant.expiresAt && new Date(grant.expiresAt) < new Date()) {
        continue;
      }

      // Full authorization -> Direct allow
      if (grant.level === "full") {
        return { allowed: true, grant };
      }

      // Restricted authorization -> Check limit
      if (grant.level === "restricted" && grant.amount !== undefined) {
        const used = grant.usedAmount ?? 0;
        const remaining = grant.amount - used;

        if (amount !== undefined && amount > remaining) {
          return {
            allowed: false,
            grant,
            reason: `Limit insufficient, remaining ${remaining} ${grant.unit ?? ""}`,
          };
        }

        return { allowed: true, grant };
      }
    }

    return { allowed: false, reason: "No valid authorization" };
  }

  /**
   * Use resource (Deduct limit)
   */
  useResource(grantId: string, amount: number): { success: boolean; error?: string } {
    const grant = this.grants.get(grantId);
    if (!grant) {
      return { success: false, error: "Authorization does not exist" };
    }

    // Full authorization -> Direct allow, no deduction
    if (grant.level === "full") {
      this.emit("resource-used", { grantId, amount, level: "full" });
      return { success: true };
    }

    // Restricted authorization -> Deduct limit
    if (grant.amount !== undefined) {
      const used = grant.usedAmount ?? 0;
      const remaining = grant.amount - used;

      if (amount > remaining) {
        return { success: false, error: `Limit insufficient, remaining ${remaining}` };
      }

      grant.usedAmount = used + amount;
      this.saveGrants();
      this.emit("resource-used", { grantId, amount, remaining: remaining - amount });
    }

    return { success: true };
  }

  /**
   * Bot initiates resource request
   */
  createRequest(params: {
    type: ResourceType;
    name: string;
    amount?: number;
    unit?: string;
    reason: string;
    expectedOutcome: string;
    riskAssessment?: string;
  }): ResourceRequest {
    const request: ResourceRequest = {
      id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...params,
      createdAt: new Date().toISOString(),
      status: "pending",
    };

    this.requests.set(request.id, request);
    this.emit("request-created", request);

    return request;
  }

  /**
   * User approves request
   */
  approveRequest(
    requestId: string,
    options: {
      level: AuthorizationLevel;
      decidedBy: string;
      note?: string;
      expiresAt?: string;
    },
  ): { success: boolean; grant?: ResourceGrant; error?: string } {
    const request = this.requests.get(requestId);
    if (!request) {
      return { success: false, error: "请求不存在" };
    }

    if (request.status !== "pending") {
      return { success: false, error: `请求已 ${request.status}` };
    }

    // 更新请求状态
    request.status = "approved";
    request.response = {
      decidedAt: new Date().toISOString(),
      decidedBy: options.decidedBy,
      level: options.level,
      note: options.note,
    };

    // 创建授权
    const grant: ResourceGrant = {
      id: `grant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: request.type,
      name: request.name,
      amount: request.amount,
      unit: request.unit,
      level: options.level,
      grantedAt: new Date().toISOString(),
      grantedBy: options.decidedBy,
      expiresAt: options.expiresAt,
      usedAmount: 0,
    };

    this.grants.set(grant.id, grant);
    this.saveGrants();

    this.emit("request-approved", { request, grant });
    return { success: true, grant };
  }

  /**
   * User denies request
   */
  denyRequest(
    requestId: string,
    options: { decidedBy: string; note?: string },
  ): { success: boolean; error?: string } {
    const request = this.requests.get(requestId);
    if (!request) {
      return { success: false, error: "请求不存在" };
    }

    if (request.status !== "pending") {
      return { success: false, error: `请求已 ${request.status}` };
    }

    request.status = "denied";
    request.response = {
      decidedAt: new Date().toISOString(),
      decidedBy: options.decidedBy,
      note: options.note,
    };

    this.emit("request-denied", request);
    return { success: true };
  }

  /**
   * Direct authorization (No request needed)
   * Used when user actively gives resource to Bot, e.g., "Take 100, have fun"
   */
  grantDirectly(params: {
    type: ResourceType;
    name: string;
    amount?: number;
    unit?: string;
    level: AuthorizationLevel;
    grantedBy: string;
    expiresAt?: string;
    scope?: string[];
  }): ResourceGrant {
    const grant: ResourceGrant = {
      id: `grant-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      ...params,
      grantedAt: new Date().toISOString(),
      usedAmount: 0,
    };

    this.grants.set(grant.id, grant);
    this.saveGrants();

    this.emit("grant-created", grant);
    return grant;
  }

  /**
   * Revoke authorization
   */
  revokeGrant(grantId: string): void {
    const grant = this.grants.get(grantId);
    if (grant) {
      this.grants.delete(grantId);
      this.saveGrants();
      this.emit("grant-revoked", grant);
    }
  }

  /**
   * Get all grants
   */
  getAllGrants(): ResourceGrant[] {
    return Array.from(this.grants.values());
  }

  /**
   * Get pending requests
   */
  getPendingRequests(): ResourceRequest[] {
    return Array.from(this.requests.values()).filter((r) => r.status === "pending");
  }

  /** Load authorization */
  private loadGrants(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, "utf-8");
        const data = JSON.parse(content);
        for (const grant of data.grants ?? []) {
          this.grants.set(grant.id, grant);
        }
      }
    } catch {
      // ignore
    }
  }

  /** Save authorization */
  private saveGrants(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(
        this.configPath,
        JSON.stringify({ grants: Array.from(this.grants.values()) }, null, 2),
        { mode: 0o600 },
      );
    } catch (err) {
      console.error("[ResourceManager] Save failed:", err);
    }
  }
}

// Export singleton
export const resourceManager = ResourceManager.getInstance();

/**
 * Resource Access Guard
 */
export function assertResourceAccess(type: ResourceType, amount?: number): ResourceGrant {
  const check = resourceManager.canUseResource(type, amount);
  if (!check.allowed) {
    throw new ResourceRequestError(check.reason ?? "Resource access denied", type);
  }
  return check.grant!;
}

/**
 * Resource Request Error
 */
export class ResourceRequestError extends Error {
  resourceType: ResourceType;

  constructor(message: string, resourceType: ResourceType) {
    super(message);
    this.name = "ResourceRequestError";
    this.resourceType = resourceType;
  }
}
