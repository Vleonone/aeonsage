/**
 * OpenRouter Controller
 *
 * Handles OpenRouter API interactions via Gateway WebSocket RPC:
 * - API key management via config.get/set
 * - Model listing
 * - Usage statistics
 */

import type { AppViewState } from "../app-view-state.js";
import type { OpenRouterModel, OpenRouterViewProps } from "../views/openrouter.js";

export interface OpenRouterControllerState {
    apiKey: string;
    apiKeyMasked: boolean;
    connected: boolean;
    loading: boolean;
    error: string | null;
    models: OpenRouterModel[];
    modelsLoading: boolean;
    searchQuery: string;
    selectedModel: string | null;
    usage: OpenRouterViewProps["usage"];
    defaultModel: string | null;
}

export function createOpenRouterState(): OpenRouterControllerState {
    return {
        apiKey: "",
        apiKeyMasked: true,
        connected: false,
        loading: false,
        error: null,
        models: [],
        modelsLoading: false,
        searchQuery: "",
        selectedModel: null,
        usage: null,
        defaultModel: null,
    };
}

/**
 * Load OpenRouter API key from config
 */
export async function loadOpenRouterApiKey(state: AppViewState): Promise<void> {
    if (!state.openRouterState) {
        state.openRouterState = createOpenRouterState();
    }

    state.openRouterState = { ...state.openRouterState, loading: true, error: null };

    try {
        if (!state.client || !state.connected) {
            throw new Error("Not connected to Gateway");
        }

        // Get API key from config via RPC
        const res = await state.client.request("config.get", {
            path: "providers.openrouter.apiKey",
        }) as { value?: string } | null;

        // Get default model
        const modelRes = await state.client.request("config.get", {
            path: "agents.defaults.model",
        }) as { value?: string } | null;

        const apiKey = res?.value || "";
        const hasKey = apiKey.length > 0;

        state.openRouterState = {
            ...state.openRouterState,
            apiKey: apiKey,
            connected: hasKey,
            loading: false,
            defaultModel: modelRes?.value || null,
        };

        // If we have a key, load models
        if (hasKey) {
            await loadOpenRouterModels(state);
        }
    } catch (err) {
        state.openRouterState = {
            ...state.openRouterState,
            loading: false,
            error: String(err),
        };
    }
}

/**
 * Save OpenRouter API key to config
 */
export async function saveOpenRouterApiKey(state: AppViewState, apiKey: string): Promise<void> {
    if (!state.openRouterState) {
        state.openRouterState = createOpenRouterState();
    }

    state.openRouterState = { ...state.openRouterState, loading: true, error: null };

    try {
        if (!state.client || !state.connected) {
            throw new Error("Not connected to Gateway");
        }

        // Save API key via config.set RPC
        await state.client.request("config.set", {
            path: "providers.openrouter.apiKey",
            value: apiKey,
        });

        state.openRouterState = {
            ...state.openRouterState,
            apiKey: apiKey,
            loading: false,
            connected: apiKey.length > 0,
        };

        // Test the connection and load models
        if (apiKey.length > 0) {
            await testOpenRouterConnection(state);
        }
    } catch (err) {
        state.openRouterState = {
            ...state.openRouterState,
            loading: false,
            error: String(err),
        };
    }
}

/**
 * Test OpenRouter connection by validating the API key
 */
export async function testOpenRouterConnection(state: AppViewState): Promise<void> {
    if (!state.openRouterState) return;

    state.openRouterState = { ...state.openRouterState, loading: true, error: null };

    try {
        const apiKey = state.openRouterState.apiKey;
        if (!apiKey) {
            throw new Error("No API key configured");
        }

        // Validate key via OpenRouter API
        const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });

        if (res.ok) {
            const data = await res.json() as { data?: { label?: string; usage?: number; limit?: number } };
            state.openRouterState = {
                ...state.openRouterState,
                loading: false,
                connected: true,
                usage: data.data ? {
                    totalCost: data.data.usage || 0,
                    totalRequests: 0,
                    periodStart: new Date().toISOString().split("T")[0],
                } : null,
            };
            // Load models after successful connection
            await loadOpenRouterModels(state);
        } else {
            throw new Error(`Invalid API key: ${res.status}`);
        }
    } catch (err) {
        state.openRouterState = {
            ...state.openRouterState,
            loading: false,
            connected: false,
            error: String(err),
        };
    }
}

/**
 * Load available models from OpenRouter
 */
export async function loadOpenRouterModels(state: AppViewState): Promise<void> {
    if (!state.openRouterState) return;

    state.openRouterState = { ...state.openRouterState, modelsLoading: true };

    try {
        const apiKey = state.openRouterState.apiKey;
        if (!apiKey) return;

        const res = await fetch("https://openrouter.ai/api/v1/models", {
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });

        if (res.ok) {
            const data = await res.json() as { data: OpenRouterModel[] };
            state.openRouterState = {
                ...state.openRouterState,
                models: data.data || [],
                modelsLoading: false,
            };
        } else {
            state.openRouterState = {
                ...state.openRouterState,
                modelsLoading: false,
            };
        }
    } catch {
        state.openRouterState = {
            ...state.openRouterState,
            modelsLoading: false,
        };
    }
}

/**
 * Set default model in config
 */
