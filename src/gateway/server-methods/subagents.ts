/**
 * Gateway RPC handlers for subagent workflow management.
 * Exposes SubagentRegistry to UI for Canvas visualization.
 */

import { loadConfig } from "../../config/config.js";
import {
    listSubagentRunsForRequester,
    releaseSubagentRun,
    getBudgetStatus,
    type SubagentRunRecord,
} from "../../agents/subagent-registry.js";
import { resolveMainSessionKey } from "../../config/sessions.js";
import { ErrorCodes, errorShape } from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";

/** Subagent status for UI display */
export interface SubagentNodeStatus {
    runId: string;
    childSessionKey: string;
    requesterSessionKey: string;
    task: string;
    label?: string;
    status: "running" | "completed" | "error" | "pending";
    createdAt: number;
    startedAt?: number;
    endedAt?: number;
    outcome?: string;
}

/** Convert registry record to UI node format */
function toNodeStatus(record: SubagentRunRecord): SubagentNodeStatus {
    let status: SubagentNodeStatus["status"] = "pending";
    if (record.endedAt) {
        status = record.outcome?.status === "ok" ? "completed" : "error";
    } else if (record.startedAt) {
        status = "running";
    }

    return {
        runId: record.runId,
        childSessionKey: record.childSessionKey,
        requesterSessionKey: record.requesterSessionKey,
        task: record.task,
        label: record.label,
        status,
        createdAt: record.createdAt,
        startedAt: record.startedAt,
        endedAt: record.endedAt,
        outcome: record.outcome?.status,
    };
}

export const subagentsHandlers: GatewayRequestHandlers = {
    /**
     * List all subagent runs for the main session (workflow tree).
     */
    "subagents.list": ({ params, respond }) => {
        const cfg = loadConfig();
        const requesterKey =
            typeof params?.requesterSessionKey === "string"
                ? params.requesterSessionKey
                : resolveMainSessionKey(cfg);

        const runs = listSubagentRunsForRequester(requesterKey);
        const nodes = runs.map(toNodeStatus);

        respond(true, { ts: Date.now(), requesterKey, nodes }, undefined);
    },

    /**
     * Get workflow tree for Canvas visualization.
     * Returns hierarchical structure of main + subagents.
     */
    "subagents.tree": ({ params: _params, respond }) => {
        const cfg = loadConfig();
        const mainKey = resolveMainSessionKey(cfg);

        // Build tree: main session at root, subagents as children
        const allRuns = listSubagentRunsForRequester(mainKey);

        // Group by requester to create hierarchy
        const childMap = new Map<string, SubagentNodeStatus[]>();
        for (const run of allRuns) {
            const parentKey = run.requesterSessionKey;
            if (!childMap.has(parentKey)) {
                childMap.set(parentKey, []);
            }
            childMap.get(parentKey)!.push(toNodeStatus(run));
        }

        const tree = {
            root: {
                sessionKey: mainKey,
                label: "CEO Bot",
                status: "running" as const,
                children: childMap.get(mainKey) ?? [],
            },
            childMap: Object.fromEntries(childMap),
            totalNodes: allRuns.length + 1,
        };

        respond(true, { ts: Date.now(), tree }, undefined);
    },

    /**
     * Stop a running subagent.
     */
    "subagents.stop": ({ params, respond }) => {
        const runId = typeof params?.runId === "string" ? params.runId : "";
        if (!runId) {
            respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, "runId required"));
            return;
        }

        releaseSubagentRun(runId);
        respond(true, { ok: true, runId }, undefined);
    },

    /**
     * Get budget status for the main session.
     * Returns current token usage and spawn limits.
     */
    "subagents.budget": ({ params, respond }) => {
        const cfg = loadConfig();
        const requesterKey =
            typeof params?.requesterSessionKey === "string"
                ? params.requesterSessionKey
                : resolveMainSessionKey(cfg);

        const status = getBudgetStatus(requesterKey);

        respond(true, {
            ts: Date.now(),
            budget: {
                dailyTokenLimit: status.budget.dailyTokenLimit,
                currentTokenUsage: status.budget.currentTokenUsage,
                remainingTokens: status.remainingTokens,
                utilizationPercent: status.utilizationPercent,
                spawnCount: status.budget.spawnCount,
                runningCount: status.budget.runningCount,
                canSpawn: status.canSpawn,
            },
        }, undefined);
    },
};
