/**
 * SSH Tool
 *
 * Execute commands on remote servers via SSH.
 */

import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
// MCP-style tool - type inferred
import type { AeonSageConfig } from "../../config/config.js";

export interface SshToolParams {
  config?: AeonSageConfig;
}

export interface SshResult {
  success: boolean;
  host?: string;
  command?: string;
  output?: string;
  exitCode?: number;
  error?: string;
}

// Host registry for saved connections
const hostRegistry: Map<
  string,
  {
    host: string;
    port: number;
    user: string;
    keyPath?: string;
    description?: string;
  }
> = new Map();

// Command whitelist for safety (can be disabled)
const DEFAULT_COMMAND_WHITELIST = [
  "ls",
  "pwd",
  "cat",
  "head",
  "tail",
  "grep",
  "find",
  "df",
  "du",
  "ps",
  "top",
  "uptime",
  "free",
  "who",
  "hostname",
  "uname",
  "systemctl status",
  "journalctl",
  "docker ps",
  "docker logs",
  "pm2 list",
  "pm2 logs",
  "pm2 status",
];

/**
 * Check if command is allowed
 */
function isCommandAllowed(command: string, whitelist: string[], strictMode: boolean): boolean {
  if (!strictMode) return true;

  const cmdLower = command.toLowerCase().trim();
  return whitelist.some((allowed) => cmdLower.startsWith(allowed.toLowerCase()));
}

/**
 * Execute SSH command
 */
