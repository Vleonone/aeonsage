import type { AeonSagePluginApi } from "../../src/plugins/types.js";

import { createLlmTaskTool } from "./src/llm-task-tool.js";

export default function register(api: AeonSagePluginApi) {
  api.registerTool(createLlmTaskTool(api), { optional: true });
}
