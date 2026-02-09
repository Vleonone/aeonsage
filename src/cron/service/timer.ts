import type { HeartbeatRunResult } from "../../infra/heartbeat-wake.js";
import type { CronJob } from "../types.js";
import { computeJobNextRunAtMs, nextWakeAtMs, resolveJobPayloadTextForMain } from "./jobs.js";
import { locked } from "./locked.js";
import type { CronEvent, CronServiceState } from "./state.js";
import { ensureLoaded, persist } from "./store.js";

const MAX_TIMEOUT_MS = 2 ** 31 - 1;

// --- Exponential backoff tracking (in-memory, no schema change) ---
const jobConsecutiveErrors = new Map<string, number>();
const BACKOFF_BASE_MS = 5_000;
const BACKOFF_MAX_MS = 15 * 60_000; // 15 minutes cap

function getBackoffDelayMs(jobId: string): number {
  const errors = jobConsecutiveErrors.get(jobId) ?? 0;
  if (errors <= 0) return 0;
  // Exponential: 5s, 10s, 20s, 40s, ... capped at 15min
  return Math.min(BACKOFF_BASE_MS * 2 ** (errors - 1), BACKOFF_MAX_MS);
}

function recordJobSuccess(jobId: string) {
  jobConsecutiveErrors.delete(jobId);
}

function recordJobError(jobId: string) {
  const current = jobConsecutiveErrors.get(jobId) ?? 0;
  jobConsecutiveErrors.set(jobId, current + 1);
}

// --- Timer drift correction ---
const DRIFT_TOLERANCE_MS = 2_000; // 2s tolerance
let lastExpectedFireMs = 0;

// --- Missed-run catch-up ---
const MISSED_RUN_THRESHOLD_MS = 60_000; // 1 minute past due = missed

export function armTimer(state: CronServiceState) {
  if (state.timer) clearTimeout(state.timer);
  state.timer = null;
  if (!state.deps.cronEnabled) return;
  const nextAt = nextWakeAtMs(state);
  if (!nextAt) return;
  const now = state.deps.nowMs();
  const delay = Math.max(nextAt - now, 0);
  // Avoid TimeoutOverflowWarning when a job is far in the future.
  const clampedDelay = Math.min(delay, MAX_TIMEOUT_MS);
  lastExpectedFireMs = now + clampedDelay;
  state.timer = setTimeout(() => {
    // Drift correction: if setTimeout fired significantly late, log it.
    const actualFireMs = state.deps.nowMs();
    const drift = actualFireMs - lastExpectedFireMs;
    if (drift > DRIFT_TOLERANCE_MS) {
      state.deps.log.warn(
        { driftMs: drift, expectedMs: lastExpectedFireMs, actualMs: actualFireMs },
        "cron: timer drift detected, correcting",
      );
    }
    void onTimer(state).catch((err) => {
      state.deps.log.error({ err: String(err) }, "cron: timer tick failed");
    });
  }, clampedDelay);
  state.timer.unref?.();
}

export async function onTimer(state: CronServiceState) {
  if (state.running) return;
  state.running = true;
  try {
    await locked(state, async () => {
      await ensureLoaded(state);
      await runDueJobs(state);
      await persist(state);
      armTimer(state);
    });
  } finally {
    state.running = false;
  }
}

export async function runDueJobs(state: CronServiceState) {
  if (!state.store) return;
  const now = state.deps.nowMs();
  const due = state.store.jobs.filter((j) => {
    if (!j.enabled) return false;
    if (typeof j.state.runningAtMs === "number") return false;
    const next = j.state.nextRunAtMs;
    if (typeof next !== "number" || now < next) return false;

    // Exponential backoff: skip job if still in backoff window.
    const backoffMs = getBackoffDelayMs(j.id);
    if (backoffMs > 0) {
      const lastRun = j.state.lastRunAtMs ?? 0;
      if (now - lastRun < backoffMs) {
        state.deps.log.debug(
          { jobId: j.id, backoffMs, sinceLastRunMs: now - lastRun },
          "cron: job in backoff, skipping this tick",
        );
        return false;
      }
    }

    return true;
  });

  // Missed-run catch-up: detect and log jobs that were significantly past due.
  for (const job of due) {
    const next = job.state.nextRunAtMs ?? now;
    const overdueMs = now - next;
    if (overdueMs > MISSED_RUN_THRESHOLD_MS) {
      state.deps.log.info(
        { jobId: job.id, overdueMs, scheduledMs: next, nowMs: now },
        "cron: catch-up — running missed job",
      );
    }
  }

  for (const job of due) {
    await executeJob(state, job, now, { forced: false });
  }
}

