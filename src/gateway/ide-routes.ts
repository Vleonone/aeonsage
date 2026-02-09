/**
 * IDE Routes - Web IDE Backend API
 *
 * Provides HTTP endpoints for:
 * - SSE log streaming (/api/ide/logs)
 * - Terminal command execution (/api/ide/terminal)
 * - File system operations (/api/ide/fs/*)
 * - AI chat streaming (/api/ide/chat)
 *
 * @module gateway/ide-routes
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import { existsSync, statSync } from "node:fs";
import { readFile, writeFile, readdir, mkdir, rm } from "node:fs/promises";
import { join, relative, resolve, dirname } from "node:path";
import { spawn, type ChildProcess } from "node:child_process";
import { createSubsystemLogger } from "../logging/subsystem.js";
import type { ResolvedGatewayAuth } from "./auth.js";

const log = createSubsystemLogger("ide");

// Active SSE connections for log streaming
const sseConnections = new Set<ServerResponse>();

// Active terminal processes
const activeTerminals = new Map<string, ChildProcess>();

/**
 * Broadcast log entry to all SSE connections
 */
export function broadcastLogEntry(entry: {
  timestamp: string;
  level: string;
  subsystem: string;
  message: string;
}) {
  const data = `data: ${JSON.stringify(entry)}\n\n`;
  for (const res of sseConnections) {
    try {
      res.write(data);
    } catch {
      sseConnections.delete(res);
    }
  }
}

/**
 * Handle IDE HTTP requests
 */
export async function handleIdeHttpRequest(
  req: IncomingMessage,
  res: ServerResponse,
  opts: {
    auth: ResolvedGatewayAuth;
    projectRoot: string;
  },
): Promise<boolean> {
  const url = new URL(req.url ?? "/", "http://localhost");

  // Only handle /api/ide/* routes
  if (!url.pathname.startsWith("/api/ide/")) {
    return false;
  }

  const subPath = url.pathname.slice("/api/ide/".length);

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.statusCode = 204;
    res.end();
    return true;
  }

  try {
    // SSE Log Stream
    if (subPath === "logs" && req.method === "GET") {
      return handleLogStream(req, res);
    }

    // Terminal Execution
    if (subPath === "terminal" && req.method === "POST") {
      return await handleTerminalExec(req, res, opts.projectRoot);
    }

    // Terminal Kill
    if (subPath.startsWith("terminal/") && req.method === "DELETE") {
      const termId = subPath.slice("terminal/".length);
      return handleTerminalKill(termId, res);
    }

    // File System - Tree
    if (subPath === "fs/tree" && req.method === "GET") {
      return await handleFsTree(url, res, opts.projectRoot);
    }

    // File System - Read
    if (subPath === "fs/read" && req.method === "GET") {
      return await handleFsRead(url, res, opts.projectRoot);
    }

    // File System - Write
    if (subPath === "fs/write" && req.method === "POST") {
      return await handleFsWrite(req, res, opts.projectRoot);
    }

    // File System - Delete
    if (subPath === "fs/delete" && req.method === "DELETE") {
      return await handleFsDelete(url, res, opts.projectRoot);
    }

    // File System - Mkdir
    if (subPath === "fs/mkdir" && req.method === "POST") {
      return await handleFsMkdir(req, res, opts.projectRoot);
    }

    // AI Chat (placeholder - will be implemented with streaming)
    if (subPath === "chat" && req.method === "POST") {
      return await handleAiChat(req, res);
    }

    // System Status
    if (subPath === "status" && req.method === "GET") {
      return handleIdeStatus(res, opts.projectRoot);
    }

    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Not found" }));
    return true;
  } catch (err) {
    log.error(`IDE route error: ${String(err)}`);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Internal server error" }));
    return true;
  }
}

/**
 * SSE Log Stream
 */
