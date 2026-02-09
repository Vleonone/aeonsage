import chalk, { Chalk } from "chalk";

import { AEONSAGE_PALETTE } from "./palette.js";

const hasForceColor =
  typeof process.env.FORCE_COLOR === "string" &&
  process.env.FORCE_COLOR.trim().length > 0 &&
  process.env.FORCE_COLOR.trim() !== "0";

const baseChalk = process.env.NO_COLOR && !hasForceColor ? new Chalk({ level: 0 }) : chalk;

const hex = (value: string) => baseChalk.hex(value);

export const theme = {
  accent: hex(AEONSAGE_PALETTE.accent),
  accentBright: hex(AEONSAGE_PALETTE.accentBright),
  accentDim: hex(AEONSAGE_PALETTE.accentDim),
  info: hex(AEONSAGE_PALETTE.info),
  success: hex(AEONSAGE_PALETTE.success),
  warn: hex(AEONSAGE_PALETTE.warn),
  error: hex(AEONSAGE_PALETTE.error),
  muted: hex(AEONSAGE_PALETTE.muted),
  heading: baseChalk.bold.hex(AEONSAGE_PALETTE.accent),
  command: hex(AEONSAGE_PALETTE.accentBright),
  option: hex(AEONSAGE_PALETTE.warn),
  label: hex("#888888"), // For secondary descriptors
  narrative: hex("#666666"), // For low-priority narrative flow
  subtle: hex("#333333"), // For ultra-low contrast decorative elements
  active: baseChalk.bold.hex(AEONSAGE_PALETTE.success),
} as const;

export const isRich = () => Boolean(baseChalk.level > 0);

export const colorize = (rich: boolean, color: (value: string) => string, value: string) =>
  rich ? color(value) : value;
