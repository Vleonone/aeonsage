/**
 * Workflow Canvas Controller
 * Manages subagent tree state for Canvas visualization.
 */

import type { GatewayBrowserClient } from "../gateway";

/** Subagent node status */
export interface WorkflowNode {
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
    // Real-time activity tracking
    currentAction?: string;  // e.g., "Browsing", "Searching", "Coding", "Thinking"
    currentUrl?: string;     // Current website/URL if browsing
    activityLog?: ActivityEntry[];
}

/** Activity log entry for real-time traces */
export interface ActivityEntry {
    timestamp: number;
    action: string;
    url?: string;
    details?: string;
}

/** Workflow tree structure */
export interface WorkflowTree {
    root: {
        sessionKey: string;
        label: string;
        status: "running" | "idle";
        children: WorkflowNode[];
    };
    childMap: Record<string, WorkflowNode[]>;
    totalNodes: number;
}

/** Budget status for display */
export interface BudgetStatus {
    dailyTokenLimit: number;
    currentTokenUsage: number;
    remainingTokens: number;
    utilizationPercent: number;
    spawnCount: number;
    runningCount: number;
    canSpawn: boolean;
}

/** Workflow state for UI */
export interface WorkflowState {
    loading: boolean;
    error: string | null;
    tree: WorkflowTree | null;
    selectedNode: string | null;
    budget: BudgetStatus | null;
}

/** Create initial workflow state */
export function createWorkflowState(): WorkflowState {
    return {
        loading: false,
        error: null,
        tree: null,
        selectedNode: null,
        budget: null,
    };
}

/** Load workflow tree from gateway */
export async function loadWorkflowTree(
    client: GatewayBrowserClient,
    state: WorkflowState,
): Promise<void> {
    state.loading = true;
    state.error = null;

    try {
        const [treeRes, budgetRes] = await Promise.all([
            client.request("subagents.tree", {}),
            client.request("subagents.budget", {}).catch(() => null), // Budget may not be available
        ]);
        if (treeRes && typeof treeRes === "object" && "tree" in treeRes) {
            state.tree = (treeRes as { tree: WorkflowTree }).tree;
        }
        if (budgetRes && typeof budgetRes === "object" && "budget" in budgetRes) {
            state.budget = (budgetRes as { budget: BudgetStatus }).budget;
        }
    } catch (err) {
        state.error = err instanceof Error ? err.message : "Failed to load workflow";
    } finally {
        state.loading = false;
    }
}

/** Stop a subagent */
export async function stopSubagent(
    client: GatewayBrowserClient,
    state: WorkflowState,
    runId: string,
): Promise<boolean> {
    try {
        await client.request("subagents.stop", { runId });
        // Reload tree after stop
        await loadWorkflowTree(client, state);
        return true;
    } catch {
        return false;
    }
}

/** Select a node for details view */
export function selectNode(state: WorkflowState, nodeId: string | null): void {
    state.selectedNode = nodeId;
}

/** Get flattened list of all nodes */
export function getAllNodes(tree: WorkflowTree | null): WorkflowNode[] {
    if (!tree) return [];
    const nodes: WorkflowNode[] = [];
    nodes.push(...tree.root.children);
    for (const children of Object.values(tree.childMap)) {
        nodes.push(...children);
    }
    return nodes;
}

/** Calculate node positions for Canvas layout */
export function calculateCanvasLayout(tree: WorkflowTree | null): Map<string, { x: number; y: number }> {
    const positions = new Map<string, { x: number; y: number }>();
    if (!tree) return positions;

    // Root at center top
    positions.set(tree.root.sessionKey, { x: 400, y: 50 });

    // Children spread horizontally below root
    const children = tree.root.children;
    const spacing = Math.min(200, 700 / Math.max(children.length, 1));
    const startX = 400 - (children.length - 1) * spacing / 2;

    children.forEach((child, i) => {
        positions.set(child.runId, { x: startX + i * spacing, y: 180 });

        // Second level children
        const grandChildren = tree.childMap[child.childSessionKey] ?? [];
        grandChildren.forEach((gc, j) => {
            positions.set(gc.runId, { x: startX + i * spacing + (j - grandChildren.length / 2) * 80, y: 310 });
        });
    });

    return positions;
}
