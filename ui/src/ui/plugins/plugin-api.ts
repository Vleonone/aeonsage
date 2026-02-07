/**
 * IDE Plugin API - Plugin SDK Interface
 *
 * ⚠️ AUTHORIZATION: This module is for authorized DEV use only.
 * Not included in public open-source distribution.
 *
 * Provides extension points for:
 * - Terminal commands
 * - Editor actions
 * - Sidebar panels
 * - Security tools (Kali)
 */

/**
 * Plugin risk levels per senior engineer review
 */
export type PluginRiskLevel = "low" | "medium" | "high" | "critical";

/**
 * Plugin trust levels
 */
export type PluginTrustLevel = "official" | "community" | "third-party";

/**
 * Plugin manifest (required for all plugins)
 */
export interface PluginManifest {
    /** Unique plugin ID */
    id: string;

    /** Display name */
    name: string;

    /** Version (semver) */
    version: string;

    /** Description */
    description: string;

    /** Author */
    author: string;

    /** Permissions required */
    permissions: PluginPermission[];

    /** Risk level - high/critical requires human confirmation */
    riskLevel: PluginRiskLevel;

    /** Trust level */
    trusted: PluginTrustLevel;

    /** Category */
    category: "utility" | "editor" | "terminal" | "security" | "ai";

    /** Entry point */
    main: string;
}

/**
 * Plugin permissions
 */
export type PluginPermission =
    | "terminal:read"
    | "terminal:write"
    | "filesystem:read"
    | "filesystem:write"
    | "network:local"
    | "network:external"
    | "ai:chat"
    | "security:scan"
    | "security:assess";

/**
 * Plugin lifecycle hooks
 */
export interface PluginHooks {
    /** Called when plugin is activated */
    onActivate?: (context: PluginContext) => void | Promise<void>;

    /** Called when plugin is deactivated */
    onDeactivate?: () => void | Promise<void>;

    /** Called on terminal command */
    onTerminalCommand?: (cmd: string) => TerminalCommandResult | null;

    /** Called on editor action */
    onEditorAction?: (action: string, context: EditorContext) => void;
}

/**
 * Plugin context provided on activation
 */
export interface PluginContext {
    /** Plugin manifest */
    manifest: PluginManifest;

    /** Logger */
    log: PluginLogger;

    /** Terminal API */
    terminal: TerminalApi;

    /** Filesystem API (if permitted) */
    filesystem?: FilesystemApi;

    /** AI API (if permitted) */
    ai?: AiApi;

    /** UI API */
    ui: UiApi;
}

/**
 * Plugin logger
 */
export interface PluginLogger {
    info: (msg: string) => void;
    warn: (msg: string) => void;
    error: (msg: string) => void;
    debug: (msg: string) => void;
}

/**
 * Terminal API for plugins
 */
export interface TerminalApi {
    /** Add output line */
    writeLine: (content: string, type?: "output" | "error" | "system") => void;

    /** Register command handler */
    registerCommand: (name: string, handler: CommandHandler) => void;

    /** Execute command */
    execute: (cmd: string) => Promise<CommandResult>;
}

export type CommandHandler = (args: string[]) => Promise<CommandResult> | CommandResult;

export interface CommandResult {
    stdout?: string;
    stderr?: string;
    exitCode: number;
}

export interface TerminalCommandResult {
    handled: boolean;
    output?: string;
}

/**
 * Filesystem API for plugins
 */
export interface FilesystemApi {
    read: (path: string) => Promise<string>;
    write: (path: string, content: string) => Promise<void>;
    list: (path: string) => Promise<string[]>;
    exists: (path: string) => Promise<boolean>;
}

/**
 * AI API for plugins
 */
export interface AiApi {
    chat: (message: string) => Promise<string>;
    complete: (prompt: string) => Promise<string>;
}

/**
 * UI API for plugins
 */
export interface UiApi {
    /** Show notification */
    notify: (message: string, type?: "info" | "success" | "warning" | "error") => void;

