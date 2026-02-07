import { html } from "lit";
import { type ChannelsProps } from "./channels.types.js";
import { renderChannels } from "./channels.js";
import type { AppViewState } from "../app-view-state.js";
import { renderTtsView } from "./tts.js";
import { t, getCurrentLanguage } from "../i18n.js";

export type ConnectProps = {
  channels: ChannelsProps;
  tts: AppViewState;
  subTab: "channels" | "voice";
  onSubTabChange: (tab: "channels" | "voice") => void;
};

export function renderConnect(props: ConnectProps) {
  const lang = getCurrentLanguage();
  const texts = t(lang);

  return html`
    <div class="connect-container dashboard-bg">
      
      <div class="sub-nav glass-floating">
        <button 
          class="sub-nav-item ${props.subTab === 'channels' ? 'active' : ''}"
          @click=${() => props.onSubTabChange('channels')}
        >
          ${texts.nav.channels}
        </button>
        <button 
          class="sub-nav-item ${props.subTab === 'voice' ? 'active' : ''}"
          @click=${() => props.onSubTabChange('voice')}
        >
          ${texts.nav.tts}
        </button>
      </div>

      <div class="connect-content" style="margin-top: 20px;">
        ${props.subTab === 'channels' ? renderChannels(props.channels) : ''}
        ${props.subTab === 'voice' ? renderTtsView(props.tts) : ''}
      </div>
    </div>
  `;
}