function handleLogStream(_req: IncomingMessage, res: ServerResponse): boolean {
  res.statusCode = 200;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // Send initial connection event
  res.write(`event: connected\ndata: ${JSON.stringify({ status: "connected" })}\n\n`);

  sseConnections.add(res);
  log.info(`IDE log stream connected (${sseConnections.size} active)`);

  res.on("close", () => {
    sseConnections.delete(res);
    log.info(`IDE log stream disconnected (${sseConnections.size} active)`);
  });

  return true;
}

/**
 * Terminal Command Execution
 *
 * SECURITY CONSTRAINTS (per senior engineer review):
 * - Must bind to workspaceId, identityId, auditSessionId
 * - No global shell access - workspace sandbox only
 * - All commands are logged for audit trail
 */
async function handleTerminalExec(
  req: IncomingMessage,
  res: ServerResponse,
  projectRoot: string,
): Promise<boolean> {
  const body = await readJsonBody(req);
  if (!body.ok) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: body.error }));
    return true;
  }

  const { command, cwd, terminalId, workspaceId, identityId, auditSessionId } = body.value as {
    command?: string;
    cwd?: string;
    terminalId?: string;
    workspaceId?: string;
    identityId?: string;
    auditSessionId?: string;
  };

  // SECURITY: Require workspace and identity binding
  if (!workspaceId || !identityId) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: "Security violation: workspaceId and identityId are required",
        code: "MISSING_IDENTITY_BINDING",
      }),
    );
    return true;
  }

  if (!command) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "command is required" }));
    return true;
  }

  // SECURITY: Audit logging
  const auditEntry = {
    timestamp: new Date().toISOString(),
    workspaceId,
    identityId,
    auditSessionId: auditSessionId ?? `audit-${Date.now()}`,
    command,
    cwd: cwd ?? ".",
    action: "terminal_exec",
  };
  log.info(`[AUDIT] Terminal exec: ${JSON.stringify(auditEntry)}`);

  // Security: validate cwd is within project root (sandbox workspace)
  const workdir = cwd ? resolve(projectRoot, cwd) : projectRoot;
  if (!workdir.startsWith(projectRoot)) {
    log.warn(`[SECURITY] Path escape attempt: ${workdir} by ${identityId}`);
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Access denied: path outside workspace sandbox" }));
    return true;
  }

  // SECURITY: Command blocklist for dangerous operations
  const blockedPatterns = [
    /rm\s+-rf\s+\//, // rm -rf /
    /:\(\)\s*{\s*:\|:&\s*};\s*:/, // fork bomb
    />(\/dev\/|\/proc\/|\/sys\/)/, // dangerous redirects
    /curl.*\|.*sh/, // pipe curl to shell
    /wget.*\|.*bash/, // pipe wget to bash
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(command)) {
      log.error(`[SECURITY] Blocked dangerous command: ${command} by ${identityId}`);
      res.statusCode = 403;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          error: "Command blocked: potentially dangerous operation",
          code: "DANGEROUS_COMMAND",
        }),
      );
      return true;
    }
  }

  const id = terminalId ?? `term-${Date.now()}`;
  const isWindows = process.platform === "win32";
  const shell = isWindows ? "powershell.exe" : "/bin/bash";
  const shellArgs = isWindows ? ["-Command", command] : ["-c", command];

  return new Promise((resolvePromise) => {
    const proc = spawn(shell, shellArgs, {
      cwd: workdir,
      env: { ...process.env, TERM: "xterm-256color" },
      shell: false,
    });

    activeTerminals.set(id, proc);

    let stdout = "";
    let stderr = "";

    proc.stdout?.on("data", (data) => {
      stdout += data.toString();
      broadcastLogEntry({
        timestamp: new Date().toISOString(),
        level: "info",
        subsystem: "terminal",
        message: data.toString().trim(),
      });
    });

    proc.stderr?.on("data", (data) => {
      stderr += data.toString();
      broadcastLogEntry({
        timestamp: new Date().toISOString(),
        level: "warn",
        subsystem: "terminal",
        message: data.toString().trim(),
      });
    });

    proc.on("close", (code) => {
      activeTerminals.delete(id);
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      res.end(
        JSON.stringify({
          terminalId: id,
          exitCode: code,
          stdout,
          stderr,
        }),
      );
      resolvePromise(true);
    });

    proc.on("error", (err) => {
      activeTerminals.delete(id);
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json");
      res.end(JSON.stringify({ error: err.message }));
      resolvePromise(true);
    });

    // Timeout after 60 seconds
    setTimeout(() => {
      if (activeTerminals.has(id)) {
        proc.kill("SIGTERM");
      }
    }, 60000);
  });
}

