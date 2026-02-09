/**
 * Bash Tools Exec - Type Definitions
 *
 * Extracted types to reduce main file size and improve modularity.
 */

import type { AgentToolResult } from "@mariozechner/pi-agent-core";
import type { ProcessSession } from "./bash-process-registry.js";
import type { BashSandboxConfig } from "./bash-tools.shared.js";
import type { ExecAsk, ExecHost, ExecSecurity } from "../infra/exec-approvals.js";

/** PTY process exit event */
export type PtyExitEvent = { exitCode: number; signal?: number };

/** PTY event listener type */
export type PtyListener<T> = (event: T) => void;

/** PTY handle for interactive processes */
export type PtyHandle = {
  pid: number;
  write: (data: string | Buffer) => void;
  onData: (listener: PtyListener<string>) => void;
  onExit: (listener: PtyListener<PtyExitEvent>) => void;
};

/** PTY spawn function signature */
export type PtySpawn = (
  file: string,
  args: string[] | string,
  options: {
    name?: string;
    cols?: number;
    rows?: number;
    cwd?: string;
    env?: Record<string, string>;
  },
) => PtyHandle;

/** Outcome of an exec process execution */
export type ExecProcessOutcome = {
  status: "completed" | "failed";
  exitCode: number | null;
  exitSignal: NodeJS.Signals | number | null;
  durationMs: number;
  aggregated: string;
  timedOut: boolean;
  reason?: string;
};

/** Handle for managing an exec process */
export type ExecProcessHandle = {
  session: ProcessSession;
  startedAt: number;
  pid?: number;
  promise: Promise<ExecProcessOutcome>;
  kill: () => void;
};

/** Default configuration options for exec tool */
export type ExecToolDefaults = {
  host?: ExecHost;
  security?: ExecSecurity;
  ask?: ExecAsk;
  node?: string;
  pathPrepend?: string[];
  safeBins?: string[];
  agentId?: string;
  backgroundMs?: number;
  timeoutSec?: number;
  approvalRunningNoticeMs?: number;
  sandbox?: BashSandboxConfig;
  elevated?: ExecElevatedDefaults;
  allowBackground?: boolean;
  scopeKey?: string;
  sessionKey?: string;
  messageProvider?: string;
  notifyOnExit?: boolean;
  cwd?: string;
};

/** Elevated execution defaults */
export type ExecElevatedDefaults = {
  enabled: boolean;
  allowed: boolean;
  defaultLevel: "on" | "off" | "ask" | "full";
};

/** Detailed result types for exec tool execution */
export type ExecToolDetails =
  | {
      status: "running";
      sessionId: string;
      pid?: number;
      startedAt: number;
      cwd?: string;
      tail?: string;
    }
  | {
      status: "completed" | "failed";
      exitCode: number | null;
      durationMs: number;
      aggregated: string;
      cwd?: string;
    }
  | {
      status: "approval-pending";
      approvalId: string;
      approvalSlug: string;
      expiresAtMs: number;
      host: ExecHost;
      command: string;
      cwd?: string;
      nodeId?: string;
    };

/** Parameters for running exec process */
export type RunExecProcessParams = {
  command: string;
  workdir: string;
  env: Record<string, string>;
  sandbox?: BashSandboxConfig;
  containerWorkdir?: string | null;
  usePty: boolean;
  warnings: string[];
  maxOutput: number;
  pendingMaxOutput: number;
  notifyOnExit: boolean;
  scopeKey?: string;
  sessionKey?: string;
  timeoutSec: number;
  onUpdate?: (partialResult: AgentToolResult<ExecToolDetails>) => void;
};

/** Result of approval check */
export type ApprovalCheckResult =
  | { approved: true }
  | {
      approved: false;
      approvalId: string;
      approvalSlug: string;
      expiresAtMs: number;
      host: ExecHost;
    };

// Re-export from shared module
export type { BashSandboxConfig } from "./bash-tools.shared.js";
