import type { AeonSagePluginApi } from "aeonsage/plugin-sdk";
import { emptyPluginConfigSchema } from "aeonsage/plugin-sdk";

import { createDiagnosticsOtelService } from "./src/service.js";

const plugin = {
  id: "diagnostics-otel",
  name: "Diagnostics OpenTelemetry",
  description: "Export diagnostics events to OpenTelemetry",
  configSchema: emptyPluginConfigSchema(),
  register(api: AeonSagePluginApi) {
    api.registerService(createDiagnosticsOtelService());
  },
};

export default plugin;
