/**
 * Crypto Price Tool
 *
 * Get cryptocurrency prices and market data.
 */

// MCP-style tool - type inferred
import type { AeonSageConfig } from "../../config/config.js";

export interface CryptoPriceToolParams {
  config?: AeonSageConfig;
}

export interface CryptoPrice {
  symbol: string;
  name: string;
  price: number;
  priceChange24h: number;
  priceChangePercent24h: number;
  marketCap: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  lastUpdated: string;
}

export interface CryptoPriceResult {
  success: boolean;
  data?: CryptoPrice | CryptoPrice[];
  formatted?: string;
  error?: string;
}

// Common symbol mappings
const SYMBOL_MAPPINGS: Record<string, string> = {
  btc: "bitcoin",
  eth: "ethereum",
  bnb: "binancecoin",
  sol: "solana",
  xrp: "ripple",
  ada: "cardano",
  doge: "dogecoin",
  dot: "polkadot",
  matic: "polygon",
  link: "chainlink",
  uni: "uniswap",
  avax: "avalanche-2",
  shib: "shiba-inu",
  ltc: "litecoin",
  atom: "cosmos",
  usdt: "tether",
  usdc: "usd-coin",
};

/**
 * Get CoinGecko coin ID from symbol
 */
function getCoinId(symbol: string): string {
  const lower = symbol.toLowerCase().trim();
  return SYMBOL_MAPPINGS[lower] ?? lower;
}

/**
 * Format currency
 */
function formatCurrency(value: number, currency: string = "usd"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
    minimumFractionDigits: value < 1 ? 6 : 2,
    maximumFractionDigits: value < 1 ? 6 : 2,
  }).format(value);
}

/**
 * Format large number
 */
function formatLargeNumber(value: number): string {
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return formatCurrency(value);
}

/**
 * Fetch price from CoinGecko
 */
