import type { ConfigUiHints, ConfigUiHint } from "../types";

export type JsonSchema = {
  type?: string | string[];
  title?: string;
  description?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema | JsonSchema[];
  additionalProperties?: JsonSchema | boolean;
  enum?: unknown[];
  const?: unknown;
  default?: unknown;
  anyOf?: JsonSchema[];
  oneOf?: JsonSchema[];
  allOf?: JsonSchema[];
  nullable?: boolean;
};

/**
 * Default hints for common config paths.
 * These provide helpful descriptions and placeholders when the schema doesn't include them.
 */
export const DEFAULT_CONFIG_HINTS: ConfigUiHints = {
  // Setup Wizard section
  "wizard.lastRunAt": {
    help: "Timestamp of the last setup wizard run",
    placeholder: "e.g., 2026-02-03T10:00:00Z",
  },
  "wizard.lastRunCommand": {
    help: "Command used in the last wizard run",
    placeholder: "e.g., aeonsage setup",
  },
  "wizard.lastRunCommit": {
    help: "Git commit hash at last wizard run",
    placeholder: "e.g., abc123def456",
  },
  "wizard.lastRunMode": {
    help: "Deployment mode: 'local' for development, 'remote' for production server",
  },
  "wizard.lastRunVersion": {
    help: "AeonSage version at last wizard run",
    placeholder: "e.g., 2.0.0",
  },
  // Environment section
  "env.logLevel": {
    help: "Logging verbosity: debug, info, warn, error",
    placeholder: "info",
  },
  "env.dataDir": {
    help: "Directory for storing application data",
    placeholder: "~/.aeonsage/data",
  },
  "env.locale": {
    help: "Language/locale setting (e.g., en, zh-CN, ja)",
    placeholder: "en",
  },
  // Agents section
  "agents.defaultId": {
    help: "ID of the default agent to use",
    placeholder: "main",
  },
  "agents.list.*.id": {
    help: "Unique identifier for this agent",
    placeholder: "e.g., support-bot",
  },
  "agents.list.*.name": {
    help: "Display name for the agent",
    placeholder: "e.g., Customer Support Bot",
  },
  // Channels section
  "channels.telegram.token": {
    help: "Telegram Bot Token from @BotFather",
    placeholder: "123456789:ABCdefGHIjklMNOpqrsTUVwxyz",
    sensitive: true,
  },
  "channels.discord.token": {
    help: "Discord Bot Token from Developer Portal",
    placeholder: "NTk...xyz.ABC",
    sensitive: true,
  },
  "channels.slack.botToken": {
    help: "Slack Bot OAuth Token (xoxb-...)",
    placeholder: "xoxb-123456789-...",
    sensitive: true,
  },
  "channels.whatsapp.phoneNumber": {
    help: "WhatsApp Business phone number",
    placeholder: "+1234567890",
  },
  // Messages section
  "messages.maxTokens": {
    help: "Maximum tokens per response",
    placeholder: "4096",
  },
  "messages.defaultModel": {
    help: "Default LLM model name",
    placeholder: "e.g., gpt-4, claude-3-opus",
  },
  // Commands section
  "commands.prefix": {
    help: "Command prefix character",
    placeholder: "/",
  },
  "commands.allowlist": {
    help: "List of allowed commands (empty = all)",
  },
  // Skills section
  "skills.install.nodeManager": {
    help: "Package manager for Node skills: npm, pnpm, yarn, bun",
    placeholder: "pnpm",
  },
  "skills.entries.*.enabled": {
    help: "Whether this skill is enabled",
  },
  "skills.entries.*.apiKey": {
    help: "API key for this skill (if required)",
    sensitive: true,
  },
  // Tools section
  "tools.bash.enabled": {
    help: "Enable bash/shell command execution",
  },
  "tools.web.enabled": {
    help: "Enable web browsing capabilities",
  },
  "tools.*.timeout": {
    help: "Timeout in milliseconds",
    placeholder: "30000",
  },
  // Gateway section
  "gateway.port": {
    help: "HTTP server port",
    placeholder: "3333",
  },
  "gateway.host": {
    help: "Bind address (0.0.0.0 for all interfaces)",
    placeholder: "127.0.0.1",
  },
  "gateway.cors.origins": {
    help: "Allowed CORS origins",
    placeholder: "http://localhost:5173",
  },
  // Authentication section
  "auth.password": {
    help: "Password for UI access",
    sensitive: true,
    placeholder: "Enter secure password",
  },
  "auth.jwtSecret": {
    help: "Secret for JWT token signing",
    sensitive: true,
  },
  // OpenRouter section
  "openrouter.apiKey": {
    help: "OpenRouter API key from openrouter.ai",
    sensitive: true,
    placeholder: "sk-or-v1-...",
  },
  "openrouter.defaultModel": {
    help: "Default model to use via OpenRouter",
    placeholder: "anthropic/claude-3.5-sonnet",
  },
  // Meta section
  "meta.projectName": {
    help: "Your project name",
    placeholder: "My AI Assistant",
  },
  "meta.description": {
    help: "Brief project description",
    placeholder: "An intelligent assistant for...",
  },
};

