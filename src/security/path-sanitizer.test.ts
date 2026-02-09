import { describe, expect, it } from "vitest";
import path from "node:path";

import {
  sanitizeId,
  validatePathInSandbox,
  sanitizeEnvironment,
  validateExternalUrl,
  escapeHtml,
} from "./path-sanitizer.js";

const isWindows = process.platform === "win32";

describe("path-sanitizer", () => {
  describe("sanitizeId", () => {
    it("accepts valid alphanumeric IDs", () => {
      expect(sanitizeId("user123")).toBe("user123");
      expect(sanitizeId("my-account")).toBe("my-account");
      expect(sanitizeId("test_id")).toBe("test_id");
    });

    it("trims whitespace from valid IDs", () => {
      expect(sanitizeId("  hello  ")).toBe("hello");
    });

    it("rejects empty or non-string input", () => {
      expect(() => sanitizeId("")).toThrow("id is required");
      expect(() => sanitizeId(null as unknown as string)).toThrow("id is required");
      expect(() => sanitizeId(undefined as unknown as string)).toThrow("id is required");
    });

    it("rejects IDs with disallowed characters", () => {
      expect(() => sanitizeId("user/admin")).toThrow("contains disallowed characters");
      expect(() => sanitizeId("../../etc")).toThrow("contains disallowed characters");
      expect(() => sanitizeId("user name")).toThrow("contains disallowed characters");
      expect(() => sanitizeId("user@host")).toThrow("contains disallowed characters");
      expect(() => sanitizeId("id;drop")).toThrow("contains disallowed characters");
    });

    it("rejects IDs with dot traversal patterns", () => {
      expect(() => sanitizeId("foo..bar")).toThrow("suspicious pattern detected");
    });

    it("rejects IDs starting or ending with a dot", () => {
      expect(() => sanitizeId(".hidden")).toThrow("suspicious pattern detected");
      expect(() => sanitizeId("trailing.")).toThrow("suspicious pattern detected");
    });

    it("uses custom fieldName in error messages", () => {
      expect(() => sanitizeId("", "accountId")).toThrow("accountId is required");
      expect(() => sanitizeId("a/b", "userId")).toThrow("Invalid userId");
    });
  });

  describe("validatePathInSandbox", () => {
    const sandbox = isWindows ? "C:\\sandbox" : "/tmp/sandbox";

    it("accepts paths within the sandbox", () => {
      const result = validatePathInSandbox("file.txt", sandbox);
      expect(result).toBe(path.resolve(sandbox, "file.txt"));
    });

    it("accepts nested paths within the sandbox", () => {
      const result = validatePathInSandbox("sub/dir/file.txt", sandbox);
      expect(result).toBe(path.resolve(sandbox, "sub/dir/file.txt"));
    });

    it("rejects path traversal via ..", () => {
      expect(() => validatePathInSandbox("../../etc/passwd", sandbox)).toThrow();
    });

    it("rejects empty filePath", () => {
      expect(() => validatePathInSandbox("", sandbox)).toThrow("filePath is required");
    });

    it("rejects empty sandboxRoot", () => {
      expect(() => validatePathInSandbox("a.txt", "")).toThrow("sandboxRoot is required");
    });

    if (!isWindows) {
      it("blocks /etc/ paths (Unix)", () => {
        expect(() => validatePathInSandbox("/etc/passwd", "/etc")).toThrow(
          "Dangerous path pattern",
        );
      });

      it("blocks /proc/ paths (Linux)", () => {
        expect(() => validatePathInSandbox("/proc/self/maps", "/proc")).toThrow(
          "Dangerous path pattern",
        );
      });

      it("blocks /dev/ paths (Unix)", () => {
        expect(() => validatePathInSandbox("/dev/null", "/dev")).toThrow("Dangerous path pattern");
      });
    }

    if (isWindows) {
      it("blocks C:\\Windows paths (Windows)", () => {
        expect(() =>
          validatePathInSandbox("C:\\Windows\\System32\\cmd.exe", "C:\\Windows"),
        ).toThrow("Dangerous path pattern");
      });

      it("blocks C:\\Users paths (Windows)", () => {
        expect(() => validatePathInSandbox("C:\\Users\\admin\\secret", "C:\\Users")).toThrow(
          "Dangerous path pattern",
        );
      });
    }
  });

  describe("sanitizeEnvironment", () => {
    it("removes LD_PRELOAD and LD_LIBRARY_PATH", () => {
      const env = {
        LD_PRELOAD: "/evil.so",
        LD_LIBRARY_PATH: "/tmp",
        HOME: "/home/user",
      };
      const result = sanitizeEnvironment(env);
      expect(result).not.toHaveProperty("LD_PRELOAD");
      expect(result).not.toHaveProperty("LD_LIBRARY_PATH");
      expect(result).toHaveProperty("HOME", "/home/user");
    });

    it("removes DYLD_* variables (macOS)", () => {
      const env = {
        DYLD_INSERT_LIBRARIES: "/evil.dylib",
        DYLD_FALLBACK_LIBRARY_PATH: "/tmp",
        TERM: "xterm",
      };
      const result = sanitizeEnvironment(env);
      expect(result).not.toHaveProperty("DYLD_INSERT_LIBRARIES");
      expect(result).not.toHaveProperty("DYLD_FALLBACK_LIBRARY_PATH");
      expect(result).toHaveProperty("TERM", "xterm");
    });

    it("removes PATH to prevent path injection", () => {
      const env = { PATH: "/evil/bin:/usr/bin", SHELL: "/bin/bash" };
      const result = sanitizeEnvironment(env);
      expect(result).not.toHaveProperty("PATH");
      expect(result).toHaveProperty("SHELL");
    });

    it("removes _= prefixed variable", () => {
      // The regex is /^_=/ which matches keys starting with "_="
      const env = { "_=/usr/bin/env": "value", NODE_ENV: "test" };
      const result = sanitizeEnvironment(env);
      expect(result).not.toHaveProperty("_=/usr/bin/env");
      expect(result).toHaveProperty("NODE_ENV", "test");
    });

    it("preserves bare _ variable (not matched by /^_=/)", () => {
      const env = { _: "/usr/bin/env", NODE_ENV: "test" };
      const result = sanitizeEnvironment(env);
      expect(result).toHaveProperty("_", "/usr/bin/env");
    });

    it("preserves safe variables", () => {
      const env = { NODE_ENV: "production", LANG: "en_US.UTF-8", TZ: "UTC" };
      const result = sanitizeEnvironment(env);
      expect(result).toEqual(env);
    });
  });

  describe("validateExternalUrl", () => {
    it("accepts valid external HTTPS URLs", () => {
      expect(validateExternalUrl("https://example.com")).toBe(true);
      expect(validateExternalUrl("https://api.github.com/repos")).toBe(true);
    });

    it("accepts valid external HTTP URLs", () => {
      expect(validateExternalUrl("http://example.com")).toBe(true);
    });

    it("rejects empty or non-string URLs", () => {
      expect(() => validateExternalUrl("")).toThrow("URL is required");
      expect(() => validateExternalUrl(null as unknown as string)).toThrow("URL is required");
    });

    it("blocks file:// protocol", () => {
      expect(() => validateExternalUrl("file:///etc/passwd")).toThrow(
        "file:// URLs are not allowed",
      );
    });

    it("blocks localhost", () => {
      expect(() => validateExternalUrl("http://localhost:3000")).toThrow(
        "Blocked internal/localhost",
      );
    });

    it("blocks 127.0.0.0/8 loopback", () => {
      expect(() => validateExternalUrl("http://127.0.0.1")).toThrow("Blocked internal/localhost");
      expect(() => validateExternalUrl("http://127.0.0.2:8080")).toThrow(
        "Blocked internal/localhost",
      );
    });

    it("blocks 10.0.0.0/8 private range", () => {
      expect(() => validateExternalUrl("http://10.0.0.1")).toThrow("Blocked internal/localhost");
    });

    it("blocks 172.16.0.0/12 private range", () => {
      expect(() => validateExternalUrl("http://172.16.0.1")).toThrow("Blocked internal/localhost");
      expect(() => validateExternalUrl("http://172.31.255.255")).toThrow(
        "Blocked internal/localhost",
      );
    });

    it("blocks 192.168.0.0/16 private range", () => {
      expect(() => validateExternalUrl("http://192.168.1.1")).toThrow("Blocked internal/localhost");
    });

    it("blocks 169.254.0.0/16 link-local", () => {
      expect(() => validateExternalUrl("http://169.254.169.254")).toThrow(
        "Blocked internal/localhost",
      );
    });

    it("does not block bracketed IPv6 localhost (known gap: regex tests ::1 but Node parses hostname as [::1])", () => {
      // Node URL parser keeps brackets: new URL("http://[::1]:3000").hostname === "[::1]"
      // The regex /^::1$/ does not match "[::1]", so this is a known coverage gap
      expect(validateExternalUrl("http://[::1]:3000")).toBe(true);
    });

    it("blocks 0.0.0.0 addresses", () => {
      expect(() => validateExternalUrl("http://0.0.0.0")).toThrow("Blocked internal/localhost");
    });
  });

  describe("escapeHtml", () => {
    it("escapes ampersand", () => {
      expect(escapeHtml("a & b")).toBe("a &amp; b");
    });

    it("escapes angle brackets", () => {
      expect(escapeHtml("<script>")).toBe("&lt;script&gt;");
    });

    it("escapes double quotes", () => {
      expect(escapeHtml('a "b" c')).toBe("a &quot;b&quot; c");
    });

    it("escapes single quotes", () => {
      expect(escapeHtml("a 'b' c")).toBe("a &#039;b&#039; c");
    });

    it("escapes all dangerous characters in one string", () => {
      expect(escapeHtml(`<div class="x" data='y'>&`)).toBe(
        "&lt;div class=&quot;x&quot; data=&#039;y&#039;&gt;&amp;",
      );
    });

    it("returns empty string unchanged", () => {
      expect(escapeHtml("")).toBe("");
    });

    it("returns plain text unchanged", () => {
      expect(escapeHtml("hello world 123")).toBe("hello world 123");
    });
  });
});
