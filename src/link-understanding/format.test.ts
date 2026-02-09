import { describe, expect, it } from "vitest";

import { formatLinkUnderstandingBody } from "./format.js";

describe("formatLinkUnderstandingBody", () => {
  it("returns original body when outputs are empty", () => {
    expect(formatLinkUnderstandingBody({ body: "hello", outputs: [] })).toBe("hello");
  });

  it("returns empty string when body is undefined and outputs are empty", () => {
    expect(formatLinkUnderstandingBody({ outputs: [] })).toBe("");
  });

  it("returns joined outputs when body is empty", () => {
    expect(formatLinkUnderstandingBody({ body: "", outputs: ["a", "b"] })).toBe("a\nb");
  });

  it("returns joined outputs when body is undefined", () => {
    expect(formatLinkUnderstandingBody({ outputs: ["x", "y"] })).toBe("x\ny");
  });

  it("appends outputs to body with double newline", () => {
    expect(formatLinkUnderstandingBody({ body: "intro", outputs: ["detail"] })).toBe(
      "intro\n\ndetail",
    );
  });

  it("filters empty/whitespace-only outputs", () => {
    expect(formatLinkUnderstandingBody({ body: "hi", outputs: ["", "  ", "valid"] })).toBe(
      "hi\n\nvalid",
    );
  });

  it("trims output entries", () => {
    expect(formatLinkUnderstandingBody({ body: "hi", outputs: ["  trimmed  "] })).toBe(
      "hi\n\ntrimmed",
    );
  });

  it("trims body before appending", () => {
    expect(formatLinkUnderstandingBody({ body: "  body  ", outputs: ["out"] })).toBe("body\n\nout");
  });

  it("treats whitespace-only body as empty", () => {
    expect(formatLinkUnderstandingBody({ body: "   ", outputs: ["out"] })).toBe("out");
  });

  it("handles multiple outputs correctly", () => {
    expect(formatLinkUnderstandingBody({ body: "base", outputs: ["a", "b", "c"] })).toBe(
      "base\n\na\nb\nc",
    );
  });
});
