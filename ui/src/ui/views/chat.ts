import { html, nothing } from "lit";
import { repeat } from "lit/directives/repeat.js";
import type { SessionsListResult } from "../types";
import type { ChatAttachment, ChatQueueItem } from "../ui-types";
import type { ChatItem, MessageGroup } from "../types/chat-types";
import { icons } from "../icons";
import {
  normalizeMessage,
  normalizeRoleForGrouping,
} from "../chat/message-normalizer";
import {
  renderMessageGroup,
  renderReadingIndicatorGroup,
  renderStreamingGroup,
} from "../chat/grouped-render";
import { renderMarkdownSidebar } from "./markdown-sidebar";
import "../components/resizable-divider";
import { t, getCurrentLanguage, type Language } from "../i18n";

export type CompactionIndicatorStatus = {
  active: boolean;
  startedAt: number | null;
  completedAt: number | null;
};

export type ChatProps = {
  sessionKey: string;
  onSessionKeyChange: (next: string) => void;
  thinkingLevel: string | null;
  showThinking: boolean;
  loading: boolean;
  sending: boolean;
  canAbort?: boolean;
  compactionStatus?: CompactionIndicatorStatus | null;
  messages: unknown[];
  toolMessages: unknown[];
  stream: string | null;
  streamStartedAt: number | null;
  assistantAvatarUrl?: string | null;
  draft: string;
  queue: ChatQueueItem[];
  connected: boolean;
  canSend: boolean;
  disabledReason: string | null;
  error: string | null;
  sessions: SessionsListResult | null;
  // Focus mode
  focusMode: boolean;
  // Sidebar state
  sidebarOpen?: boolean;
  sidebarContent?: string | null;
  sidebarError?: string | null;
  splitRatio?: number;
  assistantName: string;
  assistantAvatar: string | null;
  // Image attachments
  attachments?: ChatAttachment[];
  onAttachmentsChange?: (attachments: ChatAttachment[]) => void;
  // SENSEI: 语言参数
  language?: Language;
  // Event handlers
  onRefresh: () => void;
  onToggleFocusMode: () => void;
  onDraftChange: (next: string) => void;
  onSend: () => void;
  onAbort?: () => void;
  onQueueRemove: (id: string) => void;
  onNewSession: () => void;
  onOpenSidebar?: (content: string) => void;
  onCloseSidebar?: () => void;
  onSplitRatioChange?: (ratio: number) => void;
  onChatScroll?: (event: Event) => void;
};

const COMPACTION_TOAST_DURATION_MS = 5000;

function renderCompactionIndicator(status: CompactionIndicatorStatus | null | undefined, lang: Language) {
  if (!status) return nothing;
  const texts = t(lang);

  // Show "compacting..." while active
  if (status.active) {
    return html`
      <div class="callout info compaction-indicator compaction-indicator--active">
        ${icons.loader} ${texts.chat.compacting}
      </div>
    `;
  }

  // Show "compaction complete" briefly after completion
  if (status.completedAt) {
    const elapsed = Date.now() - status.completedAt;
    if (elapsed < COMPACTION_TOAST_DURATION_MS) {
      return html`
        <div class="callout success compaction-indicator compaction-indicator--complete">
          ${icons.check} ${texts.chat.compactComplete}
        </div>
      `;
    }
  }

  return nothing;
}

