/**
 * Security Controller - UI integration with backend security systems
 * 
 * Provides access to:
 * - Kill Switch (emergency stop)
 * - Safety Gates (operation approval)
 * - VDID Status (identity)
 */

import type { AppViewState } from "../app-view-state.js";

// ============================================
// Types
// ============================================

export interface KillSwitchState {
    killed: boolean;
    killedAt?: string;
    killedBy?: string;
    reason?: string;
}

export interface SafetyGate {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    defaultAction: "approve" | "deny" | "ask";
    patterns?: string[];
    locked?: boolean; // UI cannot modify
}

export interface VDIDStatus {
    did: string | null;
    network: string | null;
    registered: boolean;
    walletConnected: boolean;
    wallets?: Array<{
        chain: string;
        address: string;
        balance?: string;
        currency?: string;
        balanceStatus?: "ok" | "unavailable" | "error";
    }>;
    status?: "active" | "inactive" | null;
    vscoreTotal?: number;
    vscoreLevel?: string;
    registeredAt?: string;
}

export interface SecurityState {
    loading: boolean;
    error: string | null;
    killSwitch: KillSwitchState;
    gates: SafetyGate[];
    vdid: VDIDStatus;
}

// ============================================
// Default State
// ============================================

// Default safety gates when backend returns none
export const DEFAULT_GATES: SafetyGate[] = [
    { id: "exec-approval", name: "Exec Approval Gate", description: "Require approval before executing system commands", enabled: true, defaultAction: "ask", locked: false },
    { id: "file-write", name: "File Write Gate", description: "Control file modification permissions", enabled: true, defaultAction: "ask", locked: false },
    { id: "network-access", name: "Network Access Gate", description: "Monitor and control outbound network requests", enabled: false, defaultAction: "deny", locked: false },
];

export const DEFAULT_SECURITY_STATE: SecurityState = {
    loading: false,
    error: null,
    killSwitch: { killed: false },
    gates: DEFAULT_GATES,
    vdid: {
        did: null,
        network: null,
        registered: false,
        walletConnected: false,
        status: null,
        vscoreTotal: 0,
        vscoreLevel: "Unranked",
    },
};

// ============================================
// API Calls
// ============================================

export async function loadSecurityStatus(state: AppViewState): Promise<void> {
    if (!state.client) return;

    state.securityLoading = true;
    state.securityError = null;

    try {
        // Fetch kill switch status
        const killResult = await state.client.request("security.killSwitch.status", {});
        state.killSwitch = killResult as KillSwitchState ?? { killed: false };

        // Fetch gates - use defaults if backend returns none
        const gatesResult = await state.client.request("security.gates.list", {}) as { gates?: SafetyGate[] } | null;
        const backendGates = gatesResult?.gates ?? [];
        state.securityGates = backendGates.length > 0 ? backendGates : DEFAULT_GATES;

        // Fetch VDID status
        const vdidResult = await state.client.request("security.vdid.status", {});
        state.vdidStatus = vdidResult as VDIDStatus ?? DEFAULT_SECURITY_STATE.vdid;

    } catch (err) {
        state.securityError = `Failed to load security status: ${String(err)}`;
    } finally {
        state.securityLoading = false;
    }
}

export async function activateKillSwitch(
    state: AppViewState,
    reason: string = "Manual activation from UI"
): Promise<boolean> {
    if (!state.client) return false;

    try {
        await state.client.request("security.killSwitch.activate", {
            reason,
            by: "ui-user",
        });

        // Refresh status
        await loadSecurityStatus(state);
        return true;
    } catch (err) {
        state.securityError = `Kill switch activation failed: ${String(err)}`;
        return false;
    }
}

export async function updateGate(
    state: AppViewState,
    gateId: string,
    updates: Partial<SafetyGate>
): Promise<boolean> {
    if (!state.client) return false;

    try {
        await state.client.request("security.gates.update", {
            gateId,
            updates,
        });

        // Refresh gates
        await loadSecurityStatus(state);
        return true;
    } catch (err) {
        state.securityError = `Gate update failed: ${String(err)}`;
        return false;
    }
}

export async function toggleGate(
    state: AppViewState,
    gateId: string,
    enabled: boolean
): Promise<boolean> {
    // First, update local state immediately for responsive UI
    const currentGates = state.securityGates ?? DEFAULT_GATES;
    const updatedGates = currentGates.map((gate: SafetyGate) =>
        gate.id === gateId ? { ...gate, enabled } : gate
    );
    state.securityGates = updatedGates;

    // Then try to sync with backend (may fail if backend doesn't have this gate)
    try {
        if (state.client) {
            await state.client.request("security.gates.update", {
                gateId,
                updates: { enabled },
            });
        }
        return true;
    } catch (err) {
        // Backend update failed, revert local state
        const revertedGates = state.securityGates.map((gate: SafetyGate) =>
            gate.id === gateId ? { ...gate, enabled: !enabled } : gate
        );
        state.securityGates = revertedGates;
        state.securityError = `Failed to sync security gate: ${String(err)}`;
        return false;
    }
}
