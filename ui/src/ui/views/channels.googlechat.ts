import { html, nothing } from "lit";

import { formatAgo } from "../format.js";
import type { GoogleChatStatus } from "../types.js";
import { renderChannelConfigSection } from "./channels.config.js";
import type { ChannelsProps } from "./channels.types.js";
import { t, getCurrentLanguage } from "../i18n.js";

export function renderGoogleChatCard(params: {
  props: ChannelsProps;
  googleChat?: GoogleChatStatus | null;
  accountCountLabel: unknown;
}) {
  const { props, googleChat, accountCountLabel } = params;
  const lang = getCurrentLanguage();
  const texts = t(lang);

  return html`
    <div class="card">
      <div class="card-title">Google Chat</div>
      <div class="card-sub">Chat API webhook status and channel configuration.</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${texts.channels.common.configured}</span>
          <span>${googleChat ? (googleChat.configured ? texts.common.success : texts.common.error) : "n/a"}</span>
        </div>
        <div>
          <span class="label">${texts.channels.common.running}</span>
          <span>${googleChat ? (googleChat.running ? texts.common.success : texts.common.error) : "n/a"}</span>
        </div>
        <div>
          <span class="label">Credential</span>
          <span>${googleChat?.credentialSource ?? "n/a"}</span>
        </div>
        <div>
          <span class="label">Audience</span>
          <span>
            ${googleChat?.audienceType
      ? `${googleChat.audienceType}${googleChat.audience ? ` · ${googleChat.audience}` : ""}`
      : "n/a"}
          </span>
        </div>
        <div>
          <span class="label">${texts.channels.common.lastStart}</span>
          <span>${googleChat?.lastStartAt ? formatAgo(googleChat.lastStartAt) : "n/a"}</span>
        </div>
        <div>
          <span class="label">${texts.channels.common.lastProbe}</span>
          <span>${googleChat?.lastProbeAt ? formatAgo(googleChat.lastProbeAt) : "n/a"}</span>
        </div>
      </div>

      ${googleChat?.lastError
      ? html`<div class="callout danger" style="margin-top: 12px;">
            ${googleChat.lastError}
          </div>`
      : nothing}

      ${googleChat?.probe
      ? html`<div class="callout" style="margin-top: 12px;">
            Probe ${googleChat.probe.ok ? "ok" : "failed"} ·
            ${googleChat.probe.status ?? ""} ${googleChat.probe.error ?? ""}
          </div>`
      : nothing}

      ${renderChannelConfigSection({ channelId: "googlechat", props })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${() => props.onRefresh(true)}>
          ${texts.channels.telegram.probe}
        </button>
      </div>
    </div>
  `;
}
