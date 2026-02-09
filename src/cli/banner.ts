/**
 * AeonSage CLI Banner
 * Clean, responsive, blue-purple theme
 *
 */

import { resolveCommitHash } from "../infra/git-commit.js";
import { visibleWidth } from "../terminal/ansi.js";
import { isRich, theme } from "../terminal/theme.js";
import { pickTagline, type TaglineOptions } from "./tagline.js";
import { resolveCliName } from "./cli-name.js";

// ═══════════════════════════════════════════════════════════════
// Color Palette - Sovereign Green + White + Gray Theme
// ═══════════════════════════════════════════════════════════════

const c = {
  // Brand - Sovereign Green (AeonSage Core)
  pri: "\x1b[38;5;40m", // Primary Green (#00d700)
  sec: "\x1b[38;5;34m", // Secondary deeper green
  acc: "\x1b[38;5;46m", // Accent bright green

  // Galaxy - Green gradient
  g1: "\x1b[38;5;40m", // Core green
  g2: "\x1b[38;5;34m", // Mid green
  g3: "\x1b[38;5;28m", // Dark green
  g4: "\x1b[38;5;48m", // Light green

  // Galaxy - Purple/Cosmic colors (Milky Way)
  p1: "\x1b[38;5;141m", // Light purple
  p2: "\x1b[38;5;135m", // Magenta purple
  p3: "\x1b[38;5;99m", // Deep purple
  p4: "\x1b[38;5;63m", // Blue purple
  b1: "\x1b[38;5;75m", // Cosmic blue
  b2: "\x1b[38;5;111m", // Light blue

  // UI - White/Gray hierarchy
  dim: "\x1b[38;5;244m", // Gray
  dimmer: "\x1b[38;5;238m", // Darker gray
  text: "\x1b[38;5;255m", // White
  star: "\x1b[38;5;255m", // Pure white
  starBright: "\x1b[38;5;231m", // Bright white star
  border: "\x1b[38;5;99m", // Deep purple for brand-aligned borders

  // Status
  ok: "\x1b[38;5;40m", // Green
  warn: "\x1b[38;5;220m", // Yellow (kept for warnings)
  err: "\x1b[38;5;196m", // Red
  info: "\x1b[38;5;252m", // Light gray

  // Effects
  bold: "\x1b[1m",
  r: "\x1b[0m",
} as const;

// ═══════════════════════════════════════════════════════════════
// ASCII Art - Raw characters (no color codes)
// ═══════════════════════════════════════════════════════════════

// AEONSAGE wordmark ASCII art
const WORDMARK_RAW = [
  "█████╗ ███████╗ ██████╗ ███╗   ██╗███████╗ █████╗  ██████╗ ███████╗",
  "██╔══██╗██╔════╝██╔═══██╗████╗  ██║██╔════╝██╔══██╗██╔════╝ ██╔════╝",
  "███████║█████╗  ██║   ██║██╔██╗ ██║███████╗███████║██║  ███╗█████╗  ",
  "██╔══██║██╔══╝  ██║   ██║██║╚██╗██║╚════██║██╔══██║██║   ██║██╔══╝  ",
  "██║  ██║███████╗╚██████╔╝██║ ╚████║███████║██║  ██║╚██████╔╝███████╗",
  "╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═══╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝",
];

// Octopus mascot ASCII art - Compact high-density dot-matrix
// Features: Small size, dense dots, X-eyes, curling tentacles
const MASCOT_RAW = [
  "      ●●●●●●●●●●●●      ",
  "    ●●●●●●●●●●●●●●●●    ",
  "   ●●●●●●●●●●●●●●●●●●   ",
  "  ●●●●●╲╱●●●●●●╲╱●●●●●  ",
  "  ●●●●●●╳●●●●●●●╳●●●●●  ",
  "  ●●●●●╱╲●●●●●●╱╲●●●●●  ",
  "   ●●●●●●●●●●●●●●●●●●   ",
  "  ●● ●●●●●●●●●●●●●● ●●  ",
  " ●●   ●●●●    ●●●●   ●● ",
  "●●    ●●●●    ●●●●    ●●",
];

const _ASTRONAUT_RAW = [
  "        ▄███▄        ",
  "       ███████       ",
  "        █████        ",
  "       ███░███       ",
  "       ██░ ░██       ",
  "      ██░   ░██      ",
];

const GROUND_RAW = "░░░░░░░░░░░░░░░░░░███   ███░░░░░░░░░░░░░░░░░░";

