import { AppViewState } from "../app-view-state.js";

export interface TtsStatus {
    enabled: boolean;
    provider: string;
    hasOpenAIKey: boolean;
    hasElevenLabsKey: boolean;
}

export type TtsState = {
    ttsLoading: boolean;
    ttsProcessing: boolean;
    ttsError: string | null;
    ttsStatus: TtsStatus | null;
    ttsAudioUrl: string | null;
};

export async function loadTtsStatus(state: AppViewState) {
    state.ttsState = { ...state.ttsState, ttsLoading: true, ttsError: null };
    try {
        if (!state.client || !state.connected) {
            // Fallback to default if not connected
            state.ttsState = {
                ...state.ttsState,
                ttsLoading: false,
                ttsStatus: {
                    enabled: true,
                    provider: "edge",
                    hasOpenAIKey: false,
                    hasElevenLabsKey: false
                }
            };
            return;
        }
        const res = await state.client.request("tts.status", {}) as TtsStatus | undefined;
        state.ttsState = {
            ...state.ttsState,
            ttsLoading: false,
            ttsStatus: res || {
                enabled: true,
                provider: "edge",
                hasOpenAIKey: false,
                hasElevenLabsKey: false
            }
        };
    } catch (err) {
        state.ttsState = {
            ...state.ttsState,
            ttsLoading: false,
            ttsError: String(err),
            ttsStatus: {
                enabled: true,
                provider: "edge",
                hasOpenAIKey: false,
                hasElevenLabsKey: false
            }
        };
    }
}

export async function enableTts(state: AppViewState) {
    try {
        if (state.client && state.connected) {
            await state.client.request("tts.enable", {});
        }
        const current = state.ttsState.ttsStatus || { enabled: false, provider: "edge", hasOpenAIKey: false, hasElevenLabsKey: false };
        state.ttsState = { ...state.ttsState, ttsStatus: { ...current, enabled: true } };
    } catch (err) {
        state.ttsState = { ...state.ttsState, ttsError: String(err) };
    }
}

export async function disableTts(state: AppViewState) {
    try {
        if (state.client && state.connected) {
            await state.client.request("tts.disable", {});
        }
        const current = state.ttsState.ttsStatus || { enabled: false, provider: "edge", hasOpenAIKey: false, hasElevenLabsKey: false };
        state.ttsState = { ...state.ttsState, ttsStatus: { ...current, enabled: false } };
    } catch (err) {
        state.ttsState = { ...state.ttsState, ttsError: String(err) };
    }
}

export async function setTtsProvider(state: AppViewState, provider: string) {
    try {
        if (state.client && state.connected) {
            await state.client.request("tts.setProvider", { provider });
        }
        const current = state.ttsState.ttsStatus || { enabled: false, provider: "edge", hasOpenAIKey: false, hasElevenLabsKey: false };
        state.ttsState = { ...state.ttsState, ttsStatus: { ...current, provider } };
    } catch (err) {
        state.ttsState = { ...state.ttsState, ttsError: String(err) };
    }
}

export async function convertTextToSpeech(state: AppViewState, text: string) {
    if (!text || !text.trim()) {
        state.ttsState = { ...state.ttsState, ttsError: "Please enter text to convert" };
        return;
    }

    state.ttsState = { ...state.ttsState, ttsProcessing: true, ttsError: null, ttsAudioUrl: null };

    try {
        if (state.client && state.connected) {
            const res = await state.client.request("tts.convert", { text: text.trim() }) as { audioUrl?: string; error?: string } | undefined;

            if (res?.error) {
                state.ttsState = { ...state.ttsState, ttsProcessing: false, ttsError: res.error };
                return;
            }

            if (res?.audioUrl) {
                state.ttsState = { ...state.ttsState, ttsProcessing: false, ttsAudioUrl: res.audioUrl };
                return;
            }
        }

        // Fallback: use browser SpeechSynthesis API
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(text.trim());
            utterance.lang = 'en-US';
            utterance.onend = () => {
                state.ttsState = { ...state.ttsState, ttsProcessing: false };
            };
            utterance.onerror = (e) => {
                state.ttsState = { ...state.ttsState, ttsProcessing: false, ttsError: `Speech error: ${e.error}` };
            };
            window.speechSynthesis.speak(utterance);
        } else {
            state.ttsState = { ...state.ttsState, ttsProcessing: false, ttsError: "TTS not available" };
        }
    } catch (err) {
        state.ttsState = { ...state.ttsState, ttsProcessing: false, ttsError: String(err) };
    }
}
