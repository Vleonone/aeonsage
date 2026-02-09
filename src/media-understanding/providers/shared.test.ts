import { describe, expect, it, vi } from "vitest";

import { normalizeBaseUrl, fetchWithTimeout, readErrorResponse } from "./shared.js";

describe("media-understanding/providers/shared", () => {
  describe("normalizeBaseUrl", () => {
    it("returns fallback when baseUrl is undefined", () => {
      expect(normalizeBaseUrl(undefined, "https://api.example.com")).toBe(
        "https://api.example.com",
      );
    });

    it("returns fallback when baseUrl is empty", () => {
      expect(normalizeBaseUrl("", "https://fallback.com")).toBe("https://fallback.com");
      expect(normalizeBaseUrl("  ", "https://fallback.com")).toBe("https://fallback.com");
    });

    it("removes trailing slashes", () => {
      expect(normalizeBaseUrl("https://api.example.com/", "")).toBe("https://api.example.com");
      expect(normalizeBaseUrl("https://api.example.com///", "")).toBe("https://api.example.com");
    });

    it("preserves URLs without trailing slash", () => {
      expect(normalizeBaseUrl("https://api.example.com", "")).toBe("https://api.example.com");
    });

    it("trims whitespace from baseUrl", () => {
      expect(normalizeBaseUrl("  https://api.example.com  ", "")).toBe("https://api.example.com");
    });

    it("removes trailing slashes from fallback too", () => {
      expect(normalizeBaseUrl(undefined, "https://fallback.com/")).toBe("https://fallback.com");
    });
  });

  describe("fetchWithTimeout", () => {
    it("returns response when fetch completes within timeout", async () => {
      const mockResponse = new Response("ok", { status: 200 });
      const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(mockResponse);

      const result = await fetchWithTimeout("https://api.test/endpoint", {}, 5000, mockFetch);
      expect(result.status).toBe(200);
      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.test/endpoint",
        expect.objectContaining({ signal: expect.any(AbortSignal) }),
      );
    });

    it("aborts when timeout expires", async () => {
      const mockFetch = vi.fn<typeof fetch>().mockImplementation(
        (_url, init) =>
          new Promise((_resolve, reject) => {
            // Simulate waiting for abort
            (init as RequestInit).signal?.addEventListener("abort", () => {
              reject(new DOMException("aborted", "AbortError"));
            });
          }),
      );

      await expect(
        fetchWithTimeout("https://slow.api/endpoint", {}, 1, mockFetch),
      ).rejects.toThrow();
    });

    it("clears timeout after successful fetch", async () => {
      const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");
      const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response("ok"));

      await fetchWithTimeout("https://api.test/fast", {}, 5000, mockFetch);
      expect(clearTimeoutSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
    });

    it("passes request init through to fetch", async () => {
      const mockFetch = vi.fn<typeof fetch>().mockResolvedValue(new Response("ok"));
      const headers = { Authorization: "Bearer token" };

      await fetchWithTimeout(
        "https://api.test",
        { method: "POST", headers, body: "data" },
        5000,
        mockFetch,
      );

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.test",
        expect.objectContaining({
          method: "POST",
          headers,
          body: "data",
        }),
      );
    });
  });

  describe("readErrorResponse", () => {
    it("reads error text from response", async () => {
      const res = new Response("Something went wrong", { status: 500 });
      const text = await readErrorResponse(res);
      expect(text).toBe("Something went wrong");
    });

    it("collapses whitespace", async () => {
      const res = new Response("error\n  on \t multiple   lines", { status: 400 });
      const text = await readErrorResponse(res);
      expect(text).toBe("error on multiple lines");
    });

    it("returns undefined for empty response body", async () => {
      const res = new Response("", { status: 500 });
      const text = await readErrorResponse(res);
      expect(text).toBeUndefined();
    });

    it("truncates long error messages to 300 chars", async () => {
      const longText = "x".repeat(400);
      const res = new Response(longText, { status: 500 });
      const text = await readErrorResponse(res);
      expect(text).toBeDefined();
      expect(text!.length).toBeLessThanOrEqual(301); // 300 + ellipsis
    });

    it("returns undefined on read failure", async () => {
      const res = {
        text: () => Promise.reject(new Error("read fail")),
      } as unknown as Response;
      const text = await readErrorResponse(res);
      expect(text).toBeUndefined();
    });
  });
});
