import { describe, expect, it } from "vitest";

import { applySecurityModeDefaults } from "./defaults.js";

describe("applySecurityModeDefaults", () => {
  it("applies secure defaults when unset", () => {
    const result = applySecurityModeDefaults({
      gateway: { securityMode: "secure" },
    });

    expect(result.tools?.profile).toBe("minimal");
    expect(result.tools?.exec?.security).toBe("allowlist");
    expect(result.tools?.exec?.ask).toBe("on-miss");
  });

  it("respects explicit tool overrides", () => {
    const result = applySecurityModeDefaults({
      gateway: { securityMode: "efficient" },
      tools: {
        profile: "minimal",
        exec: { security: "allowlist", ask: "always" },
      },
    });

    expect(result.tools?.profile).toBe("minimal");
    expect(result.tools?.exec?.security).toBe("allowlist");
    expect(result.tools?.exec?.ask).toBe("always");
  });
});