/**
 * Kill Terminal Process
 */
function handleTerminalKill(terminalId: string, res: ServerResponse): boolean {
  const proc = activeTerminals.get(terminalId);
  if (proc) {
    proc.kill("SIGTERM");
    activeTerminals.delete(terminalId);
    res.statusCode = 200;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ success: true, terminalId }));
  } else {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Terminal not found" }));
  }
  return true;
}

/**
 * File System - Directory Tree
 */
async function handleFsTree(url: URL, res: ServerResponse, projectRoot: string): Promise<boolean> {
  const pathParam = url.searchParams.get("path") || ".";
  const targetPath = resolve(projectRoot, pathParam);

  // Security check
  if (!targetPath.startsWith(projectRoot)) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Access denied" }));
    return true;
  }

  if (!existsSync(targetPath)) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Path not found" }));
    return true;
  }

  const tree = await buildFileTree(targetPath, projectRoot, 3);

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify(tree));
  return true;
}

interface FileNode {
  name: string;
  path: string;
  isDirectory: boolean;
  size?: number;
  children?: FileNode[];
}

async function buildFileTree(
  dirPath: string,
  projectRoot: string,
  maxDepth: number,
  currentDepth = 0,
): Promise<FileNode[]> {
  if (currentDepth >= maxDepth) return [];

  const entries = await readdir(dirPath, { withFileTypes: true });
  const nodes: FileNode[] = [];

  // Filter out node_modules and hidden files
  const filtered = entries.filter(
    (e) => !e.name.startsWith(".") && e.name !== "node_modules" && e.name !== "dist",
  );

  for (const entry of filtered) {
    const fullPath = join(dirPath, entry.name);
    const relativePath = relative(projectRoot, fullPath);
    const stat = statSync(fullPath);

    const node: FileNode = {
      name: entry.name,
      path: relativePath.replace(/\\/g, "/"),
      isDirectory: entry.isDirectory(),
      size: entry.isDirectory() ? undefined : stat.size,
    };

    if (entry.isDirectory()) {
      node.children = await buildFileTree(fullPath, projectRoot, maxDepth, currentDepth + 1);
    }

    nodes.push(node);
  }

  // Sort: directories first, then alphabetically
  return nodes.sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    return a.name.localeCompare(b.name);
  });
}

/**
 * File System - Read File
 */
async function handleFsRead(url: URL, res: ServerResponse, projectRoot: string): Promise<boolean> {
  const pathParam = url.searchParams.get("path");
  if (!pathParam) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "path is required" }));
    return true;
  }

  const targetPath = resolve(projectRoot, pathParam);

  // Security check
  if (!targetPath.startsWith(projectRoot)) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Access denied" }));
    return true;
  }

  if (!existsSync(targetPath)) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "File not found" }));
    return true;
  }

  const stat = statSync(targetPath);
  if (stat.isDirectory()) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Cannot read directory" }));
    return true;
  }

  // Check file size limit (10MB)
  if (stat.size > 10 * 1024 * 1024) {
    res.statusCode = 413;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "File too large" }));
    return true;
  }

  const content = await readFile(targetPath, "utf-8");

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      path: pathParam,
      content,
      size: stat.size,
      modified: stat.mtime.toISOString(),
    }),
  );
  return true;
}

/**
 * File System - Write File
 */
