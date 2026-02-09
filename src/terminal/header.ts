import { theme } from "./theme.js";

/**
 * Unified institutional header for AeonSage TUI.
 * Aligning with Claude-style minimalist professional aesthetic.
 */
export function printInstitutionalHeader(log: (msg: string) => void) {
  const header = [
    "",
    theme.accent("   AEONSAGE "),
    theme.label("   Sovereign Cognitive Operating System (AS2)"),
    theme.subtle("   " + "―".repeat(48)),
    "",
  ].join("\n");
  log(header);
}

/**
 * Compact header for status and other daily commands.
 */
export function printCompactHeader(log: (msg: string) => void) {
  log("");
  log(
    `   ${theme.accent("AEONSAGE")} ${theme.label("｜ Sovereign Cognitive Operating System (AS2)")}`,
  );
  log(`   ${theme.subtle("―".repeat(48))}`);
  log("");
}