export async function setDefaultModel(state: AppViewState, modelId: string): Promise<void> {
    if (!state.openRouterState) return;

    state.openRouterState = { ...state.openRouterState, loading: true, error: null };

    try {
        if (!state.client || !state.connected) {
            throw new Error("Not connected to Gateway");
        }

        // Save default model via config.set RPC
        await state.client.request("config.set", {
            path: "agents.defaults.model",
            value: `openrouter/${modelId}`,
        });

        state.openRouterState = {
            ...state.openRouterState,
            loading: false,
            selectedModel: modelId,
            defaultModel: `openrouter/${modelId}`,
        };
    } catch (err) {
        state.openRouterState = {
            ...state.openRouterState,
            loading: false,
            error: String(err),
        };
    }
}

/**
 * Toggle API key visibility
 */
export function toggleApiKeyMask(state: AppViewState): void {
    if (!state.openRouterState) return;
    state.openRouterState = {
        ...state.openRouterState,
        apiKeyMasked: !state.openRouterState.apiKeyMasked,
    };
}

/**
 * Set search query for model filtering
 */
export function setModelSearchQuery(state: AppViewState, query: string): void {
    if (!state.openRouterState) return;
    state.openRouterState = {
        ...state.openRouterState,
        searchQuery: query,
    };
}

/**
 * Select a model
 */
export function selectModel(state: AppViewState, modelId: string): void {
    if (!state.openRouterState) return;
    state.openRouterState = {
        ...state.openRouterState,
        selectedModel: modelId,
    };
}

/**
 * Get filtered models based on search query
 */
export function getFilteredModels(state: AppViewState): OpenRouterModel[] {
    if (!state.openRouterState) return [];

    const { models, searchQuery } = state.openRouterState;
    if (!searchQuery) return models;

    const query = searchQuery.toLowerCase();
    return models.filter(model =>
        model.id.toLowerCase().includes(query) ||
        model.name?.toLowerCase().includes(query) ||
        model.description?.toLowerCase().includes(query)
    );
}

// Legacy controller factory for backwards compatibility
export function createOpenRouterController(params: {
    gatewayUrl: string;
    authToken?: string;
    onStateChange: (state: OpenRouterControllerState) => void;
}) {
    let state = createOpenRouterState();

    const update = (partial: Partial<OpenRouterControllerState>) => {
        state = { ...state, ...partial };
        params.onStateChange(state);
    };

    return {
        getState: () => state,

        async loadApiKey() {
            update({ loading: true, error: null });
            try {
                const res = await fetch(`${params.gatewayUrl}/api/config/get?path=providers.openrouter.apiKey`, {
                    headers: params.authToken ? { Authorization: `Bearer ${params.authToken}` } : {},
                });
                if (res.ok) {
                    const data = await res.json() as { value?: string };
                    update({ apiKey: data.value || "", loading: false, connected: !!data.value });
                } else {
                    update({ loading: false });
                }
            } catch (err) {
                update({ loading: false, error: String(err) });
            }
        },

        setApiKey(key: string) {
            update({ apiKey: key });
        },

        toggleMask() {
            update({ apiKeyMasked: !state.apiKeyMasked });
        },

        async saveApiKey() {
            update({ loading: true, error: null });
            try {
                const res = await fetch(`${params.gatewayUrl}/api/config/set`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(params.authToken ? { Authorization: `Bearer ${params.authToken}` } : {}),
                    },
                    body: JSON.stringify({
                        path: "providers.openrouter.apiKey",
                        value: state.apiKey,
                    }),
                });
                if (!res.ok) throw new Error(`Failed to save: ${res.status}`);
                update({ loading: false });
            } catch (err) {
                update({ loading: false, error: String(err) });
            }
        },

        async testConnection() {
            update({ loading: true, error: null, connected: false });
            try {
                const res = await fetch("https://openrouter.ai/api/v1/auth/key", {
                    headers: { Authorization: `Bearer ${state.apiKey}` },
                });
                if (res.ok) {
                    update({ loading: false, connected: true });
                    await this.loadModels();
                } else {
                    throw new Error(`Invalid API key: ${res.status}`);
                }
            } catch (err) {
                update({ loading: false, connected: false, error: String(err) });
            }
        },

        async loadModels() {
            update({ modelsLoading: true });
            try {
                const res = await fetch("https://openrouter.ai/api/v1/models", {
                    headers: { Authorization: `Bearer ${state.apiKey}` },
                });
                if (res.ok) {
                    const data = await res.json() as { data: OpenRouterModel[] };
                    update({ models: data.data || [], modelsLoading: false });
                } else {
                    update({ modelsLoading: false });
                }
            } catch {
                update({ modelsLoading: false });
            }
        },

        setSearchQuery(query: string) {
            update({ searchQuery: query });
        },

        selectModel(modelId: string) {
            update({ selectedModel: modelId });
        },

        async setDefaultModel(modelId: string) {
            update({ loading: true, error: null });
            try {
                const res = await fetch(`${params.gatewayUrl}/api/config/set`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        ...(params.authToken ? { Authorization: `Bearer ${params.authToken}` } : {}),
                    },
                    body: JSON.stringify({
                        path: "agents.defaults.model",
                        value: `openrouter/${modelId}`,
                    }),
                });
                if (!res.ok) throw new Error(`Failed to set default: ${res.status}`);
                update({ loading: false, selectedModel: modelId, defaultModel: `openrouter/${modelId}` });
            } catch (err) {
                update({ loading: false, error: String(err) });
            }
        },
    };
}
