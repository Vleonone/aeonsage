import { html, nothing } from "lit";

import { formatAgo } from "../format";
import type { WhatsAppStatus } from "../types";
import type { ChannelsProps } from "./channels.types";
import { renderChannelConfigSection } from "./channels.config.js";
import { formatDuration } from "./channels.shared.js";
import { t, getCurrentLanguage } from "../i18n.js";
export function renderWhatsAppCard(params: {
  props: ChannelsProps;
  whatsapp?: WhatsAppStatus;
  accountCountLabel: unknown;
}) {
  const { props, whatsapp, accountCountLabel } = params;
  const lang = getCurrentLanguage();
  const texts = t(lang);
  return html`
    <div class="card">
      <div class="card-title">${texts.channels.whatsapp.title}</div>
      <div class="card-sub">${texts.channels.whatsapp.subtitle}</div>
      ${accountCountLabel}

      <div class="status-list" style="margin-top: 16px;">
        <div>
          <span class="label">${texts.channels.common.configured}</span>
          <span>${whatsapp?.configured ? texts.common.success : texts.common.error}</span>
        </div>
        <div>
          <span class="label">${texts.channels.common.linked}</span>
          <span>${whatsapp?.linked ? texts.common.success : texts.common.error}</span>
        </div>
        <div>
          <span class="label">${texts.channels.common.running}</span>
          <span>${whatsapp?.running ? texts.common.success : texts.common.error}</span>
        </div>
        <div>
          <span class="label">${texts.channels.common.connected}</span>
          <span>${whatsapp?.connected ? texts.common.success : texts.common.error}</span>
        </div>
        <div>
          <span class="label">${texts.channels.common.lastConnect}</span>
          <span>
            ${whatsapp?.lastConnectedAt
      ? formatAgo(whatsapp.lastConnectedAt)
      : "n/a"}
          </span>
        </div>
        <div>
          <span class="label">${texts.channels.common.lastMessage}</span>
          <span>
            ${whatsapp?.lastMessageAt ? formatAgo(whatsapp.lastMessageAt) : "n/a"}
          </span>
        </div>
        <div>
          <span class="label">${texts.channels.common.authAge}</span>
          <span>
            ${whatsapp?.authAgeMs != null
      ? formatDuration(whatsapp.authAgeMs)
      : "n/a"}
          </span>
        </div>
      </div>

      ${whatsapp?.lastError
      ? html`<div class="callout danger" style="margin-top: 12px;">
            ${whatsapp.lastError}
          </div>`
      : nothing}

      ${props.whatsappMessage
      ? html`<div class="callout" style="margin-top: 12px;">
            ${props.whatsappMessage}
          </div>`
      : nothing}

      ${props.whatsappQrDataUrl
      ? html`<div class="qr-wrap">
            <img src=${props.whatsappQrDataUrl} alt="WhatsApp QR" />
          </div>`
      : nothing}

      <div class="row" style="margin-top: 14px; flex-wrap: wrap;">
        <button
          class="btn primary"
          ?disabled=${props.whatsappBusy}
          @click=${() => props.onWhatsAppStart(false)}
        >
          ${props.whatsappBusy ? texts.status.busy : texts.channels.whatsapp.showQr}
        </button>
        <button
          class="btn"
          ?disabled=${props.whatsappBusy}
          @click=${() => props.onWhatsAppStart(true)}
        >
          ${texts.channels.whatsapp.relink}
        </button>
        <button
          class="btn"
          ?disabled=${props.whatsappBusy}
          @click=${() => props.onWhatsAppWait()}
        >
          ${texts.channels.whatsapp.waitScan}
        </button>
        <button
          class="btn danger"
          ?disabled=${props.whatsappBusy}
          @click=${() => props.onWhatsAppLogout()}
        >
          ${texts.channels.whatsapp.logout}
        </button>
        <button class="btn" @click=${() => props.onRefresh(true)}>
          ${texts.common.refresh}
        </button>
      </div>

      ${renderChannelConfigSection({ channelId: "whatsapp", props })}
    </div>
  `;
}
