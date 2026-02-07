/**
 * Security View - Kill Switch, Safety Gates, VDID Status
 */

import { html, nothing } from "lit";
import { icons } from "../icons.js";
import { getCurrentLanguage, t } from "../i18n.js";
import type {
    KillSwitchState,
    SafetyGate,
    VDIDStatus
} from "../controllers/security.js";

export interface SecurityViewProps {
    loading: boolean;
    error: string | null;
    killSwitch: KillSwitchState;
    gates: SafetyGate[];
    vdid: VDIDStatus;
    onRefresh: () => void;
    onActivateKillSwitch: (reason: string) => void;
    onToggleGate: (gateId: string, enabled: boolean) => void;
}

// Helper to wrap icon with smaller size for card titles
const smallIcon = (icon: ReturnType<typeof html>) => html`
    <span style="display: inline-flex; width: 18px; height: 18px; flex-shrink: 0;">${icon}</span>
`;

export function renderSecurity(props: SecurityViewProps) {
    const { loading, error, killSwitch, gates, vdid } = props;
    const lang = getCurrentLanguage();
    const texts = t(lang).security;

    return html`
        <div class="security-container">
            ${error ? html`<div class="callout danger">${error}</div>` : nothing}
            
            <div class="security-grid">
                <!-- Kill Switch Panel -->
                <div class="card glass-card">
                    <div class="card__header">
                        <div class="card__title" style="display: flex; align-items: center; gap: 8px;">
                            ${smallIcon(icons.alertTriangle)} ${texts.killSwitchTitle}
                        </div>
                        <button 
                            class="btn btn--sm"
                            @click=${props.onRefresh}
                            ?disabled=${loading}
                        >
                            ${smallIcon(icons.refreshCw)} ${texts.refresh}
                        </button>
                    </div>
                    
                    <div class="killswitch-status ${killSwitch.killed ? 'killed' : 'active'}">
                        <div class="killswitch-indicator">
                            ${killSwitch.killed ? icons.alertOctagon : icons.checkCircle}
                        </div>
                        <div class="killswitch-label">
                            ${killSwitch.killed
            ? html`
                                    <strong>${texts.systemHalted}</strong>
                                    <span class="muted">
                                        ${killSwitch.killedAt ? `${texts.activatedAt}: ${killSwitch.killedAt}` : ''}
                                        ${killSwitch.reason ? ` - ${texts.reason}: ${killSwitch.reason}` : ''}
                                    </span>
                                `
            : html`
                                    <strong>${texts.systemOperational}</strong>
                                    <span class="muted">${texts.operationalDesc}</span>
                                `
        }
                        </div>
                    </div>
                    
                    ${!killSwitch.killed ? html`
                        <button 
                            class="btn danger killswitch-button"
                            @click=${() => {
                const reason = prompt("Enter reason for emergency stop:"); // Browser prompt cant be easily localized without UI replacement
                if (reason) props.onActivateKillSwitch(reason);
            }}
                        >
                            ${smallIcon(icons.alertTriangle)} ${texts.activateButton}
                        </button>
                        <p class="muted" style="font-size: 12px; margin-top: 8px;">
                            ${texts.activateWarning}
                        </p>
                    ` : html`
                        <div class="callout info">
                            ${html([texts.resumeHint.replace('aeonsage resume', '<code>aeonsage resume</code>')] as any)}
                        </div>
                    `}
                </div>

                <!-- VDID Status moved to Dashboard -->

                <!-- Safety Gates -->
                <div class="card glass-card">
                    <div class="card__header">
                        <div class="card__title" style="display: flex; align-items: center; gap: 8px;">
                            ${smallIcon(icons.shield)} ${t(lang).safetyGates.title}
                        </div>
                    </div>

                    <div class="gates-list">
                        ${gates && gates.length > 0 ? gates.map((gate: SafetyGate) => html`
                            <div class="gate-item ${gate.enabled ? 'enabled' : 'disabled'} ${gate.locked ? 'locked' : ''}">
                                <div class="gate-info">
                                    <div class="gate-name">${gate.name}</div>
                                    <div class="gate-desc muted">${gate.description}</div>
                                    ${gate.locked ? html`
                                        <span class="chip chip-warn" style="font-size: 10px;">
                                            ${smallIcon(icons.lock)} CLI Only
                                        </span>
                                    ` : nothing}
                                </div>
                                <div class="gate-action">
                                    <span class="gate-action-label ${gate.defaultAction}">
                                        ${gate.defaultAction.toUpperCase()}
                                    </span>
                                </div>
                                <div class="gate-toggle">
                                    <label class="switch" title="${gate.locked ? 'Locked by system policy' : 'Toggle Gate'}">
                                      <input 
                                        type="checkbox" 
                                        ?checked=${gate.enabled} 
                                        ?disabled=${gate.locked}
                                        @change=${(e: Event) => props.onToggleGate(gate.id, (e.target as HTMLInputElement).checked)}
                                      >
                                      <span class="slider round"></span>
                                    </label>
                                </div>
                            </div>
                        `) : html`
                            <div class="empty-state" style="padding: 32px; text-align: center;">
                                    <div style="opacity: 0.4; margin-bottom: 12px;">${smallIcon(icons.shield)}</div>
                                    <div class="muted">${t(lang).safetyGates.defaultPolicies}</div>
                            </div>
                        `}
                    </div>
                </div>
            </div>
        </div>
    `;

}
