import { theme } from "./theme.js";

/**
 * AeonSage Terminal Expression System
 * Provides dynamic expression states for terminal output
 */

export type AeonMood =
  | "idle" // Standby
  | "thinking" // Processing
  | "happy" // Success/Joy
  | "working" // Active Task
  | "error" // Failure/Fault
  | "sleeping" // Dormant
  | "scanning" // Surveillance/Discovery
  | "crazy"; // High-Integrity Burst

/**
 * ASCII Emoticon Map
 */
export const AEON_FACES: Record<AeonMood, string> = {
  idle: "◇ω◇", // Square Calm
  thinking: "◆ω◆", // Solid Thinking
  happy: "♡ω♡", // Heart Success
  working: "◈ω◈", // Rotating Block
  error: "✖ω✖", // X-type Fault
  sleeping: "—ω—", // Closed Eyes
  scanning: "@ω@", // Ring Scan
  crazy: "@_@", // Spiral Frenzy
};

/**
 * Colored Expressions (Terminal ANSI Support)
 */
export const AEON_COLORED_FACES: Record<AeonMood, (text: string) => string> = {
  idle: (t) => theme.accent(t),
  thinking: (t) => theme.info(t),
  happy: (t) => theme.success(t),
  working: (t) => theme.accentBright(t),
  error: (t) => theme.error(t),
  sleeping: (t) => theme.muted(t),
  scanning: (t) => theme.accentDim(t),
  crazy: (t) => theme.accent(t),
};

/**
 * Get prefix with mood
 */
export function getAeonPrefix(mood: AeonMood = "idle", colored = true): string {
  const face = AEON_FACES[mood];
  return colored ? AEON_COLORED_FACES[mood](face) : face;
}

/**
 * Format message with emotion
 */
export function aeonLog(mood: AeonMood, message: string, colored = true): string {
  return `[${getAeonPrefix(mood, colored)}] ${message}`;
}

/**
 * Progress bar with emotion
 */
export function aeonProgress(mood: AeonMood, percent: number, message: string, width = 20): string {
  const filled = Math.floor((percent / 100) * width);
  const empty = width - filled;
  const bar = "█".repeat(filled) + "░".repeat(empty);
  return `[${getAeonPrefix(mood)}] ${bar} ${percent}% ${message}`;
}
