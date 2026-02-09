/**
 * Feishu/Lark Message Context Builder
 *
 * @module feishu/message-context
 */

import type { FeishuWebhookEvent, FeishuMessageContext } from "./types.js";

/**
 * Build a normalized message context from a Feishu webhook event
 */
export function buildFeishuMessageContext(
  event: FeishuWebhookEvent,
  _accountId?: string,
): FeishuMessageContext | null {
  const msg = event.event?.message;
  const sender = event.event?.sender;

  if (!msg || !sender) {
    return null;
  }

  // Parse message content
  let text = "";
  try {
    if (msg.message_type === "text") {
      const content = JSON.parse(msg.content) as { text?: string };
      text = content.text ?? "";
    } else {
      // For non-text messages, use empty string or indicate type
      text = `[${msg.message_type}]`;
    }
  } catch {
    text = msg.content;
  }

  // Extract mentions
  const mentions = msg.mentions?.map((m) => m.name) ?? [];

  // Remove @mentions from text for cleaner processing
  let cleanText = text;
  for (const mention of msg.mentions ?? []) {
    cleanText = cleanText.replace(mention.key, "").trim();
  }

  const senderId = sender.sender_id?.open_id ?? sender.sender_id?.user_id ?? "unknown";

  return {
    From: senderId,
    FromName: undefined, // Would need additional API call to get user name
    Channel: "feishu",
    ChannelMessageId: msg.message_id,
    ChatId: msg.chat_id,
    ChatType: msg.chat_type === "p2p" ? "p2p" : "group",
    Text: cleanText || text,
    Mentions: mentions.length > 0 ? mentions : undefined,
    ReplyToken: msg.message_id, // Use message_id as reply reference
  };
}
