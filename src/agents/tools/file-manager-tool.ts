/**
 * File Manager Tool
 *
 * File system operations for managing files and directories.
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { createReadStream, createWriteStream } from "node:fs";
import { pipeline } from "node:stream/promises";
import { createGzip, createGunzip } from "node:zlib";
// MCP-style tool - type inferred
import type { AeonSageConfig } from "../../config/config.js";

export interface FileManagerParams {
  config?: AeonSageConfig;
  sandboxDir?: string;
}

export interface FileInfo {
  name: string;
  path: string;
  size: number;
  type: "file" | "directory" | "symlink";
  modified: string;
  created: string;
  permissions: string;
}

export interface FileOperationResult {
  success: boolean;
  operation: string;
  path?: string;
  error?: string;
  data?: unknown;
}

// Allowed base directories for safety
const SAFE_DIRS = [os.homedir(), os.tmpdir()];

/**
 * Check if path is within allowed directories
 */
function isPathAllowed(targetPath: string, sandboxDir?: string): boolean {
  const resolvedPath = path.resolve(targetPath);
  const allowedDirs = sandboxDir ? [...SAFE_DIRS, sandboxDir] : SAFE_DIRS;

  return allowedDirs.some((dir) => resolvedPath.startsWith(path.resolve(dir)));
}

/**
 * Get file/directory info
 */
async function getFileInfo(targetPath: string): Promise<FileInfo> {
  const stats = await fs.stat(targetPath);
  const lstat = await fs.lstat(targetPath);

  let type: "file" | "directory" | "symlink" = "file";
  if (lstat.isSymbolicLink()) type = "symlink";
  else if (stats.isDirectory()) type = "directory";

  return {
    name: path.basename(targetPath),
    path: targetPath,
    size: stats.size,
    type,
    modified: stats.mtime.toISOString(),
    created: stats.birthtime.toISOString(),
    permissions: (stats.mode & 0o777).toString(8),
  };
}

/**
 * Format file size
 */
function formatSize(bytes: number): string {
  const units = ["B", "KB", "MB", "GB", "TB"];
  let unitIndex = 0;
  let value = bytes;
  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex++;
  }
  return `${value.toFixed(1)} ${units[unitIndex]}`;
}

/**
 * Create the file manager tool
 */
