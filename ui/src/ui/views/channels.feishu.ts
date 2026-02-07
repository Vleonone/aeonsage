import { html, nothing } from "lit";

import { formatAgo } from "../format";
import type { ChannelAccountSnapshot } from "../types";
import type { ChannelsProps } from "./channels.types";
import { renderChannelConfigSection } from "./channels.config";
import { t, getCurrentLanguage } from "../i18n.js";

export type FeishuStatus = {
    configured: boolean;
    running: boolean;
    connected?: boolean | null;
    lastStartAt?: number | null;
    lastStopAt?: number | null;
    lastError?: string | null;
    webhookPath?: string | null;
    webhookUrl?: string | null;
    probe?: {
        ok: boolean;
        error?: string | null;
        elapsedMs?: number | null;
        appName?: string | null;
    } | null;
    lastProbeAt?: number | null;
};

export function renderFeishuCard(params: {
    props: ChannelsProps;
    feishu?: FeishuStatus | null;
    feishuAccounts: ChannelAccountSnapshot[];
    accountCountLabel: unknown;
}) {
    const { props, feishu, feishuAccounts, accountCountLabel } = params;
    const hasMultipleAccounts = feishuAccounts.length > 1;
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
      <div class="card-title">飞书 / Lark</div>
      <div class="card-sub">Feishu/Lark bot status and configuration.</div>
      ${accountCountLabel}

      ${hasMultipleAccounts
            ? html`
            <div class="account-card-list">
              ${feishuAccounts.map((account) => renderAccountCard(account))}
            </div>
          `
            : html`
            <div class="status-list" style="margin-top: 16px;">
              <div>
                <span class="label">${texts.channels.common.configured}</span>
                <span>${feishu?.configured ? texts.common.success : texts.common.error}</span>
              </div>
              <div>
                <span class="label">${texts.channels.common.running}</span>
                <span>${feishu?.running ? texts.common.success : texts.common.error}</span>
              </div>
              <div>
                <span class="label">${texts.channels.common.connected}</span>
                <span>${feishu?.connected ? texts.common.success : feishu?.connected === false ? texts.common.error : "n/a"}</span>
              </div>
              <div>
                <span class="label">Last start</span>
                <span>${feishu?.lastStartAt ? formatAgo(feishu.lastStartAt) : "n/a"}</span>
              </div>
              <div>
                <span class="label">Last probe</span>
                <span>${feishu?.lastProbeAt ? formatAgo(feishu.lastProbeAt) : "n/a"}</span>
              </div>
              ${feishu?.webhookPath
                    ? html`
                    <div>
                      <span class="label">Webhook</span>
                      <span class="mono">${feishu.webhookPath}</span>
                    </div>
                  `
                    : nothing}
            </div>
          `}

      ${feishu?.lastError
            ? html`<div class="callout danger" style="margin-top: 12px;">
            ${feishu.lastError}
          </div>`
            : nothing}

      ${feishu?.probe
            ? html`<div class="callout" style="margin-top: 12px;">
            Probe ${feishu.probe.ok ? "ok" : "failed"}
            ${feishu.probe.appName ? `· ${feishu.probe.appName}` : ""}
            ${feishu.probe.error ?? ""}
            ${feishu.probe.elapsedMs ? `(${feishu.probe.elapsedMs}ms)` : ""}
          </div>`
            : nothing}

      ${renderChannelConfigSection({ channelId: "feishu", props })}

      <div class="row" style="margin-top: 12px;">
        <button class="btn" @click=${() => props.onRefresh(true)}>
          ${texts.common.refresh}
        </button>
      </div>
    </div>
  `;
}
