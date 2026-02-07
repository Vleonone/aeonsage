import { html, nothing } from "lit";
import { type UiSettings } from "../storage.js";
import { t, getCurrentLanguage } from "../i18n.js";
import { icon } from "../icons.js";

export type SetupWizardProps = {
  settings: UiSettings;
  connected: boolean;
  onUpdateSettings: (patch: Partial<UiSettings>) => void;
  onConnect: () => void;
  onDismiss: () => void;
};

export function renderSetupWizard(props: SetupWizardProps) {
  const lang = getCurrentLanguage();
  const texts = t(lang);

  const missingToken = !props.settings.token;
  const isComplete = props.connected && !missingToken;

  if (isComplete) return nothing;

  return html`
    <section class="setup-wizard">
      <div class="setup-wizard__header">
        <div class="setup-wizard__title">
          ${icon("settings")}
          <span>Setup</span>
        </div>
        <button class="btn btn--sm" @click=${props.onDismiss}>
          ${icon("x")}
        </button>
      </div>
      
      <p class="setup-wizard__desc muted">Configure your AeonSage connection.</p>

      <div class="setup-wizard__steps">
        <!-- Step 1: Gateway Connection -->
        <div class="setup-step ${props.connected ? 'setup-step--done' : 'setup-step--active'}">
          <div class="setup-step__indicator">
            ${props.connected ? icon("check") : html`<span class="setup-step__number">1</span>`}
          </div>
          <div class="setup-step__content">
            <div class="setup-step__title">Gateway Connection</div>
            <div class="setup-step__desc muted">
              ${props.connected ? "Connected" : "Enter token to connect"}
            </div>
            ${!props.connected ? html`
              <button class="btn btn--sm primary" @click=${props.onConnect}>
                Connect
              </button>
            ` : nothing}
          </div>
        </div>

        <!-- Step 2: Token Config -->
        <div class="setup-step ${!missingToken ? 'setup-step--done' : ''}">
          <div class="setup-step__indicator">
            ${!missingToken ? icon("check") : html`<span class="setup-step__number">2</span>`}
          </div>
          <div class="setup-step__content">
            <div class="setup-step__title">API Configuration</div>
            <div class="setup-step__desc muted">Token saved</div>
          </div>
        </div>
      </div>

      <!-- Social Connect Section -->
      <div class="setup-wizard__social">
        <span class="setup-wizard__social-label muted">Connect with us</span>
        <div class="setup-wizard__social-links">
          <a href="https://github.com/aeonsage" target="_blank" rel="noopener" class="social-link" title="GitHub">
            ${icon("github")}
          </a>
          <a href="https://twitter.com/aeonsage" target="_blank" rel="noopener" class="social-link" title="Twitter">
            ${icon("twitter")}
          </a>
          <a href="https://discord.gg/aeonsage" target="_blank" rel="noopener" class="social-link" title="Discord">
            ${icon("discord")}
          </a>
        </div>
      </div>
    </section>
  `;
}
