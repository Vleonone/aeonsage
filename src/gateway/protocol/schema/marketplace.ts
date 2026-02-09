import { Type } from "@sinclair/typebox";

import { NonEmptyString } from "./primitives.js";

export const MarketplaceSkillsSearchParamsSchema = Type.Object(
  {
    query: Type.Optional(Type.String()),
    category: Type.Optional(NonEmptyString),
    installedOnly: Type.Optional(Type.Boolean()),
    limit: Type.Optional(Type.Integer({ minimum: 1, maximum: 200 })),
    offset: Type.Optional(Type.Integer({ minimum: 0 })),
    sourceId: Type.Optional(NonEmptyString),
  },
  { additionalProperties: false },
);

export const MarketplaceSkillsStatsParamsSchema = Type.Object({}, { additionalProperties: false });

export const MarketplaceSkillsSyncParamsSchema = Type.Object({}, { additionalProperties: false });

export const MarketplaceToolsRegistryParamsSchema = Type.Object({}, { additionalProperties: false });

export const MarketplaceToolsSyncParamsSchema = Type.Object({}, { additionalProperties: false });

export const MarketplaceRiskSchema = Type.Object(
  {
    tier: Type.Union([
      Type.Literal("green"),
      Type.Literal("yellow"),
      Type.Literal("red"),
      Type.Literal("unknown"),
    ]),
    reasons: Type.Array(NonEmptyString),
  },
  { additionalProperties: false },
);

export const MarketplaceSkillSchema = Type.Object(
  {
    name: NonEmptyString,
    displayName: Type.Optional(NonEmptyString),
    category: NonEmptyString,
    description: Type.String(),
    author: NonEmptyString,
    url: NonEmptyString,
    repoPath: NonEmptyString,
    tags: Type.Optional(Type.Array(NonEmptyString)),
    installed: Type.Optional(Type.Boolean()),
    localPath: Type.Optional(NonEmptyString),
    updatedAt: Type.Optional(NonEmptyString),
    risk: MarketplaceRiskSchema,
    sourceId: Type.Optional(NonEmptyString),
  },
  { additionalProperties: false },
);

export const MarketplaceSkillsSearchResultSchema = Type.Object(
  {
    skills: Type.Array(MarketplaceSkillSchema),
    total: Type.Integer({ minimum: 0 }),
    lastSync: Type.Optional(NonEmptyString),
    source: Type.Optional(NonEmptyString),
  },
  { additionalProperties: false },
);

export const MarketplaceSkillsStatsResultSchema = Type.Object(
  {
    total: Type.Integer({ minimum: 0 }),
    installed: Type.Integer({ minimum: 0 }),
    categories: Type.Record(NonEmptyString, Type.Integer({ minimum: 0 })),
    lastSync: Type.Optional(NonEmptyString),
    source: Type.Optional(NonEmptyString),
  },
  { additionalProperties: false },
);

export const MarketplaceSkillsSyncResultSchema = Type.Object(
  {
    success: Type.Boolean(),
    skillsAdded: Type.Integer({ minimum: 0 }),
    skillsUpdated: Type.Integer({ minimum: 0 }),
    totalSkills: Type.Integer({ minimum: 0 }),
    error: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export const MarketplaceToolsRegistryResultSchema = Type.Object(
  {
    tools: Type.Array(
      Type.Object(
        {
          id: NonEmptyString,
          name: NonEmptyString,
          description: Type.Optional(Type.String()),
          version: Type.Optional(NonEmptyString),
          source: Type.Optional(NonEmptyString),
          riskTier: Type.Optional(NonEmptyString),
          riskReasons: Type.Optional(Type.Array(NonEmptyString)),
        },
        { additionalProperties: false },
      ),
    ),
    total: Type.Integer({ minimum: 0 }),
    source: Type.Optional(NonEmptyString),
    lastSync: Type.Optional(NonEmptyString),
  },
  { additionalProperties: false },
);

export const MarketplaceToolsSyncResultSchema = Type.Object(
  {
    ok: Type.Boolean(),
  },
  { additionalProperties: false },
);

export const MarketplaceSourceSchema = Type.Object(
  {
    id: NonEmptyString,
    name: NonEmptyString,
    url: NonEmptyString,
    kind: NonEmptyString,
    trust: NonEmptyString,
    notes: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export const MarketplaceSourcesListParamsSchema = Type.Object({}, { additionalProperties: false });

export const MarketplaceSourcesListResultSchema = Type.Object(
  {
    sources: Type.Array(MarketplaceSourceSchema),
  },
  { additionalProperties: false },
);
