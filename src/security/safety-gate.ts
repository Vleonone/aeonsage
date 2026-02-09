/**
 * Safety Gate - Operation Approval System
 *
 * Provides approval checkpoints for high-risk operations:
 * - LOW: Auto-approve (reads, searches)
 * - MEDIUM: Password/PIN required (writes, exec)
 * - HIGH: Voice/TOTP required (deletes, external API)
 * - CRITICAL: Biometric + Password (wallet, kill recovery)
 *
 * Gates are configurable via UI and persist in config.
 */

import { EventEmitter } from "node:events";
import * as fs from "node:fs";
import * as path from "node:path";
import { homedir } from "node:os";
import { sentinel, type ThreatReport } from "./sentinel.js";

/** Risk levels for operations */
export type RiskLevel = "low" | "medium" | "high" | "critical";

/** Gate action types */
export type GateAction = "approve" | "deny" | "ask";

/** Gate configuration */
export interface SafetyGate {
  id: string;
  name: string;
  description: string;
  riskLevel: RiskLevel;
  enabled: boolean;
  defaultAction: GateAction;
  patterns?: string[]; // Tool/command patterns this gate applies to
}

/** Gate check result */
export interface GateCheckResult {
  allowed: boolean;
  gate?: SafetyGate;
  requiresAuth?: "pin" | "totp" | "voice" | "biometric";
  message?: string;
  threatReport?: ThreatReport;
}

/** Approval request for interactive verification */
export interface ApprovalRequest {
  id: string;
  gate: SafetyGate;
  operation: string;
  details: Record<string, unknown>;
  threatReport?: ThreatReport; // [NEW] Threat report if detected
  createdAt: string;
  expiresAt: string;
  status: "pending" | "approved" | "denied" | "expired";
}

/** Default gates */
const DEFAULT_GATES: SafetyGate[] = [
  {
    id: "shell_exec",
    name: "Shell Execution",
    description: "Approval required before running shell commands",
    riskLevel: "medium",
    enabled: true,
    defaultAction: "ask",
    patterns: ["exec", "bash", "shell", "cmd"],
  },
  {
    id: "file_delete",
    name: "File Deletion",
    description: "Confirmation for file and directory deletions",
    riskLevel: "high",
    enabled: true,
    defaultAction: "ask",
    patterns: ["rm", "del", "delete", "remove", "unlink"],
  },
  {
    id: "file_write",
    name: "File Write",
    description: "Monitor file creation and modification",
    riskLevel: "low",
    enabled: true,
    defaultAction: "approve",
    patterns: ["write", "create", "save", "edit"],
  },
  {
    id: "external_api",
    name: "External API Calls",
    description: "Approval for calls to external services",
    riskLevel: "high",
    enabled: false,
    defaultAction: "ask",
    patterns: ["http", "fetch", "api", "webhook"],
  },
  {
    id: "wallet_transaction",
    name: "Wallet Transaction",
    description: "Multi-factor auth for any wallet operations",
    riskLevel: "critical",
    enabled: true,
    defaultAction: "ask",
    patterns: ["wallet", "transfer", "send", "transaction", "sign"],
  },
  {
    id: "data_export",
    name: "Data Export",
    description: "Approval for exporting sensitive data",
    riskLevel: "high",
    enabled: true,
    defaultAction: "ask",
    patterns: ["export", "download", "dump", "backup"],
  },
];

/** Safety Gate Manager */
class SafetyGateManager extends EventEmitter {
  // ... (Singleton & Init logic unchanged) ...
  // Note: To avoid huge diff, mainly overriding checkOperation and createApprovalRequest.

  private static instance: SafetyGateManager;
  private gates: Map<string, SafetyGate> = new Map();
  private pendingApprovals: Map<string, ApprovalRequest> = new Map();
  private approvalTimeoutMs = 60000; // 1 minute
  private configPath: string;

  private constructor() {
    super();
    const aeonsageDir = path.join(homedir(), ".aeonsage", "security");
    this.configPath = path.join(aeonsageDir, "gates.json");
    this.init();
  }

  static getInstance(): SafetyGateManager {
    if (!SafetyGateManager.instance) {
      SafetyGateManager.instance = new SafetyGateManager();
    }
    return SafetyGateManager.instance;
  }

