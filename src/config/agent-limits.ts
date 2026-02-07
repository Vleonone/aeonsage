import type { AeonSageConfig } from "./types.js";
import { getCapabilities, LicenseType } from "./capabilities.js";

// Default limits (restored for backward compatibility and sane defaults)
export const DEFAULT_AGENT_MAX_CONCURRENT = 4;
export const DEFAULT_SUBAGENT_MAX_CONCURRENT = 8;
const FALLBACK_MAX_CONCURRENT = 1;

export async function resolveAgentMaxConcurrent(cfg?: AeonSageConfig): Promise<number> {
  const capabilities = await getCapabilities();
  const licenseMax = capabilities.features.maxWorkers;

  // User config value or default
  const raw = cfg?.agents?.defaults?.maxConcurrent;
  let userValue = DEFAULT_AGENT_MAX_CONCURRENT;

  if (typeof raw === "number" && Number.isFinite(raw)) {
    userValue = Math.max(1, Math.floor(raw));
  } else if (capabilities.type === LicenseType.OPEN_SOURCE) {
    // If running in OSS mode without explicit config, strict default
    userValue = FALLBACK_MAX_CONCURRENT;
  }

  // Enforce license limit: min(userValue, licenseMax)
  return Math.min(userValue, licenseMax);
}

export async function resolveSubagentMaxConcurrent(cfg?: AeonSageConfig): Promise<number> {
  const capabilities = await getCapabilities();
  const licenseMax = capabilities.features.maxWorkers;

  const raw = cfg?.agents?.defaults?.subagents?.maxConcurrent;
  let userValue = DEFAULT_SUBAGENT_MAX_CONCURRENT;

  if (typeof raw === "number" && Number.isFinite(raw)) {
    userValue = Math.max(1, Math.floor(raw));
  } else if (capabilities.type === LicenseType.OPEN_SOURCE) {
    userValue = FALLBACK_MAX_CONCURRENT;
  }

  return Math.min(userValue, licenseMax);
}
