/**
 * Sleep Mode - Auto Sleep on Idle
 * 
 * Automatically enters sleep mode after configurable idle timeout
 * Wakes on new task/message
 * Reduces resource usage when sleeping
 */

import { EventEmitter } from "node:events";

/** Sleep Configuration */
export interface SleepConfig {
    enabled: boolean;
    idleTimeoutMinutes: number;
    reducedPollingInterval: number; // ms
    normalPollingInterval: number; // ms
}

/** Sleep State */
export interface SleepState {
    isSleeping: boolean;
    sleepingSince: string | null;
    lastActivity: string;
    totalSleepTime: number; // minutes today
}

/** Sleep Mode Manager */
class SleepModeManager extends EventEmitter {
    private static instance: SleepModeManager;
    private config: SleepConfig;
    private state: SleepState;
    private idleTimer: NodeJS.Timeout | null = null;

    private constructor() {
        super();
        this.config = {
            enabled: true,
            idleTimeoutMinutes: 30, // Default: 30 minutes
            reducedPollingInterval: 60000, // 1 minute when sleeping
            normalPollingInterval: 5000, // 5 seconds when awake
        };
        this.state = {
            isSleeping: false,
            sleepingSince: null,
            lastActivity: new Date().toISOString(),
            totalSleepTime: 0,
        };
        this.startIdleWatcher();
    }

    static getInstance(): SleepModeManager {
        if (!SleepModeManager.instance) {
            SleepModeManager.instance = new SleepModeManager();
        }
        return SleepModeManager.instance;
    }

    /** Get Current State */
    getState(): SleepState {
        return { ...this.state };
    }

    /** Get Config */
    getConfig(): SleepConfig {
        return { ...this.config };
    }

    /** Update Config */
    configure(config: Partial<SleepConfig>): void {
        this.config = { ...this.config, ...config };
        if (this.config.enabled) {
            this.startIdleWatcher();
        } else {
            this.stopIdleWatcher();
            if (this.state.isSleeping) {
                this.wake("Config disabled sleep mode");
            }
        }
        this.emit("config-changed", this.config);
    }

    /** Record Activity (Resets Idle Timer) */
    recordActivity(): void {
        this.state.lastActivity = new Date().toISOString();
        if (this.state.isSleeping) {
            this.wake("Activity detected");
        }
        this.resetIdleTimer();
    }

    /** Force Wake */
    wake(reason: string): void {
        if (!this.state.isSleeping) return;

        // Calculate sleep duration
        if (this.state.sleepingSince) {
            const sleepStart = new Date(this.state.sleepingSince);
            const sleepDuration = Math.round((Date.now() - sleepStart.getTime()) / 60000);
            this.state.totalSleepTime += sleepDuration;
        }

        this.state.isSleeping = false;
        this.state.sleepingSince = null;
        this.emit("wake", { reason, timestamp: new Date().toISOString() });
        this.resetIdleTimer();
    }

    /** Force Sleep */
    sleep(reason: string): void {
        if (this.state.isSleeping) return;

        this.state.isSleeping = true;
        this.state.sleepingSince = new Date().toISOString();
        this.stopIdleWatcher();
        this.emit("sleep", { reason, timestamp: new Date().toISOString() });
    }

    /** Get Current Polling Interval */
    getPollingInterval(): number {
        return this.state.isSleeping
            ? this.config.reducedPollingInterval
            : this.config.normalPollingInterval;
    }

    /** Is Sleeping */
    isSleeping(): boolean {
        return this.state.isSleeping;
    }

    /** Start Idle Watcher */
    private startIdleWatcher(): void {
        this.stopIdleWatcher();
        if (!this.config.enabled) return;
        this.resetIdleTimer();
    }

    /** Stop Idle Watcher */
    private stopIdleWatcher(): void {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
    }

    /** Reset Idle Timer */
    private resetIdleTimer(): void {
        this.stopIdleWatcher();
        if (!this.config.enabled || this.state.isSleeping) return;

        this.idleTimer = setTimeout(() => {
            this.sleep("Idle timeout reached");
        }, this.config.idleTimeoutMinutes * 60 * 1000);
    }
}

export const sleepMode = SleepModeManager.getInstance();