async function execSsh(
  host: string,
  user: string,
  command: string,
  options: {
    port?: number;
    keyPath?: string;
    timeout?: number;
    password?: string;
  },
): Promise<SshResult> {
  return new Promise((resolve) => {
    const args: string[] = [];

    // Add port
    if (options.port && options.port !== 22) {
      args.push("-p", String(options.port));
    }

    // Add identity file
    if (options.keyPath) {
      args.push("-i", options.keyPath);
    }

    // Disable host key checking for automation (use with caution)
    args.push("-o", "StrictHostKeyChecking=no");
    args.push("-o", "UserKnownHostsFile=/dev/null");
    args.push("-o", "BatchMode=yes");
    args.push("-o", `ConnectTimeout=${Math.floor((options.timeout ?? 30000) / 1000)}`);

    // Add user@host
    args.push(`${user}@${host}`);

    // Add command
    args.push(command);

    const child = spawn("ssh", args, {
      timeout: options.timeout ?? 30000,
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    child.stdout?.on("data", (data) => {
      stdout += data.toString();
    });

    child.stderr?.on("data", (data) => {
      stderr += data.toString();
    });

    child.on("close", (code) => {
      resolve({
        success: code === 0,
        host,
        command,
        output: stdout.trim() || stderr.trim(),
        exitCode: code ?? undefined,
        error: code !== 0 ? stderr.trim() || `Exit code: ${code}` : undefined,
      });
    });

    child.on("error", (err) => {
      resolve({
        success: false,
        host,
        command,
        error: err.message,
      });
    });
  });
}

/**
 * Create the SSH tool
 */
export function createSshTool() {
  return {
    name: "ssh",
    description: `Execute commands on remote servers via SSH.

Operations:
- exec: Execute a command on remote server
- save: Save a host configuration
- list: List saved hosts
- delete: Remove a saved host
- test: Test connection to a host

Security:
- Commands are validated against whitelist in strict mode
- SSH keys are recommended over passwords
- Host key verification is disabled for automation

Requires SSH client to be installed.`,
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["exec", "save", "list", "delete", "test"],
          description: "SSH operation to perform. Default is 'exec'.",
        },
        host: {
          type: "string",
          description: "SSH host (hostname or IP).",
        },
        user: {
          type: "string",
          description: "SSH username.",
        },
        port: {
          type: "number",
          description: "SSH port. Default is 22.",
        },
        command: {
          type: "string",
          description: "Command to execute on remote server.",
        },
        keyPath: {
          type: "string",
          description: "Path to SSH private key file.",
        },
        name: {
          type: "string",
          description: "Name for saved host configuration.",
        },
        description: {
          type: "string",
          description: "Description for saved host.",
        },
        timeout: {
          type: "number",
          description: "Command timeout in milliseconds. Default is 30000.",
        },
        strictMode: {
          type: "boolean",
          description: "If true, only whitelisted commands are allowed. Default is true.",
        },
      },
      required: ["action"],
    },
    call: async (input: {
      action?: "exec" | "save" | "list" | "delete" | "test";
      host?: string;
      user?: string;
      port?: number;
      command?: string;
      keyPath?: string;
      name?: string;
      description?: string;
      timeout?: number;
      strictMode?: boolean;
    }): Promise<SshResult & { hosts?: unknown[] }> => {
      const action = input.action ?? "exec";
      const strictMode = input.strictMode ?? true;

      switch (action) {
        case "exec": {
          // Resolve host from saved or input
          let host = input.host;
          let user = input.user;
          let port = input.port ?? 22;
          let keyPath = input.keyPath;

          if (input.name && hostRegistry.has(input.name)) {
            const saved = hostRegistry.get(input.name)!;
            host = host ?? saved.host;
            user = user ?? saved.user;
            port = input.port ?? saved.port;
            keyPath = keyPath ?? saved.keyPath;
          }

          if (!host || !user) {
            return {
              success: false,
              error: "Host and user required. Provide directly or use a saved host name.",
            };
          }

          if (!input.command) {
            return { success: false, error: "Command required for exec" };
          }

          // Check command whitelist
          if (!isCommandAllowed(input.command, DEFAULT_COMMAND_WHITELIST, strictMode)) {
            return {
              success: false,
              host,
              command: input.command,
              error: `Command not allowed in strict mode. Allowed commands: ${DEFAULT_COMMAND_WHITELIST.slice(0, 5).join(", ")}...`,
            };
          }

          // Resolve key path
          if (keyPath && !path.isAbsolute(keyPath)) {
            keyPath = path.join(os.homedir(), ".ssh", keyPath);
          }

          // Default key if not specified
          if (!keyPath) {
            const defaultKey = path.join(os.homedir(), ".ssh", "id_rsa");
            try {
              await fs.access(defaultKey);
              keyPath = defaultKey;
            } catch {
              // No default key
            }
          }

          return execSsh(host, user, input.command, {
            port,
            keyPath,
            timeout: input.timeout,
          });
        }

        case "save": {
          if (!input.name || !input.host || !input.user) {
            return {
              success: false,
              error: "Name, host, and user required to save host.",
            };
          }

          hostRegistry.set(input.name, {
            host: input.host,
            port: input.port ?? 22,
            user: input.user,
            keyPath: input.keyPath,
            description: input.description,
          });

          return {
            success: true,
            host: input.host,
            output: `Host '${input.name}' saved.`,
          };
        }

        case "list": {
          const hosts: Array<{
            name: string;
            host: string;
            user: string;
            port: number;
            description?: string;
          }> = [];

          hostRegistry.forEach((value, key) => {
            hosts.push({ name: key, ...value });
          });

          return {
            success: true,
            output: `${hosts.length} host(s) saved`,
            hosts,
          };
        }

        case "delete": {
          if (!input.name) {
            return { success: false, error: "Name required to delete host." };
          }

          const deleted = hostRegistry.delete(input.name);

          return {
            success: deleted,
            output: deleted ? `Host '${input.name}' deleted.` : `Host '${input.name}' not found.`,
          };
        }

        case "test": {
          let host = input.host;
          let user = input.user;
          let port = input.port ?? 22;
          let keyPath = input.keyPath;

          if (input.name && hostRegistry.has(input.name)) {
            const saved = hostRegistry.get(input.name)!;
            host = host ?? saved.host;
            user = user ?? saved.user;
            port = input.port ?? saved.port;
            keyPath = keyPath ?? saved.keyPath;
          }

          if (!host || !user) {
            return {
              success: false,
              error: "Host and user required for test.",
            };
          }

          const result = await execSsh(host, user, "echo 'Connection successful'", {
            port,
            keyPath,
            timeout: 10000,
          });

          return {
            ...result,
            output: result.success
              ? `✅ Connection to ${user}@${host}:${port} successful`
              : `❌ Connection to ${user}@${host}:${port} failed`,
          };
        }

        default:
          return { success: false, error: `Unknown action: ${String(action)}` };
      }
    },
  };
}
