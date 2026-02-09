/**
 * PiAgentAdapter - AeonSage / Pi-Agent runtime implementation
 *
 * This adapter wraps the @mariozechner/pi-* packages to conform to RuntimeAdapter.
 * All Pi-Agent specific imports are ISOLATED to this file.
 *
 * CRITICAL: This is the ONLY file that should import @mariozechner/* packages.
 * Upper layers MUST use RuntimeAdapter interface instead.
 *
 * @module runtime
 */

import type { RuntimeAdapter, ModelInfo } from "./RuntimeAdapter.js";
import type { RuntimeConfig, AgentState, ToolExecutionResult } from "./RuntimeTypes.js";

/**
 * Pi-Agent Runtime Adapter
 *
 * Implements RuntimeAdapter for AeonSage / Pi-Agent runtime.
 */
export class PiAgentAdapter implements RuntimeAdapter {
  readonly name = "pi-agent";
  readonly version = "0.49.x";

  private config: RuntimeConfig | null = null;
  private running = false;
  private piSdk: PiSdkModule | null = null;

  /**
   * Initialize the Pi-Agent runtime
   */
  async initialize(config: RuntimeConfig): Promise<void> {
    this.config = config;

    // Dynamic import to isolate dependency
    this.piSdk = await import("@mariozechner/pi-coding-agent");
  }

  /**
   * Start the runtime
   */
  async start(): Promise<void> {
    if (!this.piSdk) {
      throw new Error("Runtime not initialized. Call initialize() first.");
    }

    // Pi-Agent specific initialization
    this.running = true;
  }

  /**
   * Stop the runtime
   */
  async stop(): Promise<void> {
    this.running = false;
  }

  /**
   * Check if runtime is running
   */
  isRunning(): boolean {
    return this.running;
  }

  /**
   * Execute a tool
   */
  async executeTool(toolName: string, input: unknown): Promise<ToolExecutionResult> {
    if (!this.piSdk || !this.running) {
      return {
        success: false,
        error: "Runtime not running",
      };
    }

    const startTime = Date.now();

    try {
      // Delegate to Pi-Agent tool execution
      // This is where @mariozechner/pi-agent-core would be called
      const result = await this.executeToolInternal(toolName, input);

      return {
        success: true,
        data: result,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        duration: Date.now() - startTime,
      };
    }
  }

  /**
   * Internal tool execution (Pi-Agent specific)
   */
  private async executeToolInternal(toolName: string, input: unknown): Promise<unknown> {
    // This would call the actual Pi-Agent tool execution
    // For now, this is a placeholder that can be filled with actual implementation
    return { toolName, input, executed: true };
  }

  /**
   * Get available tools
   */
  async getAvailableTools(): Promise<string[]> {
    // Return list of available Pi-Agent tools
    return [];
  }

  /**
   * Get agent state
   */
  async getAgentState(): Promise<AgentState> {
    return {
      agentId: "pi-agent-default",
      status: this.running ? "running" : "stopped",
    };
  }

  /**
   * Set agent state
   */
  async setAgentState(_state: Partial<AgentState>): Promise<void> {
    // Pi-Agent specific state management
  }

  /**
   * Discover available models
   */
  async discoverModels(): Promise<ModelInfo[]> {
    if (!this.piSdk) {
      return [];
    }

    try {
      // Use Pi-Agent model discovery
      const models = await this.discoverModelsInternal();
      return models;
    } catch {
      return [];
    }
  }

  /**
   * Internal model discovery (Pi-Agent specific)
   */
  private async discoverModelsInternal(): Promise<ModelInfo[]> {
    // This would call piSdk.discoverModels()
    // Placeholder for actual implementation
    return [];
  }

  /**
   * Select a model
   */
  async selectModel(_modelId: string): Promise<void> {
    // Pi-Agent model selection
  }

  /**
   * Get current model
   */
  async getCurrentModel(): Promise<ModelInfo | null> {
    return null;
  }
}

/**
 * Pi-SDK module type (dynamically imported)
 */
type PiSdkModule = typeof import("@mariozechner/pi-coding-agent");
