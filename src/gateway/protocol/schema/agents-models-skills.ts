import { Type } from "@sinclair/typebox";

import { NonEmptyString } from "./primitives.js";

export const ModelChoiceSchema = Type.Object(
  {
    id: NonEmptyString,
    name: NonEmptyString,
    provider: NonEmptyString,
    contextWindow: Type.Optional(Type.Integer({ minimum: 1 })),
    reasoning: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);

export const AgentSummarySchema = Type.Object(
  {
    id: NonEmptyString,
    name: Type.Optional(NonEmptyString),
    identity: Type.Optional(
      Type.Object(
        {
          name: Type.Optional(NonEmptyString),
          theme: Type.Optional(NonEmptyString),
          emoji: Type.Optional(NonEmptyString),
          avatar: Type.Optional(NonEmptyString),
          avatarUrl: Type.Optional(NonEmptyString),
        },
        { additionalProperties: false },
      ),
    ),
  },
  { additionalProperties: false },
);

export const AgentsListParamsSchema = Type.Object({}, { additionalProperties: false });

export const AgentsListResultSchema = Type.Object(
  {
    defaultId: NonEmptyString,
    mainKey: NonEmptyString,
    scope: Type.Union([Type.Literal("per-sender"), Type.Literal("global")]),
    agents: Type.Array(AgentSummarySchema),
  },
  { additionalProperties: false },
);

// --- Agent CRUD Schemas ---

export const AgentsCreateParamsSchema = Type.Object(
  {
    id: NonEmptyString,
    name: Type.Optional(Type.String()),
    model: Type.Optional(Type.String()),
    workspace: Type.Optional(Type.String()),
    identity: Type.Optional(
      Type.Object(
        {
          name: Type.Optional(Type.String()),
          theme: Type.Optional(Type.String()),
          emoji: Type.Optional(Type.String()),
          avatar: Type.Optional(Type.String()),
        },
        { additionalProperties: false },
      ),
    ),
    default: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);

export const AgentsUpdateParamsSchema = Type.Object(
  {
    id: NonEmptyString,
    name: Type.Optional(Type.String()),
    model: Type.Optional(Type.String()),
    workspace: Type.Optional(Type.String()),
    identity: Type.Optional(
      Type.Object(
        {
          name: Type.Optional(Type.String()),
          theme: Type.Optional(Type.String()),
          emoji: Type.Optional(Type.String()),
          avatar: Type.Optional(Type.String()),
        },
        { additionalProperties: false },
      ),
    ),
    default: Type.Optional(Type.Boolean()),
  },
  { additionalProperties: false },
);

export const AgentsDeleteParamsSchema = Type.Object(
  {
    id: NonEmptyString,
  },
  { additionalProperties: false },
);

export const AgentsCrudResultSchema = Type.Object(
  {
    ok: Type.Boolean(),
    agentId: NonEmptyString,
    message: Type.Optional(Type.String()),
  },
  { additionalProperties: false },
);

export const ModelsListParamsSchema = Type.Object({}, { additionalProperties: false });

export const ModelsListResultSchema = Type.Object(
  {
    models: Type.Array(ModelChoiceSchema),
  },
  { additionalProperties: false },
);

export const SkillsStatusParamsSchema = Type.Object({}, { additionalProperties: false });

export const SkillsBinsParamsSchema = Type.Object({}, { additionalProperties: false });

export const SkillsBinsResultSchema = Type.Object(
  {
    bins: Type.Array(NonEmptyString),
  },
  { additionalProperties: false },
);

export const SkillsInstallParamsSchema = Type.Object(
  {
    name: NonEmptyString,
    installId: NonEmptyString,
    timeoutMs: Type.Optional(Type.Integer({ minimum: 1000 })),
  },
  { additionalProperties: false },
);

export const SkillsUpdateParamsSchema = Type.Object(
  {
    skillKey: NonEmptyString,
    enabled: Type.Optional(Type.Boolean()),
    apiKey: Type.Optional(Type.String()),
    env: Type.Optional(Type.Record(NonEmptyString, Type.String())),
  },
  { additionalProperties: false },
);
