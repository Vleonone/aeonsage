/**
 * Kali Security CLI Commands
 *
 * ⚠️ AUTHORIZATION: DEV-only professional tool
 *
 * Provides CLI interface for Kali security tools:
 * - Network scanning
 * - Port scanning
 * - Vulnerability assessment
 * - Reconnaissance
 */

import type { Command } from "commander";
import { buildGatewayConnectionDetails } from "../../gateway/call.js";
import type { AeonSageConfig } from "../../config/config.js";
import { loadConfig } from "../../config/config.js";
import { note } from "../../terminal/note.js";

interface ScanOptions {
  target?: string;
  authorized?: boolean;
  verbose?: boolean;
}

async function callKaliApi(endpoint: string, body: unknown, config: AeonSageConfig) {
  const details = buildGatewayConnectionDetails({ config });
  // Convert ws:// or wss:// to http:// or https://
  const baseUrl = details.url.replace(/^wss?:\/\//, (m) =>
    m === "wss://" ? "https://" : "http://",
  );
  const token = config.gateway?.auth?.token;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(`${baseUrl}${endpoint}`, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API error ${res.status}: ${text}`);
  }

  return res.json();
}

function parseTarget(target: string): { type: string; address: string } {
  if (target === "localhost" || target === "127.0.0.1") {
    return { type: "localhost", address: "127.0.0.1" };
  }
  if (/^\d+\.\d+\.\d+\.\d+$/.test(target)) {
    return { type: "ip", address: target };
  }
  if (/^\d+\.\d+\.\d+\.\d+\/\d+$/.test(target)) {
    return { type: "cidr", address: target };
  }
  return { type: "hostname", address: target };
}

export function registerKaliCommands(program: Command) {
  const kali = program
    .command("kali")
    .description("⚠️ Kali security assessment tools (authorized use only)");

  // Network scan
  kali
    .command("scan:network <target>")
    .description("Perform network discovery scan")
    .option("--authorized", "Confirm authorization for external targets", false)
    .option("-v, --verbose", "Verbose output", false)
    .action(async (target: string, opts: ScanOptions) => {
      const config = loadConfig();
      const parsedTarget = parseTarget(target);
      const isExternal = parsedTarget.type !== "localhost";

      if (isExternal && !opts.authorized) {
        note(
          "⚠️ External target requires explicit authorization.\n" +
            "Add --authorized flag to confirm you have permission.\n" +
            "Example: aeonsage kali scan:network 192.168.1.0/24 --authorized",
          "Authorization Required",
        );
        process.exit(1);
      }

      note(`Scanning network: ${target}...`, "Kali");

      try {
        const result = await callKaliApi(
          "/api/kali/scan/network",
          {
            target: {
              ...parsedTarget,
              authorized: opts.authorized || parsedTarget.type === "localhost",
            },
            options: { verbose: opts.verbose },
          },
          config,
        );

        console.log("\n📊 Network Scan Results:");
        console.log(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error("❌ Scan failed:", err);
        process.exit(1);
      }
    });

  // Port scan
  kali
    .command("scan:ports <target>")
    .description("Scan ports on target")
    .option("--authorized", "Confirm authorization for external targets", false)
    .option("--ports <range>", "Port range (default: 1-1000)", "1-1000")
    .option("-v, --verbose", "Verbose output", false)
    .action(async (target: string, opts: ScanOptions & { ports?: string }) => {
      const config = loadConfig();
      const parsedTarget = parseTarget(target);
      const isExternal = parsedTarget.type !== "localhost";

      if (isExternal && !opts.authorized) {
        note(
          "⚠️ External target requires explicit authorization.\n" +
            "Add --authorized flag to confirm you have permission.",
          "Authorization Required",
        );
        process.exit(1);
      }

      note(`Scanning ports on ${target}: ${opts.ports}...`, "Kali");

      try {
        const result = await callKaliApi(
          "/api/kali/scan/ports",
          {
            target: {
              ...parsedTarget,
              authorized: opts.authorized || parsedTarget.type === "localhost",
            },
            options: {
              portRange: opts.ports,
              verbose: opts.verbose,
            },
          },
          config,
        );

        console.log("\n📊 Port Scan Results:");
        console.log(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error("❌ Scan failed:", err);
        process.exit(1);
      }
    });

  // Vulnerability scan
  kali
    .command("scan:vuln <target>")
    .description("⚠️ CRITICAL: Vulnerability assessment scan")
    .option("--authorized", "Confirm authorization (REQUIRED)", false)
    .option("-v, --verbose", "Verbose output", false)
    .action(async (target: string, opts: ScanOptions) => {
      const config = loadConfig();
      const parsedTarget = parseTarget(target);

      if (!opts.authorized) {
        note(
          "⚠️ CRITICAL: Vulnerability scanning requires explicit authorization.\n" +
            "This tool should only be used against systems you own or have written permission to test.\n" +
            "Add --authorized flag to confirm authorization.",
          "Authorization Required",
        );
        process.exit(1);
      }

      note(`⚠️ Vulnerability scan on ${target}...`, "Kali");

      try {
        const result = await callKaliApi(
          "/api/kali/scan/vulnerability",
          {
            target: {
              ...parsedTarget,
              authorized: true,
            },
            options: { verbose: opts.verbose },
          },
          config,
        );

        console.log("\n📊 Vulnerability Scan Results:");
        console.log(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error("❌ Scan failed:", err);
        process.exit(1);
      }
    });

  // Reconnaissance
  kali
    .command("recon <target>")
    .description("Passive reconnaissance and information gathering")
    .option("--authorized", "Confirm authorization for external targets", false)
    .option("-v, --verbose", "Verbose output", false)
    .action(async (target: string, opts: ScanOptions) => {
      const config = loadConfig();
      const parsedTarget = parseTarget(target);
      const isExternal = parsedTarget.type !== "localhost";

      if (isExternal && !opts.authorized) {
        note(
          "⚠️ External target requires explicit authorization.\n" +
            "Add --authorized flag to confirm you have permission.",
          "Authorization Required",
        );
        process.exit(1);
      }

      note(`Reconnaissance on ${target}...`, "Kali");

      try {
        const result = await callKaliApi(
          "/api/kali/scan/recon",
          {
            target: {
              ...parsedTarget,
              authorized: opts.authorized || parsedTarget.type === "localhost",
            },
            options: { verbose: opts.verbose },
          },
          config,
        );

        console.log("\n📊 Reconnaissance Results:");
        console.log(JSON.stringify(result, null, 2));
      } catch (err) {
        console.error("❌ Recon failed:", err);
        process.exit(1);
      }
    });

  // Report generation
  kali
    .command("report")
    .description("Generate security assessment report")
    .option("--format <format>", "Output format (json|markdown|html)", "markdown")
    .action(async (opts: { format: string }) => {
      const config = loadConfig();

      note("Generating security report...", "Kali");

      try {
        const result = await callKaliApi(
          "/api/kali/report",
          {
            format: opts.format,
          },
          config,
        );

        console.log("\n📄 Security Report Generated:");
        console.log(result.report || JSON.stringify(result, null, 2));
      } catch (err) {
        console.error("❌ Report generation failed:", err);
        process.exit(1);
      }
    });

  return kali;
}
