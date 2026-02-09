import { loadConfig, writeConfigFile } from "../../config/config.js";
import type { AgentConfig } from "../../config/types.agents.js";
import { normalizeAgentId } from "../../routing/session-key.js";
import {
  ErrorCodes,
  errorShape,
  formatValidationErrors,
  validateAgentsListParams,
  validateAgentsCreateParams,
  validateAgentsUpdateParams,
  validateAgentsDeleteParams,
} from "../protocol/index.js";
import { listAgentsForGateway } from "../session-utils.js";
import type { GatewayRequestHandlers } from "./types.js";

export const agentsHandlers: GatewayRequestHandlers = {
  "agents.list": ({ params, respond }) => {
    if (!validateAgentsListParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid agents.list params: ${formatValidationErrors(validateAgentsListParams.errors)}`,
        ),
      );
      return;
    }

    const cfg = loadConfig();
    const result = listAgentsForGateway(cfg);
    respond(true, result, undefined);
  },

  "agents.create": async ({ params, respond }) => {
    if (!validateAgentsCreateParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid agents.create params: ${formatValidationErrors(validateAgentsCreateParams.errors)}`,
        ),
      );
      return;
    }

    const { id, name, model, workspace, identity, default: isDefault } = params as {
      id: string;
      name?: string;
      model?: string;
      workspace?: string;
      identity?: { name?: string; theme?: string; emoji?: string; avatar?: string };
      default?: boolean;
    };

    const normalizedId = normalizeAgentId(id);
    const cfg = loadConfig();
    const agents = cfg.agents?.list ?? [];

    // Check for duplicate
    if (agents.some((a) => normalizeAgentId(a.id) === normalizedId)) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, `agent "${normalizedId}" already exists`));
      return;
    }

    const newAgent: AgentConfig = { id: normalizedId };
    if (name) newAgent.name = name;
    if (model) newAgent.model = model;
    if (workspace) newAgent.workspace = workspace;
    if (identity) newAgent.identity = identity;
    if (isDefault) newAgent.default = true;

    const updatedConfig = {
      ...cfg,
      agents: {
        ...cfg.agents,
        list: [...agents, newAgent],
      },
    };

    try {
      await writeConfigFile(updatedConfig);
      respond(true, { ok: true, agentId: normalizedId, message: "agent created" }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, `failed to save config: ${String(err)}`));
    }
  },

  "agents.update": async ({ params, respond }) => {
    if (!validateAgentsUpdateParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid agents.update params: ${formatValidationErrors(validateAgentsUpdateParams.errors)}`,
        ),
      );
      return;
    }

    const { id, name, model, workspace, identity, default: isDefault } = params as {
      id: string;
      name?: string;
      model?: string;
      workspace?: string;
      identity?: { name?: string; theme?: string; emoji?: string; avatar?: string };
      default?: boolean;
    };

    const normalizedId = normalizeAgentId(id);
    const cfg = loadConfig();
    const agents = cfg.agents?.list ?? [];
    const idx = agents.findIndex((a) => normalizeAgentId(a.id) === normalizedId);

    if (idx === -1) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, `agent "${normalizedId}" not found`));
      return;
    }

    const updated = { ...agents[idx] };
    if (name !== undefined) updated.name = name || undefined;
    if (model !== undefined) updated.model = model || undefined;
    if (workspace !== undefined) updated.workspace = workspace || undefined;
    if (identity !== undefined) updated.identity = identity;
    if (isDefault !== undefined) updated.default = isDefault || undefined;

    const updatedList = [...agents];
    updatedList[idx] = updated;

    const updatedConfig = {
      ...cfg,
      agents: {
        ...cfg.agents,
        list: updatedList,
      },
    };

    try {
      await writeConfigFile(updatedConfig);
      respond(true, { ok: true, agentId: normalizedId, message: "agent updated" }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, `failed to save config: ${String(err)}`));
    }
  },

  "agents.delete": async ({ params, respond }) => {
    if (!validateAgentsDeleteParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid agents.delete params: ${formatValidationErrors(validateAgentsDeleteParams.errors)}`,
        ),
      );
      return;
    }

    const { id } = params as { id: string };
    const normalizedId = normalizeAgentId(id);
    const cfg = loadConfig();
    const agents = cfg.agents?.list ?? [];
    const idx = agents.findIndex((a) => normalizeAgentId(a.id) === normalizedId);

    if (idx === -1) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, `agent "${normalizedId}" not found`));
      return;
    }

    // Prevent deleting the default agent
    if (agents[idx].default) {
      respond(false, undefined, errorShape(ErrorCodes.INVALID_REQUEST, `cannot delete the default agent`));
      return;
    }

    const updatedList = agents.filter((_, i) => i !== idx);

    const updatedConfig = {
      ...cfg,
      agents: {
        ...cfg.agents,
        list: updatedList,
      },
    };

    try {
      await writeConfigFile(updatedConfig);
      respond(true, { ok: true, agentId: normalizedId, message: "agent deleted" }, undefined);
    } catch (err) {
      respond(false, undefined, errorShape(ErrorCodes.UNAVAILABLE, `failed to save config: ${String(err)}`));
    }
  },
};
