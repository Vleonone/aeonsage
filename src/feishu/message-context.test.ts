import { describe, expect, it } from "vitest";

import { buildFeishuMessageContext } from "./message-context.js";
import type { FeishuWebhookEvent } from "./types.js";

function makeEvent(
  overrides: Partial<{
    message_type: string;
    content: string;
    chat_type: string;
    chat_id: string;
    message_id: string;
    open_id: string;
    user_id: string;
    mentions: Array<{ key: string; name: string }>;
  }> = {},
): FeishuWebhookEvent {
  return {
    header: {
      event_id: "evt_1",
      event_type: "im.message.receive_v1",
      create_time: "1700000000",
      token: "tok",
      app_id: "app1",
      tenant_key: "t1",
    },
    event: {
      message: {
        message_id: overrides.message_id ?? "msg_1",
        chat_id: overrides.chat_id ?? "chat_1",
        chat_type: overrides.chat_type ?? "p2p",
        message_type: overrides.message_type ?? "text",
        content: overrides.content ?? JSON.stringify({ text: "hello" }),
        mentions: overrides.mentions,
      },
      sender: {
        sender_id: {
          open_id: overrides.open_id ?? "ou_abc",
          user_id: overrides.user_id,
        },
      },
    },
  } as FeishuWebhookEvent;
}

describe("feishu/message-context", () => {
  describe("buildFeishuMessageContext", () => {
    it("builds context for a simple text message", () => {
      const ctx = buildFeishuMessageContext(makeEvent());
      expect(ctx).not.toBeNull();
      expect(ctx!.Channel).toBe("feishu");
      expect(ctx!.Text).toBe("hello");
      expect(ctx!.From).toBe("ou_abc");
      expect(ctx!.ChatId).toBe("chat_1");
      expect(ctx!.ChatType).toBe("p2p");
      expect(ctx!.ReplyToken).toBe("msg_1");
    });

    it("maps group chat_type to 'group'", () => {
      const ctx = buildFeishuMessageContext(makeEvent({ chat_type: "group" }));
      expect(ctx!.ChatType).toBe("group");
    });

    it("handles non-text message types", () => {
      const ctx = buildFeishuMessageContext(
        makeEvent({
          message_type: "image",
          content: "{}",
        }),
      );
      expect(ctx!.Text).toBe("[image]");
    });

    it("extracts mention names", () => {
      const ctx = buildFeishuMessageContext(
        makeEvent({
          content: JSON.stringify({ text: "@_user_1 hi there" }),
          mentions: [{ key: "@_user_1", name: "Alice" }],
        }),
      );
      expect(ctx!.Mentions).toEqual(["Alice"]);
      expect(ctx!.Text).toBe("hi there");
    });

    it("falls back to user_id when open_id is absent", () => {
      const event = makeEvent({ user_id: "uid_123" });
      // Directly remove open_id to simulate it not being present
      delete (event.event!.sender!.sender_id as Record<string, unknown>).open_id;
      const ctx = buildFeishuMessageContext(event);
      expect(ctx!.From).toBe("uid_123");
    });

    it("defaults to 'unknown' when no sender IDs available", () => {
      const event = makeEvent();
      event.event!.sender!.sender_id = {} as Record<string, string>;
      const ctx = buildFeishuMessageContext(event);
      expect(ctx!.From).toBe("unknown");
    });

    it("returns null when event.message is missing", () => {
      const event = makeEvent();
      delete (event.event as Record<string, unknown>).message;
      expect(buildFeishuMessageContext(event)).toBeNull();
    });

    it("returns null when event.sender is missing", () => {
      const event = makeEvent();
      delete (event.event as Record<string, unknown>).sender;
      expect(buildFeishuMessageContext(event)).toBeNull();
    });

    it("handles malformed JSON content gracefully", () => {
      const ctx = buildFeishuMessageContext(
        makeEvent({
          content: "not-json",
        }),
      );
      expect(ctx).not.toBeNull();
      expect(ctx!.Text).toBe("not-json");
    });

    it("returns undefined Mentions when no mentions exist", () => {
      const ctx = buildFeishuMessageContext(makeEvent());
      expect(ctx!.Mentions).toBeUndefined();
    });
  });
});