  /** Initialize state */
  private init(): void {
    this.loadDefaultGates();
    this.loadConfig();
  }

  private loadDefaultGates(): void {
    for (const gate of DEFAULT_GATES) {
      this.gates.set(gate.id, gate);
    }
  }

  private loadConfig(): void {
    try {
      if (fs.existsSync(this.configPath)) {
        const content = fs.readFileSync(this.configPath, "utf-8");
        const persistedGates = JSON.parse(content) as SafetyGate[];
        for (const pGate of persistedGates) {
          if (pGate && pGate.id) {
            this.gates.set(pGate.id, pGate);
          }
        }
      }
    } catch (err) {
      console.error("[SAFETY GATE] Failed to load config:", err);
    }
  }

  private saveConfig(): void {
    try {
      const dir = path.dirname(this.configPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const gatesList = Array.from(this.gates.values());
      fs.writeFileSync(this.configPath, JSON.stringify(gatesList, null, 2), "utf-8");
    } catch (err) {
      console.error("[SAFETY GATE] Failed to save config:", err);
    }
  }

  getAllGates(): SafetyGate[] {
    return Array.from(this.gates.values());
  }

  getGate(id: string): SafetyGate | undefined {
    return this.gates.get(id);
  }

  updateGate(id: string, updates: Partial<SafetyGate>): void {
    const gate = this.gates.get(id);
    if (gate) {
      const updated = { ...gate, ...updates };
      this.gates.set(id, updated);
      this.saveConfig();
      this.emit("gate-updated", updated);
    }
  }

  setGateEnabled(id: string, enabled: boolean): void {
    this.updateGate(id, { enabled });
  }

  /**
   * Check if operation is allowed
   * [MODIFIED] Now performs Heuristic Sentinel scan on operation content.
   */
  checkOperation(operation: string, context?: Record<string, unknown>): GateCheckResult {
    const normalizedOp = operation.toLowerCase();

    // [SENTINEL INTEGRATION]
    // Inspect content if available (e.g. command string, file content)
    // We look for 'command' or 'content' in context, or use the operation string itself if it looks like a shell command
    let contentToScan = "";
    if (context?.command && typeof context.command === "string") {
      contentToScan = context.command;
    } else if (context?.fileContent && typeof context.fileContent === "string") {
      contentToScan = context.fileContent;
    } else if (operation === "shell_exec") {
      // Maybe passed as arg somewhere else? usually shell_exec has 'command' in context
    }

    // Perform scan
    let threatReport: ThreatReport | undefined;
    if (contentToScan) {
      threatReport = sentinel.scan(contentToScan);
    }

    // Sentinel Override: If Critical/High threat detected, force BLOCK or ASK
    if (
      threatReport?.detected &&
      (threatReport.maxLevel === "critical" || threatReport.maxLevel === "high")
    ) {
      console.warn(`[SENTINEL] Blocked high threat in operation: ${operation}`, threatReport);
      // Create a virtual "Sentinel Gate" to enforce the block
      return {
        allowed: false,
        gate: {
          id: "sentinel_override",
          name: "Sentinel Heuristic Protection",
          description: "Blocked by malicious pattern detection",
          riskLevel: "critical",
          enabled: true,
          defaultAction: "ask", // We set to ASK so user sees the threat report UI, unless we want hard deny
          patterns: [],
        },
        requiresAuth: "biometric", // Max security
        message: `Security Threat Detected: ${threatReport.matches[0].description}`,
        threatReport,
      };
    }

    for (const gate of Array.from(this.gates.values())) {
      if (!gate.enabled) continue;

      const matches = gate.patterns?.some((pattern) =>
        normalizedOp.includes(pattern.toLowerCase()),
      );

      if (matches) {
        switch (gate.defaultAction) {
          case "approve":
            // Even if approved by gate, if there is a low/medium threat, we should maybe warn?
            // For now, allow unless Sentinel Critical/High caught above.
            return { allowed: true, gate, threatReport };

          case "deny":
            return {
              allowed: false,
              gate,
              message: `Operation blocked by ${gate.name} gate`,
              threatReport,
            };

          case "ask":
            return {
              allowed: false,
              gate,
              requiresAuth: this.getRequiredAuth(gate.riskLevel),
              message: `Operation requires approval: ${gate.name}`,
              threatReport,
            };
        }
      }
    }

    return { allowed: true, threatReport };
  }

  private getRequiredAuth(riskLevel: RiskLevel): "pin" | "totp" | "voice" | "biometric" {
    switch (riskLevel) {
      case "low":
      case "medium":
        return "pin";
      case "high":
        return "totp";
      case "critical":
        return "biometric";
    }
  }

  /**
   * Create approval request
   * [MODIFIED] Accepts threatReport
   */
  createApprovalRequest(
    gate: SafetyGate,
    operation: string,
    details: Record<string, unknown> = {},
    threatReport?: ThreatReport,
  ): ApprovalRequest {
    const now = new Date();
    const request: ApprovalRequest = {
      id: `approval-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      gate,
      operation,
      details,
      threatReport, // Attach threat report
      createdAt: now.toISOString(),
      expiresAt: new Date(now.getTime() + this.approvalTimeoutMs).toISOString(),
      status: "pending",
    };

    this.pendingApprovals.set(request.id, request);
    this.emit("approval-requested", request);

    setTimeout(() => {
      const req = this.pendingApprovals.get(request.id);
      if (req && req.status === "pending") {
        req.status = "expired";
        this.emit("approval-expired", req);
      }
    }, this.approvalTimeoutMs);

    return request;
  }

  approveRequest(
    requestId: string,
    authData: { method: string; verified: boolean },
  ): { success: boolean; error?: string } {
    const request = this.pendingApprovals.get(requestId);
    if (!request) return { success: false, error: "Request not found" };
    if (request.status !== "pending")
      return { success: false, error: `Request already ${request.status}` };
    if (!authData.verified) return { success: false, error: "Authentication not verified" };

    request.status = "approved";
    this.emit("approval-granted", request);
    return { success: true };
  }

  denyRequest(requestId: string): { success: boolean; error?: string } {
    const request = this.pendingApprovals.get(requestId);
    if (!request) return { success: false, error: "Request not found" };
    if (request.status !== "pending")
      return { success: false, error: `Request already ${request.status}` };

    request.status = "denied";
    this.emit("approval-denied", request);
    return { success: true };
  }

  getPendingApprovals(): ApprovalRequest[] {
    return Array.from(this.pendingApprovals.values()).filter((req) => req.status === "pending");
  }

  exportConfig(): SafetyGate[] {
    return this.getAllGates();
  }

  importConfig(gates: SafetyGate[]): void {
    for (const gate of gates) {
      this.gates.set(gate.id, gate);
    }
    this.saveConfig();
  }
}

export const safetyGate = SafetyGateManager.getInstance();

export function checkSafetyGate(
  operation: string,
  context?: Record<string, unknown>,
): GateCheckResult {
  return safetyGate.checkOperation(operation, context);
}

export function gated(operation: string) {
  return function (target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: unknown[]) {
      const check = safetyGate.checkOperation(operation);

      if (!check.allowed && check.gate && check.requiresAuth) {
        // If it requires auth, we can't just throw unless we have a way to handle interactive auth here.
        // Usually this throws an error that the frontend catches to show the modal.
        // We should pass the threat report in the error too if possible, but SafetyGateError implementation below needs update?
        // Actually the frontend usually initiates the check via checkSafetyGate -> createApprovalRequest flow.
        // This decorator is for backend-only protection.
        throw new SafetyGateError(
          `Operation "${operation}" requires ${check.requiresAuth} verification`,
          check.gate,
          check.threatReport, // Pass threat report
        );
      }

      if (!check.allowed) {
        throw new SafetyGateError(
          check.message ?? `Operation "${operation}" blocked by safety gate`,
          check.gate,
          check.threatReport,
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

export class SafetyGateError extends Error {
  gate?: SafetyGate;
  threatReport?: ThreatReport;

  constructor(message: string, gate?: SafetyGate, threatReport?: ThreatReport) {
    super(message);
    this.name = "SafetyGateError";
    this.gate = gate;
    this.threatReport = threatReport;
  }
}
