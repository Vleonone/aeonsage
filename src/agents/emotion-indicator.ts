/**
 * Emotion Indicator - Bot Emotional State
 * 
 * Tracks and displays bot's current emotional state
 * Based on task success/failure rates
 */

import { EventEmitter } from "node:events";

/** Emotion Type */
export type EmotionType =
    | "happy"      // High success rate
    | "focused"    // Working on tasks
    | "neutral"    // Idle or balanced
    | "frustrated" // Multiple failures
    | "tired"      // Long uptime
    | "sleeping";  // Sleep mode

/** Emotion State */
export interface EmotionState {
    current: EmotionType;
    intensity: number; // 0-100
    lastUpdate: string;
    reason: string;
}

/** Emotion Indicator Manager */
class EmotionIndicatorManager extends EventEmitter {
    private static instance: EmotionIndicatorManager;
    private state: EmotionState;
    private successCount = 0;
    private failureCount = 0;
    private uptimeStart: Date;

    private constructor() {
        super();
        this.uptimeStart = new Date();
        this.state = {
            current: "neutral",
            intensity: 50,
            lastUpdate: new Date().toISOString(),
            reason: "Bot initialized",
        };
    }

    static getInstance(): EmotionIndicatorManager {
        if (!EmotionIndicatorManager.instance) {
            EmotionIndicatorManager.instance = new EmotionIndicatorManager();
        }
        return EmotionIndicatorManager.instance;
    }

    /** Get Current State */
    getState(): EmotionState {
        return { ...this.state };
    }

    /** Record Task Success */
    recordSuccess(): void {
        this.successCount++;
        this.updateEmotion();
    }

    /** Record Task Failure */
    recordFailure(): void {
        this.failureCount++;
        this.updateEmotion();
    }

    /** Set Working State */
    setWorking(): void {
        this.setState("focused", 70, "Working on task");
    }

    /** Set Sleeping State */
    setSleeping(): void {
        this.setState("sleeping", 20, "Entered sleep mode");
    }

    /** Wake Up */
    wakeUp(): void {
        this.setState("neutral", 50, "Woke up from sleep");
        this.uptimeStart = new Date();
    }

    /** Get Emoji Representation */
    getEmoji(): string {
        const emojis: Record<EmotionType, string> = {
            happy: "😊",
            focused: "🎯",
            neutral: "😐",
            frustrated: "😤",
            tired: "😴",
            sleeping: "💤",
        };
        return emojis[this.state.current];
    }

    /** Get Display String */
    getDisplay(): string {
        return `${this.getEmoji()} ${this.state.current} (${this.state.intensity}%)`;
    }

    /** Update Emotion Based on Metrics */
    private updateEmotion(): void {
        const total = this.successCount + this.failureCount;
        if (total === 0) return;

        const successRate = this.successCount / total;
        const uptime = this.getUptimeMinutes();

        // Check for tiredness first
        if (uptime > 480) { // 8 hours
            this.setState("tired", 80, "Running for extended period");
            return;
        }

        // Evaluate based on success rate
        if (successRate > 0.8) {
            this.setState("happy", Math.round(successRate * 100), "High success rate");
        } else if (successRate < 0.3 && this.failureCount >= 3) {
            this.setState("frustrated", Math.round((1 - successRate) * 100), "Multiple failures");
        } else {
            this.setState("neutral", 50, "Balanced activity");
        }
    }

    /** Set State */
    private setState(emotion: EmotionType, intensity: number, reason: string): void {
        const previous = this.state.current;
        this.state = {
            current: emotion,
            intensity: Math.min(100, Math.max(0, intensity)),
            lastUpdate: new Date().toISOString(),
            reason,
        };
        if (previous !== emotion) {
            this.emit("emotion-changed", this.state);
        }
    }

    /** Get Uptime in Minutes */
    private getUptimeMinutes(): number {
        return Math.round((Date.now() - this.uptimeStart.getTime()) / 60000);
    }
}

export const emotionIndicator = EmotionIndicatorManager.getInstance();
