/**
 * AeonSage Unified Error Handling Module
 *
 * Provides standardized error types, formatting, logging, and recovery utilities.
 * @module infra/errors
 */

// ═══════════════════════════════════════════════════════════════
// Error Categories
// ═══════════════════════════════════════════════════════════════

export type ErrorCategory =
  | "config" // Configuration errors
  | "auth" // Authentication/authorization errors
  | "network" // Network connectivity errors
  | "validation" // Input validation errors
  | "runtime" // Runtime/execution errors
  | "resource" // Resource not found/exhausted
  | "external" // External service errors
  | "internal"; // Internal/unexpected errors

export interface StructuredError {
  category: ErrorCategory;
  code: string;
  message: string;
  details?: Record<string, unknown>;
  cause?: Error;
  recoverable: boolean;
}

// ═══════════════════════════════════════════════════════════════
// Error Extraction Utilities
// ═══════════════════════════════════════════════════════════════

export function extractErrorCode(err: unknown): string | undefined {
  if (!err || typeof err !== "object") return undefined;
  const code = (err as { code?: unknown }).code;
  if (typeof code === "string") return code;
  if (typeof code === "number") return String(code);
  return undefined;
}

export function extractErrorStatus(err: unknown): number | undefined {
  if (!err || typeof err !== "object") return undefined;
  const status = (err as { status?: unknown }).status;
  if (typeof status === "number") return status;
  return undefined;
}

export function formatErrorMessage(err: unknown): string {
  if (err instanceof Error) {
    return err.message || err.name || "Error";
  }
  if (typeof err === "string") return err;
  if (typeof err === "number" || typeof err === "boolean" || typeof err === "bigint") {
    return String(err);
  }
  try {
    return JSON.stringify(err);
  } catch {
    return Object.prototype.toString.call(err);
  }
}

export function formatUncaughtError(err: unknown): string {
  if (extractErrorCode(err) === "INVALID_CONFIG") {
    return formatErrorMessage(err);
  }
  if (err instanceof Error) {
    return err.stack ?? err.message ?? err.name;
  }
  return formatErrorMessage(err);
}

// ═══════════════════════════════════════════════════════════════
// Error Classification
// ═══════════════════════════════════════════════════════════════

export function classifyError(err: unknown): ErrorCategory {
  const code = extractErrorCode(err);
  const status = extractErrorStatus(err);
  const message = formatErrorMessage(err).toLowerCase();

  // Check by error code
  if (code === "INVALID_CONFIG" || code === "ENOENT") return "config";
  if (code === "ECONNREFUSED" || code === "ETIMEDOUT" || code === "ENOTFOUND") return "network";
  if (code === "EACCES" || code === "EPERM") return "auth";

  // Check by HTTP status
  if (status) {
    if (status === 401 || status === 403) return "auth";
    if (status === 404) return "resource";
    if (status === 400 || status === 422) return "validation";
    if (status >= 500) return "external";
  }

  // Check by message content
  if (message.includes("auth") || message.includes("token") || message.includes("credential")) {
    return "auth";
  }
  if (
    message.includes("network") ||
    message.includes("connection") ||
    message.includes("timeout")
  ) {
    return "network";
  }
  if (message.includes("invalid") || message.includes("required") || message.includes("missing")) {
    return "validation";
  }

  return "internal";
}

export function isRecoverableError(err: unknown): boolean {
  const category = classifyError(err);
  // Network and external errors are typically recoverable with retry
  return category === "network" || category === "external";
}

// ═══════════════════════════════════════════════════════════════
// Error Creation Helpers
// ═══════════════════════════════════════════════════════════════

export class AeonSageError extends Error {
  readonly category: ErrorCategory;
  readonly code: string;
  readonly recoverable: boolean;
  readonly details?: Record<string, unknown>;

  constructor(
    category: ErrorCategory,
    code: string,
    message: string,
    options?: { cause?: Error; recoverable?: boolean; details?: Record<string, unknown> },
  ) {
    super(message);
    this.name = "AeonSageError";
    this.category = category;
    this.code = code;
    this.recoverable = options?.recoverable ?? isRecoverableError({ code });
    this.details = options?.details;
  }

  toStructured(): StructuredError {
    return {
      category: this.category,
      code: this.code,
      message: this.message,
      details: this.details,
      cause: undefined,
      recoverable: this.recoverable,
    };
  }
}

// ═══════════════════════════════════════════════════════════════
// Safe Execution Wrappers
// ═══════════════════════════════════════════════════════════════

/**
 * Execute a function and return a result tuple [error, result]
 * Useful for avoiding try-catch boilerplate
 */
export async function safeAsync<T>(fn: () => Promise<T>): Promise<[Error, null] | [null, T]> {
  try {
    const result = await fn();
    return [null, result];
  } catch (err) {
    return [err instanceof Error ? err : new Error(formatErrorMessage(err)), null];
  }
}

export function safeSync<T>(fn: () => T): [Error, null] | [null, T] {
  try {
    const result = fn();
    return [null, result];
  } catch (err) {
    return [err instanceof Error ? err : new Error(formatErrorMessage(err)), null];
  }
}

/**
 * Execute with automatic retry for recoverable errors
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; delayMs?: number; shouldRetry?: (err: unknown) => boolean } = {},
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const delayMs = options.delayMs ?? 1000;
  const shouldRetry = options.shouldRetry ?? isRecoverableError;

  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries && shouldRetry(err)) {
        await new Promise((r) => setTimeout(r, delayMs * (attempt + 1)));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}
