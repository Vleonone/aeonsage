/**
 * Webhook Trigger Tool
 *
 * Call external webhooks and APIs for integrations.
 */

// MCP-style tool - type inferred
import type { AeonSageConfig } from "../../config/config.js";

export interface WebhookToolParams {
  config?: AeonSageConfig;
}

export type HttpMethod = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export interface WebhookResult {
  success: boolean;
  url: string;
  method: HttpMethod;
  statusCode?: number;
  statusText?: string;
  responseTime?: number;
  headers?: Record<string, string>;
  body?: unknown;
  error?: string;
}

// Webhook registry for saved webhooks
const webhookRegistry: Map<
  string,
  {
    url: string;
    method: HttpMethod;
    headers?: Record<string, string>;
    description?: string;
  }
> = new Map();

/**
 * Validate URL for safety
 */
function isUrlAllowed(url: string): boolean {
  try {
    const parsed = new URL(url);

    // Block localhost and private IPs in production
    const hostname = parsed.hostname.toLowerCase();

    // Allow localhost for development
    if (process.env.NODE_ENV !== "production") {
      return true;
    }

    // Block private networks in production
    const privatePatterns = [
      /^localhost$/i,
      /^127\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
      /^192\.168\./,
      /^0\./,
      /\.local$/i,
    ];

    for (const pattern of privatePatterns) {
      if (pattern.test(hostname)) {
        return false;
      }
    }

    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

/**
 * Execute HTTP request
 */
async function executeRequest(
  url: string,
  method: HttpMethod,
  options: {
    headers?: Record<string, string>;
    body?: unknown;
    timeout?: number;
    followRedirects?: boolean;
  },
): Promise<WebhookResult> {
  const startTime = Date.now();

  if (!isUrlAllowed(url)) {
    return {
      success: false,
      url,
      method,
      error: "URL not allowed. Private IPs are blocked in production.",
    };
  }

  try {
    const headers: Record<string, string> = {
      "User-Agent": "AeonSage-Bot/1.0",
      ...options.headers,
    };

    // Set Content-Type for body
    if (options.body && !headers["Content-Type"]) {
      headers["Content-Type"] = "application/json";
    }

    const fetchOptions: RequestInit = {
      method,
      headers,
      signal: AbortSignal.timeout(options.timeout ?? 30000),
      redirect: options.followRedirects === false ? "manual" : "follow",
    };

    // Add body for non-GET requests
    if (options.body && method !== "GET") {
      fetchOptions.body =
        typeof options.body === "string" ? options.body : JSON.stringify(options.body);
    }

    const response = await fetch(url, fetchOptions);
    const responseTime = Date.now() - startTime;

    // Parse response body
    let body: unknown;
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      try {
        body = await response.json();
      } catch {
        body = await response.text();
      }
    } else if (contentType.includes("text/")) {
      body = await response.text();
    } else {
      const buffer = await response.arrayBuffer();
      body = `[Binary data: ${buffer.byteLength} bytes]`;
    }

    // Extract response headers
    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return {
      success: response.ok,
      url,
      method,
      statusCode: response.status,
      statusText: response.statusText,
      responseTime,
      headers: responseHeaders,
      body,
      error: response.ok ? undefined : `HTTP ${response.status}: ${response.statusText}`,
    };
  } catch (error) {
    return {
      success: false,
      url,
      method,
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : "Request failed",
    };
  }
}

/**
 * Create the webhook trigger tool
 */
export function createWebhookTriggerTool(_params: WebhookToolParams = {}) {
  return {
    name: "webhook_trigger",
    description: `Trigger external webhooks and APIs for third-party integrations.

Operations:
- call: Execute HTTP request (GET, POST, PUT, PATCH, DELETE)
- save: Save a webhook for later use
- list: List saved webhooks
- delete: Remove a saved webhook

Features:
- Support for JSON and form data
- Custom headers and authentication
- Response parsing (JSON, text, binary)
- Timeout and redirect handling
- URL validation for security

Common uses:
- Trigger external automations (Zapier, Make, n8n)
- Call REST APIs
- Send notifications to external services`,
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["call", "save", "list", "delete"],
          description: "Operation to perform. Default is 'call'.",
        },
        url: {
          type: "string",
          description: "Webhook URL to call or save.",
        },
        method: {
          type: "string",
          enum: ["GET", "POST", "PUT", "PATCH", "DELETE"],
          description: "HTTP method. Default is POST.",
        },
        headers: {
          type: "object",
          description: "Custom HTTP headers.",
        },
        body: {
          type: ["object", "string"],
          description: "Request body (for POST, PUT, PATCH).",
        },
        name: {
          type: "string",
          description: "Name for saved webhook.",
        },
        description: {
          type: "string",
          description: "Description for saved webhook.",
        },
        timeout: {
          type: "number",
          description: "Request timeout in milliseconds. Default is 30000.",
        },
        followRedirects: {
          type: "boolean",
          description: "Follow redirects. Default is true.",
        },
        auth: {
          type: "object",
          properties: {
            type: { type: "string", enum: ["basic", "bearer", "api-key"] },
            username: { type: "string" },
            password: { type: "string" },
            token: { type: "string" },
            key: { type: "string" },
            headerName: { type: "string" },
          },
          description: "Authentication configuration.",
        },
      },
      required: [],
    },
    call: async (input: {
      action?: "call" | "save" | "list" | "delete";
      url?: string;
      method?: HttpMethod;
      headers?: Record<string, string>;
      body?: unknown;
      name?: string;
      description?: string;
      timeout?: number;
      followRedirects?: boolean;
      auth?: {
        type: "basic" | "bearer" | "api-key";
        username?: string;
        password?: string;
        token?: string;
        key?: string;
        headerName?: string;
      };
    }) => {
      const action = input.action ?? "call";

      switch (action) {
        case "call": {
          // Try to use saved webhook
          let url = input.url;
          let method = input.method ?? "POST";
          let headers = { ...input.headers };

          if (input.name && webhookRegistry.has(input.name)) {
            const saved = webhookRegistry.get(input.name)!;
            url = url ?? saved.url;
            method = input.method ?? saved.method;
            headers = { ...saved.headers, ...headers };
          }

          if (!url) {
            return {
              success: false,
              error: "URL required. Provide url or use a saved webhook name.",
            };
          }

          // Apply authentication
          if (input.auth) {
            switch (input.auth.type) {
              case "basic":
                if (input.auth.username && input.auth.password) {
                  const credentials = Buffer.from(
                    `${input.auth.username}:${input.auth.password}`,
                  ).toString("base64");
                  headers["Authorization"] = `Basic ${credentials}`;
                }
                break;
              case "bearer":
                if (input.auth.token) {
                  headers["Authorization"] = `Bearer ${input.auth.token}`;
                }
                break;
              case "api-key":
                if (input.auth.key) {
                  const headerName = input.auth.headerName ?? "X-API-Key";
                  headers[headerName] = input.auth.key;
                }
                break;
            }
          }

          return executeRequest(url, method, {
            headers,
            body: input.body,
            timeout: input.timeout,
            followRedirects: input.followRedirects,
          });
        }

        case "save": {
          if (!input.name || !input.url) {
            return {
              success: false,
              error: "Name and URL required to save webhook.",
            };
          }

          webhookRegistry.set(input.name, {
            url: input.url,
            method: input.method ?? "POST",
            headers: input.headers,
            description: input.description,
          });

          return {
            success: true,
            message: `Webhook '${input.name}' saved.`,
            webhook: webhookRegistry.get(input.name),
          };
        }

        case "list": {
          const webhooks: Array<{
            name: string;
            url: string;
            method: HttpMethod;
            description?: string;
          }> = [];

          webhookRegistry.forEach((value, key) => {
            webhooks.push({
              name: key,
              ...value,
            });
          });

          return {
            success: true,
            count: webhooks.length,
            webhooks,
          };
        }

        case "delete": {
          if (!input.name) {
            return {
              success: false,
              error: "Name required to delete webhook.",
            };
          }

          const deleted = webhookRegistry.delete(input.name);

          return {
            success: deleted,
            message: deleted
              ? `Webhook '${input.name}' deleted.`
              : `Webhook '${input.name}' not found.`,
          };
        }

        default:
          return { success: false, error: `Unknown action: ${String(action)}` };
      }
    },
  };
}
