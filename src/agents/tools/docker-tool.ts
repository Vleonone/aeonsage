/**
 * Docker Tool
 *
 * Manage Docker containers and images.
 */

import { spawn } from "node:child_process";
// MCP-style tool - type inferred
import type { AeonSageConfig } from "../../config/config.js";

export interface DockerToolParams {
  config?: AeonSageConfig;
}

export interface DockerResult {
  success: boolean;
  operation: string;
  data?: unknown;
  error?: string;
}

/**
 * Execute docker command
 */
async function execDocker(
  args: string[],
  timeout = 30000,
): Promise<{ success: boolean; stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve) => {
    const child = spawn("docker", args, {
      timeout,
      shell: process.platform === "win32",
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
        stdout: stdout.trim(),
        stderr: stderr.trim(),
        code,
      });
    });

    child.on("error", (err) => {
      resolve({
        success: false,
        stdout: "",
        stderr: err.message,
        code: null,
      });
    });
  });
}

/**
 * Parse docker ps output
 */
function parseContainers(output: string): Array<{
  id: string;
  image: string;
  command: string;
  created: string;
  status: string;
  ports: string;
  names: string;
}> {
  const lines = output.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return [];

  // Skip header and parse
  return lines.slice(1).map((line) => {
    const parts = line.split(/\s{2,}/);
    return {
      id: parts[0] ?? "",
      image: parts[1] ?? "",
      command: parts[2] ?? "",
      created: parts[3] ?? "",
      status: parts[4] ?? "",
      ports: parts[5] ?? "",
      names: parts[6] ?? parts[5] ?? "",
    };
  });
}

/**
 * Parse docker images output
 */
function parseImages(output: string): Array<{
  repository: string;
  tag: string;
  imageId: string;
  created: string;
  size: string;
}> {
  const lines = output.split("\n").filter((l) => l.trim());
  if (lines.length === 0) return [];

  return lines.slice(1).map((line) => {
    const parts = line.split(/\s{2,}/);
    return {
      repository: parts[0] ?? "",
      tag: parts[1] ?? "",
      imageId: parts[2] ?? "",
      created: parts[3] ?? "",
      size: parts[4] ?? "",
    };
  });
}

/**
 * Create the docker tool
 */
