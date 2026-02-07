import { html, nothing } from "lit";
import type { AppViewState } from "../app-view-state";

// Import custom element for side effects (registration)
import "../components/threat-alert.js";

function formatRemaining(ms: number): string {
  const remaining = Math.max(0, ms);
  const totalSeconds = Math.floor(remaining / 1000);
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h`;
}

function renderMetaRow(label: string, value?: string | null) {
  if (!value) return nothing;
  return html`<div class="exec-approval-meta-row"><span>${label}</span><span>${value}</span></div>`;
}

export function renderExecApprovalPrompt(state: AppViewState) {
  const active = state.execApprovalQueue[0];
  if (!active) return nothing;

  const request = active.request;
  const threat = request.threatReport;
  const isHighRisk = threat && threat.detected && (threat.maxLevel === "high" || threat.maxLevel === "critical");

  const remainingMs = active.expiresAtMs - Date.now();
  const remaining = remainingMs > 0 ? `expires in ${formatRemaining(remainingMs)}` : "expired";
  const queueCount = state.execApprovalQueue.length;

  return html`
    <div class="exec-approval-overlay" role="dialog" aria-live="polite">
      <div class="exec-approval-card ${isHighRisk ? 'danger-border' : ''}">
        <div class="exec-approval-header">
          <div>
            <div class="exec-approval-title">Exec approval needed</div>
            <div class="exec-approval-sub">${remaining}</div>
          </div>
          ${queueCount > 1
      ? html`<div class="exec-approval-queue">${queueCount} pending</div>`
      : nothing}
        </div>
        
        <!-- Threat Alert -->
        ${threat ? html`<threat-alert .report=${threat}></threat-alert>` : nothing}

        <div class="exec-approval-command mono">${request.command}</div>
        <div class="exec-approval-meta">
          ${renderMetaRow("Host", request.host)}
          ${renderMetaRow("Agent", request.agentId)}
          ${renderMetaRow("Session", request.sessionKey)}
          ${renderMetaRow("CWD", request.cwd)}
          ${renderMetaRow("Resolved", request.resolvedPath)}
          ${renderMetaRow("Security", request.security)}
          ${renderMetaRow("Ask", request.ask)}
        </div>
        ${state.execApprovalError
      ? html`<div class="exec-approval-error">${state.execApprovalError}</div>`
      : nothing}
        
        <div class="exec-approval-actions">
           <!-- Swap buttons if high risk: Deny becomes Primary -->
           ${isHighRisk
      ? html`
                <button
                    class="btn danger"
                    style="flex-grow: 2; font-weight: bold; border: 2px solid red;"
                    ?disabled=${state.execApprovalBusy}
                    @click=${() => state.handleExecApprovalDecision("deny")}
                >
                    BLOCK THREAT
                </button>
                <button
                    class="btn"
                    ?disabled=${state.execApprovalBusy}
                    @click=${() => state.handleExecApprovalDecision("allow-once")}
                >
                    Allow once (Risky)
                </button>
             `
      : html`
                <button
                    class="btn primary"
                    ?disabled=${state.execApprovalBusy}
                    @click=${() => state.handleExecApprovalDecision("allow-once")}
                >
                    Allow once
                </button>
                <button
                    class="btn"
                    ?disabled=${state.execApprovalBusy}
                    @click=${() => state.handleExecApprovalDecision("allow-always")}
                >
                    Always allow
                </button>
                <button
                    class="btn danger"
                    ?disabled=${state.execApprovalBusy}
                    @click=${() => state.handleExecApprovalDecision("deny")}
                >
                    Deny
                </button>
             `
    }
        </div>
      </div>
    </div>
  `;
}