async function fetchPrice(coinIds: string[], currency: string = "usd"): Promise<CryptoPriceResult> {
  try {
    const ids = coinIds.join(",");
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&ids=${ids}&order=market_cap_desc&sparkline=false&price_change_percentage=24h`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        Accept: "application/json",
        "User-Agent": "AeonSage-Bot/1.0",
      },
    });

    if (!response.ok) {
      if (response.status === 429) {
        return { success: false, error: "Rate limited. Please try again later." };
      }
      return { success: false, error: `API error: HTTP ${response.status}` };
    }

    const data = (await response.json()) as Array<{
      id: string;
      symbol: string;
      name: string;
      current_price: number;
      price_change_24h: number;
      price_change_percentage_24h: number;
      market_cap: number;
      total_volume: number;
      high_24h: number;
      low_24h: number;
      last_updated: string;
    }>;

    if (!data.length) {
      return { success: false, error: "No data found for the specified coins" };
    }

    const prices: CryptoPrice[] = data.map((coin) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      priceChange24h: coin.price_change_24h,
      priceChangePercent24h: coin.price_change_percentage_24h,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      high24h: coin.high_24h,
      low24h: coin.low_24h,
      lastUpdated: coin.last_updated,
    }));

    return { success: true, data: prices.length === 1 ? prices[0] : prices };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch price",
    };
  }
}

/**
 * Fetch top coins by market cap
 */
async function fetchTopCoins(
  limit: number = 10,
  currency: string = "usd",
): Promise<CryptoPriceResult> {
  try {
    const url = `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${limit}&page=1&sparkline=false&price_change_percentage=24h`;

    const response = await fetch(url, {
      signal: AbortSignal.timeout(10000),
      headers: {
        Accept: "application/json",
        "User-Agent": "AeonSage-Bot/1.0",
      },
    });

    if (!response.ok) {
      return { success: false, error: `API error: HTTP ${response.status}` };
    }

    const data = (await response.json()) as Array<{
      symbol: string;
      name: string;
      current_price: number;
      price_change_24h: number;
      price_change_percentage_24h: number;
      market_cap: number;
      total_volume: number;
      high_24h: number;
      low_24h: number;
      last_updated: string;
    }>;

    const prices: CryptoPrice[] = data.map((coin) => ({
      symbol: coin.symbol.toUpperCase(),
      name: coin.name,
      price: coin.current_price,
      priceChange24h: coin.price_change_24h,
      priceChangePercent24h: coin.price_change_percentage_24h,
      marketCap: coin.market_cap,
      volume24h: coin.total_volume,
      high24h: coin.high_24h,
      low24h: coin.low_24h,
      lastUpdated: coin.last_updated,
    }));

    return { success: true, data: prices };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to fetch prices",
    };
  }
}

/**
 * Format price data as readable text
 */
function formatPriceData(data: CryptoPrice | CryptoPrice[]): string {
  const prices = Array.isArray(data) ? data : [data];
  const lines: string[] = [];

  lines.push("📊 Cryptocurrency Prices");
  lines.push("");

  for (const coin of prices) {
    const changeEmoji = coin.priceChangePercent24h >= 0 ? "📈" : "📉";
    const changeColor = coin.priceChangePercent24h >= 0 ? "+" : "";

    lines.push(`${changeEmoji} **${coin.name} (${coin.symbol})**`);
    lines.push(`   Price: ${formatCurrency(coin.price)}`);
    lines.push(`   24h Change: ${changeColor}${coin.priceChangePercent24h.toFixed(2)}%`);
    lines.push(`   Market Cap: ${formatLargeNumber(coin.marketCap)}`);
    lines.push(`   24h Volume: ${formatLargeNumber(coin.volume24h)}`);
    lines.push(`   24h Range: ${formatCurrency(coin.low24h)} - ${formatCurrency(coin.high24h)}`);
    lines.push("");
  }

  return lines.join("\n").trim();
}

/**
 * Create the crypto price tool
 */
export function createCryptoPriceTool() {
  return {
    name: "crypto_price",
    description: `Get cryptocurrency prices and market data from CoinGecko.

Features:
- Get price for any cryptocurrency
- View 24h price change, market cap, volume
- Get top coins by market cap
- Support for multiple currencies (USD, EUR, etc.)

Common symbols:
BTC, ETH, BNB, SOL, XRP, ADA, DOGE, DOT, MATIC, LINK, UNI, AVAX, SHIB, LTC, ATOM

Note: Free API has rate limits. Use responsibly.`,
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["price", "top"],
          description:
            "Action: 'price' for specific coin(s), 'top' for top coins. Default is 'price'.",
        },
        symbol: {
          type: "string",
          description:
            "Coin symbol or ID (e.g., 'BTC', 'ETH', 'bitcoin'). Can be comma-separated for multiple.",
        },
        currency: {
          type: "string",
          description: "Quote currency (e.g., 'usd', 'eur', 'jpy'). Default is 'usd'.",
        },
        limit: {
          type: "number",
          description: "Number of top coins to return (for 'top' action). Default is 10.",
        },
      },
      required: [],
    },
    call: async (input: {
      action?: "price" | "top";
      symbol?: string;
      currency?: string;
      limit?: number;
    }): Promise<CryptoPriceResult> => {
      const { action = "price", symbol, currency = "usd", limit = 10 } = input;

      if (action === "top") {
        const result = await fetchTopCoins(limit, currency);
        if (result.success && result.data) {
          result.formatted = formatPriceData(result.data);
        }
        return result;
      }

      // Price action
      if (!symbol) {
        // Default to top coins if no symbol specified
        const result = await fetchTopCoins(5, currency);
        if (result.success && result.data) {
          result.formatted = formatPriceData(result.data);
        }
        return result;
      }

      // Parse symbols
      const symbols = symbol.split(",").map((s) => getCoinId(s.trim()));
      const result = await fetchPrice(symbols, currency);

      if (result.success && result.data) {
        result.formatted = formatPriceData(result.data);
      }

      return result;
    },
  };
}
