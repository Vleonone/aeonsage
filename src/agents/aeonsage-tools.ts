import type { AeonSageConfig } from "../config/config.js";
import { resolvePluginTools } from "../plugins/tools.js";
import type { GatewayMessageChannel } from "../utils/message-channel.js";
import { resolveSessionAgentId } from "./agent-scope.js";
import { createAgentsListTool } from "./tools/agents-list-tool.js";
import { createBrowserTool } from "./tools/browser-tool.js";
import { createCanvasTool } from "./tools/canvas-tool.js";
import type { AnyAgentTool } from "./tools/common.js";
import { createCronTool } from "./tools/cron-tool.js";
import { createGatewayTool } from "./tools/gateway-tool.js";
import { createImageTool } from "./tools/image-tool.js";
import { createMessageTool } from "./tools/message-tool.js";
import { createNodesTool } from "./tools/nodes-tool.js";
import { createSessionStatusTool } from "./tools/session-status-tool.js";
import { createSessionsHistoryTool } from "./tools/sessions-history-tool.js";
import { createSessionsListTool } from "./tools/sessions-list-tool.js";
import { createSessionsSendTool } from "./tools/sessions-send-tool.js";
import { createSessionsSpawnTool } from "./tools/sessions-spawn-tool.js";
import { createWebFetchTool, createWebSearchTool } from "./tools/web-tools.js";
import { createTtsTool } from "./tools/tts-tool.js";
import { adaptMcpTool, type McpToolDefinition } from "./tools/tool-adapter.js";
// P0: 24/7 Core Tools (MCP-style, adapted)
import { createHealthCheckTool as createHealthCheckToolMcp } from "./tools/health-check-tool.js";
import { createHeartbeatTool as createHeartbeatToolMcp } from "./tools/heartbeat-tool.js";
import { createSelfRestartTool as createSelfRestartToolMcp } from "./tools/self-restart-tool.js";
import { createErrorRecoveryTool as createErrorRecoveryToolMcp } from "./tools/error-recovery-tool.js";
import { createLogAnalyzerTool as createLogAnalyzerToolMcp } from "./tools/log-analyzer-tool.js";
// P1: Efficiency Tools (MCP-style, adapted)
import { createDatabaseTool as createDatabaseToolMcp } from "./tools/database-tool.js";
import { createFileManagerTool as createFileManagerToolMcp } from "./tools/file-manager-tool.js";
import { createEmailTool as createEmailToolMcp } from "./tools/email-tool.js";
import { createWebhookTriggerTool as createWebhookTriggerToolMcp } from "./tools/webhook-trigger-tool.js";
// P2: Capability Extension Tools (MCP-style, adapted)
import { createWeatherTool as createWeatherToolMcp } from "./tools/weather-tool.js";
import { createTranslateTool as createTranslateToolMcp } from "./tools/translate-tool.js";
import { createGitHubTool as createGitHubToolMcp } from "./tools/github-tool.js";
import { createCryptoPriceTool as createCryptoPriceToolMcp } from "./tools/crypto-price-tool.js";
// P3: Advanced Tools (MCP-style, adapted)
import { createDockerTool as createDockerToolMcp } from "./tools/docker-tool.js";
import { createSshTool as createSshToolMcp } from "./tools/ssh-tool.js";
import { createScreenCaptureTool as createScreenCaptureToolMcp } from "./tools/screen-capture-tool.js";
// Skill Manager Tool
import { createSkillManagerTool } from "./tools/skill-manager-tool.js";

