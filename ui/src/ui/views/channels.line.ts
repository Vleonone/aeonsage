import { html, nothing } from "lit";

import { formatAgo } from "../format";
import type { ChannelAccountSnapshot, LineStatus } from "../types";
import type { ChannelsProps } from "./channels.types";
import { renderChannelConfigSection } from "./channels.config";
import { t, getCurrentLanguage } from "../i18n.js";

export function renderLineCard(params: {
    props: ChannelsProps;
    line?: LineStatus | null;
    lineAccounts: ChannelAccountSnapshot[];
    accountCountLabel: unknown;
}) {
    const { props, line, lineAccounts, accountCountLabel } = params;
    const hasMultipleAccounts = lineAccounts.length > 1;
    const lang = getCurrentLanguage();
    const texts = t(lang);

    const renderAccountCard = (account: ChannelAccountSnapshot) => {
        const label = account.name || account.accountId;
        return html`
      <div class="account-card">
        <div class="account-card-header">
          <div class="account-card-title">${label}</div>
          <div class="account-card-id">${account.accountId}</div>
        </div>
        <div class="status-list account-card-status">
          <div>
            <span class="label">${texts.channels.common.running}</span>
            <span>${account.running ? texts.common.success : texts.common.error}</span>
          </div>
          <div>
            <span class="label">${texts.channels.common.configured}</span>
            <span>${account.configured ? texts.common.success : texts.common.error}</span>
          </div>
          <div>
            <span class="label">${texts.channels.common.lastInbound}</span>
            <span>${account.lastInboundAt ? formatAgo(account.lastInboundAt) : "n/a"}</span>
          </div>
          ${account.webhookPath
                ? html`
                <div>
                  <span class="label">Webhook</span>
                  <span class="mono">${account.webhookPath}</span>
                </div>
              `
                : nothing}
          ${account.lastError
                ? html`
                <div class="account-card-error">
                  ${account.lastError}
                </div>
              `
                : nothing}
        </div>
      </div>
    `;
    };

    return html`
    <div class="card">
      <div class="card-title">LINE</div>
      <div class="card-sub">LINE Messaging API bot status and configuration.</div>
      ${accountCountLabel}

      ${hasMultipleAccounts
            ? html`
            <div class="account-card-list">
              ${lineAccounts.map((account) => renderAccountCard(account))}
            </div>
          `
            : html`
            <div class="status-list" style="margin-top: 16px;">
              <div>
                <span class="label">${texts.channels.common.configured}</span>
                <span>${line?.configured ? texts.common.success : texts.common.error}</span>
              </div>
              <div>
                <span class="label">${texts.channels.common.running}</span>
                <span>${line?.running ? texts.common.success : texts.common.error}</span>
              </div>
              <div>
                <span class="label">${texts.channels.common.connected}</span>
                <span>${line?.connected ? texts.common.success : line?.connected === false ? texts.common.error : "n/a"}</span>
              </div>
              <div>
                <span class="label">Last start</span>
                <span>${line?.lastStartAt ? formatAgo(line.lastStartAt) : "n/a"}</span>
              </div>
              <div>
                <span class="label">Last probe</span>
                <span>${line?.lastProbeAt ? formatAgo(line.lastProbeAt) : "n/a"}</span>
              </div>
              ${line?.webhookPath
                    ? html`
                    <div>
                      <span class="label">Webhook</span>
                      <span class="mono">${line.webhookPath}</span>
                    </div>
                  `
                    : nothing}
            </div>
          `}

      ${line?.lastError
            ? html`<div class="callout danger" style="margin-top: 12px;">
            ${line.lastError}
          </div>`
            : nothing}

      ${line?.probe
            ? html`<div class="callout" style="margin-top: 12px;">
            Probe ${line.probe.ok ? "ok" : "failed"} ·
            ${line.probe.status ?? ""} ${line.probe.error ?? ""}
            ${line.probe.elapsedMs ? `(${line.probe.elapsedMs}ms)` : ""}
          </div>`
            : nothing}

      ${renderChannelConfigSection({ channelId: "line", props })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${() => props.onRefresh(true)}>
          ${texts.common.refresh}
        </button>
      </div>
    </div>
  `;
}
