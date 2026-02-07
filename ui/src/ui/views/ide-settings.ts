/**
 * IDE Settings View - Configuration Panel
 *
 * ⚠️ AUTHORIZATION: DEV-only professional tool
 *
 * Provides:
 * - Theme selection
 * - Editor configuration
 * - Terminal configuration
 * - Plugin management shortcuts
 */

import { html, nothing } from "lit";
import type { TemplateResult } from "lit";
import type { PluginManifest, PluginRiskLevel } from "../plugins/plugin-api.js";

export interface IdeSettingsState {
    theme: "dark" | "light";
    fontSize: number;
    tabSize: number;
    autoSave: boolean;
    autoSaveDelay: number;
    terminalFontSize: number;
    terminalScrollback: number;
    enablePlugins: boolean;
    installedPlugins: InstalledPlugin[];
}

export interface InstalledPlugin {
    manifest: PluginManifest;
    enabled: boolean;
    activatedAt: string | null;
}

export const DEFAULT_SETTINGS: IdeSettingsState = {
    theme: "dark",
    fontSize: 14,
    tabSize: 4,
    autoSave: true,
    autoSaveDelay: 1000,
    terminalFontSize: 13,
    terminalScrollback: 1000,
    enablePlugins: true,
    installedPlugins: [],
};

export interface IdeSettingsCallbacks {
    onThemeChange: (theme: "dark" | "light") => void;
    onFontSizeChange: (size: number) => void;
    onTabSizeChange: (size: number) => void;
    onAutoSaveChange: (enabled: boolean) => void;
    onAutoSaveDelayChange: (delay: number) => void;
    onTerminalFontSizeChange: (size: number) => void;
    onTerminalScrollbackChange: (lines: number) => void;
    onPluginsToggle: (enabled: boolean) => void;
    onPluginToggle: (pluginId: string, enabled: boolean) => void;
    onClose: () => void;
    onResetDefaults: () => void;
}

