/**
 * AeonSafe Security Module - Open Source Edition
 *
 * Security assessment tools are not available in the Open Source edition.
 * This module exports stubs for API compatibility.
 */

export interface ToolResult {
  success: boolean;
  tool: string;
  output: string;
  findings: ScanFinding[];
  error?: string;
}

export interface ScanFinding {
  severity: string;
  title: string;
  description: string;
  target?: string;
}

export interface ToolConfig {
  id: string;
  name: string;
  binary: string;
  description: string;
  available: boolean;
}

export type GuardianToolId = "nmap" | "nuclei" | "httpx";

export const GUARDIAN_TOOLS: Record<string, ToolConfig> = {};

export async function runTool(_toolId: string, _args: string[]): Promise<ToolResult> {
  return {
    success: false,
    tool: _toolId,
    output: "Security tools are not available in the Open Source edition.",
    findings: [],
    error: "PRO feature",
  };
}

export function isToolAvailable(_toolId: string): boolean {
  return false;
}

export function getAvailableTools(): ToolConfig[] {
  return [];
}

export function getToolVersion(_toolId: string): string | null {
  return null;
}