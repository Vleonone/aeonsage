/**
 * Security Utilities - Path Sanitization
 *
 * Provides defensive utilities to prevent:
 * - Path traversal attacks (CWE-22)
 * - Local File Inclusion (CWE-98)
 * - Sandbox escape
 *
 * @module security/path-sanitizer
 */

import path from "node:path";

/**
 * Characters allowed in sanitized identifiers (account IDs, user IDs, etc.)
 * Only alphanumeric, dash, underscore, and period are allowed
 */
const SAFE_ID_PATTERN = /^[a-zA-Z0-9_.-]+$/;

/**
 * Dangerous path traversal patterns
 */
const DANGEROUS_PATTERNS = [
  /\.\./, // Parent directory traversal
  /^\/etc\//i, // Unix system directories
  /^\/proc\//i, // Linux proc filesystem
  /^\/dev\//i, // Device files
  /^\/root\//i, // Root home
  /^\/home\//i, // Other users
  /^C:\\Windows/i, // Windows system
  /^C:\\Users/i, // Windows users (unless allowed)
];

/**
 * Sanitize an account ID or user identifier
 * Prevents path traversal via malicious IDs
 *
 * @param id - The identifier to sanitize
 * @param fieldName - Name of the field for error messages
 * @returns Sanitized identifier
 * @throws Error if identifier contains dangerous characters
 */
export function sanitizeId(id: string, fieldName = "id"): string {
  if (!id || typeof id !== "string") {
    throw new Error(`${fieldName} is required and must be a string`);
  }

  const trimmed = id.trim();

  if (!SAFE_ID_PATTERN.test(trimmed)) {
    throw new Error(
      `Invalid ${fieldName}: contains disallowed characters. ` +
        `Only alphanumeric, dash, underscore, and period are allowed.`,
    );
  }

  // Additional check for hidden patterns
  if (trimmed.includes("..") || trimmed.startsWith(".") || trimmed.endsWith(".")) {
    throw new Error(`Invalid ${fieldName}: suspicious pattern detected`);
  }

  return trimmed;
}

/**
 * Validate and restrict a file path to a sandbox directory
 *
 * @param filePath - The path to validate
 * @param sandboxRoot - The root directory that paths must be within
 * @returns Normalized absolute path within sandbox
 * @throws Error if path escapes sandbox or contains dangerous patterns
 */
export function validatePathInSandbox(filePath: string, sandboxRoot: string): string {
  if (!filePath || typeof filePath !== "string") {
    throw new Error("filePath is required and must be a string");
  }

  if (!sandboxRoot || typeof sandboxRoot !== "string") {
    throw new Error("sandboxRoot is required and must be a string");
  }

  // Normalize both paths
  const normalizedRoot = path.resolve(sandboxRoot);
  const normalizedPath = path.resolve(normalizedRoot, filePath);

  // Check if resolved path is within sandbox
  if (!normalizedPath.startsWith(normalizedRoot + path.sep) && normalizedPath !== normalizedRoot) {
    throw new Error(`Path traversal detected: '${filePath}' escapes sandbox root '${sandboxRoot}'`);
  }

  // Check for dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    if (pattern.test(normalizedPath)) {
      throw new Error(`Dangerous path pattern detected: ${filePath}`);
    }
  }

  return normalizedPath;
}

/**
 * Sanitize environment variables to prevent injection attacks
 * Removes LD_*, DYLD_*, and other dangerous environment variables
 *
 * @param env - Environment variable object
 * @returns Sanitized environment object
 */
export function sanitizeEnvironment(
  env: Record<string, string | undefined>,
): Record<string, string | undefined> {
  const dangerous = [
    /^LD_/i,
    /^DYLD_/i,
    /^_=/,
    /^PATH$/i, // Consider if PATH should be filtered
  ];

  const sanitized: Record<string, string | undefined> = {};

  for (const [key, value] of Object.entries(env)) {
    let isDangerous = false;
    for (const pattern of dangerous) {
      if (pattern.test(key)) {
        isDangerous = true;
        console.warn(`[security] Blocked dangerous env var: ${key}`);
        break;
      }
    }
    if (!isDangerous) {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

/**
 * Validate that a URL is safe for fetching
 * Blocks file://, localhost abuse, and internal IPs
 *
 * @param url - URL to validate
 * @returns true if URL is safe
 * @throws Error if URL is dangerous
 */
export function validateExternalUrl(url: string): boolean {
  if (!url || typeof url !== "string") {
    throw new Error("URL is required");
  }

  // Block file:// protocol
  if (url.startsWith("file://")) {
    throw new Error("file:// URLs are not allowed");
  }

  // Block localhost and internal IPs (unless explicitly allowed)
  const parsed = new URL(url);
  const hostname = parsed.hostname.toLowerCase();

  const blockedPatterns = [
    /^localhost$/,
    /^127\./,
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^0\./,
    /^169\.254\./, // Link-local
    /^::1$/, // IPv6 localhost
  ];

  for (const pattern of blockedPatterns) {
    if (pattern.test(hostname)) {
      throw new Error(`Blocked internal/localhost URL: ${hostname}`);
    }
  }

  return true;
}

/**
 * Sanitize HTML content to prevent XSS
 * Simple escape of dangerous characters
 *
 * @param html - Raw HTML content
 * @returns Escaped HTML
 */
export function escapeHtml(html: string): string {
  return html
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