export function schemaType(schema: JsonSchema): string | undefined {
  if (!schema) return undefined;
  if (Array.isArray(schema.type)) {
    const filtered = schema.type.filter((t) => t !== "null");
    return filtered[0] ?? schema.type[0];
  }
  return schema.type;
}

export function defaultValue(schema?: JsonSchema): unknown {
  if (!schema) return "";
  if (schema.default !== undefined) return schema.default;
  const type = schemaType(schema);
  switch (type) {
    case "object":
      return {};
    case "array":
      return [];
    case "boolean":
      return false;
    case "number":
    case "integer":
      return 0;
    case "string":
      return "";
    default:
      return "";
  }
}

export function pathKey(path: Array<string | number>): string {
  return path.filter((segment) => typeof segment === "string").join(".");
}

export function hintForPath(path: Array<string | number>, hints: ConfigUiHints): ConfigUiHint | undefined {
  const key = pathKey(path);

  // Try direct match first
  const direct = hints[key];
  if (direct) return direct;

  // Try wildcard match from provided hints
  const segments = key.split(".");
  for (const [hintKey, hint] of Object.entries(hints)) {
    if (!hintKey.includes("*")) continue;
    const hintSegments = hintKey.split(".");
    if (hintSegments.length !== segments.length) continue;
    let match = true;
    for (let i = 0; i < segments.length; i += 1) {
      if (hintSegments[i] !== "*" && hintSegments[i] !== segments[i]) {
        match = false;
        break;
      }
    }
    if (match) return hint;
  }

  // Fallback to DEFAULT_CONFIG_HINTS
  const defaultHint = DEFAULT_CONFIG_HINTS[key];
  if (defaultHint) return defaultHint;

  // Try wildcard in DEFAULT_CONFIG_HINTS
  for (const [hintKey, hint] of Object.entries(DEFAULT_CONFIG_HINTS)) {
    if (!hintKey.includes("*")) continue;
    const hintSegments = hintKey.split(".");
    if (hintSegments.length !== segments.length) continue;
    let match = true;
    for (let i = 0; i < segments.length; i += 1) {
      if (hintSegments[i] !== "*" && hintSegments[i] !== segments[i]) {
        match = false;
        break;
      }
    }
    if (match) return hint;
  }

  return undefined;
}


export function humanize(raw: string) {
  return raw
    .replace(/_/g, " ")
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .replace(/\s+/g, " ")
    .replace(/^./, (m) => m.toUpperCase());
}

export function isSensitivePath(path: Array<string | number>): boolean {
  const key = pathKey(path).toLowerCase();
  return (
    key.includes("token") ||
    key.includes("password") ||
    key.includes("secret") ||
    key.includes("apikey") ||
    key.endsWith("key")
  );
}
