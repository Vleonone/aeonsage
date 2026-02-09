/**
 * Skill Auto-Trigger Engine
 *
 * Core Functions:
 * 1. Intent Recognition: Analyze user message intent
 * 2. Skill Matching: Semantic matching for best-fit skills
 * 3. Atomic Trigger: Execute skills without manual invocation
 *
 * Integration Point: src/commands/agent.ts -> agentCommand
 */

import type { Skill } from "@mariozechner/pi-coding-agent";
import type { SkillEntry } from "./types.js";

/**
 * Intent Classifier
 * Recognizes intent based on keywords and rules
 */
export type IntentCategory =
  | "query" // Query cases (Weather/Stocks/News)
  | "action" // Action cases (Email/Reminders/Recording)
  | "generation" // Generation cases (Image/Audio/Docs)
  | "analysis" // Analysis cases (Logs/Data/Stats)
  | "system" // System cases (Config/Status/Mgmt)
  | "unknown"; // Unknown

export interface IntentAnalysis {
  category: IntentCategory;
  confidence: number;
  keywords: string[];
  originalMessage: string;
}

/**
 * Skill Match Result
 */
export interface SkillMatchResult {
  skill: Skill;
  score: number; // 0-1 Confidence score
  reason: string;
}

/**
 * Auto-trigger Configuration
 */
export interface AutoTriggerConfig {
  enabled: boolean;
  minConfidence: number; // Threshold (0-1)
  maxSkills: number; // Max results
  timeout: number; // Timeout in milliseconds
}

const DEFAULT_CONFIG: AutoTriggerConfig = {
  enabled: true,
  minConfidence: 0.5, // Lowered to allow more matches
  maxSkills: 3,
  timeout: 5000,
};

// Chinese-English keyword mapping for cross-language matching
const KEYWORD_TRANSLATIONS: Record<string, string[]> = {
  // Query
  天气: ["weather"],
  股票: ["stock"],
  新闻: ["news"],
  搜索: ["search"],
  查询: ["query", "search", "fetch"],
  // Action
  发送: ["send"],
  邮件: ["email", "mail"],
  提醒: ["remind", "reminder"],
  通知: ["notify", "notification"],
  // Generation
  生成: ["generate", "create"],
  图片: ["image", "picture"],
  绘制: ["draw", "render"],
  创建: ["create", "make"],
  // Analysis
  分析: ["analyze", "analysis"],
  统计: ["statistics", "stats"],
  日志: ["log", "logs"],
  // System
  状态: ["status"],
  配置: ["config", "configuration"],
  设置: ["settings", "setting"],
};

/**
 * Intent Analyzer
 * Uses keyword rules for fast classification
 */
