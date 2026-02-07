import { html } from "lit";
import { type ConfigProps, renderConfig } from "./config.js";
import { type DebugProps, renderDebug } from "./debug.js";
import { type LogsProps, renderLogs } from "./logs.js";
import { type CronProps, renderCron } from "./cron.js";
import { t, getCurrentLanguage } from "../i18n.js";

export type SystemSubTab = "config" | "debug" | "logs" | "cron";

export type SystemProps = {
  config: ConfigProps;
  debug: DebugProps;
  logs: LogsProps;
  cron: CronProps;
  subTab: SystemSubTab;
  onSubTabChange: (tab: SystemSubTab) => void;
};

export function renderSystem(props: SystemProps) {
  const lang = getCurrentLanguage();
  const texts = t(lang);

  return html`
    <div class="system-container dashboard-bg">
      
      <div class="sub-nav glass-floating">
        <button 
          class="sub-nav-item ${props.subTab === 'config' ? 'active' : ''}"
          @click=${() => props.onSubTabChange('config')}
        >
          ${texts.nav.config}
        </button>
        <button 
          class="sub-nav-item ${props.subTab === 'logs' ? 'active' : ''}"
          @click=${() => props.onSubTabChange('logs')}
        >
          ${texts.nav.logs}
        </button>
        <button 
          class="sub-nav-item ${props.subTab === 'debug' ? 'active' : ''}"
          @click=${() => props.onSubTabChange('debug')}
        >
          ${texts.nav.debug}
        </button>
         <button 
          class="sub-nav-item ${props.subTab === 'cron' ? 'active' : ''}"
          @click=${() => props.onSubTabChange('cron')}
        >
          ${texts.nav.cron}
        </button>
      </div>

      <div class="system-content" style="margin-top: 20px;">
        ${props.subTab === 'config' ? renderConfig(props.config) : ''}
        ${props.subTab === 'logs' ? renderLogs(props.logs) : ''}
        ${props.subTab === 'debug' ? renderDebug(props.debug) : ''}
        ${props.subTab === 'cron' ? renderCron(props.cron) : ''}
      </div>
    </div>
  `;
}