    /** Show confirmation dialog - REQUIRED for high-risk actions */
    confirm: (message: string) => Promise<boolean>;

    /** Register sidebar panel */
    registerPanel: (panel: SidebarPanel) => void;
}

export interface SidebarPanel {
    id: string;
    title: string;
    icon: string;
    render: () => HTMLElement | string;
}

/**
 * Editor context for editor actions
 */
export interface EditorContext {
    filePath: string;
    content: string;
    selection?: { start: number; end: number };
    language: string;
}

// ============================================================================
// KALI SECURITY PLUGIN CONSTRAINTS (per senior engineer review)
// ============================================================================

/**
 * Security scan target - MUST be explicit
 *
 * ⚠️ CRITICAL CONSTRAINT: No default external scanning
 * - Default targets: localhost, 127.0.0.1, workspace network only
 * - External IPs require: manual input + confirmation dialog
 */
export interface SecurityScanTarget {
    /** Target type */
    type: "localhost" | "workspace" | "external";

    /** Target address */
    address: string;

    /** Authorization confirmation */
    authorized: boolean;

    /** Authorization timestamp */
    authorizedAt?: string;

    /** Authorizing identity */
    authorizedBy?: string;
}

/**
 * Security scan request - requires explicit authorization
 */
export interface SecurityScanRequest {
    /** Plugin ID */
    pluginId: string;

    /** Scan type */
    scanType: "network" | "port" | "vulnerability" | "recon";

    /** Target - MUST be explicitly authorized */
    target: SecurityScanTarget;

    /** Scope limitations */
    scope: {
        /** Maximum ports to scan */
        maxPorts?: number;
        /** Timeout in seconds */
        timeout: number;
    };
}

/**
 * Security scan result - NEVER raw output, always structured
 *
 * ⚠️ CRITICAL: Output must be:
 * - Risk summary (not raw port lists)
 * - Severity levels
 * - Remediation suggestions
 */
export interface SecurityScanResult {
    /** Scan ID */
    scanId: string;

    /** Target */
    target: string;

    /** Timestamp */
    timestamp: string;

    /** Summary */
    summary: string;

    /** Risk level */
    riskLevel: "none" | "low" | "medium" | "high" | "critical";

    /** Findings (structured, not raw) */
    findings: SecurityFinding[];

    /** Recommendations */
    recommendations: string[];
}

export interface SecurityFinding {
    category: string;
    severity: "info" | "low" | "medium" | "high" | "critical";
    title: string;
    description: string;
    remediation?: string;
}

// ============================================================================
// PLUGIN REGISTRY
// ============================================================================

/**
 * Plugin registry for managing installed plugins
 */
export class PluginRegistry {
    private plugins = new Map<string, RegisteredPlugin>();

    /**
     * Register a plugin
     */
    register(manifest: PluginManifest, hooks: PluginHooks): void {
        // Validate manifest
        if (!manifest.id || !manifest.name || !manifest.version) {
            throw new Error("Invalid plugin manifest");
        }

        // Check for high-risk plugins
        if (manifest.riskLevel === "high" || manifest.riskLevel === "critical") {
            console.warn(
                `[PLUGIN] High-risk plugin registered: ${manifest.id}. Requires human confirmation for actions.`
            );
        }

        this.plugins.set(manifest.id, {
            manifest,
            hooks,
            enabled: false,
            activatedAt: null,
        });
    }

    /**
     * Enable a plugin (requires confirmation for high-risk)
     */
    async enable(pluginId: string, confirm: () => Promise<boolean>): Promise<boolean> {
        const plugin = this.plugins.get(pluginId);
        if (!plugin) return false;

        // High-risk requires confirmation
        if (plugin.manifest.riskLevel === "high" || plugin.manifest.riskLevel === "critical") {
            const confirmed = await confirm();
            if (!confirmed) {
                console.log(`[PLUGIN] User declined high-risk plugin: ${pluginId}`);
                return false;
            }
        }

        plugin.enabled = true;
        plugin.activatedAt = new Date().toISOString();
        console.log(`[PLUGIN] Enabled: ${pluginId} at ${plugin.activatedAt}`);
        return true;
    }

