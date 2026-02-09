/**
 * Runtime Module - Entry point for runtime abstraction
 *
 * This module provides the factory function for creating runtime adapters.
 * Upper layers should ONLY import from this file, never directly from adapters.
 *
 * Usage:
 * ```typescript
 * import { createRuntime } from "./runtime";
 *
 * const runtime = createRuntime({ type: "pi-agent" });
 * await runtime.initialize(config);
 * await runtime.start();
 * ```
 *
 * @module runtime
 */

export { RuntimeAdapter, ModelInfo, RuntimeAdapterFactory } from "./RuntimeAdapter.js";
export {
  RuntimeConfig,
  AgentState,
  AgentContext,
  ConversationMessage,
  ToolExecutionResult,
} from "./RuntimeTypes.js";
export { PiAgentAdapter } from "./PiAgentAdapter.js";

import type { RuntimeAdapter } from "./RuntimeAdapter.js";
import type { RuntimeConfig } from "./RuntimeTypes.js";
import { PiAgentAdapter } from "./PiAgentAdapter.js";

/**
 * Create a runtime adapter based on configuration
 *
 * This is the primary entry point for obtaining a runtime instance.
 * The factory pattern allows runtime selection without exposing implementation details.
 *
 * @param config - Runtime configuration
 * @returns RuntimeAdapter instance
 *
 * @example
 * ```typescript
 * // Use Pi-Agent runtime (default)
 * const runtime = createRuntime({ type: "pi-agent" });
 *
 * // Future: Use alternative runtime
 * const runtime = createRuntime({ type: "langgraph" });
 * ```
 */
export function createRuntime(config: RuntimeConfig): RuntimeAdapter {
  switch (config.type) {
    case "pi-agent":
      return new PiAgentAdapter();

    case "langgraph":
      // Future: return new LangGraphAdapter();
      throw new Error("LangGraph adapter not yet implemented");

    case "crewai":
      // Future: return new CrewAIAdapter();
      throw new Error("CrewAI adapter not yet implemented");

    case "custom":
      // Future: return new CustomAdapter(config.options);
      throw new Error("Custom adapter not yet implemented");

    default:
      // Default to Pi-Agent
      return new PiAgentAdapter();
  }
}

/**
 * Get the default runtime adapter
 *
 * Convenience function for common use case.
 */
export function getDefaultRuntime(): RuntimeAdapter {
  return createRuntime({ type: "pi-agent" });
}