// ═══════════════════════════════════════════════════════════════
// Colorize Functions
// ═══════════════════════════════════════════════════════════════

function colorizeMascot(line: string): string {
  // Brand dot-matrix purple colors (user specified)
  // Dot Main: #7C6BFF, Dot Dim: #4E459B, Dot Shadow: #2B275F
  const dotMain = "\x1b[38;2;124;107;255m"; // #7C6BFF - Main dots
  const dotDim = "\x1b[38;2;78;69;155m"; // #4E459B - Dim dots (eyes X marks)
  return line
    .replace(/●/g, `${dotMain}●${c.r}`) // Main body dots
    .replace(/[╲╱╳]/g, `${dotDim}$&${c.r}`); // X-eye marks dimmer
}

function colorizeWordmark(line: string): string {
  // Professional Logo - Three-layer structure (Claude style)
  // Layer 1 (Main Fill): #6E56CF
  // Layer 2 (Inner Shadow): simulated with darker shade
  // Layer 3 (Outer Stroke): #C9D4E2 (soft silver-gray)
  const mainFill = "\x1b[38;2;110;86;207m"; // #6E56CF - Primary Purple
  const outerStroke = "\x1b[38;2;201;212;226m"; // #C9D4E2 - Soft silver-gray
  return line
    .replace(/█/g, `${mainFill}█${c.r}`)
    .replace(/╗/g, `${outerStroke}╗${c.r}`)
    .replace(/╔/g, `${outerStroke}╔${c.r}`)
    .replace(/║/g, `${outerStroke}║${c.r}`)
    .replace(/╝/g, `${outerStroke}╝${c.r}`)
    .replace(/╚/g, `${outerStroke}╚${c.r}`)
    .replace(/═/g, `${outerStroke}═${c.r}`);
}

function _colorizeAstronaut(line: string): string {
  return line
    .replace(/▄/g, `${c.dim}▄${c.r}`)
    .replace(/█/g, `${c.dim}█${c.r}`)
    .replace(/░/g, `${c.acc}░${c.r}`);
}

function _colorizeGround(): string {
  return GROUND_RAW.replace(/░/g, `${c.dimmer}░${c.r}`).replace(/█/g, `${c.dim}█${c.r}`);
}

// ═══════════════════════════════════════════════════════════════
// Galaxy Generator
// ═══════════════════════════════════════════════════════════════

function seededRandom(seed: number, i: number): number {
  const x = Math.sin(seed * 9999 + i * 7919) * 10000;
  return x - Math.floor(x);
}

function generateStars(width: number, seed: number): string {
  // Star colors for realistic galaxy effect
  const starColors = [c.star, c.starBright, c.p1, c.b1, c.b2];
  let line = "";
  for (let i = 0; i < width; i++) {
    const r = seededRandom(seed, i);
    if (r < 0.008) {
      // Bright stars - mixed colors
      const color = starColors[Math.floor(seededRandom(seed, i + 500) * starColors.length)];
      line += `${color}*${c.r}`;
    } else if (r < 0.025) {
      // Medium stars - purple/blue tint
      const tintColors = [c.dim, c.p1, c.p3, c.b1];
      const color = tintColors[Math.floor(seededRandom(seed, i + 600) * tintColors.length)];
      line += `${color}·${c.r}`;
    } else if (r < 0.045) {
      line += `${c.dimmer}.${c.r}`;
    } else {
      line += " ";
    }
  }
  return line;
}

function generateGalaxy(width: number, density: number, seed: number): string {
  // Milky Way colors - green core with purple/blue outer regions
  const coreColors = [c.g1, c.g2, c.g3, c.g4];
  const outerColors = [c.p1, c.p2, c.p3, c.p4, c.b1, c.b2];
  const chars = ["░", "▒", "▓", "·", "✦"];

  let line = "";
  for (let i = 0; i < width; i++) {
    const r = seededRandom(seed, i);
    const pos = i / width;
    const inGalaxy = pos > 0.2 && pos < 0.8 && r < density * Math.sin(pos * Math.PI);

    if (inGalaxy) {
      const char = chars[Math.floor(seededRandom(seed, i + 1000) * chars.length)];
      // Core region (center) uses green, outer regions use purple/blue
      const distFromCenter = Math.abs(pos - 0.5);
      const isCore = distFromCenter < 0.15;
      const colors = isCore ? coreColors : outerColors;
      const color = colors[Math.floor(seededRandom(seed, i + 2000) * colors.length)];
      line += `${color}${char}${c.r}`;
    } else if (r < 0.015) {
      // Scattered stars with purple tint
      const scatterColors = [c.dim, c.p1, c.p3];
      const color = scatterColors[Math.floor(seededRandom(seed, i + 3000) * scatterColors.length)];
      line += `${color}·${c.r}`;
    } else {
      line += " ";
    }
  }
  return line;
}