export function createFileManagerTool(params: FileManagerParams = {}) {
  return {
    name: "file_manager",
    description: `Manage files and directories with read, write, copy, move, and delete operations.

Operations:
- list: List directory contents
- read: Read file content
- write: Write content to file
- append: Append content to file
- copy: Copy file or directory
- move: Move/rename file or directory
- delete: Delete file or directory
- mkdir: Create directory
- info: Get file/directory information
- search: Search for files by pattern
- compress: Compress file/directory (gzip)
- decompress: Decompress gzip file

Safety: Operations are sandboxed to home and temp directories.`,
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: [
            "list",
            "read",
            "write",
            "append",
            "copy",
            "move",
            "delete",
            "mkdir",
            "info",
            "search",
            "compress",
            "decompress",
          ],
          description: "File operation to perform.",
        },
        path: {
          type: "string",
          description: "Target path for the operation.",
        },
        destination: {
          type: "string",
          description: "Destination path for copy/move operations.",
        },
        content: {
          type: "string",
          description: "Content for write/append operations.",
        },
        pattern: {
          type: "string",
          description: "Search pattern (glob or regex) for search operation.",
        },
        recursive: {
          type: "boolean",
          description: "Recursive operation for list/delete/copy.",
        },
        encoding: {
          type: "string",
          enum: ["utf-8", "base64", "binary"],
          description: "File encoding. Default is utf-8.",
        },
      },
      required: ["action", "path"],
    },
    call: async (input: {
      action:
        | "list"
        | "read"
        | "write"
        | "append"
        | "copy"
        | "move"
        | "delete"
        | "mkdir"
        | "info"
        | "search"
        | "compress"
        | "decompress";
      path: string;
      destination?: string;
      content?: string;
      pattern?: string;
      recursive?: boolean;
      encoding?: "utf-8" | "base64" | "binary";
    }): Promise<FileOperationResult> => {
      const {
        action,
        path: targetPath,
        destination,
        content,
        pattern,
        recursive,
        encoding = "utf-8",
      } = input;

      // Resolve and validate path
      const resolvedPath = path.resolve(targetPath);
      if (!isPathAllowed(resolvedPath, params.sandboxDir)) {
        return {
          success: false,
          operation: action,
          error: `Path not allowed: ${targetPath}. Operations limited to home and temp directories.`,
        };
      }

      try {
        switch (action) {
          case "list": {
            const entries = await fs.readdir(resolvedPath, { withFileTypes: true });
            const files: FileInfo[] = [];

            for (const entry of entries) {
              try {
                const entryPath = path.join(resolvedPath, entry.name);
                const info = await getFileInfo(entryPath);
                files.push(info);
              } catch {
                // Skip inaccessible files
              }
            }

            // If recursive, include subdirectory contents
            if (recursive) {
              for (const file of files) {
                if (file.type === "directory") {
                  try {
                    const subEntries = await fs.readdir(file.path, { withFileTypes: true });
                    for (const subEntry of subEntries) {
                      try {
                        const subPath = path.join(file.path, subEntry.name);
                        const info = await getFileInfo(subPath);
                        files.push(info);
                      } catch {
                        // Skip
                      }
                    }
                  } catch {
                    // Skip inaccessible directories
                  }
                }
              }
            }

            return {
              success: true,
              operation: action,
              path: resolvedPath,
              data: {
                count: files.length,
                files: files.map((f) => ({
                  ...f,
                  sizeFormatted: formatSize(f.size),
                })),
              },
            };
          }

          case "read": {
            const buffer = await fs.readFile(resolvedPath);
            let data: string;

            if (encoding === "base64") {
              data = buffer.toString("base64");
            } else if (encoding === "binary") {
              data = `[Binary data: ${buffer.length} bytes]`;
            } else {
              data = buffer.toString("utf-8");
            }

            const stats = await fs.stat(resolvedPath);

            return {
              success: true,
              operation: action,
              path: resolvedPath,
              data: {
                content: data,
                size: stats.size,
                sizeFormatted: formatSize(stats.size),
                encoding,
              },
            };
          }

          case "write": {
            if (content === undefined) {
              return { success: false, operation: action, error: "Content required for write" };
            }

            // Ensure parent directory exists
            await fs.mkdir(path.dirname(resolvedPath), { recursive: true });

            let writeData: Buffer | string;
            if (encoding === "base64") {
              writeData = Buffer.from(content, "base64");
            } else {
              writeData = content;
            }

            await fs.writeFile(resolvedPath, writeData);

            return {
              success: true,
              operation: action,
              path: resolvedPath,
              data: { bytesWritten: Buffer.byteLength(writeData) },
            };
          }

          case "append": {
            if (content === undefined) {
              return { success: false, operation: action, error: "Content required for append" };
            }

            await fs.appendFile(resolvedPath, content);

            return {
              success: true,
              operation: action,
              path: resolvedPath,
              data: { bytesAppended: Buffer.byteLength(content) },
            };
          }

          case "copy": {
            if (!destination) {
              return { success: false, operation: action, error: "Destination required for copy" };
            }

            const destPath = path.resolve(destination);
            if (!isPathAllowed(destPath, params.sandboxDir)) {
              return {
                success: false,
                operation: action,
                error: `Destination not allowed: ${destination}`,
              };
            }

            await fs.mkdir(path.dirname(destPath), { recursive: true });
            await fs.cp(resolvedPath, destPath, { recursive: true });

            return {
              success: true,
              operation: action,
              path: resolvedPath,
              data: { destination: destPath },
            };
          }

          case "move": {
            if (!destination) {
              return { success: false, operation: action, error: "Destination required for move" };
            }

            const destPath = path.resolve(destination);
            if (!isPathAllowed(destPath, params.sandboxDir)) {
              return {
                success: false,
                operation: action,
                error: `Destination not allowed: ${destination}`,
              };
            }

            await fs.mkdir(path.dirname(destPath), { recursive: true });
            await fs.rename(resolvedPath, destPath);

            return {
              success: true,
              operation: action,
              path: resolvedPath,
              data: { destination: destPath },
            };
          }

          case "delete": {
            const stats = await fs.stat(resolvedPath);

            if (stats.isDirectory() && !recursive) {
              return {
                success: false,
                operation: action,
                error: "Directory not empty. Use recursive: true to delete.",
              };
            }

            await fs.rm(resolvedPath, { recursive: true });

            return {
              success: true,
              operation: action,
              path: resolvedPath,
              data: { deleted: true },
            };
          }

          case "mkdir": {
            await fs.mkdir(resolvedPath, { recursive: true });

            return {
              success: true,
              operation: action,
              path: resolvedPath,
              data: { created: true },
            };
          }

          case "info": {
            const info = await getFileInfo(resolvedPath);

            return {
              success: true,
              operation: action,
              path: resolvedPath,
              data: {
                ...info,
                sizeFormatted: formatSize(info.size),
              },
            };
          }

          case "search": {
            if (!pattern) {
              return { success: false, operation: action, error: "Pattern required for search" };
            }

            const regex = new RegExp(pattern, "i");
            const results: FileInfo[] = [];

            async function searchDir(dir: string, depth = 0): Promise<void> {
              if (depth > 10) return; // Max depth

              try {
                const entries = await fs.readdir(dir, { withFileTypes: true });

                for (const entry of entries) {
                  if (regex.test(entry.name)) {
                    try {
                      const info = await getFileInfo(path.join(dir, entry.name));
                      results.push(info);
                    } catch {
                      // Skip
                    }
                  }

                  if (entry.isDirectory() && recursive) {
                    await searchDir(path.join(dir, entry.name), depth + 1);
                  }
                }
              } catch {
                // Skip inaccessible directories
              }
            }

            await searchDir(resolvedPath);

            return {
              success: true,
              operation: action,
              path: resolvedPath,
              data: {
                pattern,
                count: results.length,
                files: results,
              },
            };
          }

          case "compress": {
            const gzPath = `${resolvedPath}.gz`;

            if (!isPathAllowed(gzPath, params.sandboxDir)) {
              return { success: false, operation: action, error: "Output path not allowed" };
            }

            await pipeline(createReadStream(resolvedPath), createGzip(), createWriteStream(gzPath));

            const originalSize = (await fs.stat(resolvedPath)).size;
            const compressedSize = (await fs.stat(gzPath)).size;

            return {
              success: true,
              operation: action,
              path: resolvedPath,
              data: {
                output: gzPath,
                originalSize,
                compressedSize,
                ratio: ((1 - compressedSize / originalSize) * 100).toFixed(1) + "%",
              },
            };
          }

          case "decompress": {
            if (!resolvedPath.endsWith(".gz")) {
              return { success: false, operation: action, error: "File must be .gz" };
            }

            const outPath = destination ?? resolvedPath.slice(0, -3);

            if (!isPathAllowed(outPath, params.sandboxDir)) {
              return { success: false, operation: action, error: "Output path not allowed" };
            }

            await pipeline(
              createReadStream(resolvedPath),
              createGunzip(),
              createWriteStream(outPath),
            );

            return {
              success: true,
              operation: action,
              path: resolvedPath,
              data: { output: outPath },
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
          path: resolvedPath,
          error: error instanceof Error ? error.message : "Operation failed",
        };
      }
    },
  };
}
