/**
 * Marketplace Controller
 * Fetches skills from the remote AeonSkills Marketplace API.
 */

export type MarketplaceSkill = {
    name: string;
    author: string;
    repoPath?: string;
    url?: string;
    displayName?: string;
    description?: string;
    category?: string;
    tags?: string[];
    sourceIds?: string[];
    sources?: Array<{ id: string; trust: string; url: string }>;
    sourceTrust?: string;
};

export type MarketplaceSource = {
    id: string;
    url: string;
    total: number;
    error?: string;
};

export type MarketplaceSearchResult = {
    skills: MarketplaceSkill[];
    total: number;
    sources?: MarketplaceSource[];
    lastSync?: string;
};

export type MarketplaceState = {
    marketplaceApiUrl: string;
    marketplaceSkills: MarketplaceSkill[];
    marketplaceSources: MarketplaceSource[];
    marketplaceLoading: boolean;
    marketplaceError: string | null;
    marketplaceLastSync: string | null;
    marketplaceTotalCount: number;
    marketplaceQuery: string;
    selectedCategory: string; // "all" | "official" | "community" | "tools" | "ai"
};

const DEFAULT_API_URL = "https://aeonskills-production.up.railway.app";

function getApiUrl(state: MarketplaceState): string {
    return state.marketplaceApiUrl || DEFAULT_API_URL;
}

/**
 * Fetch skills from the remote Marketplace API.
 */
export async function loadMarketplaceSkills(
    state: MarketplaceState,
    options?: { query?: string; limit?: number; offset?: number }
): Promise<void> {
    if (state.marketplaceLoading) return;

    state.marketplaceLoading = true;
    state.marketplaceError = null;

    try {
        const baseUrl = getApiUrl(state);
        const params = new URLSearchParams();
        if (options?.query) params.set("q", options.query);
        if (options?.limit) params.set("limit", String(options.limit));
        if (options?.offset) params.set("offset", String(options.offset));

        const url = `${baseUrl}/api/skills/search?${params.toString()}`;
        const response = await fetch(url, {
            method: "GET",
            headers: { Accept: "application/json" },
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        state.marketplaceSkills = data.skills ?? [];
        state.marketplaceTotalCount = data.total ?? data.skills?.length ?? 0;
        state.marketplaceSources = data.sources ?? [];
        state.marketplaceLastSync = data.lastSync ?? null;
    } catch (err) {
        state.marketplaceError = err instanceof Error ? err.message : String(err);
    } finally {
        state.marketplaceLoading = false;
    }
}

/**
 * Trigger a sync on the Marketplace API to refresh skills from sources.
 */
export async function syncMarketplace(state: MarketplaceState): Promise<void> {
    if (state.marketplaceLoading) return;

    state.marketplaceLoading = true;
    state.marketplaceError = null;

    try {
        const baseUrl = getApiUrl(state);
        const response = await fetch(`${baseUrl}/api/skills/sync`, {
            method: "POST",
            headers: { Accept: "application/json" },
        });

        if (!response.ok) {
            throw new Error(`Sync failed: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        state.marketplaceLastSync = data.lastSync ?? null;
        state.marketplaceTotalCount = data.totalSkills ?? 0;

        // Reload skills after sync
        await loadMarketplaceSkills(state);
    } catch (err) {
        state.marketplaceError = err instanceof Error ? err.message : String(err);
        state.marketplaceLoading = false;
    }
}

/**
 * Fetch available sources from the Marketplace API.
 */
export async function loadMarketplaceSources(state: MarketplaceState): Promise<void> {
    try {
        const baseUrl = getApiUrl(state);
        const response = await fetch(`${baseUrl}/api/sources`, {
            method: "GET",
            headers: { Accept: "application/json" },
        });

        if (!response.ok) {
            throw new Error(`API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        state.marketplaceSources = data.sources ?? [];
    } catch (err) {
        // Non-critical, don't set error state
        console.warn("[marketplace] Failed to load sources:", err);
    }
}

/**
 * Initialize marketplace state with defaults.
 */
export function initMarketplaceState(): MarketplaceState {
    return {
        marketplaceApiUrl: DEFAULT_API_URL,
        marketplaceSkills: [],
        marketplaceSources: [],
        marketplaceLoading: false,
        marketplaceError: null,
        marketplaceLastSync: null,
        marketplaceTotalCount: 0,
        marketplaceQuery: "",
        selectedCategory: "all",
    };
}

