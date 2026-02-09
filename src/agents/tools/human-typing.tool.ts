import { Type } from "@sinclair/typebox";
import { type AnyAgentTool, jsonResult, readStringParam } from "./common.js";

// Common typo mappings
const TYPO_MAP: Record<string, string[]> = {
  a: ["s", "q", "z"],
  b: ["v", "n", "g"],
  c: ["x", "v", "d"],
  d: ["s", "f", "e"],
  e: ["w", "r", "d"],
  f: ["d", "g", "r"],
  g: ["f", "h", "t"],
  h: ["g", "j", "y"],
  i: ["u", "o", "k"],
  j: ["h", "k", "u"],
  k: ["j", "l", "i"],
  l: ["k", "o", "p"],
  m: ["n", "k"],
  n: ["b", "m", "h"],
  o: ["i", "p", "l"],
  p: ["o", "l"],
  q: ["w", "a"],
  r: ["e", "t", "f"],
  s: ["a", "d", "w"],
  t: ["r", "y", "g"],
  u: ["y", "i", "j"],
  v: ["c", "b", "f"],
  w: ["q", "e", "s"],
  x: ["z", "c", "s"],
  y: ["t", "u", "h"],
  z: ["x", "a"],
};

/**
 * Calculate typing delay based on character and context
 * 根据字符和上下文计算打字延迟
 */
function calculateKeyDelay(char: string, prevChar: string, fatigueLevel: number): number {
  let baseDelay = 80; // Base delay in ms

  // Space after punctuation is slower
  if (char === " " && /[.!?]/.test(prevChar)) {
    baseDelay += 200 + Math.random() * 300; // Thinking pause
  }

  // Capital letters are slower (Shift key)
  if (char !== char.toLowerCase() && char === char.toUpperCase()) {
    baseDelay += 50;
  }

  // Numbers and special chars are slower
  if (/[0-9]/.test(char)) {
    baseDelay += 30;
  }
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(char)) {
    baseDelay += 50;
  }

  // Same finger keys are slower
  const sameFingerPairs = [
    "ed",
    "de",
    "ws",
    "sw",
    "rf",
    "fr",
    "tg",
    "gt",
    "yh",
    "hy",
    "uj",
    "ju",
    "ik",
    "ki",
    "ol",
    "lo",
  ];
  if (sameFingerPairs.includes((prevChar + char).toLowerCase())) {
    baseDelay += 40;
  }

  // Apply fatigue (increases delay over time)
  baseDelay *= 1 + fatigueLevel * 0.3;

  // Add random human variation (+/- 50%)
  return baseDelay * (0.5 + Math.random());
}

/**
 * Decide if a typo should occur
 */
function shouldMakeTypo(fatigueLevel: number): boolean {
  // Base 2% chance, increases with fatigue
  return Math.random() < 0.02 + fatigueLevel * 0.03;
}

/**
 * Get a typo character for the intended character
 */
function getTypoChar(char: string): string {
  const lower = char.toLowerCase();
  const typos = TYPO_MAP[lower];
  if (!typos || typos.length === 0) return char;

  const typo = typos[Math.floor(Math.random() * typos.length)];

  // Preserve case
  return char === char.toUpperCase() ? typo.toUpperCase() : typo;
}

/**
 * Simulate thinking pause
 */
function shouldThinkingPause(): boolean {
  return Math.random() < 0.05; // 5% chance
}

function getThinkingPauseDuration(): number {
  return 500 + Math.random() * 1500; // 500-2000ms
}

const HumanTypingToolSchema = Type.Object({
  action: Type.String(),
  text: Type.Optional(Type.String()),
  wpm: Type.Optional(Type.Number()),
  enableTypos: Type.Optional(Type.Boolean()),
  fatigueEnabled: Type.Optional(Type.Boolean()),
});

export function createHumanTypingTool(): AnyAgentTool {
  return {
    label: "Human Typing",
    name: "human_typing",
    description: `Simulate human-like typing with realistic timing and occasional typos.
Features:
- Variable inter-key delays based on key positions
- Occasional typos with corrections
- Thinking pauses
- Fatigue simulation (slower over time)
- Natural rhythm patterns

ACTIONS:
- type: Generate typing sequence
- analyze: Get typing plan without executing`,
    parameters: HumanTypingToolSchema,
    execute: async (_toolCallId, rawArgs) => {
      const args = rawArgs as Record<string, unknown>;
      const action = readStringParam(args, "action");
      const text = readStringParam(args, "text");

      if (!text) {
        return jsonResult({ success: false, error: "text parameter is required" });
      }

      const wpm = Math.min(120, Math.max(20, Number(args.wpm) || 60));
      const enableTypos = args.enableTypos !== false;
      const fatigueEnabled = args.fatigueEnabled !== false;

      // Calculate base delay from WPM (average 5 chars per word)
      const baseDelay = 60000 / (wpm * 5);

      // Generate typing sequence
      const keystrokes: Array<{
        char: string;
        delay: number;
        isTypo?: boolean;
        correction?: string[];
      }> = [];

      let prevChar = "";
      let totalTime = 0;

      for (let i = 0; i < text.length; i++) {
        const char = text[i];

        // Calculate fatigue level (0 to 1)
        const fatigueLevel = fatigueEnabled ? Math.min(1, i / 500) : 0;

        // Add thinking pause occasionally
        if (shouldThinkingPause() && i > 0) {
          const pauseDuration = getThinkingPauseDuration();
          keystrokes.push({
            char: "[pause]",
            delay: pauseDuration,
          });
          totalTime += pauseDuration;
        }

        // Calculate delay for this keystroke
        let delay = calculateKeyDelay(char, prevChar, fatigueLevel);
        delay = delay * (baseDelay / 80); // Adjust to target WPM

        // Check for typo
        if (enableTypos && shouldMakeTypo(fatigueLevel) && TYPO_MAP[char.toLowerCase()]) {
          const typoChar = getTypoChar(char);

          // Type the wrong character
          keystrokes.push({
            char: typoChar,
            delay,
            isTypo: true,
          });
          totalTime += delay;

          // Pause to "notice" the typo
          const noticeDelay = 200 + Math.random() * 400;
          totalTime += noticeDelay;

          // Backspace and correct
          keystrokes.push({
            char: "[backspace]",
            delay: noticeDelay,
            correction: ["backspace"],
          });

          // Type correct character (slightly slower - being careful)
          keystrokes.push({
            char,
            delay: delay * 1.3,
            correction: ["correction"],
          });
          totalTime += delay * 1.3;
        } else {
          keystrokes.push({
            char,
            delay: Math.round(delay),
          });
          totalTime += delay;
        }

        prevChar = char;
      }

      const stats = {
        totalCharacters: text.length,
        totalKeystrokes: keystrokes.length,
        typos: keystrokes.filter((k) => k.isTypo).length,
        corrections: keystrokes.filter((k) => k.correction).length,
        pauses: keystrokes.filter((k) => k.char === "[pause]").length,
        estimatedDuration: Math.round(totalTime),
        effectiveWpm: Math.round(text.length / 5 / (totalTime / 60000)),
      };

      if (action === "analyze") {
        return jsonResult({
          success: true,
          action: "analyze",
          stats,
          sampleKeystrokes: keystrokes.slice(0, 20),
          message: `Analyzed typing plan for ${text.length} characters`,
        });
      }

      return jsonResult({
        success: true,
        action: "type",
        text,
        keystrokes,
        stats,
        message: `Generated human-like typing sequence: ${keystrokes.length} keystrokes, ~${Math.round(totalTime / 1000)}s duration`,
      });
    },
  };
}
