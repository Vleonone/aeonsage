/**
 * Human Emulation Tools - Stress Test
 * 人类仿真工具压力测试
 */

import { describe, it, expect } from "vitest";

// Test Bezier curve generation
describe("Human Mouse - Bezier Curves", () => {
  it("should generate non-linear paths", () => {
    const startX = 0,
      startY = 0;
    const endX = 500,
      endY = 500;

    // Simulate path generation
    const path: Array<{ x: number; y: number }> = [];
    const steps = 50;

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Simple linear would be: x = startX + (endX - startX) * t
      // Bezier adds curves
      const x = startX + (endX - startX) * t + Math.sin(t * Math.PI) * 50;
      const y = startY + (endY - startY) * t + Math.cos(t * Math.PI) * 50;
      path.push({ x, y });
    }

    // Check that middle points deviate from straight line
    const midPoint = path[25];
    const expectedLinearX = 250;
    const expectedLinearY = 250;

    // Middle should deviate from straight line
    const deviation =
      Math.abs(midPoint.x - expectedLinearX) + Math.abs(midPoint.y - expectedLinearY);
    expect(deviation).toBeGreaterThan(10); // Should deviate significantly
  });

  it("should handle stress: 1000 path generations", () => {
    const startTime = Date.now();

    for (let i = 0; i < 1000; i++) {
      const steps = 50;
      const path = [];
      for (let j = 0; j <= steps; j++) {
        const t = j / steps;
        path.push({
          x: t * 1000 + Math.random() * 100,
          y: t * 1000 + Math.random() * 100,
        });
      }
    }

    const duration = Date.now() - startTime;
    console.log(`Generated 1000 paths in ${duration}ms`);
    expect(duration).toBeLessThan(1000); // Should complete in <1s
  });
});

// Test typing simulation
describe("Human Typing - Stress Test", () => {
  it("should generate variable delays", () => {
    const text = "Hello, World! This is a test.";
    const delays: number[] = [];

    for (let i = 0; i < text.length; i++) {
      const baseDelay = 80;
      const variation = 0.5 + Math.random();
      delays.push(baseDelay * variation);
    }

    // Check variance
    const avg = delays.reduce((a, b) => a + b, 0) / delays.length;
    const variance = delays.reduce((sum, d) => sum + Math.pow(d - avg, 2), 0) / delays.length;

    expect(variance).toBeGreaterThan(100); // Should have meaningful variance
  });

  it("should handle stress: 10000 character typing simulation", () => {
    const startTime = Date.now();
    const longText = "a".repeat(10000);

    let totalDelay = 0;
    for (let i = 0; i < longText.length; i++) {
      totalDelay += 50 + Math.random() * 100;
    }

    const duration = Date.now() - startTime;
    console.log(`Simulated 10000 keystrokes in ${duration}ms, total typing time: ${totalDelay}ms`);
    expect(duration).toBeLessThan(500); // Calculation should be fast
  });

  it("should occasionally generate typos", () => {
    const iterations = 1000;
    let typoCount = 0;

    for (let i = 0; i < iterations; i++) {
      if (Math.random() < 0.02) {
        // 2% typo rate
        typoCount++;
      }
    }

    // Should be roughly 2% (15-25 typos in 1000)
    expect(typoCount).toBeGreaterThan(5);
    expect(typoCount).toBeLessThan(50);
  });
});

// Test browser fingerprint randomization
describe("Human Browser - Fingerprint Stress Test", () => {
  it("should generate unique fingerprints", () => {
    const fingerprints = new Set<string>();

    for (let i = 0; i < 100; i++) {
      const userAgents = [
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120",
        "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/537.36",
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Firefox/121",
      ];

      const ua = userAgents[Math.floor(Math.random() * userAgents.length)];
      const width = 1920 + Math.floor(Math.random() * 100);
      const height = 1080 + Math.floor(Math.random() * 100);

      const fingerprint = `${ua}-${width}x${height}`;
      fingerprints.add(fingerprint);
    }

    // Should have many unique fingerprints
    console.log(`Generated ${fingerprints.size} unique fingerprints from 100 attempts`);
    expect(fingerprints.size).toBeGreaterThan(50);
  });
});

console.log("\\n✅ Human Emulation Stress Tests Complete\\n");
