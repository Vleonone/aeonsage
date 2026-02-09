import type { WebSocket as _WebSocket } from "ws";
import { GatewayClient } from "./client.js";
import type { NodeInvokeResult } from "./node-registry.js";

// Synthetic types to match what NodeRegistry provides, 
// allowing us to treat Remote Gateways as pseudo-nodes.
export type RemoteSession = {
    id: string; // The "nodeId" (remote gateway's agentId)
    url: string;
    client: GatewayClient;
    connectedAt: number;
};

export class RemoteGatewayRegistry {
    private remotes = new Map<string, RemoteSession>();
    private remotesByUrl = new Map<string, string>(); // url -> id

    constructor() { }

    async connect(url: string, authToken?: string): Promise<{ ok: boolean; error?: string; nodeId?: string }> {
        if (this.remotesByUrl.has(url)) {
            return { ok: true, nodeId: this.remotesByUrl.get(url) };
        }

        try {
            const client = new GatewayClient({
                url,
                token: authToken || "anonymous", // simplistic auth for now
                clientName: "gateway-client" as any, // identify ourselves
            });

            // Wait for connection
            client.start();

            // We need to fetch the remote identity to use as nodeId
            // For now, we'll ask for agent summary or similar. 
            // If that's too complex for this phase, we use a synthetic ID based on URL hash or similar,
            // BUT ideally we want the real Agent ID of the remote.
            // Let's assume the remote hello provided it, or we query it.
            // Since GatewayClient doesn't expose remote AgentID easily in its current form without extra calls,
            // let's do a quick 'agent.list' or 'session.list' to verify.

            // For Phase 1 implementation, we will perform a handshake call.
            const status = await client.request("health.status", {});
            // @ts-ignore
            const remoteId = status.agentId || `remote-${Date.now()}`; // Fallback

            const session: RemoteSession = {
                id: remoteId,
                url,
                client,
                connectedAt: Date.now(),
            };

            this.remotes.set(remoteId, session);
            this.remotesByUrl.set(url, remoteId);

            // Handle disconnection
            // client.on("close", () => this.disconnect(remoteId)); 

            return { ok: true, nodeId: remoteId };
        } catch (err) {
            return { ok: false, error: String(err) };
        }
    }

    get(nodeId: string): RemoteSession | undefined {
        return this.remotes.get(nodeId);
    }

    list() {
        return Array.from(this.remotes.values()).map(s => ({
            id: s.id,
            url: s.url,
            type: "remote-gateway",
            connectedAt: s.connectedAt
        }));
    }

    async invoke(params: {
        nodeId: string;
        command: string;
        params?: unknown;
        timeoutMs?: number;
    }): Promise<NodeInvokeResult> {
        const session = this.remotes.get(params.nodeId);
        if (!session) {
            return { ok: false, error: { code: "NOT_FOUND", message: "Remote node not found" } };
        }

        try {
            // Forward the request via the client
            const result = await session.client.request(params.command, params.params as any);
            return { ok: true, payload: result };
        } catch (err: any) {
            return {
                ok: false,
                error: {
                    code: "REMOTE_ERROR",
                    message: err.message || String(err),
                }
            };
        }
    }

    async disconnect(nodeId: string) {
        const session = this.remotes.get(nodeId);
        if (session) {
            session.client.stop();
            this.remotes.delete(nodeId);
            this.remotesByUrl.delete(session.url);
        }
    }
}