export function analyzeIntent(message: string): IntentAnalysis {
  const text = message.toLowerCase().trim();
  const words = text.split(/\s+/);

  // Query keywords (English + Chinese)
  const queryKeywords = [
    "weather",
    "stock",
    "news",
    "search",
    "what",
    "how",
    "where",
    "info",
    "天气",
    "股票",
    "新闻",
    "搜索",
    "查询",
    "查看",
    "什么",
    "怎么",
    "哪里",
  ];
  // Action keywords (English + Chinese)
  const actionKeywords = [
    "send",
    "remind",
    "record",
    "photo",
    "notify",
    "call",
    "发送",
    "提醒",
    "记录",
    "拍照",
    "通知",
    "电话",
    "邮件",
  ];
  // Generation keywords (English + Chinese)
  const generationKeywords = [
    "generate",
    "create",
    "draw",
    "write",
    "make",
    "render",
    "生成",
    "创建",
    "绘制",
    "写",
    "制作",
    "渲染",
    "图片",
  ];
  // Analysis keywords (English + Chinese)
  const analysisKeywords = [
    "analyze",
    "statistics",
    "summary",
    "report",
    "log",
    "session",
    "usage",
    "分析",
    "统计",
    "总结",
    "报告",
    "日志",
    "会话",
    "使用",
  ];
  // System keywords (English + Chinese)
  const systemKeywords = [
    "config",
    "settings",
    "status",
    "restart",
    "kernel",
    "daemon",
    "配置",
    "设置",
    "状态",
    "重启",
    "内核",
    "守护",
  ];

  const matchKeywords = (keywords: string[]) =>
    words.some((word) => keywords.some((kw) => word.includes(kw) || kw.includes(word)));

  // Check for specific matches first for better priority
  const hasSystemKeyword = matchKeywords(systemKeywords);
  const hasQueryKeyword = matchKeywords(queryKeywords);
  const hasActionKeyword = matchKeywords(actionKeywords);
  const hasGenerationKeyword = matchKeywords(generationKeywords);
  const hasAnalysisKeyword = matchKeywords(analysisKeywords);

  let category: IntentCategory = "unknown";
  let confidence = 0.5;
  let matchedKeywords: string[] = [];

  // Priority: system > action > generation > analysis > query
  // This ensures more specific intents are matched first
  if (
    hasSystemKeyword &&
    (text.includes("状态") ||
      text.includes("配置") ||
      text.includes("设置") ||
      text.includes("config") ||
      text.includes("status"))
  ) {
    category = "system";
    confidence = 0.9;
    matchedKeywords = systemKeywords.filter((kw) => text.includes(kw));
  } else if (hasActionKeyword) {
    category = "action";
    confidence = 0.85;
    matchedKeywords = actionKeywords.filter((kw) => text.includes(kw));
  } else if (hasGenerationKeyword) {
    category = "generation";
    confidence = 0.8;
    matchedKeywords = generationKeywords.filter((kw) => text.includes(kw));
  } else if (hasAnalysisKeyword) {
    category = "analysis";
    confidence = 0.75;
    matchedKeywords = analysisKeywords.filter((kw) => text.includes(kw));
  } else if (hasQueryKeyword) {
    category = "query";
    confidence = 0.8;
    matchedKeywords = queryKeywords.filter((kw) => text.includes(kw));
  } else if (hasSystemKeyword) {
    category = "system";
    confidence = 0.9;
    matchedKeywords = systemKeywords.filter((kw) => text.includes(kw));
  }

  return {
    category,
    confidence,
    keywords: matchedKeywords,
    originalMessage: message,
  };
}

/**
 * Skill Semantic Matching
 * Matches based on skill name, description, and keywords
 */
export function matchSkills(
  intent: IntentAnalysis,
  availableSkills: SkillEntry[],
  config: Partial<AutoTriggerConfig> = {},
): SkillMatchResult[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };
  const results: SkillMatchResult[] = [];

  for (const entry of availableSkills) {
    const { skill } = entry;
    let score = 0;
    const reasons: string[] = [];

    // 1. Intent Matching
    const categoryMatch = matchIntentToSkill(intent.category, skill.name, skill.description || "");
    if (categoryMatch > 0) {
      score += categoryMatch * 0.4;
      reasons.push(`Intent Match (${categoryMatch.toFixed(2)})`);
    }

    // 2. Keyword Matching
    const keywordScore = matchKeywordsStrings(intent.keywords, skill.name, skill.description || "");
    if (keywordScore > 0) {
      score += keywordScore * 0.4;
      reasons.push(`Keyword Match (${keywordScore.toFixed(2)})`);
    }

    // 3. Name Similarity
    const nameScore = calculateSimilarity(intent.originalMessage, skill.name);
    if (nameScore > 0.3) {
      score += nameScore * 0.2;
      reasons.push(`Name Similarity (${nameScore.toFixed(2)})`);
    }

    // If score exceeds threshold, add to results
    if (score >= cfg.minConfidence) {
      results.push({
        skill,
        score,
        reason: reasons.join(", "),
      });
    }
  }

  // Sort by score descending, return top N
  return results.sort((a, b) => b.score - a.score).slice(0, cfg.maxSkills);
}

/**
 * Intent & Skill Category Mapping
 */
