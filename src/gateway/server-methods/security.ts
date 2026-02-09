/**
 * Security RPC Methods
 *
 * Provides Gateway API endpoints for:
 * - Kill Switch status and activation
 * - Safety Gates listing and updates
 * - VDID identity status
 */

import { killSwitch } from "../../security/kill-switch.js";
import { safetyGate, type SafetyGate } from "../../security/safety-gate.js";
import { loadConfig } from "../../config/config.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

// Locked gates that cannot be modified via UI
const LOCKED_GATE_IDS = new Set(["fund_transfer", "god_key"]);

export const securityHandlers: GatewayRequestHandlers = {
  /**
   * Get current kill switch status
   */
  "security.killSwitch.status": async ({ respond }) => {
    const state = killSwitch.getState();
    respond(
      true,
      {
        killed: state.killed,
        killedAt: state.killedAt,
        killedBy: state.killedBy,
        reason: state.reason,
      },
      undefined,
    );
  },

  /**
   * Activate kill switch (emergency stop)
   * Resume is CLI-only for security
   */
  "security.killSwitch.activate": async ({ respond, params }) => {
    const reason = (params?.reason as string) ?? "Activated via UI";
    const by = (params?.by as string) ?? "ui-operator";

    killSwitch.kill({ reason, by });

    respond(
      true,
      {
        success: true,
        killed: true,
        reason,
        killedAt: new Date().toISOString(),
      },
      undefined,
    );
  },

  /**
   * List all safety gates with their current configuration
   */
  "security.gates.list": async ({ respond }) => {
    const gates = safetyGate.getAllGates();

    // Add locked flag for UI
    const gatesWithLock = gates.map((gate: SafetyGate) => ({
      ...gate,
      locked: LOCKED_GATE_IDS.has(gate.id),
    }));

    respond(true, { gates: gatesWithLock }, undefined);
  },

  /**
   * Update a safety gate configuration
   * Locked gates cannot be modified via UI
   */
  "security.gates.update": async ({ respond, params }) => {
    const gateId = params?.gateId as string;
    const updates = params?.updates as Partial<SafetyGate>;

    if (!gateId) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "Missing gateId"));
      return;
    }

    if (LOCKED_GATE_IDS.has(gateId)) {
      respond(
        false,
        undefined,
        errorShape(ErrorCodes.INVALID_REQUEST, "This gate can only be modified via CLI"),
      );
      return;
    }

    const gate = safetyGate.getGate(gateId);
    if (!gate) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "Gate not found"));
      return;
    }

    safetyGate.updateGate(gateId, updates);
    respond(true, { success: true, gate: safetyGate.getGate(gateId) }, undefined);
  },

  /**
   * Get VDID identity status
   */
  "security.vdid.status": async ({ respond, context }) => {
    // Try to get VDID from config if available
    let vdidStatus = {
      did: null as string | null,
      network: null as string | null,
      registered: false,
      walletConnected: false,
      wallets: [] as Array<{
        chain: string;
        address: string;
        balance?: string;
        currency?: string;
        balanceStatus?: "ok" | "unavailable" | "error";
      }>,
    };

    try {
      // Check if we have a stored identity config
      const configSnapshot = (context as Record<string, unknown>).getConfigSnapshot as
        | (() => Record<string, unknown>)
        | undefined;
      if (typeof configSnapshot === "function") {
        const snapshot = configSnapshot();
        const config = snapshot?.config as Record<string, unknown> | undefined;
        const identity = config?.identity as Record<string, unknown> | undefined;

        if (identity?.did && typeof identity.did === "string") {
          vdidStatus = {
            did: identity.did,
            network: (identity.network as string) ?? "base",
            registered: true,
            walletConnected: Boolean(identity.walletAddress),
            wallets: [],
          };
        }
      }
    } catch {
      // VDID not configured, return default status
    }

    try {
      const { getIdentitySummary } = await import("../../security/bot-birth.js");
      const summary = getIdentitySummary() as
        | { wallets?: Array<{ chain: string; address: string }> }
        | null;
      if (summary?.wallets?.length) {
        vdidStatus.wallets = await enrichWalletBalances(summary.wallets);
        vdidStatus.walletConnected = summary.wallets.length > 0;
      }
    } catch {
      // Ignore wallet enrichment failures
    }

    respond(true, vdidStatus, undefined);
  },
};

