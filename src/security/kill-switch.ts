/**
 * Kill Switch - Open Source Stub
 *
 * Provides the same interface as the full kill-switch module
 * but with a simplified in-memory implementation.
 */

export interface KillSwitchState {
  killed: boolean;
  killedAt?: string;
  killedBy?: string;
  reason?: string;
}

export type KillSwitchEvent = "kill" | "resume";

class KillSwitchStub {
  private state: KillSwitchState = { killed: false };

  isKilled(): boolean {
    return this.state.killed;
  }

  getState(): KillSwitchState {
    return { ...this.state };
  }

  kill(options: { by?: string; reason?: string } = {}): void {
    this.state = {
      killed: true,
      killedAt: new Date().toISOString(),
      killedBy: options.by ?? "unknown",
      reason: options.reason ?? "Emergency stop activated",
    };
  }

  resume(options: { by?: string; confirm?: boolean } = {}): { success: boolean; error?: string } {
    if (!options.confirm) {
      return { success: false, error: "Resume requires explicit confirmation." };
    }
    this.state = { killed: false };
    return { success: true };
  }

  startMonitoring(_intervalMs?: number): void { /* no-op in OSS */ }
  stopMonitoring(): void { /* no-op in OSS */ }

  on(_event: string, _listener: (...args: unknown[]) => void): this { return this; }
  emit(_event: string, ..._args: unknown[]): boolean { return false; }
}

export const killSwitch = new KillSwitchStub();

export function assertNotKilled(context?: string): void {
  if (killSwitch.isKilled()) {
    const state = killSwitch.getState();
    throw new KillSwitchError(
      `Operation blocked: Kill switch active since ${state.killedAt}. Reason: ${state.reason}`,
      context,
    );
  }
}

export function checkKillSwitch(): { blocked: boolean; state: KillSwitchState } {
  const state = killSwitch.getState();
  return { blocked: state.killed, state };
}

export class KillSwitchError extends Error {
  context?: string;
  constructor(message: string, context?: string) {
    super(message);
    this.name = "KillSwitchError";
    this.context = context;
  }
}