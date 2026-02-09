/**
 * Skill Auto-Trigger Engine - Unit Tests
 */

import { describe, expect, it } from "vitest";
import {
  analyzeIntent,
  matchSkills,
  autoTriggerSkills,
  generateSkillTriggerPrompt,
} from "./auto-trigger.js";
import type { SkillEntry } from "./types.js";

describe("analyzeIntent", () => {
  it("should recognize query intent", () => {
    const result = analyzeIntent("今天天气怎么样?");
    expect(result.category).toBe("query");
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.keywords).toContain("天气");
  });

  it("should recognize action intent", () => {
    const result = analyzeIntent("发送一封邮件给张三");
    expect(result.category).toBe("action");
    expect(result.confidence).toBeGreaterThan(0.7);
    expect(result.keywords).toContain("发送");
  });

  it("should recognize generation intent", () => {
    const result = analyzeIntent("生成一张图片");
    expect(result.category).toBe("generation");
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it("should recognize analysis intent", () => {
    const result = analyzeIntent("分析最近的日志");
    expect(result.category).toBe("analysis");
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it("should recognize system intent", () => {
    const result = analyzeIntent("查看当前状态");
    expect(result.category).toBe("system");
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it("should return low confidence for unknown intent", () => {
    const result = analyzeIntent("blablabla xyz");
    expect(result.category).toBe("unknown");
    expect(result.confidence).toBeLessThanOrEqual(0.5);
  });
});

describe("matchSkills", () => {
  const mockSkillEntries: SkillEntry[] = [
    {
      skill: {
        name: "weather",
        description: "Get current weather information",
        filePath: "/path/to/weather",
        baseDir: "/path",
        source: "test",
      },
      frontmatter: {},
    },
    {
      skill: {
        name: "send-email",
        description: "Send emails via SMTP",
        filePath: "/path/to/email",
        baseDir: "/path",
        source: "test",
      },
      frontmatter: {},
    },
    {
      skill: {
        name: "openai-image-gen",
        description: "Generate images using OpenAI DALL-E",
        filePath: "/path/to/image",
        baseDir: "/path",
        source: "test",
      },
      frontmatter: {},
    },
  ];

  it("should match query skills", () => {
    const intent = analyzeIntent("查询天气");
    const matches = matchSkills(intent, mockSkillEntries);

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]?.skill.name).toBe("weather");
  });

  it("should match action skills", () => {
    const intent = analyzeIntent("发送邮件");
    const matches = matchSkills(intent, mockSkillEntries);

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]?.skill.name).toBe("send-email");
  });

  it("should match generation skills", () => {
    const intent = analyzeIntent("生成图片");
    const matches = matchSkills(intent, mockSkillEntries);

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]?.skill.name).toBe("openai-image-gen");
  });

  it("should respect minimum confidence threshold", () => {
    const intent = analyzeIntent("blablabla");
    const matches = matchSkills(intent, mockSkillEntries, { minConfidence: 0.8 });

    expect(matches.length).toBe(0);
  });

  it("should limit the number of returned results", () => {
    const intent = analyzeIntent("查询天气并发送邮件然后生成图片");
    const matches = matchSkills(intent, mockSkillEntries, { maxSkills: 2 });

    expect(matches.length).toBeLessThanOrEqual(2);
  });
});

describe("autoTriggerSkills", () => {
  const mockSkillEntries: SkillEntry[] = [
    {
      skill: {
        name: "weather",
        description: "Get weather information",
        filePath: "/path/to/weather",
        baseDir: "/path",
        source: "test",
      },
      frontmatter: {},
    },
  ];

  it("should return matched skills", () => {
    const matches = autoTriggerSkills("今天天气怎么样", mockSkillEntries);

    expect(matches.length).toBeGreaterThan(0);
    expect(matches[0]?.skill.name).toBe("weather");
  });

  it("should return empty array when disabled", () => {
    const matches = autoTriggerSkills("今天天气怎么样", mockSkillEntries, {
      enabled: false,
    });

    expect(matches).toEqual([]);
  });

  it("should return empty array when confidence is insufficient", () => {
    const matches = autoTriggerSkills("blablabla xyz", mockSkillEntries, {
      minConfidence: 0.9,
    });

    expect(matches.length).toBe(0);
  });
});

describe("generateSkillTriggerPrompt", () => {
  it("should generate formatted prompt", () => {
    const matches = [
      {
        skill: {
          name: "weather",
          description: "Get weather info",
          filePath: "/path/to/weather",
          baseDir: "/path",
          source: "test",
        },
        score: 0.85,
        reason: "Intent Match (0.90)",
      },
    ];

    const prompt = generateSkillTriggerPrompt(matches);

    expect(prompt).toContain("🎯 Skill Auto-Trigger Suggestions");
    expect(prompt).toContain("weather");
    expect(prompt).toContain("85%");
    expect(prompt).toContain("Get weather info");
  });

  it("should return empty string when no matches", () => {
    const prompt = generateSkillTriggerPrompt([]);
    expect(prompt).toBe("");
  });
});
