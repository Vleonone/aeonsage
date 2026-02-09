export type MarketplaceTool = {
  id: string;
  name: string;
  description?: string;
  version?: string;
  source?: string;
  riskTier?: "green" | "yellow" | "red" | "unknown";
  riskReasons?: string[];
};

export type MarketplaceToolsRegistry = {
  tools: MarketplaceTool[];
  total: number;
  source?: string;
  lastSync?: string;
};

export function getMarketplaceToolsRegistry(): MarketplaceToolsRegistry {
  return {
    tools: [],
    total: 0,
  };
}
