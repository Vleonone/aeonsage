const URL_RE = /(https?:\/\/[^\s)]+|www\.[^\s)]+)/gi;

function replaceBranding(text: string): string {
  return text
    .replace(/\bopenclaw\b/gi, "AeonSage")
    .replace(/\bclawhub\b/gi, "AeonSage");
}

export function normalizeMarketplaceBranding(text: string): string {
  if (!text) return text;
  const urls: string[] = [];
  const placeholder = text.replace(URL_RE, (match) => {
    const index = urls.length;
    urls.push(match);
    return `__URL_${index}__`;
  });
  const normalized = replaceBranding(placeholder);
  return normalized.replace(/__URL_(\d+)__/g, (match, idx) => {
    const index = Number(idx);
    return Number.isFinite(index) && urls[index] ? urls[index] : match;
  });
}
