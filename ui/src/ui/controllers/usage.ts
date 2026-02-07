/**
 * Usage Controller
 * Handles token usage and cost tracking via real RPC calls
 */

import { AppViewState } from "../app-view-state.js";

export interface UsageCostReport {
    totals: {
        input: number;
        output: number;
        totalTokens: number;
        totalCost: number;
    };
    breakdown: Array<{
        model: string;
        provider: string;
        inputTokens: number;
        outputTokens: number;
        cost: number;
        calls?: number;
    }>;
    period?: {
        start: string;
        end: string;
    };
}

export interface UsageProviderStatus {
    provider: string;
    status: "active" | "limited" | "error";
    remainingCredits?: number;
    rateLimitRemaining?: number;
    lastError?: string;
}

export type UsageState = {
    usageLoading: boolean;
    usageError: string | null;
    usageCost: UsageCostReport | null;
    usageProviderStatus: UsageProviderStatus[] | null;
    usagePeriod: "day" | "week" | "month" | "all";
};

export function createUsageState(): UsageState {
    return {
        usageLoading: false,
        usageError: null,
        usageCost: null,
        usageProviderStatus: null,
        usagePeriod: "day",
    };
}

/**
 * Load usage cost from backend
 */
export async function loadUsageCost(state: AppViewState): Promise<void> {
    if (!state.usageState) {
        state.usageState = createUsageState();
    }

    state.usageState = { ...state.usageState, usageLoading: true, usageError: null };

    try {
        if (!state.client || !state.connected) {
            throw new Error("Not connected to Gateway");
        }

        // Call the real usage.cost RPC
        const period = state.usageState.usagePeriod || "day";
        const mapPeriodToDays = (p: string): number => {
            switch (p) {
                case "week": return 7;
                case "month": return 30;
                case "all": return 365;
                case "day":
                default: return 1;
            }
        };
        const days = mapPeriodToDays(period);
        const res = await state.client.request("usage.cost", { days }) as UsageCostReport | null;

        if (res) {
            state.usageState = {
                ...state.usageState,
                usageLoading: false,
                usageError: null,
                usageCost: res,
            };
        } else {
            // If no data returned, set empty report
            state.usageState = {
                ...state.usageState,
                usageLoading: false,
                usageCost: {
                    totals: { input: 0, output: 0, totalTokens: 0, totalCost: 0 },
                    breakdown: [],
                },
            };
        }
    } catch (err) {
        state.usageState = {
            ...state.usageState,
            usageLoading: false,
            usageError: String(err),
        };
    }
}

/**
 * Load provider status (rate limits, credits, etc.)
 */
export async function loadProviderStatus(state: AppViewState): Promise<void> {
    if (!state.usageState) {
        state.usageState = createUsageState();
    }

    try {
        if (!state.client || !state.connected) return;

        const res = await state.client.request("usage.providers", {}) as {
            providers?: UsageProviderStatus[];
        } | null;

        if (res?.providers) {
            state.usageState = {
                ...state.usageState,
                usageProviderStatus: res.providers,
            };
        }
    } catch {
        // Silently fail for optional provider status - UI will show defaults
    }
}

/**
 * Set the usage period filter
 */
export function setUsagePeriod(state: AppViewState, period: UsageState["usagePeriod"]): void {
    if (!state.usageState) {
        state.usageState = createUsageState();
    }
    state.usageState = { ...state.usageState, usagePeriod: period };
}

/**
 * Refresh all usage data
 */
export async function refreshUsageData(state: AppViewState): Promise<void> {
    await Promise.all([
        loadUsageCost(state),
        loadProviderStatus(state),
    ]);
}

/**
 * Reset usage data (admin function)
 */
export async function resetUsageData(state: AppViewState): Promise<void> {
    if (!state.client || !state.connected) return;

    try {
        await state.client.request("usage.reset", {});
        await loadUsageCost(state);
    } catch (err) {
        if (state.usageState) {
            state.usageState = {
                ...state.usageState,
                usageError: `Failed to reset: ${err}`,
            };
        }
    }
}