export async function executeJob(
  state: CronServiceState,
  job: CronJob,
  nowMs: number,
  opts: { forced: boolean },
) {
  const startedAt = state.deps.nowMs();
  job.state.runningAtMs = startedAt;
  job.state.lastError = undefined;
  emit(state, { jobId: job.id, action: "started", runAtMs: startedAt });

  let deleted = false;

  const finish = async (
    status: "ok" | "error" | "skipped",
    err?: string,
    summary?: string,
    outputText?: string,
  ) => {
    const endedAt = state.deps.nowMs();
    job.state.runningAtMs = undefined;
    job.state.lastRunAtMs = startedAt;
    job.state.lastStatus = status;
    job.state.lastDurationMs = Math.max(0, endedAt - startedAt);
    job.state.lastError = err;

    // Track consecutive errors for exponential backoff.
    if (status === "error") {
      recordJobError(job.id);
      const backoff = getBackoffDelayMs(job.id);
      if (backoff > 0) {
        state.deps.log.info(
          { jobId: job.id, backoffMs: backoff, consecutiveErrors: jobConsecutiveErrors.get(job.id) },
          "cron: applying exponential backoff after error",
        );
      }
    } else if (status === "ok") {
      recordJobSuccess(job.id);
    }

    const shouldDelete =
      job.schedule.kind === "at" && status === "ok" && job.deleteAfterRun === true;

    if (!shouldDelete) {
      if (job.schedule.kind === "at" && status === "ok") {
        // One-shot job completed successfully; disable it.
        job.enabled = false;
        job.state.nextRunAtMs = undefined;
      } else if (job.enabled) {
        job.state.nextRunAtMs = computeJobNextRunAtMs(job, endedAt);
      } else {
        job.state.nextRunAtMs = undefined;
      }
    }

    emit(state, {
      jobId: job.id,
      action: "finished",
      status,
      error: err,
      summary,
      runAtMs: startedAt,
      durationMs: job.state.lastDurationMs,
      nextRunAtMs: job.state.nextRunAtMs,
    });

    if (shouldDelete && state.store) {
      state.store.jobs = state.store.jobs.filter((j) => j.id !== job.id);
      deleted = true;
      emit(state, { jobId: job.id, action: "removed" });
    }

    if (job.sessionTarget === "isolated") {
      const prefix = job.isolation?.postToMainPrefix?.trim() || "Cron";
      const mode = job.isolation?.postToMainMode ?? "summary";

      let body = (summary ?? err ?? status).trim();
      if (mode === "full") {
        // Prefer full agent output if available; fall back to summary.
        const maxCharsRaw = job.isolation?.postToMainMaxChars;
        const maxChars = Number.isFinite(maxCharsRaw) ? Math.max(0, maxCharsRaw as number) : 8000;
        const fullText = (outputText ?? "").trim();
        if (fullText) {
          body = fullText.length > maxChars ? `${fullText.slice(0, maxChars)}…` : fullText;
        }
      }

      const statusPrefix = status === "ok" ? prefix : `${prefix} (${status})`;
      state.deps.enqueueSystemEvent(`${statusPrefix}: ${body}`, {
        agentId: job.agentId,
      });
      if (job.wakeMode === "now") {
        state.deps.requestHeartbeatNow({ reason: `cron:${job.id}:post` });
      }
    }
  };

  try {
    if (job.sessionTarget === "main") {
      const text = resolveJobPayloadTextForMain(job);
      if (!text) {
        const kind = job.payload.kind;
        await finish(
          "skipped",
          kind === "systemEvent"
            ? "main job requires non-empty systemEvent text"
            : 'main job requires payload.kind="systemEvent"',
        );
        return;
      }
      state.deps.enqueueSystemEvent(text, { agentId: job.agentId });
      if (job.wakeMode === "now" && state.deps.runHeartbeatOnce) {
        const reason = `cron:${job.id}`;
        const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
        const maxWaitMs = 2 * 60_000;
        const waitStartedAt = state.deps.nowMs();

        let heartbeatResult: HeartbeatRunResult;
        for (;;) {
          heartbeatResult = await state.deps.runHeartbeatOnce({ reason });
          if (
            heartbeatResult.status !== "skipped" ||
            heartbeatResult.reason !== "requests-in-flight"
          ) {
            break;
          }
          if (state.deps.nowMs() - waitStartedAt > maxWaitMs) {
            heartbeatResult = {
              status: "skipped",
              reason: "timeout waiting for main lane to become idle",
            };
            break;
          }
          await delay(250);
        }

        if (heartbeatResult.status === "ran") {
          await finish("ok", undefined, text);
        } else if (heartbeatResult.status === "skipped") {
          await finish("skipped", heartbeatResult.reason, text);
        } else {
          await finish("error", heartbeatResult.reason, text);
        }
      } else {
        // wakeMode is "next-heartbeat" or runHeartbeatOnce not available
        state.deps.requestHeartbeatNow({ reason: `cron:${job.id}` });
        await finish("ok", undefined, text);
      }
      return;
    }

    if (job.payload.kind !== "agentTurn") {
      await finish("skipped", "isolated job requires payload.kind=agentTurn");
      return;
    }

    const res = await state.deps.runIsolatedAgentJob({
      job,
      message: job.payload.message,
    });
    if (res.status === "ok") await finish("ok", undefined, res.summary, res.outputText);
    else if (res.status === "skipped")
      await finish("skipped", undefined, res.summary, res.outputText);
    else await finish("error", res.error ?? "cron job failed", res.summary, res.outputText);
  } catch (err) {
    await finish("error", String(err));
  } finally {
    job.updatedAtMs = nowMs;
    if (!opts.forced && job.enabled && !deleted) {
      // Keep nextRunAtMs in sync in case the schedule advanced during a long run.
      job.state.nextRunAtMs = computeJobNextRunAtMs(job, state.deps.nowMs());
    }
  }
}

export function wake(
  state: CronServiceState,
  opts: { mode: "now" | "next-heartbeat"; text: string },
) {
  const text = opts.text.trim();
  if (!text) return { ok: false } as const;
  state.deps.enqueueSystemEvent(text);
  if (opts.mode === "now") {
    state.deps.requestHeartbeatNow({ reason: "wake" });
  }
  return { ok: true } as const;
}

export function stopTimer(state: CronServiceState) {
  if (state.timer) clearTimeout(state.timer);
  state.timer = null;
}

export function emit(state: CronServiceState, evt: CronEvent) {
  try {
    state.deps.onEvent?.(evt);
  } catch {
    /* ignore */
  }
}