    /**
     * Disable a plugin
     */
    disable(pluginId: string): void {
        const plugin = this.plugins.get(pluginId);
        if (plugin) {
            plugin.enabled = false;
            plugin.activatedAt = null;
        }
    }

    /**
     * Get all plugins
     */
    getAll(): RegisteredPlugin[] {
        return Array.from(this.plugins.values());
    }

    /**
     * Get enabled plugins
     */
    getEnabled(): RegisteredPlugin[] {
        return this.getAll().filter((p) => p.enabled);
    }
}

interface RegisteredPlugin {
    manifest: PluginManifest;
    hooks: PluginHooks;
    enabled: boolean;
    activatedAt: string | null;
}

// ============================================================================
// BUILT-IN PLUGINS (Official)
// ============================================================================

export const BUILTIN_PLUGINS: PluginManifest[] = [
    {
        id: "git",
        name: "Git Integration",
        version: "1.0.0",
        description: "Git status, commit, push operations",
        author: "AeonSage",
        permissions: ["terminal:read", "terminal:write", "filesystem:read"],
        riskLevel: "low",
        trusted: "official",
        category: "utility",
        main: "plugins/git.js",
    },
    {
        id: "linter",
        name: "Code Linter",
        version: "1.0.0",
        description: "TypeScript/JavaScript code linting",
        author: "AeonSage",
        permissions: ["filesystem:read"],
        riskLevel: "low",
        trusted: "official",
        category: "editor",
        main: "plugins/linter.js",
    },
    {
        id: "ai-assist",
        name: "AI Code Assistant",
        version: "1.0.0",
        description: "AI-powered code completion and suggestions",
        author: "AeonSage",
        permissions: ["ai:chat", "filesystem:read"],
        riskLevel: "medium",
        trusted: "official",
        category: "ai",
        main: "plugins/ai-assist.js",
    },
];

// ============================================================================
// KALI SECURITY PLUGINS (High Risk - Authorized Only)
// ============================================================================

export const KALI_PLUGINS: PluginManifest[] = [
    {
        id: "kali-netscan",
        name: "Network Scanner",
        version: "1.0.0",
        description: "Network/subnet discovery (nmap-like)",
        author: "AeonSage Security",
        permissions: ["security:scan", "network:local"],
        riskLevel: "high",
        trusted: "official",
        category: "security",
        main: "plugins/kali/netscan.js",
    },
    {
        id: "kali-portscan",
        name: "Port Scanner",
        version: "1.0.0",
        description: "Port scanning with service identification",
        author: "AeonSage Security",
        permissions: ["security:scan", "network:local"],
        riskLevel: "high",
        trusted: "official",
        category: "security",
        main: "plugins/kali/portscan.js",
    },
    {
        id: "kali-vulnscan",
        name: "Vulnerability Scanner",
        version: "1.0.0",
        description: "CVE detection and vulnerability assessment",
        author: "AeonSage Security",
        permissions: ["security:assess", "network:local"],
        riskLevel: "critical",
        trusted: "official",
        category: "security",
        main: "plugins/kali/vulnscan.js",
    },
    {
        id: "kali-recon",
        name: "Reconnaissance Tools",
        version: "1.0.0",
        description: "WHOIS, DNS, and information gathering",
        author: "AeonSage Security",
        permissions: ["security:scan", "network:external"],
        riskLevel: "high",
        trusted: "official",
        category: "security",
        main: "plugins/kali/recon.js",
    },
    {
        id: "kali-report",
        name: "Security Report Generator",
        version: "1.0.0",
        description: "Generate structured security assessment reports",
        author: "AeonSage Security",
        permissions: ["filesystem:write"],
        riskLevel: "low",
        trusted: "official",
        category: "security",
        main: "plugins/kali/report.js",
    },
];