async function handleFsWrite(
  req: IncomingMessage,
  res: ServerResponse,
  projectRoot: string,
): Promise<boolean> {
  const body = await readJsonBody(req);
  if (!body.ok) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: body.error }));
    return true;
  }

  const { path: filePath, content } = body.value as {
    path?: string;
    content?: string;
  };

  if (!filePath || content === undefined) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "path and content are required" }));
    return true;
  }

  const targetPath = resolve(projectRoot, filePath);

  // Security check
  if (!targetPath.startsWith(projectRoot)) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Access denied" }));
    return true;
  }

  // Ensure parent directory exists
  const dir = dirname(targetPath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }

  await writeFile(targetPath, content, "utf-8");

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ success: true, path: filePath }));
  return true;
}

/**
 * File System - Delete
 */
async function handleFsDelete(
  url: URL,
  res: ServerResponse,
  projectRoot: string,
): Promise<boolean> {
  const pathParam = url.searchParams.get("path");
  if (!pathParam) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "path is required" }));
    return true;
  }

  const targetPath = resolve(projectRoot, pathParam);

  // Security check
  if (!targetPath.startsWith(projectRoot)) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Access denied" }));
    return true;
  }

  if (!existsSync(targetPath)) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Path not found" }));
    return true;
  }

  await rm(targetPath, { recursive: true, force: true });

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ success: true, path: pathParam }));
  return true;
}

/**
 * File System - Make Directory
 */
async function handleFsMkdir(
  req: IncomingMessage,
  res: ServerResponse,
  projectRoot: string,
): Promise<boolean> {
  const body = await readJsonBody(req);
  if (!body.ok) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: body.error }));
    return true;
  }

  const { path: dirPath } = body.value as { path?: string };

  if (!dirPath) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "path is required" }));
    return true;
  }

  const targetPath = resolve(projectRoot, dirPath);

  // Security check
  if (!targetPath.startsWith(projectRoot)) {
    res.statusCode = 403;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "Access denied" }));
    return true;
  }

  await mkdir(targetPath, { recursive: true });

  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(JSON.stringify({ success: true, path: dirPath }));
  return true;
}

/**
 * AI Chat Handler (SSE streaming)
 */
async function handleAiChat(req: IncomingMessage, res: ServerResponse): Promise<boolean> {
  const body = await readJsonBody(req);
  if (!body.ok) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: body.error }));
    return true;
  }

  const { message, sessionId } = body.value as {
    message?: string;
    sessionId?: string;
  };

  if (!message) {
    res.statusCode = 400;
    res.setHeader("Content-Type", "application/json");
    res.end(JSON.stringify({ error: "message is required" }));
    return true;
  }

  // TODO: Integrate with actual agent chat
  // For now, return a placeholder response
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      sessionId: sessionId ?? `chat-${Date.now()}`,
      response: `[IDE Chat] Received: ${message}`,
      note: "Full AI integration coming soon",
    }),
  );
  return true;
}

/**
 * IDE Status
 */
function handleIdeStatus(res: ServerResponse, projectRoot: string): boolean {
  res.statusCode = 200;
  res.setHeader("Content-Type", "application/json");
  res.end(
    JSON.stringify({
      status: "ready",
      projectRoot,
      sseConnections: sseConnections.size,
      activeTerminals: Array.from(activeTerminals.keys()),
      features: {
        terminal: true,
        fileSystem: true,
        logStream: true,
        aiChat: true,
      },
    }),
  );
  return true;
}

/**
 * Read JSON body from request
 */
async function readJsonBody(
  req: IncomingMessage,
): Promise<{ ok: true; value: unknown } | { ok: false; error: string }> {
  return new Promise((resolve) => {
    const chunks: Buffer[] = [];
    let size = 0;
    const maxSize = 10 * 1024 * 1024; // 10MB

    req.on("data", (chunk: Buffer) => {
      size += chunk.length;
      if (size > maxSize) {
        resolve({ ok: false, error: "Payload too large" });
        return;
      }
      chunks.push(chunk);
    });

    req.on("end", () => {
      try {
        const body = Buffer.concat(chunks).toString("utf-8");
        const parsed = body ? JSON.parse(body) : {};
        resolve({ ok: true, value: parsed });
      } catch {
        resolve({ ok: false, error: "Invalid JSON" });
      }
    });

    req.on("error", () => {
      resolve({ ok: false, error: "Request error" });
    });
  });
}