export function createAeonSageTools(options?: {
  sandboxBrowserBridgeUrl?: string;
  allowHostBrowserControl?: boolean;
  agentSessionKey?: string;
  agentChannel?: GatewayMessageChannel;
  agentAccountId?: string;
  /** Delivery target (e.g. telegram:group:123:topic:456) for topic/thread routing. */
  agentTo?: string;
  /** Thread/topic identifier for routing replies to the originating thread. */
  agentThreadId?: string | number;
  /** Group id for channel-level tool policy inheritance. */
  agentGroupId?: string | null;
  /** Group channel label for channel-level tool policy inheritance. */
  agentGroupChannel?: string | null;
  /** Group space label for channel-level tool policy inheritance. */
  agentGroupSpace?: string | null;
  agentDir?: string;
  sandboxRoot?: string;
  workspaceDir?: string;
  sandboxed?: boolean;
  config?: AeonSageConfig;
  pluginToolAllowlist?: string[];
  /** Current channel ID for auto-threading (Slack). */
  currentChannelId?: string;
  /** Current thread timestamp for auto-threading (Slack). */
  currentThreadTs?: string;
  /** Reply-to mode for Slack auto-threading. */
  replyToMode?: "off" | "first" | "all";
  /** Mutable ref to track if a reply was sent (for "first" mode). */
  hasRepliedRef?: { value: boolean };
  /** If true, the model has native vision capability */
  modelHasVision?: boolean;
  /** Explicit agent ID override for cron/hook sessions. */
  requesterAgentIdOverride?: string;
}): AnyAgentTool[] {
  const imageTool = options?.agentDir?.trim()
    ? createImageTool({
        config: options?.config,
        agentDir: options.agentDir,
        sandboxRoot: options?.sandboxRoot,
        modelHasVision: options?.modelHasVision,
      })
    : null;
  const webSearchTool = createWebSearchTool({
    config: options?.config,
    sandboxed: options?.sandboxed,
  });
  const webFetchTool = createWebFetchTool({
    config: options?.config,
    sandboxed: options?.sandboxed,
  });
  const tools: AnyAgentTool[] = [
    createBrowserTool({
      sandboxBridgeUrl: options?.sandboxBrowserBridgeUrl,
      allowHostControl: options?.allowHostBrowserControl,
    }),
    createCanvasTool(),
    createNodesTool({
      agentSessionKey: options?.agentSessionKey,
      config: options?.config,
    }),
    createCronTool({
      agentSessionKey: options?.agentSessionKey,
    }),
    createMessageTool({
      agentAccountId: options?.agentAccountId,
      agentSessionKey: options?.agentSessionKey,
      config: options?.config,
      currentChannelId: options?.currentChannelId,
      currentChannelProvider: options?.agentChannel,
      currentThreadTs: options?.currentThreadTs,
      replyToMode: options?.replyToMode,
      hasRepliedRef: options?.hasRepliedRef,
    }),
    createTtsTool({
      agentChannel: options?.agentChannel,
      config: options?.config,
    }),
    createGatewayTool({
      agentSessionKey: options?.agentSessionKey,
      config: options?.config,
    }),
    createAgentsListTool({
      agentSessionKey: options?.agentSessionKey,
      requesterAgentIdOverride: options?.requesterAgentIdOverride,
    }),
    createSessionsListTool({
      agentSessionKey: options?.agentSessionKey,
      sandboxed: options?.sandboxed,
    }),
    createSessionsHistoryTool({
      agentSessionKey: options?.agentSessionKey,
      sandboxed: options?.sandboxed,
    }),
    createSessionsSendTool({
      agentSessionKey: options?.agentSessionKey,
      agentChannel: options?.agentChannel,
      sandboxed: options?.sandboxed,
    }),
    createSessionsSpawnTool({
      agentSessionKey: options?.agentSessionKey,
      agentChannel: options?.agentChannel,
      agentAccountId: options?.agentAccountId,
      agentTo: options?.agentTo,
      agentThreadId: options?.agentThreadId,
      agentGroupId: options?.agentGroupId,
      agentGroupChannel: options?.agentGroupChannel,
      agentGroupSpace: options?.agentGroupSpace,
      sandboxed: options?.sandboxed,
      requesterAgentIdOverride: options?.requesterAgentIdOverride,
    }),
    createSessionStatusTool({
      agentSessionKey: options?.agentSessionKey,
      config: options?.config,
    }),
    ...(webSearchTool ? [webSearchTool] : []),
    ...(webFetchTool ? [webFetchTool] : []),
    ...(imageTool ? [imageTool] : []),
    // P0: 24/7 Core Tools (adapted from MCP format)
    adaptMcpTool(
      createHealthCheckToolMcp({ config: options?.config }) as unknown as McpToolDefinition,
    ),
    adaptMcpTool(
      createHeartbeatToolMcp({ config: options?.config }) as unknown as McpToolDefinition,
    ),
    adaptMcpTool(
      createSelfRestartToolMcp({ config: options?.config }) as unknown as McpToolDefinition,
    ),
    adaptMcpTool(
      createErrorRecoveryToolMcp({ config: options?.config }) as unknown as McpToolDefinition,
    ),
    adaptMcpTool(createLogAnalyzerToolMcp() as unknown as McpToolDefinition),
    // P1: Efficiency Tools (adapted from MCP format)
    adaptMcpTool(
      createDatabaseToolMcp({ config: options?.config }) as unknown as McpToolDefinition,
    ),
    adaptMcpTool(
      createFileManagerToolMcp({
        config: options?.config,
        sandboxDir: options?.sandboxRoot,
      }) as unknown as McpToolDefinition,
    ),
    adaptMcpTool(createEmailToolMcp({ config: options?.config }) as unknown as McpToolDefinition),
    adaptMcpTool(
      createWebhookTriggerToolMcp({ config: options?.config }) as unknown as McpToolDefinition,
    ),
    // P2: Capability Extension Tools (adapted from MCP format)
    adaptMcpTool(createWeatherToolMcp({ config: options?.config }) as unknown as McpToolDefinition),
    adaptMcpTool(
      createTranslateToolMcp({ config: options?.config }) as unknown as McpToolDefinition,
    ),
    adaptMcpTool(createGitHubToolMcp({ config: options?.config }) as unknown as McpToolDefinition),
    adaptMcpTool(createCryptoPriceToolMcp() as unknown as McpToolDefinition),
    // P3: Advanced Tools (adapted from MCP format)
    adaptMcpTool(createDockerToolMcp({ config: options?.config }) as unknown as McpToolDefinition),
    adaptMcpTool(createSshToolMcp() as unknown as McpToolDefinition),
    adaptMcpTool(
      createScreenCaptureToolMcp({ config: options?.config }) as unknown as McpToolDefinition,
    ),
    // Skill Manager Tool (AeonSage Skills Registry)
    adaptMcpTool(createSkillManagerTool() as unknown as McpToolDefinition),
  ];

  const pluginTools = resolvePluginTools({
    context: {
      config: options?.config,
      workspaceDir: options?.workspaceDir,
      agentDir: options?.agentDir,
      agentId: resolveSessionAgentId({
        sessionKey: options?.agentSessionKey,
        config: options?.config,
      }),
      sessionKey: options?.agentSessionKey,
      messageChannel: options?.agentChannel,
      agentAccountId: options?.agentAccountId,
      sandboxed: options?.sandboxed,
    },
    existingToolNames: new Set(tools.map((tool) => tool.name)),
    toolAllowlist: options?.pluginToolAllowlist,
  });

  return [...tools, ...pluginTools];
}