export function createDockerTool(_params: DockerToolParams = {}) {
  return {
    name: "docker",
    description: `Manage Docker containers and images.

Operations:
- ps: List running containers
- ps-all: List all containers
- images: List images
- start: Start a container
- stop: Stop a container
- restart: Restart a container
- logs: Get container logs
- inspect: Inspect container/image
- run: Run a new container
- rm: Remove a container
- rmi: Remove an image
- pull: Pull an image
- stats: Get container stats
- exec: Execute command in container

Requires Docker to be installed and running.`,
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: [
            "ps",
            "ps-all",
            "images",
            "start",
            "stop",
            "restart",
            "logs",
            "inspect",
            "run",
            "rm",
            "rmi",
            "pull",
            "stats",
            "exec",
          ],
          description: "Docker operation to perform.",
        },
        container: {
          type: "string",
          description: "Container ID or name.",
        },
        image: {
          type: "string",
          description: "Image name (for pull/run/rmi).",
        },
        command: {
          type: "string",
          description: "Command for run/exec.",
        },
        options: {
          type: "object",
          properties: {
            name: { type: "string" },
            detach: { type: "boolean" },
            ports: { type: "array", items: { type: "string" } },
            env: { type: "object" },
            volumes: { type: "array", items: { type: "string" } },
            tail: { type: "number" },
            follow: { type: "boolean" },
          },
          description: "Additional options for run/logs.",
        },
      },
      required: ["action"],
    },
    call: async (input: {
      action:
        | "ps"
        | "ps-all"
        | "images"
        | "start"
        | "stop"
        | "restart"
        | "logs"
        | "inspect"
        | "run"
        | "rm"
        | "rmi"
        | "pull"
        | "stats"
        | "exec";
      container?: string;
      image?: string;
      command?: string;
      options?: {
        name?: string;
        detach?: boolean;
        ports?: string[];
        env?: Record<string, string>;
        volumes?: string[];
        tail?: number;
        follow?: boolean;
      };
    }): Promise<DockerResult> => {
      const { action, container, image, command, options } = input;

      // Check if docker is available
      const versionCheck = await execDocker(["--version"]);
      if (!versionCheck.success) {
        return {
          success: false,
          operation: action,
          error: "Docker is not available. Make sure Docker is installed and running.",
        };
      }

      try {
        switch (action) {
          case "ps": {
            const result = await execDocker(["ps"]);
            if (!result.success) {
              return { success: false, operation: action, error: result.stderr };
            }
            return {
              success: true,
              operation: action,
              data: {
                containers: parseContainers(result.stdout),
                raw: result.stdout,
              },
            };
          }

          case "ps-all": {
            const result = await execDocker(["ps", "-a"]);
            if (!result.success) {
              return { success: false, operation: action, error: result.stderr };
            }
            return {
              success: true,
              operation: action,
              data: {
                containers: parseContainers(result.stdout),
                raw: result.stdout,
              },
            };
          }

          case "images": {
            const result = await execDocker(["images"]);
            if (!result.success) {
              return { success: false, operation: action, error: result.stderr };
            }
            return {
              success: true,
              operation: action,
              data: {
                images: parseImages(result.stdout),
                raw: result.stdout,
              },
            };
          }

          case "start":
          case "stop":
          case "restart": {
            if (!container) {
              return { success: false, operation: action, error: "Container ID or name required" };
            }
            const result = await execDocker([action, container]);
            return {
              success: result.success,
              operation: action,
              data: { container, message: result.stdout },
              error: result.success ? undefined : result.stderr,
            };
          }

          case "logs": {
            if (!container) {
              return { success: false, operation: action, error: "Container ID or name required" };
            }
            const args = ["logs"];
            if (options?.tail) args.push("--tail", String(options.tail));
            args.push(container);

            const result = await execDocker(args);
            return {
              success: true,
              operation: action,
              data: { container, logs: result.stdout || result.stderr },
            };
          }

          case "inspect": {
            const target = container || image;
            if (!target) {
              return { success: false, operation: action, error: "Container or image required" };
            }
            const result = await execDocker(["inspect", target]);
            if (!result.success) {
              return { success: false, operation: action, error: result.stderr };
            }
            try {
              return {
                success: true,
                operation: action,
                data: JSON.parse(result.stdout),
              };
            } catch {
              return { success: true, operation: action, data: result.stdout };
            }
          }

          case "run": {
            if (!image) {
              return { success: false, operation: action, error: "Image required for run" };
            }
            const args = ["run"];
            if (options?.detach) args.push("-d");
            if (options?.name) args.push("--name", options.name);
            if (options?.ports) {
              for (const port of options.ports) {
                args.push("-p", port);
              }
            }
            if (options?.env) {
              for (const [key, value] of Object.entries(options.env)) {
                args.push("-e", `${key}=${value}`);
              }
            }
            if (options?.volumes) {
              for (const vol of options.volumes) {
                args.push("-v", vol);
              }
            }
            args.push(image);
            if (command) args.push(...command.split(" "));

            const result = await execDocker(args, 60000);
            return {
              success: result.success,
              operation: action,
              data: { containerId: result.stdout.trim() },
              error: result.success ? undefined : result.stderr,
            };
          }

          case "rm": {
            if (!container) {
              return { success: false, operation: action, error: "Container required" };
            }
            const result = await execDocker(["rm", "-f", container]);
            return {
              success: result.success,
              operation: action,
              data: { removed: container },
              error: result.success ? undefined : result.stderr,
            };
          }

          case "rmi": {
            if (!image) {
              return { success: false, operation: action, error: "Image required" };
            }
            const result = await execDocker(["rmi", image]);
            return {
              success: result.success,
              operation: action,
              data: { removed: image },
              error: result.success ? undefined : result.stderr,
            };
          }

          case "pull": {
            if (!image) {
              return { success: false, operation: action, error: "Image required" };
            }
            const result = await execDocker(["pull", image], 120000);
            return {
              success: result.success,
              operation: action,
              data: { image, output: result.stdout },
              error: result.success ? undefined : result.stderr,
            };
          }

          case "stats": {
            const args = [
              "stats",
              "--no-stream",
              "--format",
              "{{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}",
            ];
            if (container) args.push(container);

            const result = await execDocker(args);
            if (!result.success) {
              return { success: false, operation: action, error: result.stderr };
            }

            const stats = result.stdout
              .split("\n")
              .filter((l) => l.trim())
              .map((line) => {
                const [name, cpu, memory, netIO, blockIO] = line.split("\t");
                return { name, cpu, memory, netIO, blockIO };
              });

            return { success: true, operation: action, data: { stats } };
          }

          case "exec": {
            if (!container || !command) {
              return { success: false, operation: action, error: "Container and command required" };
            }
            const args = ["exec", container, ...command.split(" ")];
            const result = await execDocker(args);
            return {
              success: result.success,
              operation: action,
              data: { output: result.stdout },
              error: result.success ? undefined : result.stderr,
            };
          }

          default:
            return {
              success: false,
              operation: action,
              error: `Unknown action: ${String(action)}`,
            };
        }
      } catch (error) {
        return {
          success: false,
          operation: action,
          error: error instanceof Error ? error.message : "Docker operation failed",
        };
      }
    },
  };
}