function matchIntentToSkill(
  category: IntentCategory,
  skillName: string,
  skillDesc: string,
): number {
  const text = `${skillName} ${skillDesc}`.toLowerCase();

  switch (category) {
    case "query":
      if (text.match(/weather|news|search|oracle|query|fetch/)) return 0.9;
      if (text.includes("oracle") || text.includes("query")) return 0.7;
      return 0;

    case "action":
      if (text.match(/send|notify|email|slack|discord|message/)) return 0.9;
      if (text.match(/slack|discord/)) return 0.8;
      return 0;

    case "generation":
      if (text.match(/image|audio|tts|whisper|openai|generate/)) return 0.9;
      if (text.match(/whisper|openai/)) return 0.7;
      return 0;

    case "analysis":
      if (text.match(/log|session|model-usage|summarize|analyze/)) return 0.9;
      if (text.includes("summarize")) return 0.8;
      return 0;

    case "system":
      if (text.match(/config|status|github|setting|auth/)) return 0.9;
      return 0;

    default:
      return 0;
  }
}

/**
 * Keyword Matching Score
 * Supports Chinese-English cross-language matching
 */
function matchKeywordsStrings(keywords: string[], skillName: string, skillDesc: string): number {
  if (keywords.length === 0) return 0;

  const text = `${skillName} ${skillDesc}`.toLowerCase();
  let matched = 0;

  for (const kw of keywords) {
    // Direct match
    if (text.includes(kw.toLowerCase())) {
      matched++;
      continue;
    }

    // Try translated keywords (Chinese -> English)
    const translations = KEYWORD_TRANSLATIONS[kw];
    if (translations) {
      for (const translated of translations) {
        if (text.includes(translated.toLowerCase())) {
          matched++;
          break;
        }
      }
    }
  }

  return matched / keywords.length;
}

/**
 * Simple string similarity calculation (Simplified Levenshtein)
 */
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase();
  const s2 = str2.toLowerCase();

  // If fully contained, return high score
  if (s1.includes(s2) || s2.includes(s1)) {
    return 0.8;
  }

  // Calculate common substring length
  let maxLen = 0;
  for (let i = 0; i < s1.length; i++) {
    for (let j = 0; j < s2.length; j++) {
      let k = 0;
      while (i + k < s1.length && j + k < s2.length && s1[i + k] === s2[j + k]) {
        k++;
      }
      if (k > maxLen) {
        k = maxLen;
      }
    }
  }

  return maxLen / Math.max(s1.length, s2.length);
}

/**
 * Main Entry: Auto-trigger skills
 *
 * @param message User message
 * @param skills Available skill entries
 * @param config Trigger configuration
 * @returns Matched skill results
 */
export function autoTriggerSkills(
  message: string,
  skills: SkillEntry[],
  config?: Partial<AutoTriggerConfig>,
): SkillMatchResult[] {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  if (!cfg.enabled) {
    return [];
  }

  // 1. Intent Recognition
  const intent = analyzeIntent(message);

  // If intent confidence is too low, do not trigger
  if (intent.confidence < cfg.minConfidence) {
    return [];
  }

  // 2. Skill Matching
  const matches = matchSkills(intent, skills, cfg);

  return matches;
}

/**
 * Generate skill trigger prompt (for agent prompt)
 */
export function generateSkillTriggerPrompt(matches: SkillMatchResult[]): string {
  if (matches.length === 0) {
    return "";
  }

  const lines = [
    "### 🎯 Skill Auto-Trigger Suggestions",
    "",
    "The system detected the following skills may be relevant to your request:",
    "",
  ];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    lines.push(`${i + 1}. **${match.skill.name}** (Match: ${(match.score * 100).toFixed(0)}%)`);
    if (match.skill.description) {
      lines.push(`   Description: ${match.skill.description}`);
    }
    lines.push(`   Reason: ${match.reason}`);
    lines.push("");
  }

  lines.push("You can invoke these skills directly or ask me to handle them.");

  return lines.join("\n");
}
