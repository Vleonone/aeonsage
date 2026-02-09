/**
 * RuntimeTypes - Shared type definitions for runtime abstraction
 *
 * These types are runtime-agnostic and used across all adapter implementations.
 *
 * @module runtime
 */

/**
 * Runtime configuration
 */
export interface RuntimeConfig {
  /**
   * Runtime type identifier
   */
  type: "pi-agent" | "langgraph" | "crewai" | "custom";

  /**
   * Agent directory path
   */
  agentDir?: string;

  /**
   * Debug mode
   */
  debug?: boolean;

  /**
   * Runtime-specific options
   */
  options?: Record<string, unknown>;
}

/**
 * Agent state representation
 */
export interface AgentState {
  /**
   * Unique agent identifier
   */
  agentId: string;

  /**
   * Current session ID
   */
  sessionId?: string;

  /**
   * Agent status
   */
  status: "idle" | "running" | "paused" | "stopped";

  /**
   * Current context
   */
  context?: AgentContext;

  /**
   * Metadata
   */
  metadata?: Record<string, unknown>;
}

/**
 * Agent context
 */
export interface AgentContext {
  /**
   * Conversation history
   */
  history?: ConversationMessage[];

  /**
   * Active tools
   */
  activeTools?: string[];

  /**
   * Current working directory
   */
  cwd?: string;
}

/**
 * Conversation message
 */
export interface ConversationMessage {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  timestamp?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Tool execution result
 */
export interface ToolExecutionResult {
  /**
   * Whether the execution succeeded
   */
  success: boolean;

  /**
   * Result data (if successful)
   */
  data?: unknown;

  /**
   * Error message (if failed)
   */
  error?: string;

  /**
   * Execution duration in milliseconds
   */
  duration?: number;

  /**
   * Additional metadata
   */
  metadata?: Record<string, unknown>;
}