// ═══════════════════════════════════════════════════════════════
// Layout Helpers
// ═══════════════════════════════════════════════════════════════

function centerPad(content: string, width: number): string {
  const contentWidth = visibleWidth(content);
  const leftPad = Math.max(0, Math.floor((width - contentWidth) / 2));
  const rightPad = Math.max(0, width - contentWidth - leftPad);
  return " ".repeat(leftPad) + content + " ".repeat(rightPad);
}

function _boxLine(content: string, _width: number): string {
  return `${c.border}│${c.r}${content}${c.border}│${c.r}`;
}

// ═══════════════════════════════════════════════════════════════
// Banner Builders
// ═══════════════════════════════════════════════════════════════

export interface BannerOptions {
  version?: string;
  tagline?: string;
  width?: number;
  theme?: "galaxy" | "minimal";
  argv?: string[];
  richTty?: boolean;
  env?: NodeJS.ProcessEnv;
}

export function buildGalaxyBanner(options: BannerOptions = {}): string {
  const { version = "1.0.0", tagline = "Think different. Actually think." } = options;

  // Responsive width
  const termWidth = options.width ?? process.stdout.columns ?? 80;
  const width = Math.max(72, Math.min(termWidth, 100));
  const inner = width - 2;

  // Zone-specific border helpers for visual hierarchy
  const boxPurple = (content: string) => `${c.p1}│${c.r}${content}${c.p1}│${c.r}`;
  const boxBlue = (content: string) => `${c.b1}│${c.r}${content}${c.b1}│${c.r}`;
  const _boxGreen = (content: string) => `${c.pri}│${c.r}${content}${c.pri}│${c.r}`;
  const boxOrange = (content: string) => `${c.border}│${c.r}${content}${c.border}│${c.r}`;

  const lines: string[] = [];

  // Top border (purple - cosmic)
  lines.push(`${c.p1}┌${"─".repeat(inner)}┐${c.r}`);

  // Stars section (purple borders)
  lines.push(boxPurple(generateStars(inner, 1)));
  lines.push(boxPurple(generateStars(inner, 2)));

  // Galaxy band (blue borders - transitioning)
  lines.push(boxBlue(generateGalaxy(inner, 0.25, 10)));
  lines.push(boxBlue(generateGalaxy(inner, 0.4, 20)));
  lines.push(boxBlue(generateGalaxy(inner, 0.55, 30)));

  // Wordmark section (silver-gray borders)
  const boxSilver = (content: string) => `\x1b[38;5;245m│\x1b[0m${content}\x1b[38;5;245m│\x1b[0m`;
  for (const raw of WORDMARK_RAW) {
    const colored = colorizeWordmark(raw);
    lines.push(boxSilver(centerPad(colored, inner)));
  }

  // Galaxy fade (blue borders)
  lines.push(boxBlue(generateGalaxy(inner, 0.3, 40)));
  lines.push(boxBlue(generateGalaxy(inner, 0.15, 50)));

  // Empty line (transition)
  lines.push(boxOrange(" ".repeat(inner)));

  // Ghost mascot section (purple borders - brand identity)
  for (const raw of MASCOT_RAW) {
    const colored = colorizeMascot(raw);
    lines.push(boxPurple(centerPad(colored, inner)));
  }

  // Divider (orange)
  lines.push(`${c.border}├${"─".repeat(inner)}┤${c.r}`);

  // Info line (orange accent for brand emphasis)
  const orange = "\x1b[38;5;208m"; // Bright orange accent
  const info = `  ${orange}◈${c.r} ${orange}${c.bold}AeonSage${c.r} ${c.dim}${version}${c.r} ${c.dim}──${c.r} ${c.text}${tagline}${c.r}`;
  lines.push(boxPurple(centerPad(info, inner)));

  // Bottom border (orange)
  lines.push(`${c.border}└${"─".repeat(inner)}┘${c.r}`);

  return "\n" + lines.join("\n") + "\n";
}

