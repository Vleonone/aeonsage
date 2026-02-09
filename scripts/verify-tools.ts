/**
 * Quick verification test for 24/7 Autonomous Operation Tools
 * Run with: npx tsx scripts/verify-tools.ts
 */

import { createHealthCheckTool } from "../src/agents/tools/health-check-tool.js";
import { createHeartbeatTool } from "../src/agents/tools/heartbeat-tool.js";
import { createSelfRestartTool } from "../src/agents/tools/self-restart-tool.js";
import { createErrorRecoveryTool } from "../src/agents/tools/error-recovery-tool.js";
import { createLogAnalyzerTool } from "../src/agents/tools/log-analyzer-tool.js";
import { createDatabaseTool } from "../src/agents/tools/database-tool.js";
import { createFileManagerTool } from "../src/agents/tools/file-manager-tool.js";
import { createEmailTool } from "../src/agents/tools/email-tool.js";
import { createWebhookTriggerTool } from "../src/agents/tools/webhook-trigger-tool.js";
import { createWeatherTool } from "../src/agents/tools/weather-tool.js";
import { createTranslateTool } from "../src/agents/tools/translate-tool.js";
import { createGitHubTool } from "../src/agents/tools/github-tool.js";
import { createCryptoPriceTool } from "../src/agents/tools/crypto-price-tool.js";
import { createDockerTool } from "../src/agents/tools/docker-tool.js";
import { createSshTool } from "../src/agents/tools/ssh-tool.js";
import { createScreenCaptureTool } from "../src/agents/tools/screen-capture-tool.js";

async function verifyTools() {
    console.log("🔍 Verifying 24/7 Autonomous Operation Tools...\n");

    const tools = [
        { name: "P0: health_check", factory: createHealthCheckTool },
        { name: "P0: heartbeat", factory: createHeartbeatTool },
        { name: "P0: self_restart", factory: createSelfRestartTool },
        { name: "P0: error_recovery", factory: createErrorRecoveryTool },
        { name: "P0: log_analyzer", factory: createLogAnalyzerTool },
        { name: "P1: database", factory: createDatabaseTool },
        { name: "P1: file_manager", factory: createFileManagerTool },
        { name: "P1: email", factory: createEmailTool },
        { name: "P1: webhook_trigger", factory: createWebhookTriggerTool },
        { name: "P2: weather", factory: createWeatherTool },
        { name: "P2: translate", factory: createTranslateTool },
        { name: "P2: github", factory: createGitHubTool },
        { name: "P2: crypto_price", factory: createCryptoPriceTool },
        { name: "P3: docker", factory: createDockerTool },
        { name: "P3: ssh", factory: createSshTool },
        { name: "P3: screen_capture", factory: createScreenCaptureTool },
    ];

    let passed = 0;
    let failed = 0;

    for (const { name, factory } of tools) {
        try {
            const tool = factory({});

            // Verify MCP tool structure
            if (typeof tool.name !== "string" || !tool.name) {
                throw new Error("Missing 'name' property");
            }
            if (typeof tool.description !== "string" || !tool.description) {
                throw new Error("Missing 'description' property");
            }
            if (typeof tool.inputSchema !== "object" || !tool.inputSchema) {
                throw new Error("Missing 'inputSchema' property");
            }
            if (typeof tool.call !== "function") {
                throw new Error("Missing 'call' function");
            }

            console.log(`  ✅ ${name}: ${tool.name}`);
            passed++;
        } catch (error) {
            console.log(`  ❌ ${name}: ${error instanceof Error ? error.message : "Unknown error"}`);
            failed++;
        }
    }

    console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

    // Quick functional test: health_check
    console.log("\n🧪 Running functional test: health_check...");
    try {
        const healthTool = createHealthCheckTool({});
        const result = await healthTool.call({
            target: "localhost",
            checks: ["ping"],
        });
        console.log(`  ✅ health_check executed: ${JSON.stringify(result).substring(0, 100)}...`);
    } catch (error) {
        console.log(`  ⚠️ health_check error (expected without network): ${error instanceof Error ? error.message : "Unknown"}`);
    }

    // Quick functional test: crypto_price
    console.log("\n🧪 Running functional test: crypto_price...");
    try {
        const cryptoTool = createCryptoPriceTool({});
        const result = await cryptoTool.call({
            symbol: "BTC",
        });
        console.log(`  ✅ crypto_price executed: ${JSON.stringify(result).substring(0, 100)}...`);
    } catch (error) {
        console.log(`  ⚠️ crypto_price error: ${error instanceof Error ? error.message : "Unknown"}`);
    }

    // Quick functional test: translate
    console.log("\n🧪 Running functional test: translate...");
    try {
        const translateTool = createTranslateTool({});
        const result = await translateTool.call({
            text: "Hello",
            to: "zh",
        });
        console.log(`  ✅ translate executed: ${JSON.stringify(result).substring(0, 100)}...`);
    } catch (error) {
        console.log(`  ⚠️ translate error: ${error instanceof Error ? error.message : "Unknown"}`);
    }

    console.log("\n✨ Verification complete!");

    return failed === 0;
}

verifyTools()
    .then((success) => process.exit(success ? 0 : 1))
    .catch((error) => {
        console.error("Fatal error:", error);
        process.exit(1);
    });