function generateAttachmentId(): string {
  return `att-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Supported file types for upload
const SUPPORTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/gif", "image/webp"];
const SUPPORTED_DOC_TYPES = ["application/pdf", "text/plain", "text/markdown"];
const MAX_FILE_SIZE_MB = 10;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

function isFileSupported(file: File): boolean {
  return [...SUPPORTED_IMAGE_TYPES, ...SUPPORTED_DOC_TYPES].includes(file.type);
}

function processFile(
  file: File,
  props: ChatProps,
  onComplete?: () => void
): void {
  if (!props.onAttachmentsChange) return;

  if (file.size > MAX_FILE_SIZE_BYTES) {
    console.warn(`File ${file.name} exceeds ${MAX_FILE_SIZE_MB}MB limit`);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const dataUrl = reader.result as string;
    const newAttachment: ChatAttachment = {
      id: generateAttachmentId(),
      dataUrl,
      mimeType: file.type,
      fileName: file.name,
    };
    const current = props.attachments ?? [];
    props.onAttachmentsChange?.([...current, newAttachment]);
    onComplete?.();
  };
  reader.onerror = () => {
    console.error(`Failed to read file: ${file.name}`);
  };
  reader.readAsDataURL(file);
}

function handlePaste(
  e: ClipboardEvent,
  props: ChatProps,
) {
  const items = e.clipboardData?.items;
  if (!items || !props.onAttachmentsChange) return;

  const fileItems: DataTransferItem[] = [];
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    if (item.kind === "file") {
      const file = item.getAsFile();
      if (file && isFileSupported(file)) {
        fileItems.push(item);
      }
    }
  }

  if (fileItems.length === 0) return;

  e.preventDefault();

  for (const item of fileItems) {
    const file = item.getAsFile();
    if (!file) continue;
    processFile(file, props);
  }
}

function handleDragOver(e: DragEvent): void {
  e.preventDefault();
  e.stopPropagation();
  if (e.dataTransfer) {
    e.dataTransfer.dropEffect = "copy";
  }
  const target = e.currentTarget as HTMLElement;
  target.classList.add("chat-compose--dragover");
}

function handleDragLeave(e: DragEvent): void {
  e.preventDefault();
  e.stopPropagation();
  const target = e.currentTarget as HTMLElement;
  target.classList.remove("chat-compose--dragover");
}

function handleDrop(e: DragEvent, props: ChatProps): void {
  e.preventDefault();
  e.stopPropagation();

  const target = e.currentTarget as HTMLElement;
  target.classList.remove("chat-compose--dragover");

  if (!props.onAttachmentsChange) return;

  const files = e.dataTransfer?.files;
  if (!files || files.length === 0) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (isFileSupported(file)) {
      processFile(file, props);
    }
  }
}

function handleFileInputChange(e: Event, props: ChatProps): void {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (!files || files.length === 0) return;

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (isFileSupported(file)) {
      processFile(file, props);
    }
  }

  // Clear the input so the same file can be selected again
  input.value = "";
}

function renderAttachmentPreview(props: ChatProps) {
  const attachments = props.attachments ?? [];
  if (attachments.length === 0) return nothing;

  return html`
    <div class="chat-attachments">
      ${attachments.map(
    (att) => html`
          <div class="chat-attachment">
            <img
              src=${att.dataUrl}
              alt="Attachment preview"
              class="chat-attachment__img"
            />
            <button
              class="chat-attachment__remove"
              type="button"
              aria-label="Remove attachment"
              @click=${() => {
        const next = (props.attachments ?? []).filter(
          (a) => a.id !== att.id,
        );
        props.onAttachmentsChange?.(next);
      }}
            >
              ${icons.x}
            </button>
          </div>
        `,
  )}
    </div>
  `;
}

export function renderChat(props: ChatProps) {
  const lang = props.language || getCurrentLanguage();
  const texts = t(lang);
  const canCompose = props.connected;
  const isBusy = props.sending || props.stream !== null;
  const canAbort = Boolean(props.canAbort && props.onAbort);
  const activeSession = props.sessions?.sessions?.find(
    (row) => row.key === props.sessionKey,
  );
  const reasoningLevel = activeSession?.reasoningLevel ?? "off";
  const showReasoning = props.showThinking && reasoningLevel !== "off";
  const assistantIdentity = {
    name: props.assistantName,
    avatar: props.assistantAvatar ?? props.assistantAvatarUrl ?? null,
  };

  const hasAttachments = (props.attachments?.length ?? 0) > 0;
  const composePlaceholder = props.connected
    ? hasAttachments
      ? texts.chat.addMessage
      : texts.chat.shiftEnter
    : texts.chat.disconnected;

  const splitRatio = props.splitRatio ?? 0.6;
  const sidebarOpen = Boolean(props.sidebarOpen && props.onCloseSidebar);
  const thread = html`
    <div
      class="chat-thread"
      role="log"
      aria-live="polite"
      @scroll=${props.onChatScroll}
    >
      ${props.loading ? html`<div class="muted">Loading chat…</div>` : nothing}
      ${repeat(buildChatItems(props), (item) => item.key, (item) => {
    if (item.kind === "reading-indicator") {
      return renderReadingIndicatorGroup(assistantIdentity);
    }

    if (item.kind === "stream") {
      return renderStreamingGroup(
        item.text,
        item.startedAt,
        props.onOpenSidebar,
        assistantIdentity,
      );
    }

    if (item.kind === "group") {
      return renderMessageGroup(item, {
        onOpenSidebar: props.onOpenSidebar,
        showReasoning,
        assistantName: props.assistantName,
        assistantAvatar: assistantIdentity.avatar,
      });
    }

    return nothing;
  })}
    </div>
  `;

  return html`
    <section class="card chat">
      ${props.disabledReason
      ? html`<div class="callout">${props.disabledReason}</div>`
      : nothing}

      ${props.error
      ? html`<div class="callout danger">${props.error}</div>`
      : nothing}

      ${renderCompactionIndicator(props.compactionStatus, lang)}

      ${props.focusMode
      ? html`
            <button
              class="chat-focus-exit"
              type="button"
              @click=${props.onToggleFocusMode}
              aria-label=${texts.chat.focusMode}
              title=${texts.chat.focusMode}
            >
              ${icons.x}
            </button>
          `
      : nothing}

      <div
        class="chat-split-container ${sidebarOpen ? "chat-split-container--open" : ""}"
      >
        <div
          class="chat-main"
          style="flex: ${sidebarOpen ? `0 0 ${splitRatio * 100}%` : "1 1 100%"}"
        >
          ${thread}
        </div>

        ${sidebarOpen
      ? html`
              <resizable-divider
                .splitRatio=${splitRatio}
                @resize=${(e: CustomEvent) =>
          props.onSplitRatioChange?.(e.detail.splitRatio)}
              ></resizable-divider>
              <div class="chat-sidebar">
                ${renderMarkdownSidebar({
            content: props.sidebarContent ?? null,
            error: props.sidebarError ?? null,
            onClose: props.onCloseSidebar!,
            onViewRawText: () => {
              if (!props.sidebarContent || !props.onOpenSidebar) return;
              props.onOpenSidebar(`\`\`\`\n${props.sidebarContent}\n\`\`\``);
            },
          })}
              </div>
            `
      : nothing}
      </div>

      ${props.queue.length
      ? html`
            <div class="chat-queue" role="status" aria-live="polite">
              <div class="chat-queue__title">Queued (${props.queue.length})</div>
              <div class="chat-queue__list">
                ${props.queue.map(
        (item) => html`
                    <div class="chat-queue__item">
                      <div class="chat-queue__text">
                        ${item.text ||
          (item.attachments?.length
            ? `Image (${item.attachments.length})`
            : "")}
                      </div>
                      <button
                        class="btn chat-queue__remove"
                        type="button"
                        aria-label="Remove queued message"
                        @click=${() => props.onQueueRemove(item.id)}
                      >
                        ${icons.x}
                      </button>
                    </div>
                  `,
      )}
              </div>
            </div>
          `
      : nothing}

      <div 
        class="chat-compose"
        @dragover=${handleDragOver}
        @dragleave=${handleDragLeave}
        @drop=${(e: DragEvent) => handleDrop(e, props)}
      >
        ${renderAttachmentPreview(props)}
        <div class="chat-compose__row">
          <label class="field chat-compose__field">
            <span>Message</span>
            <textarea
              .value=${props.draft}
              ?disabled=${!props.connected}
              @keydown=${(e: KeyboardEvent) => {
      if (e.key !== "Enter") return;
      if (e.isComposing || e.keyCode === 229) return;
      if (e.shiftKey) return; // Allow Shift+Enter for line breaks
      if (!props.connected) return;
      e.preventDefault();
      if (canCompose) props.onSend();
    }}
              @input=${(e: Event) =>
      props.onDraftChange((e.target as HTMLTextAreaElement).value)}
              @paste=${(e: ClipboardEvent) => handlePaste(e, props)}
              placeholder=${composePlaceholder}
            ></textarea>
          </label>
          <div class="chat-compose__actions">
            <!-- File upload button -->
            <label class="btn chat-compose__upload" title="Attach file (images, PDF, text)">
              ${icons.paperclip ?? icons.image ?? html`<span>📎</span>`}
              <input
                type="file"
                accept="image/png,image/jpeg,image/gif,image/webp,application/pdf,text/plain,text/markdown"
                multiple
                @change=${(e: Event) => handleFileInputChange(e, props)}
                style="display: none;"
              />
            </label>
            <button
              class="btn"
              ?disabled=${!props.connected || (!canAbort && props.sending)}
              @click=${canAbort ? props.onAbort : props.onNewSession}
            >
              ${canAbort ? texts.chat.abort : texts.chat.newSession}
            </button>
            <button
              class="btn primary"
              ?disabled=${!props.connected}
              @click=${props.onSend}
            >
              ${isBusy ? "Queue" : texts.chat.send}<kbd class="btn-kbd">↓</kbd>
            </button>
          </div>
        </div>
      </div>
    </section>
  `;
}

