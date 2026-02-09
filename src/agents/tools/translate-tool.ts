/**
 * Translate Tool
 *
 * Multi-language translation using Google Translate or DeepL.
 */

// MCP-style tool - type inferred
import type { AeonSageConfig } from "../../config/config.js";

export interface TranslateToolParams {
  config?: AeonSageConfig;
}

export interface TranslationResult {
  success: boolean;
  text?: string;
  translatedText?: string;
  sourceLanguage?: string;
  targetLanguage?: string;
  provider?: string;
  confidence?: number;
  alternatives?: string[];
  error?: string;
}

// Common language codes
const LANGUAGE_CODES: Record<string, string> = {
  // Full names to codes
  english: "en",
  chinese: "zh",
  japanese: "ja",
  korean: "ko",
  spanish: "es",
  french: "fr",
  german: "de",
  italian: "it",
  portuguese: "pt",
  russian: "ru",
  arabic: "ar",
  hindi: "hi",
  thai: "th",
  vietnamese: "vi",
  indonesian: "id",
  malay: "ms",
  turkish: "tr",
  polish: "pl",
  dutch: "nl",
  // Short codes pass through
  en: "en",
  zh: "zh",
  "zh-cn": "zh-CN",
  "zh-tw": "zh-TW",
  ja: "ja",
  ko: "ko",
  es: "es",
  fr: "fr",
  de: "de",
  it: "it",
  pt: "pt",
  ru: "ru",
  ar: "ar",
};

/**
 * Normalize language code
 */
function normalizeLanguageCode(lang: string): string {
  const lower = lang.toLowerCase().trim();
  return LANGUAGE_CODES[lower] ?? lower;
}

/**
 * Translate using Google Translate (free tier, limited)
 */
async function translateWithGoogle(
  text: string,
  targetLang: string,
  sourceLang?: string,
): Promise<TranslationResult> {
  try {
    // Use Google Translate's free API (may have rate limits)
    const url = new URL("https://translate.googleapis.com/translate_a/single");
    url.searchParams.set("client", "gtx");
    url.searchParams.set("sl", sourceLang ?? "auto");
    url.searchParams.set("tl", targetLang);
    url.searchParams.set("dt", "t");
    url.searchParams.set("q", text);

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(10000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; AeonSage/1.0)",
      },
    });

    if (!response.ok) {
      return {
        success: false,
        error: `Google Translate API error: HTTP ${response.status}`,
      };
    }

    const data = (await response.json()) as unknown[][];

    // Parse response
    let translatedText = "";
    let detectedSource = sourceLang ?? "auto";

    if (Array.isArray(data) && Array.isArray(data[0])) {
      for (const segment of data[0] as unknown[][]) {
        if (Array.isArray(segment) && segment[0]) {
          translatedText += `${segment[0] as string}`;
        }
      }
    }

    if (Array.isArray(data) && data[2]) {
      detectedSource = data[2] as unknown as string;
    }

    if (!translatedText) {
      return { success: false, error: "Empty translation result" };
    }

    return {
      success: true,
      text,
      translatedText,
      sourceLanguage: detectedSource,
      targetLanguage: targetLang,
      provider: "google",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Translation failed",
    };
  }
}

/**
 * Translate using DeepL API
 */
async function translateWithDeepL(
  text: string,
  targetLang: string,
  sourceLang: string | undefined,
  apiKey: string,
): Promise<TranslationResult> {
  try {
    // DeepL uses different language codes
    const deeplTargetLang = targetLang.toUpperCase().replace("-", "_");

    const url = apiKey.endsWith(":fx")
      ? "https://api-free.deepl.com/v2/translate"
      : "https://api.deepl.com/v2/translate";

    const params = new URLSearchParams();
    params.set("text", text);
    params.set("target_lang", deeplTargetLang);
    if (sourceLang) {
      params.set("source_lang", sourceLang.toUpperCase());
    }

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `DeepL-Auth-Key ${apiKey}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `DeepL API error: HTTP ${response.status} - ${errorText}`,
      };
    }

    const data = (await response.json()) as {
      translations: Array<{
        detected_source_language: string;
        text: string;
      }>;
    };

    if (!data.translations?.length) {
      return { success: false, error: "Empty translation result" };
    }

    const translation = data.translations[0]!;

    return {
      success: true,
      text,
      translatedText: translation.text,
      sourceLanguage: translation.detected_source_language.toLowerCase(),
      targetLanguage: targetLang,
      provider: "deepl",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Translation failed",
    };
  }
}

/**
 * Create the translate tool
 */
export function createTranslateTool(params: TranslateToolParams = {}) {
  return {
    name: "translate",
    description: `Translate text between languages using Google Translate or DeepL.

Supported languages:
- English, Chinese, Japanese, Korean
- Spanish, French, German, Italian, Portuguese
- Russian, Arabic, Hindi, Thai, Vietnamese
- Indonesian, Malay, Turkish, Polish, Dutch
- And many more...

Features:
- Auto-detect source language
- Multiple translation providers
- Support for long text

Providers:
- google: Free, general purpose (default)
- deepl: Higher quality, requires API key`,
    inputSchema: {
      type: "object",
      properties: {
        text: {
          type: "string",
          description: "Text to translate.",
        },
        to: {
          type: "string",
          description: "Target language (e.g., 'en', 'zh', 'ja', 'korean', 'spanish').",
        },
        from: {
          type: "string",
          description: "Source language. Auto-detect if not specified.",
        },
        provider: {
          type: "string",
          enum: ["google", "deepl", "auto"],
          description: "Translation provider. Default is 'google'.",
        },
        deeplApiKey: {
          type: "string",
          description: "DeepL API key (required for DeepL provider).",
        },
      },
      required: ["text", "to"],
    },
    call: async (input: {
      text: string;
      to: string;
      from?: string;
      provider?: "google" | "deepl" | "auto";
      deeplApiKey?: string;
    }): Promise<TranslationResult> => {
      const { text, to, from, provider = "google" } = input;

      if (!text.trim()) {
        return { success: false, error: "Text is empty" };
      }

      const targetLang = normalizeLanguageCode(to);
      const sourceLang = from ? normalizeLanguageCode(from) : undefined;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const deeplApiKey =
        input.deeplApiKey ??
        (params.config?.tools as any)?.translate?.deeplApiKey ??
        process.env.DEEPL_API_KEY;

      // Choose provider
      if (provider === "deepl" || (provider === "auto" && deeplApiKey)) {
        if (!deeplApiKey) {
          return {
            success: false,
            error: "DeepL API key not configured. Set DEEPL_API_KEY or use Google provider.",
          };
        }
        return translateWithDeepL(text, targetLang, sourceLang, deeplApiKey);
      }

      // Default to Google
      return translateWithGoogle(text, targetLang, sourceLang);
    },
  };
}