async function enrichWalletBalances(wallets: Array<{ chain: string; address: string }>) {
  const results: Array<{
    chain: string;
    address: string;
    balance?: string;
    currency?: string;
    balanceStatus?: "ok" | "unavailable" | "error";
  }> = [];

  for (const wallet of wallets) {
    const chain = wallet.chain.toLowerCase();
    if (chain === "eth" || chain === "ethereum") {
      results.push(await fetchEvmBalance(wallet.address, "ETH", readRpcOverride("wallet.rpc.eth")));
      continue;
    }
    if (chain === "base") {
      results.push(await fetchEvmBalance(wallet.address, "BASE", readRpcOverride("wallet.rpc.base")));
      continue;
    }
    if (chain === "sol" || chain === "solana") {
      results.push(await fetchSolBalance(wallet.address, readRpcOverride("wallet.rpc.solana")));
      continue;
    }
    results.push({
      chain: wallet.chain,
      address: wallet.address,
      balanceStatus: "unavailable",
    });
  }

  return results;
}

function readRpcOverride(path: string): string | undefined {
  const envKey = path.toUpperCase().replace(/\./g, "_");
  if (process.env[envKey]) return process.env[envKey];

  try {
    // Prefer config values when set (wallet.rpc.eth/base/solana)
    const config = loadConfig() as { wallet?: { rpc?: Record<string, unknown> } };
    const rpc = config.wallet?.rpc ?? {};
    const key = path.split(".").at(-1) ?? "";
    const value = rpc[key];
    return typeof value === "string" ? value : undefined;
  } catch {
    return undefined;
  }
}

async function fetchEvmBalance(address: string, currency: string, rpcUrl?: string) {
  if (!rpcUrl) {
    return { chain: currency.toLowerCase(), address, balanceStatus: "unavailable" as const };
  }

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "eth_getBalance",
        params: [address, "latest"],
      }),
    });
    const data = (await response.json()) as { result?: string };
    const wei = data.result ? BigInt(data.result) : 0n;
    const balance = formatEther(wei);
    return {
      chain: currency.toLowerCase(),
      address,
      balance,
      currency,
      balanceStatus: "ok" as const,
    };
  } catch {
    return { chain: currency.toLowerCase(), address, balanceStatus: "error" as const };
  }
}

async function fetchSolBalance(address: string, rpcUrl?: string) {
  if (!rpcUrl) {
    return { chain: "sol", address, balanceStatus: "unavailable" as const };
  }

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "getBalance",
        params: [address],
      }),
    });
    const data = (await response.json()) as { result?: { value?: number } };
    const lamports = BigInt(data.result?.value ?? 0);
    const balance = formatLamports(lamports);
    return {
      chain: "sol",
      address,
      balance,
      currency: "SOL",
      balanceStatus: "ok" as const,
    };
  } catch {
    return { chain: "sol", address, balanceStatus: "error" as const };
  }
}

function formatEther(wei: bigint): string {
  const base = 10n ** 18n;
  const whole = wei / base;
  const frac = wei % base;
  const fracStr = frac.toString().padStart(18, "0").slice(0, 4);
  return `${whole}.${fracStr}`;
}

function formatLamports(lamports: bigint): string {
  const base = 10n ** 9n;
  const whole = lamports / base;
  const frac = lamports % base;
  const fracStr = frac.toString().padStart(9, "0").slice(0, 4);
  return `${whole}.${fracStr}`;
}
