/**
 * RuntimeAdapter - Abstract interface for execution runtime
 *
 * This abstraction layer enables AeonSage to:
 * 1. Decouple from specific runtime implementations
 * 2. Support multiple runtime backends (Pi-Agent, LangGraph, CrewAI, custom)
 * 3. Enable future runtime migration without affecting L2-L4 layers
 *
 * CRITICAL RULE: Upper layers (L2+) MUST NOT directly import @mariozechner/*
 * All runtime interactions MUST go through RuntimeAdapter
 *
 * @module runtime
 */

import type { AgentState, ToolExecutionResult, RuntimeConfig } from "./RuntimeTypes.js";

/**
 * Abstract runtime adapter interface
 *
 * Any L0 runtime implementation must conform to this interface.
 * This enables runtime-agnostic system design.
 */
export interface RuntimeAdapter {
  /**
   * Runtime identification
   */
  readonly name: string;
  readonly version: string;

  /**
   * Lifecycle management
   */
  initialize(config: RuntimeConfig): Promise<void>;
  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;

  /**
   * Tool execution
   */
  executeTool(toolName: string, input: unknown): Promise<ToolExecutionResult>;
  getAvailableTools(): Promise<string[]>;

  /**
   * Agent state management
   */
  getAgentState(): Promise<AgentState>;
  setAgentState(state: Partial<AgentState>): Promise<void>;

  /**
   * Model interaction
   */
  discoverModels(): Promise<ModelInfo[]>;
  selectModel(modelId: string): Promise<void>;
  getCurrentModel(): Promise<ModelInfo | null>;
}

/**
 * Model information structure
 */
export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  contextWindow?: number;
  capabilities?: string[];
}

/**
 * Runtime adapter factory function type
 */
export type RuntimeAdapterFactory = (config: RuntimeConfig) => RuntimeAdapter;
