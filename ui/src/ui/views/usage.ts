import { html } from "lit";
import { getCurrentLanguage, t } from "../i18n";
import { icon } from "../icons";
import type { UsageState } from "../controllers/usage";
import { formatCurrency, formatNumber } from "../format";

export function renderUsageView(state: UsageState) {
  const lang = getCurrentLanguage();
  const texts = t(lang).usage;
  const cost = state.usageCost;
  const status = state.usageProviderStatus;

  if (state.usageLoading && !cost) {
    return html`
      <div class="empty-state">
        <div class="empty-state__icon">${icon("loader")}</div>
        <div class="empty-state__text">${t(lang).common.loading}</div>
      </div>
    `;
  }

  // Calculate totals if not provided directly
  // Calculate totals if not provided directly
  const totalInput = cost?.totals.input ?? 0;
  const totalOutput = cost?.totals.output ?? 0;
  const totalTokens = cost?.totals.totalTokens ?? (totalInput + totalOutput);
  const estimatedCost = cost?.totals.totalCost ?? 0;

  // Render provider breakdown
  const breakdown = cost?.breakdown ?? [];

  return html`
    <div class="view-content">
      <div class="card-grid">
        <!-- Summary Cards -->
        <div class="card usage-summary-card">
          <div class="card__header">
            <h3 class="card__title">${texts.days30}</h3>
            <span class="card__subtitle muted">${lang === 'zh-CN' ? 'AI API 使用量' : 'AI API Usage'}</span>
          </div>
          <div class="card__content">
            <div class="stat-row">
              <span class="stat-label">${texts.totalTokens}</span>
              <span class="stat-value">${formatNumber(totalTokens)}</span>
            </div>
            <div class="stat-row">
              <span class="stat-label">${texts.costEstimate}</span>
              <span class="stat-value highlight">$${formatCurrency(estimatedCost)}</span>
            </div>
            ${breakdown.length > 0 ? html`
              <div class="stat-row providers-summary">
                <span class="stat-label">${lang === 'zh-CN' ? '提供商' : 'Providers'}</span>
                <span class="stat-value muted">${[...new Set(breakdown.map(b => b.provider))].join(', ')}</span>
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Detailed Breakdown -->
        <div class="card usage-details-card">
          <div class="card__header">
            <h3 class="card__title">${texts.title}</h3>
            <span class="card__subtitle muted">${lang === 'zh-CN' ? '按模型细分' : 'Per Model Breakdown'}</span>
          </div>
          <div class="card__content table-responsive">
            ${breakdown.length === 0
      ? html`<div class="empty-text">${texts.noData}</div>`
      : html`
                  <table class="data-table">
                    <thead>
                      <tr>
                        <th>${texts.model}</th>
                        <th>${texts.provider}</th>
                        <th class="align-right">${texts.input}</th>
                        <th class="align-right">${texts.output}</th>
                        <th class="align-right">${texts.cost}</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${breakdown.map(
        (item) => html`
                          <tr>
                            <td>${item.model}</td>
                            <td>${item.provider}</td>
                            <td class="align-right">${formatNumber(item.inputTokens)}</td>
                            <td class="align-right">${formatNumber(item.outputTokens)}</td>
                            <td class="align-right">$${formatCurrency(item.cost)}</td>
                          </tr>
                        `,
      )}
                    </tbody>
                  </table>
                `}
          </div>
        </div>
      </div>
    </div>
  `;
}
