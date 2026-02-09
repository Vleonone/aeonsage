import { afterEach, describe, expect, it, vi } from "vitest";

import { onSessionTranscriptUpdate, emitSessionTranscriptUpdate } from "./transcript-events.js";

describe("transcript-events", () => {
  // Unsubscribe all listeners after each test to avoid cross-test pollution
  const unsubs: (() => void)[] = [];
  afterEach(() => {
    for (const unsub of unsubs) unsub();
    unsubs.length = 0;
  });

  describe("onSessionTranscriptUpdate", () => {
    it("registers a listener and returns unsubscribe function", () => {
      const listener = vi.fn();
      const unsub = onSessionTranscriptUpdate(listener);
      unsubs.push(unsub);
      expect(typeof unsub).toBe("function");
    });

    it("listener receives emitted updates", () => {
      const listener = vi.fn();
      unsubs.push(onSessionTranscriptUpdate(listener));

      emitSessionTranscriptUpdate("/path/to/session.json");
      expect(listener).toHaveBeenCalledWith({ sessionFile: "/path/to/session.json" });
    });

    it("unsubscribe stops listener from receiving updates", () => {
      const listener = vi.fn();
      const unsub = onSessionTranscriptUpdate(listener);
      unsub();

      emitSessionTranscriptUpdate("/path/to/session.json");
      expect(listener).not.toHaveBeenCalled();
    });
  });

  describe("emitSessionTranscriptUpdate", () => {
    it("calls all registered listeners", () => {
      const a = vi.fn();
      const b = vi.fn();
      unsubs.push(onSessionTranscriptUpdate(a));
      unsubs.push(onSessionTranscriptUpdate(b));

      emitSessionTranscriptUpdate("test.json");
      expect(a).toHaveBeenCalledOnce();
      expect(b).toHaveBeenCalledOnce();
    });

    it("trims sessionFile before dispatching", () => {
      const listener = vi.fn();
      unsubs.push(onSessionTranscriptUpdate(listener));

      emitSessionTranscriptUpdate("  trimmed.json  ");
      expect(listener).toHaveBeenCalledWith({ sessionFile: "trimmed.json" });
    });

    it("does not emit for empty sessionFile", () => {
      const listener = vi.fn();
      unsubs.push(onSessionTranscriptUpdate(listener));

      emitSessionTranscriptUpdate("");
      emitSessionTranscriptUpdate("   ");
      expect(listener).not.toHaveBeenCalled();
    });
  });
});
