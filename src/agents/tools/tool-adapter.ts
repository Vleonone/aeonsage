/**
 * Tool Adapter
 *
 * Converts MCP-style tools (inputSchema/call) to AeonSage format (parameters/execute).
 */

import { Type, type TObject, type TProperties } from "@sinclair/typebox";
import type { AnyAgentTool } from "./common.js";

export interface McpToolDefinition {
  name: string;
  label?: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<
      string,
      {
        type: string | string[];
        description?: string;
        enum?: string[];
        items?: { type: string; properties?: unknown };
      }
    >;
    required?: string[];
  };
  call: (input: unknown) => Promise<unknown>;
}

/**
 * Convert JSON Schema type to TypeBox type
 */
function jsonTypeToTypebox(propDef: {
  type: string | string[];
  description?: string;
  enum?: string[];
  items?: { type: string };
}): unknown {
  const desc = propDef.description ? { description: propDef.description } : {};
  const type = Array.isArray(propDef.type) ? propDef.type[0] : propDef.type;

  if (propDef.enum) {
    return Type.Union(
      propDef.enum.map((v) => Type.Literal(v)),
      desc,
    );
  }

  switch (type) {
    case "string":
      return Type.String(desc);
    case "number":
      return Type.Number(desc);
    case "boolean":
      return Type.Boolean(desc);
    case "array":
      if (propDef.items?.type === "string") {
        return Type.Array(Type.String(), desc);
      }
      return Type.Array(Type.Unknown(), desc);
    case "object":
      return Type.Unknown(desc);
    default:
      return Type.Unknown(desc);
  }
}

/**
 * Convert MCP inputSchema to TypeBox schema
 */
function convertSchema(inputSchema: McpToolDefinition["inputSchema"]): TObject<TProperties> {
  const properties: TProperties = {};

  for (const [key, propDef] of Object.entries(inputSchema.properties)) {
    const typeboxType = jsonTypeToTypebox(propDef) as TProperties[string];
    // Make optional if not required
    if (!inputSchema.required?.includes(key)) {
      properties[key] = Type.Optional(typeboxType);
    } else {
      properties[key] = typeboxType;
    }
  }

  return Type.Object(properties);
}

/**
 * Adapt an MCP-style tool to AeonSage format
 */
export function adaptMcpTool(tool: McpToolDefinition): AnyAgentTool {
  const parameters = convertSchema(tool.inputSchema);

  return {
    label: tool.label ?? tool.name,
    name: tool.name,
    description: tool.description,
    parameters,
    execute: async (_toolCallId, args) => {
      try {
        const result = await tool.call(args);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(result, null, 2),
            },
          ],
          details: result,
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
            },
          ],
          details: { error: error instanceof Error ? error.message : "Unknown error" },
        };
      }
    },
  };
}

/**
 * Create a wrapper factory that adapts MCP tools
 */
export function createMcpToolAdapter<T extends Record<string, unknown>>(
  createFn: (params: T) => McpToolDefinition,
): (params: T) => AnyAgentTool {
  return (params: T) => adaptMcpTool(createFn(params));
}