export function renderIdeSettings(
    state: IdeSettingsState,
    callbacks: IdeSettingsCallbacks
): TemplateResult {
    return html`
        <div class="ide-settings">
            <div class="ide-settings-header">
                <h2>Settings</h2>
                <button class="ide-btn ide-btn-icon" @click=${callbacks.onClose}>✕</button>
            </div>

            <div class="ide-settings-content">
                <!-- Appearance -->
                <section class="ide-settings-section">
                    <h3>🎨 Appearance</h3>

                    <label class="ide-settings-field">
                        <span>Theme</span>
                        <select
                            .value=${state.theme}
                            @change=${(e: Event) =>
            callbacks.onThemeChange(
                (e.target as HTMLSelectElement).value as "dark" | "light"
            )}
                        >
                            <option value="dark">Dark</option>
                            <option value="light">Light</option>
                        </select>
                    </label>
                </section>

                <!-- Editor -->
                <section class="ide-settings-section">
                    <h3>📝 Editor</h3>

                    <label class="ide-settings-field">
                        <span>Font Size</span>
                        <input
                            type="number"
                            min="10"
                            max="24"
                            .value=${String(state.fontSize)}
                            @change=${(e: Event) =>
            callbacks.onFontSizeChange(
                parseInt((e.target as HTMLInputElement).value, 10)
            )}
                        />
                    </label>

                    <label class="ide-settings-field">
                        <span>Tab Size</span>
                        <select
                            .value=${String(state.tabSize)}
                            @change=${(e: Event) =>
            callbacks.onTabSizeChange(
                parseInt((e.target as HTMLSelectElement).value, 10)
            )}
                        >
                            <option value="2">2 spaces</option>
                            <option value="4">4 spaces</option>
                            <option value="8">8 spaces</option>
                        </select>
                    </label>

                    <label class="ide-settings-field ide-settings-checkbox">
                        <input
                            type="checkbox"
                            .checked=${state.autoSave}
                            @change=${(e: Event) =>
            callbacks.onAutoSaveChange((e.target as HTMLInputElement).checked)}
                        />
                        <span>Auto Save</span>
                    </label>

                    ${state.autoSave
            ? html`
                              <label class="ide-settings-field">
                                  <span>Auto Save Delay (ms)</span>
                                  <input
                                      type="number"
                                      min="500"
                                      max="10000"
                                      step="500"
                                      .value=${String(state.autoSaveDelay)}
                                      @change=${(e: Event) =>
                    callbacks.onAutoSaveDelayChange(
                        parseInt((e.target as HTMLInputElement).value, 10)
                    )}
                                  />
                              </label>
                          `
            : nothing}
                </section>

                <!-- Terminal -->
                <section class="ide-settings-section">
                    <h3>🖥️ Terminal</h3>

                    <label class="ide-settings-field">
                        <span>Font Size</span>
                        <input
                            type="number"
                            min="10"
                            max="20"
                            .value=${String(state.terminalFontSize)}
                            @change=${(e: Event) =>
            callbacks.onTerminalFontSizeChange(
                parseInt((e.target as HTMLInputElement).value, 10)
            )}
                        />
                    </label>

                    <label class="ide-settings-field">
                        <span>Scrollback Lines</span>
                        <input
                            type="number"
                            min="100"
                            max="10000"
                            step="100"
                            .value=${String(state.terminalScrollback)}
                            @change=${(e: Event) =>
            callbacks.onTerminalScrollbackChange(
                parseInt((e.target as HTMLInputElement).value, 10)
            )}
                        />
                    </label>
                </section>

                <!-- Plugins -->
                <section class="ide-settings-section">
                    <h3>🔌 Plugins</h3>

                    <label class="ide-settings-field ide-settings-checkbox">
                        <input
                            type="checkbox"
                            .checked=${state.enablePlugins}
                            @change=${(e: Event) =>
            callbacks.onPluginsToggle((e.target as HTMLInputElement).checked)}
                        />
                        <span>Enable Plugins</span>
                    </label>

                    ${state.enablePlugins
            ? html`
                              <div class="ide-plugins-list">
                                  ${state.installedPlugins.length === 0
                    ? html`<div class="ide-muted">No plugins installed</div>`
                    : state.installedPlugins.map(
                        (p) => html`
                                                <div class="ide-plugin-item">
                                                    <div class="ide-plugin-info">
                                                        <div class="ide-plugin-name">
                                                            ${p.manifest.name}
                                                            ${renderRiskBadge(p.manifest.riskLevel)}
                                                        </div>
                                                        <div class="ide-plugin-desc">
                                                            ${p.manifest.description}
                                                        </div>
                                                    </div>
                                                    <label class="ide-switch">
                                                        <input
                                                            type="checkbox"
                                                            .checked=${p.enabled}
                                                            @change=${(e: Event) =>
                                callbacks.onPluginToggle(
                                    p.manifest.id,
                                    (e.target as HTMLInputElement)
                                        .checked
                                )}
                                                        />
                                                        <span class="ide-switch-slider"></span>
                                                    </label>
                                                </div>
                                            `
                    )}
                              </div>
                          `
            : nothing}
                </section>
            </div>

            <div class="ide-settings-footer">
                <button class="ide-btn" @click=${callbacks.onResetDefaults}>Reset to Defaults</button>
                <button class="ide-btn ide-btn-primary" @click=${callbacks.onClose}>Done</button>
            </div>
        </div>
    `;
}

function renderRiskBadge(risk: PluginRiskLevel): TemplateResult {
    const colors: Record<PluginRiskLevel, string> = {
        low: "ide-badge-green",
        medium: "ide-badge-yellow",
        high: "ide-badge-orange",
        critical: "ide-badge-red",
    };
    return html`<span class="ide-badge ${colors[risk]}">${risk}</span>`;
}
