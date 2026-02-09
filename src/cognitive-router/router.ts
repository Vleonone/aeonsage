import { OracleEngine, OracleJudgment } from "./oracle/engine.js";
import { CascadingRouter, ModelTier } from "./routing/cascading.js";

export class CognitiveRouter {
    private oracle: OracleEngine;
    private cascading: CascadingRouter;
    private static instance: CognitiveRouter;

    private constructor() {
        this.oracle = new OracleEngine();
        this.cascading = new CascadingRouter();
    }

    static getInstance(): CognitiveRouter {
        if (!CognitiveRouter.instance) {
            CognitiveRouter.instance = new CognitiveRouter();
        }
        return CognitiveRouter.instance;
    }

    /**
     * The core routing function.
     * Takes the user prompt and returns the optimal Provider & Model ID.
     */
    async route(prompt: string): Promise<{ provider: string; model: string; tier: ModelTier; judgment: OracleJudgment | null }> {
        // 1. Oracle Vibe Check
        const judgment = await this.oracle.classify(prompt);

        // 2. Decide Tier
        const tier = this.cascading.decideTier(judgment);

        // 3. Resolve Model ID
        const modelFullId = this.cascading.resolveModel(tier);

        // Parse "provider:model" string
        // e.g., "openrouter:groq/llama-3-8b-8192" -> provider="openrouter", model="groq/llama-3-8b-8192"
        // e.g., "gpt-4o" -> provider="openai", model="gpt-4o" (default assumption)

        let provider = "openai"; // Default
        let model = modelFullId;

        if (modelFullId.includes(":")) {
            const parts = modelFullId.split(":");
            provider = parts[0];
            model = parts.slice(1).join(":");
        } else {
            // Handle known implicit providers if needed, or rely on downstream logic
            if (modelFullId.startsWith("claude")) provider = "anthropic";
            if (modelFullId.startsWith("gemini")) provider = "google";
        }

        return {
            provider,
            model,
            tier,
            judgment,
        };
    }
}