export function buildMinimalBanner(options: BannerOptions = {}): string {
  const { version = "1.0.0", tagline = "Think different. Actually think." } = options;

  // Compact purple octopus for minimal/narrow screens
  const octopus = [
    `${c.p3}    ●●●●●●●●    ${c.r}`,
    `${c.p3}  ●●●●●●●●●●●●  ${c.r}`,
    `${c.p3} ●●●╲╱●●●╲╱●●● ${c.r}`,
    `${c.p3} ●●●●╳●●●●╳●●●  ${c.r}`,
    `${c.p3}  ●●●●●●●●●●●●  ${c.r}`,
    `${c.p3} ●● ●●●●●●●● ●● ${c.r}`,
    `${c.p3}●●   ●●  ●●   ●●${c.r}`,
  ];

  return [
    "",
    ...octopus,
    "",
    `  ${c.p3}${c.bold}AeonSage${c.r} ${c.dim}${version}${c.r}`,
    `  ${c.dim}${tagline}${c.r}`,
    "",
  ].join("\n");
}

// ═══════════════════════════════════════════════════════════════
// Public API
// ═══════════════════════════════════════════════════════════════

let bannerEmitted = false;

const hasFlag = (argv: string[], ...flags: string[]) =>
  argv.some((arg) => flags.includes(arg) || flags.some((f) => arg.startsWith(`${f}=`)));

export function emitCliBanner(version: string, options?: BannerOptions): void;
export function emitCliBanner(options?: BannerOptions): void;
export function emitCliBanner(
  versionOrOptions?: string | BannerOptions,
  maybeOptions?: BannerOptions,
): void {
  if (bannerEmitted) return;

  const opts =
    typeof versionOrOptions === "string"
      ? { ...maybeOptions, version: versionOrOptions }
      : (versionOrOptions ?? {});

  const argv = opts.argv ?? process.argv;

  // Skip conditions
  if (!process.stdout.isTTY) return;
  if (hasFlag(argv, "--json")) return;
  if (hasFlag(argv, "--version", "-V", "-v")) return;

  const version = opts.version ?? "1.0.0";
  const tagline = opts.tagline ?? pickTagline(opts as TaglineOptions);
  const rich = opts.richTty ?? isRich();
  const themeName = opts.theme ?? "galaxy";
  const termWidth = opts.width ?? process.stdout.columns ?? 80;

  // Use minimal banner for narrow screens (< 72 cols) or non-rich terminals
  const useMinimal = !rich || themeName === "minimal" || termWidth < 72;

  const banner = useMinimal
    ? buildMinimalBanner({ version, tagline })
    : buildGalaxyBanner({ version, tagline, width: termWidth });

  process.stdout.write(banner + "\n");
  bannerEmitted = true;
}

export function hasEmittedCliBanner(): boolean {
  return bannerEmitted;
}

// ═══════════════════════════════════════════════════════════════
// Legacy API (for help output)
// ═══════════════════════════════════════════════════════════════

export function formatCliBannerLine(version: string, options: BannerOptions = {}): string {
  const commit = resolveCommitHash({ env: options.env }) ?? "unknown";
  const tagline = options.tagline ?? pickTagline(options as TaglineOptions);
  const rich = options.richTty ?? isRich();
  const _cliName = resolveCliName(options.argv ?? process.argv, options.env);

  const title = "◈ AeonSage";
  const columns = options.width ?? process.stdout.columns ?? 120;
  const plain = `${title} ${version} (${commit}) — ${tagline}`;

  if (visibleWidth(plain) <= columns) {
    return rich
      ? `${theme.heading(title)} ${theme.info(version)} ${theme.muted(`(${commit})`)} ${theme.muted("—")} ${theme.accentDim(tagline)}`
      : plain;
  }

  const line1 = rich
    ? `${theme.heading(title)} ${theme.info(version)} ${theme.muted(`(${commit})`)}`
    : `${title} ${version} (${commit})`;
  const line2 = rich ? `   ${theme.accentDim(tagline)}` : `   ${tagline}`;

  return `${line1}\n${line2}`;
}

// ═══════════════════════════════════════════════════════════════
// Logging Utility
// ═══════════════════════════════════════════════════════════════

export function log(
  tag: string,
  message: string,
  type: "info" | "ok" | "warn" | "err" = "info",
): void {
  const time = new Date().toTimeString().slice(0, 8);
  const color = { info: c.info, ok: c.ok, warn: c.warn, err: c.err }[type];
  console.log(`${c.dim}${time}${c.r} ${color}[${tag}]${c.r} ${message}`);
}

// ═══════════════════════════════════════════════════════════════
// Exports
// ═══════════════════════════════════════════════════════════════

export const palette = c;
export default emitCliBanner;
