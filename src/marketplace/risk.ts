export type MarketplaceRiskTier = "green" | "yellow" | "red" | "unknown";

export type MarketplaceRiskReport = {
  tier: MarketplaceRiskTier;
  reasons: string[];
};

const RED_KEYWORDS = [
  "exfil",
  "keylogger",
  "credential theft",
  "steal password",
  "token siphon",
  "wallet drain",
  "private key",
  "seed phrase",
];

const YELLOW_KEYWORDS = [
  "token",
  "password",
  "credential",
  "ssh",
  "cookie",
  "vault",
  "proxy",
  "wallet",
  "keystore",
  "secrets",
];

function normalizeText(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" ").toLowerCase();
}

export function evaluateMarketplaceRisk(params: {
  name: string;
  description?: string;
  tags?: string[];
}): MarketplaceRiskReport {
  const text = normalizeText([params.name, params.description, params.tags?.join(" ")]);
  if (!text) return { tier: "unknown", reasons: [] };

  const reasons: string[] = [];
  for (const keyword of RED_KEYWORDS) {
    if (text.includes(keyword)) reasons.push(`flag:${keyword}`);
  }
  if (reasons.length > 0) return { tier: "red", reasons };

  for (const keyword of YELLOW_KEYWORDS) {
    if (text.includes(keyword)) reasons.push(`flag:${keyword}`);
  }
  if (reasons.length > 0) return { tier: "yellow", reasons };

  return { tier: "green", reasons: [] };
}