const CHAT_HISTORY_RENDER_LIMIT = 200;

function groupMessages(items: ChatItem[]): Array<ChatItem | MessageGroup> {
  const result: Array<ChatItem | MessageGroup> = [];
  let currentGroup: MessageGroup | null = null;

  for (const item of items) {
    if (item.kind !== "message") {
      if (currentGroup) {
        result.push(currentGroup);
        currentGroup = null;
      }
      result.push(item);
      continue;
    }

    const normalized = normalizeMessage(item.message);
    const role = normalizeRoleForGrouping(normalized.role);
    const timestamp = normalized.timestamp || Date.now();

    if (!currentGroup || currentGroup.role !== role) {
      if (currentGroup) result.push(currentGroup);
      currentGroup = {
        kind: "group",
        key: `group:${role}:${item.key}`,
        role,
        messages: [{ message: item.message, key: item.key }],
        timestamp,
        isStreaming: false,
      };
    } else {
      currentGroup.messages.push({ message: item.message, key: item.key });
    }
  }

  if (currentGroup) result.push(currentGroup);
  return result;
}

function buildChatItems(props: ChatProps): Array<ChatItem | MessageGroup> {
  const items: ChatItem[] = [];
  const history = Array.isArray(props.messages) ? props.messages : [];
  const tools = Array.isArray(props.toolMessages) ? props.toolMessages : [];
  const historyStart = Math.max(0, history.length - CHAT_HISTORY_RENDER_LIMIT);
  if (historyStart > 0) {
    items.push({
      kind: "message",
      key: "chat:history:notice",
      message: {
        role: "system",
        content: `Showing last ${CHAT_HISTORY_RENDER_LIMIT} messages (${historyStart} hidden).`,
        timestamp: Date.now(),
      },
    });
  }
  for (let i = historyStart; i < history.length; i++) {
    const msg = history[i];
    const normalized = normalizeMessage(msg);

    if (!props.showThinking && normalized.role.toLowerCase() === "toolresult") {
      continue;
    }

    items.push({
      kind: "message",
      key: messageKey(msg, i),
      message: msg,
    });
  }
  if (props.showThinking) {
    for (let i = 0; i < tools.length; i++) {
      items.push({
        kind: "message",
        key: messageKey(tools[i], i + history.length),
        message: tools[i],
      });
    }
  }

  if (props.stream !== null) {
    const key = `stream:${props.sessionKey}:${props.streamStartedAt ?? "live"}`;
    if (props.stream.trim().length > 0) {
      items.push({
        kind: "stream",
        key,
        text: props.stream,
        startedAt: props.streamStartedAt ?? Date.now(),
      });
    } else {
      items.push({ kind: "reading-indicator", key });
    }
  }

  return groupMessages(items);
}

function messageKey(message: unknown, index: number): string {
  const m = message as Record<string, unknown>;
  const toolCallId = typeof m.toolCallId === "string" ? m.toolCallId : "";
  if (toolCallId) return `tool:${toolCallId}`;
  const id = typeof m.id === "string" ? m.id : "";
  if (id) return `msg:${id}`;
  const messageId = typeof m.messageId === "string" ? m.messageId : "";
  if (messageId) return `msg:${messageId}`;
  const timestamp = typeof m.timestamp === "number" ? m.timestamp : null;
  const role = typeof m.role === "string" ? m.role : "unknown";
  if (timestamp != null) return `msg:${role}:${timestamp}:${index}`;
  return `msg:${role}:${index}`;
}
