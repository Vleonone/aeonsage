import {
  ErrorCodes,
  errorShape,
  formatValidationErrors,
  validateMarketplaceSkillsSearchParams,
  validateMarketplaceSkillsSyncParams,
  validateMarketplaceSkillsStatsParams,
  validateMarketplaceSourcesListParams,
  validateMarketplaceToolsRegistryParams,
  validateMarketplaceToolsSyncParams,
} from "../protocol/index.js";
import type { GatewayRequestHandlers } from "./types.js";
import {
  getMarketplaceSkillsStats,
  searchMarketplaceSkills,
  shouldSyncMarketplaceSkills,
  syncMarketplaceSkills,
} from "../../marketplace/skills.js";
import type { SkillSearchOptions } from "../../skills/skill-types.js";
import { getMarketplaceToolsRegistry } from "../../marketplace/tools.js";
import { listMarketplaceSources } from "../../marketplace/sources.js";

export const marketplaceHandlers: GatewayRequestHandlers = {
  "marketplace.skills.search": ({ params, respond }) => {
    if (!validateMarketplaceSkillsSearchParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid marketplace.skills.search params: ${formatValidationErrors(
            validateMarketplaceSkillsSearchParams.errors,
          )}`,
        ),
      );
      return;
    }
    const p = params as {
      query?: string;
      category?: string;
      installedOnly?: boolean;
      limit?: number;
      offset?: number;
      sourceId?: string;
    };
    if (shouldSyncMarketplaceSkills()) {
      void syncMarketplaceSkills();
    }
    const result = searchMarketplaceSkills({
      query: p.query,
      category: p.category as SkillSearchOptions["category"],
      installedOnly: p.installedOnly,
      limit: p.limit,
      offset: p.offset,
      sourceId: p.sourceId,
    });
    respond(true, result, undefined);
  },
  "marketplace.skills.stats": ({ params, respond }) => {
    if (!validateMarketplaceSkillsStatsParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid marketplace.skills.stats params: ${formatValidationErrors(
            validateMarketplaceSkillsStatsParams.errors,
          )}`,
        ),
      );
      return;
    }
    const stats = getMarketplaceSkillsStats();
    respond(true, stats, undefined);
  },
  "marketplace.skills.sync": async ({ params, respond }) => {
    if (!validateMarketplaceSkillsSyncParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid marketplace.skills.sync params: ${formatValidationErrors(
            validateMarketplaceSkillsSyncParams.errors,
          )}`,
        ),
      );
      return;
    }
    const result = await syncMarketplaceSkills();
    respond(
      result.success,
      result,
      result.success
        ? undefined
        : errorShape(ErrorCodes.UNAVAILABLE, result.error ?? "sync failed"),
    );
  },
  "marketplace.tools.registry": ({ params, respond }) => {
    if (!validateMarketplaceToolsRegistryParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid marketplace.tools.registry params: ${formatValidationErrors(
            validateMarketplaceToolsRegistryParams.errors,
          )}`,
        ),
      );
      return;
    }
    respond(true, getMarketplaceToolsRegistry(), undefined);
  },
  "marketplace.tools.sync": ({ params, respond }) => {
    if (!validateMarketplaceToolsSyncParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid marketplace.tools.sync params: ${formatValidationErrors(
            validateMarketplaceToolsSyncParams.errors,
          )}`,
        ),
      );
      return;
    }
    respond(true, { ok: true }, undefined);
  },
  "marketplace.sources.list": ({ params, respond }) => {
    if (!validateMarketplaceSourcesListParams(params)) {
      respond(
        false,
        undefined,
        errorShape(
          ErrorCodes.INVALID_REQUEST,
          `invalid marketplace.sources.list params: ${formatValidationErrors(
            validateMarketplaceSourcesListParams.errors,
          )}`,
        ),
      );
      return;
    }
    respond(true, { sources: listMarketplaceSources() }, undefined);
  },
};
