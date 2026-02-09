/**
 * Heuristic Sentinel - Malicious Content Detector
 *
 * L3 Security Layer for AeonSage.
 * Analyzes command and file content for known malicious patterns.
 */

export type ThreatLevel = "low" | "medium" | "high" | "critical";

export interface ThreatMatch {
  patternId: string;
  level: ThreatLevel;
  description: string;
  snippet: string; // The part of the code that triggered the match
}

export interface ThreatReport {
  detected: boolean;
  maxLevel: ThreatLevel;
  matches: ThreatMatch[];
  score: number; // 0-100 arbitrary risk score
}

interface ThreatSignature {
  id: string;
  level: ThreatLevel;
  description: string;
  regex: RegExp;
  score: number;
}

const SIGNATURES: ThreatSignature[] = [
  // CRITICAL THREATS (System Destruction / Ransomware patterns)
  {
    id: "rm_root",
    level: "critical",
    description: "Attempt to recursively delete root directory",
    regex: /rm\s+-[a-zA-Z]*r[a-zA-Z]*f\s+(\/|--no-preserve-root)/i,
    score: 100,
  },
  {
    id: "fork_bomb",
    level: "critical",
    description: "Fork bomb (DoS attack)",
    regex: /:(\(\)|)\s*{(\s*:\s*|\s*)&(\s*:\s*|)\s*}|:(\(\)|){:|:&};:/,
    score: 100,
  },
  {
    id: "disk_wipe",
    level: "critical",
    description: "Attempt to format or wipe disk/partition",
    regex: /(mkfs\.|dd\s+if=\/dev\/zero\s+of=\/dev\/|fdisk\s+\/dev\/)/,
    score: 100,
  },

  // HIGH THREATS (Reverse Shells / Exfiltration / Critical Config)
  {
    id: "reverse_shell_netcat",
    level: "high",
    description: "Netcat reverse shell pattern",
    regex: /nc\s+(\d{1,3}\.){3}\d{1,3}\s+\d+\s+-e\s+\/bin\/(sh|bash)/,
    score: 80,
  },
  {
    id: "reverse_shell_bash",
    level: "high",
    description: "Bash reverse shell pattern",
    regex: /bash\s+-i\s+>&amp;\s+\/dev\/tcp\/(\d{1,3}\.){3}\d{1,3}\/\d+/,
    score: 80,
  },
  {
    id: "curl_pipe_bash",
    level: "high",
    description: "Downloading and executing remote script directly",
    regex: /(curl|wget)\s+.*\|\s*(bash|sh|zsh)/,
    score: 75,
  },
  {
    id: "etc_shadow_access",
    level: "high",
    description: "Accessing sensitive password file",
    regex: /\/etc\/shadow/,
    score: 85,
  },
  {
    id: "ssh_key_theft",
    level: "high",
    description: "Accessing SSH private keys",
    regex: /(\.ssh\/id_rsa|\.ssh\/id_ed25519)/,
    score: 85,
  },
  {
    id: "chown_root",
    level: "high",
    description: "Changing file ownership to root",
    regex: /chown\s+root/,
    score: 70,
  },

  // MEDIUM THREATS (Suspicious Activities)
  {
    id: "hidden_file_creation",
    level: "medium",
    description: "Creating hidden files (potential persistence)",
    regex: /(touch|mkdir|echo.*>)\s+\.[a-zA-Z0-9]+/,
    score: 40,
  },
  {
    id: "chmod_777",
    level: "medium",
    description: "Setting unsafe permissions (777)",
    regex: /chmod\s+(-R\s+)?777/,
    score: 50,
  },
  {
    id: "base64_decode_exec",
    level: "medium",
    description: "Executing encoded payload",
    regex: /(base64|openssl)\s+(-d|enc)\s+.*\|\s*(bash|sh)/,
    score: 60,
  },

  // LOW THREATS (Reconnaissance)
  {
    id: "env_dump",
    level: "low",
    description: "Dumping environment variables",
    regex: /(printenv|env)(?!\s)/, // exact match or start of command
    score: 20,
  },
  {
    id: "whoami_check",
    level: "low",
    description: "Checking current user identity",
    regex: /whoami/,
    score: 10,
  },
];

export class HeuristicSentinel {
  private static instance: HeuristicSentinel;

  private constructor() {}

  public static getInstance(): HeuristicSentinel {
    if (!HeuristicSentinel.instance) {
      HeuristicSentinel.instance = new HeuristicSentinel();
    }
    return HeuristicSentinel.instance;
  }

  /**
   * Scan content for threats
   */
  public scan(content: string): ThreatReport {
    const matches: ThreatMatch[] = [];
    let totalScore = 0;
    let maxLevel: ThreatLevel = "low";

    // Normalize content strictly for matching (keep original for logging)
    // We do minimal normalization to avoid bypassing (e.g. whitespace tricks)
    const normalized = content.replace(/\\\n/g, ""); // Join escaped newlines

    for (const sig of SIGNATURES) {
      const match = normalized.match(sig.regex);
      if (match) {
        matches.push({
          patternId: sig.id,
          level: sig.level,
          description: sig.description,
          snippet: match[0],
        });
        totalScore += sig.score;

        // Update max level
        if (this.getLevelScore(sig.level) > this.getLevelScore(maxLevel)) {
          maxLevel = sig.level;
        }
      }
    }

    // Additional heuristics
    // Detect extremely long base64 strings (potential payload)
    const longBase64 = content.match(/[A-Za-z0-9+/]{100,}={0,2}/g);
    if (longBase64) {
      matches.push({
        patternId: "suspected_payload",
        level: "medium",
        description: "Large obfuscated data blob detected",
        snippet: longBase64[0].substring(0, 20) + "...",
      });
      totalScore += 30;
      if (this.getLevelScore("medium") > this.getLevelScore(maxLevel)) maxLevel = "medium";
    }

    return {
      detected: matches.length > 0,
      maxLevel: matches.length > 0 ? maxLevel : "low",
      matches,
      score: Math.min(totalScore, 100), // Cap at 100
    };
  }

  // Helper to compare levels
  private getLevelScore(level: ThreatLevel): number {
    switch (level) {
      case "critical":
        return 4;
      case "high":
        return 3;
      case "medium":
        return 2;
      case "low":
        return 1;
      default:
        return 0;
    }
  }
}

export const sentinel = HeuristicSentinel.getInstance();
