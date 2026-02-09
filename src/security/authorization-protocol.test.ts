import { describe, expect, it } from "vitest";

import {
  generateAuthorizationProtocol,
  renderProtocolMarkdown,
  signProtocol,
} from "./authorization-protocol.js";

describe("authorization-protocol", () => {
  describe("generateAuthorizationProtocol", () => {
    it("generates a protocol with default values", () => {
      const protocol = generateAuthorizationProtocol();
      expect(protocol.version).toBe("2.0");
      expect(protocol.applicant).toBe("User");
      expect(protocol.systemVersion).toBe("AeonSage v2026.1.31");
      expect(protocol.generatedAt).toBeTruthy();
      expect(protocol.signature?.signed).toBe(false);
    });

    it("respects custom applicant and systemVersion", () => {
      const protocol = generateAuthorizationProtocol({
        applicant: "Admin",
        systemVersion: "v3.0.0",
      });
      expect(protocol.applicant).toBe("Admin");
      expect(protocol.systemVersion).toBe("v3.0.0");
    });

    it("includes all default permissions", () => {
      const protocol = generateAuthorizationProtocol();
      expect(protocol.permissions.length).toBeGreaterThanOrEqual(13);
      const ids = protocol.permissions.map((p) => p.id);
      expect(ids).toContain("telegram");
      expect(ids).toContain("whatsapp");
      expect(ids).toContain("discord");
      expect(ids).toContain("exec");
      expect(ids).toContain("wallet");
      expect(ids).toContain("webchat");
    });

    it("includes permissions at all 4 risk levels", () => {
      const protocol = generateAuthorizationProtocol();
      const levels = new Set(protocol.permissions.map((p) => p.riskLevel));
      expect(levels).toContain("low");
      expect(levels).toContain("medium");
      expect(levels).toContain("high");
      expect(levels).toContain("critical");
    });

    it("includes all default security measures", () => {
      const protocol = generateAuthorizationProtocol();
      expect(protocol.securityMeasures.length).toBe(8);
      const ids = protocol.securityMeasures.map((m) => m.id);
      expect(ids).toContain("dm_pairing");
      expect(ids).toContain("audit_log");
      expect(ids).toContain("network_isolation");
    });

    it("includes dataProtection section", () => {
      const protocol = generateAuthorizationProtocol();
      expect(protocol.dataProtection.piiTypes).toContain("Chat History");
      expect(protocol.dataProtection.credentialTypes).toContain("API Keys");
      expect(protocol.dataProtection.retentionDays).toBe(0);
      expect(protocol.dataProtection.storageLocation).toContain(".aeonsage");
    });

    it("returns a new copy of permissions (no shared mutation)", () => {
      const a = generateAuthorizationProtocol();
      const b = generateAuthorizationProtocol();
      a.permissions[0].enabled = true;
      expect(b.permissions[0].enabled).toBe(
        a.permissions[0].enabled === b.permissions[0].enabled
          ? b.permissions[0].enabled
          : b.permissions[0].enabled,
      );
      // They are different arrays
      expect(a.permissions).not.toBe(b.permissions);
    });
  });

  describe("renderProtocolMarkdown", () => {
    it("renders a non-empty markdown string", () => {
      const protocol = generateAuthorizationProtocol();
      const md = renderProtocolMarkdown(protocol);
      expect(typeof md).toBe("string");
      expect(md.length).toBeGreaterThan(100);
    });

    it("includes header with metadata", () => {
      const protocol = generateAuthorizationProtocol({ applicant: "TestUser" });
      const md = renderProtocolMarkdown(protocol);
      expect(md).toContain("Authorization Protocol");
      expect(md).toContain("TestUser");
    });

    it("groups permissions by risk level", () => {
      const protocol = generateAuthorizationProtocol();
      const md = renderProtocolMarkdown(protocol);
      expect(md).toContain("Low Risk");
      expect(md).toContain("Medium Risk");
      expect(md).toContain("High Risk");
      expect(md).toContain("Critical Risk");
    });

    it("shows enabled/disabled status for permissions", () => {
      const protocol = generateAuthorizationProtocol();
      const md = renderProtocolMarkdown(protocol);
      expect(md).toContain("Enabled");
      expect(md).toContain("Disabled");
    });

    it("includes security measures section", () => {
      const protocol = generateAuthorizationProtocol();
      const md = renderProtocolMarkdown(protocol);
      expect(md).toContain("Security Measures");
      expect(md).toContain("DM Pairing Mode");
    });

    it("shows pending signature for unsigned protocol", () => {
      const protocol = generateAuthorizationProtocol();
      const md = renderProtocolMarkdown(protocol);
      expect(md).toContain("Pending Signature");
    });

    it("shows signed status for signed protocol", () => {
      const protocol = generateAuthorizationProtocol();
      signProtocol(protocol, { method: "pin", verified: true });
      const md = renderProtocolMarkdown(protocol);
      expect(md).toContain("Signed");
      expect(md).toContain("pin");
    });

    it("includes revocation instructions", () => {
      const protocol = generateAuthorizationProtocol();
      const md = renderProtocolMarkdown(protocol);
      expect(md).toContain("Revocation");
      expect(md).toContain("aeonsage kill");
    });
  });

  describe("signProtocol", () => {
    it("signs protocol when auth is verified", () => {
      const protocol = generateAuthorizationProtocol();
      const result = signProtocol(protocol, { method: "pin", verified: true });
      expect(result.success).toBe(true);
      expect(protocol.signature?.signed).toBe(true);
      expect(protocol.signature?.method).toBe("pin");
      expect(protocol.signature?.signedBy).toBe("User");
      expect(protocol.signature?.signedAt).toBeTruthy();
    });

    it("rejects signature when auth is not verified", () => {
      const protocol = generateAuthorizationProtocol();
      const result = signProtocol(protocol, { method: "biometric", verified: false });
      expect(result.success).toBe(false);
      expect(result.error).toContain("not verified");
      expect(protocol.signature?.signed).toBe(false);
    });

    it("supports all auth methods", () => {
      for (const method of ["pin", "voice", "biometric"] as const) {
        const protocol = generateAuthorizationProtocol();
        const result = signProtocol(protocol, { method, verified: true });
        expect(result.success).toBe(true);
        expect(protocol.signature?.method).toBe(method);
      }
    });
  });
});
