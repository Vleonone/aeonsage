/**
 * Oracle Engine Debug Test
 * Detailed diagnostics for Oracle connection
 */

import { OracleEngine } from "./oracle/engine.js";

async function testOracleDetailed() {
    console.log("🔍 Oracle Engine Diagnostic Test\n");

    const oracle = new OracleEngine();
    const testPrompt = "Hello, how are you?";

    console.log("📝 Test Prompt:", testPrompt);
    console.log("🔗 Oracle Endpoint: http://127.0.0.1:11434/v1/chat/completions");
    console.log("🤖 Model: qwen2.5:0.5b");
    console.log("⏱️  Timeout: 500ms\n");

    console.log("⏳ Calling Oracle.classify()...\n");

    const startTime = Date.now();
    try {
        const result = await oracle.classify(testPrompt);
        const elapsedTime = Date.now() - startTime;

        if (result) {
            console.log("✅ Oracle Response Received!");
            console.log(`⏱️  Time: ${elapsedTime}ms\n`);
            console.log("📊 Judgment:");
            console.log(`   - Complexity: ${result.complexity}/10`);
            console.log(`   - Domain: ${result.domain}`);
            console.log(`   - Reasoning Required: ${result.reasoning_required}`);
            console.log(`   - Suggested Tier: ${result.suggested_tier}\n`);
            console.log("🎉 Oracle is ONLINE and working correctly!");
        } else {
            const elapsedTime = Date.now() - startTime;
            console.log(`❌ Oracle returned NULL (offline/timeout)`);
            console.log(`⏱️  Time: ${elapsedTime}ms\n`);

            if (elapsedTime >= 500) {
                console.log("⚠️  Reason: Timeout (>500ms)");
                console.log("💡 Suggestion: Model might be too slow. Try:");
                console.log("   1. Keep the model loaded with: ollama run qwen2.5:0.5b");
                console.log("   2. Or increase timeout in oracle/engine.ts");
            } else {
                console.log("⚠️  Reason: Network error or invalid response");
                console.log("💡 Suggestion: Check if Ollama is running:");
                console.log("   curl http://127.0.0.1:11434/api/version");
            }
        }
    } catch (error) {
        const elapsedTime = Date.now() - startTime;
        console.log(`❌ Oracle Error: ${String(error)}`);
        console.log(`⏱️  Time: ${elapsedTime}ms\n`);
    }

    // Test raw Ollama endpoint
    console.log("\n🔬 Testing Raw Ollama Endpoint...\n");

    try {
        const response = await fetch("http://127.0.0.1:11434/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "qwen2.5:0.5b",
                messages: [
                    { role: "system", content: "You are a test assistant. Reply with 'OK'." },
                    { role: "user", content: "Test" },
                ],
                temperature: 0.1,
            }),
        });

        if (response.ok) {
            const data = await response.json();
            console.log("✅ Raw Ollama endpoint is accessible");
            console.log(`📝 Response: ${JSON.stringify(data, null, 2)}\n`);
        } else {
            console.log(`❌ Raw endpoint returned status: ${response.status}`);
        }
    } catch (error) {
        console.log(`❌ Raw endpoint error: ${String(error)}`);
    }
}

testOracleDetailed()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error("Fatal error:", error);
        process.exit(1);
    });
