import { z } from "zod";

// Configuration for the Oracle Engine
const ORACLE_CONFIG = {
    baseUrl: "http://127.0.0.1:11434/v1", // Default Ollama OpenAI-compatible endpoint
    // Default to a small, fast model. User should have this pulled.
    // We can make this configurable via env vars later.
    model: "qwen2.5:0.5b",
    timeoutMs: 1000, // Allow up to 1s for local SLM inference
    maxRetries: 1,
};

// The schema for the Oracle's judgment
// We ask the model to output strict JSON conforming to this.
const OracleJudgmentSchema = z.object({
    complexity: z.number().min(1).max(10),
    reasoning_required: z.boolean(),
    domain: z.enum(["coding", "creative", "logic", "conversation", "knowledge"]),
    suggested_tier: z.enum(["reflex", "standard", "deep"]),
});

export type OracleJudgment = z.infer<typeof OracleJudgmentSchema>;

const SYSTEM_PROMPT = `
You are the AEONSAGE COGNITIVE ORACLE.
Your job is to analyze the user's prompt and classify its DIFFICULTY and INTENT.
You must output ONLY valid JSON. No other text.

Classification Rules:
- complexity: 1-10 scale (1=Hello/Hi, 5=Write a react component, 10=Prove P=NP or debug complex race condition)
- reasoning_required: true if the task requires multi-step logic or planning.
- domain: "coding", "creative", "logic", "conversation", "knowledge"
- suggested_tier:
  - "reflex" (Score 1-3): Simple queries, chit-chat, exact facts.
  - "standard" (Score 4-7): Standard coding, email drafting, summarization.
  - "deep" (Score 8-10): Complex architecture, math proofs, security audits.

Example JSON:
{"complexity": 2, "reasoning_required": false, "domain": "conversation", "suggested_tier": "reflex"}
`;

export class OracleEngine {
    private baseUrl: string;
    private model: string;

    constructor(config?: Partial<typeof ORACLE_CONFIG>) {
        this.baseUrl = config?.baseUrl ?? ORACLE_CONFIG.baseUrl;
        this.model = config?.model ?? ORACLE_CONFIG.model;
    }

    /**
     * The "Vibe Check". Quickly classifies a prompt using the local SLM.
     * Returns null if the Oracle is offline or times out (fail-open).
     */
    async classify(prompt: string): Promise<OracleJudgment | null> {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), ORACLE_CONFIG.timeoutMs);

            const response = await fetch(`${this.baseUrl}/chat/completions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        { role: "system", content: SYSTEM_PROMPT },
                        { role: "user", content: prompt },
                    ],
                    temperature: 0.1, // Deterministic
                    response_format: { type: "json_object" }, // Ollama supports this for some models
                }),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                // Fail silently - the router should fallback to default behavior
                // logic/logs can be added here for debugging
                return null;
            }

            const data = await response.json();
            const content = data.choices?.[0]?.message?.content;

            if (!content) return null;

            // Parse and validate
            // We handle potential JSON parsing errors from the model
            const parsed = JSON.parse(content);
            return OracleJudgmentSchema.parse(parsed);

        } catch {
            // If classification fails (timeout, network, bad model logic),
            // we return null to allow the default router to take over.
            // We do NOT want the Oracle to be a blocker.
            return null;
        }
    }
}
