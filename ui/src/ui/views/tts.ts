import { html } from "lit";
import { getCurrentLanguage, t } from "../i18n";
import { icon } from "../icons";
import type { AppViewState } from "../app-view-state";
import { enableTts, disableTts, setTtsProvider, convertTextToSpeech } from "../controllers/tts";

export function renderTtsView(state: AppViewState) {
  const lang = getCurrentLanguage();
  const texts = t(lang).tts;
  const ttsState = state.ttsState;
  const status = ttsState?.ttsStatus;

  if (ttsState?.ttsLoading && !status) {
    return html`
      <div class="empty-state">
        <div class="empty-state__icon">${icon("loader")}</div>
        <div class="empty-state__text">${t(lang).common.loading}</div>
      </div>
    `;
  }

  // Event handlers
  const handleToggle = () => {
    if (status?.enabled) disableTts(state);
    else enableTts(state);
  };

  const handleProviderChange = (e: Event) => {
    const select = e.target as HTMLSelectElement;
    setTtsProvider(state, select.value);
  };

  const handleTest = () => {
    const input = document.getElementById("tts-test-input") as HTMLInputElement;
    if (input) convertTextToSpeech(state, input.value);
  };

  return html`
    <div class="view-content">
      <div class="card-grid">
        <!-- Configuration Card -->
        <div class="card tts-config-card">
          <div class="card__header">
            <h3 class="card__title">${texts.title}</h3>
            <div class="card__actions">
              <button 
                class="button ${status?.enabled ? 'button--danger' : 'button--primary'}"
                @click=${handleToggle}
              >
                ${status?.enabled ? texts.disable : texts.enable}
              </button>
            </div>
          </div>
          
          <div class="card__content">
            <div class="form-group">
              <label>${texts.provider}</label>
              <select 
                class="select" 
                .value=${status?.provider || ""} 
                @change=${handleProviderChange}
                ?disabled=${!status?.enabled}
              >
                <option value="openai" ?selected=${status?.provider === "openai"}>OpenAI ${status?.hasOpenAIKey ? "✅" : "⚠️"}</option>
                <option value="elevenlabs" ?selected=${status?.provider === "elevenlabs"}>ElevenLabs ${status?.hasElevenLabsKey ? "✅" : "⚠️"}</option>
                <option value="edge" ?selected=${status?.provider === "edge"}>Edge TTS (Free) ✅</option>
              </select>
              ${(!status?.hasOpenAIKey && status?.provider === "openai") || (!status?.hasElevenLabsKey && status?.provider === "elevenlabs")
      ? html`<div class="form-hint warning">${texts.configureKeys}</div>`
      : ""}
            </div>
          </div>
        </div>

        <!-- Test Card -->
        <div class="card tts-test-card">
          <div class="card__header">
            <h3 class="card__title">${texts.test}</h3>
          </div>
          <div class="card__content">
            <div class="form-group">
              <div class="input-group">
                <input 
                  id="tts-test-input" 
                  type="text" 
                  class="input" 
                  placeholder="Hello world, this is a test." 
                />
                <button 
                  class="button ${ttsState?.ttsProcessing ? 'button--secondary' : 'success'}" 
                  @click=${handleTest}
                  ?disabled=${!status?.enabled || ttsState?.ttsProcessing}
                  style="gap: 8px; min-width: 100px;"
                >
                  <span>${ttsState?.ttsProcessing ? texts.playing : texts.play}</span>
                  ${icon("play")}
                </button>
              </div>
            </div>

            ${ttsState?.ttsError
      ? html`<div class="error-message">${icon("bug")} ${ttsState.ttsError}</div>`
      : ""}
            
            ${ttsState?.ttsAudioUrl
      ? html`
                  <div class="audio-player">
                    <audio controls autoplay src="${ttsState.ttsAudioUrl}"></audio>
                  </div>
                `
      : ""}
          </div>
        </div>
      </div>
    </div>
  `;
}
