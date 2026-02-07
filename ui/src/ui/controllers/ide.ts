/**
 * IDE Controller - Web IDE State Management and API Integration
 *
 * ⚠️ AUTHORIZATION: This module is for authorized use only.
 * Not included in public open-source distribution.
 *
 * Handles:
 * - File system API calls
 * - Terminal command execution
 * - AI chat integration
 * - SSE log streaming
 */

import type {
    IdeState,
    IdeCallbacks,
} from "../views/ide.js";

export interface IdeFile {
    name: string;
    path: string;
    type: "file" | "directory";
    children?: IdeFile[];
}

export interface IdeTerminalLine {
    type: "input" | "output" | "error" | "system";
    content: string;
    timestamp: string;
}

export interface IdeChatMessage {
    role: "user" | "assistant";
    content: string;
    timestamp: string;
}

export interface IdeSession {
    workspaceId: string;
    identityId: string;
    auditSessionId: string;
}

/**
 * IDE Controller Class
 */
export class IdeController {
    private state: IdeState;
    private session: IdeSession;
    private sseConnection: EventSource | null = null;
    private onStateChange: (state: IdeState) => void;
    private baseUrl: string;

    constructor(opts: {
        session: IdeSession;
        onStateChange: (state: IdeState) => void;
        baseUrl?: string;
    }) {
        this.session = opts.session;
        this.onStateChange = opts.onStateChange;
        this.baseUrl = opts.baseUrl ?? "";
        this.state = {
            // Notebook cells
            cells: [
                {
                    id: "cell-1",
                    type: "markdown",
                    content: "# AeonSage Notebook\n\nWelcome to the AeonSage Web IDE.",
                },
                {
                    id: "cell-2",
                    type: "code",
                    content: "// Example code cell\nconsole.log('Hello from AeonSage!');",
                    language: "javascript",
                },
            ],
            activeCellId: "cell-2",
            // File browser
            files: [],
            filesLoading: true,
            filesError: null,
            selectedFile: null,
            editorContent: "",
            editorPath: null,
            editorDirty: false,
            editorLanguage: "plaintext",
            // Terminal
            terminalLines: [
                {
                    type: "system",
                    content: "AeonSage IDE Terminal Ready. Type 'help' for commands.",
                    timestamp: new Date().toISOString(),
                },
            ],
            terminalInput: "",
            terminalHistory: [],
            terminalHistoryIndex: -1,
            terminalCollapsed: true,
            terminalBusy: false,
            terminalHeight: 200,
            // Chat
            chatMessages: [
                { role: "assistant", content: "Hi! I'm your AI coding assistant." },
            ],
            chatInput: "",
            chatLoading: false,
            chatVisible: true,
            chatWidth: 320,
            // UI
            settingsOpen: false,
            theme: "dark",
            fontSize: 14,
            sidebarWidth: 250,
        };
    }

    /**
     * Initialize the IDE
     */
    async init(): Promise<void> {
        await this.loadFiles();
        this.connectLogStream();
    }

    /**
     * Cleanup resources
     */
    destroy(): void {
        if (this.sseConnection) {
            this.sseConnection.close();
            this.sseConnection = null;
        }
    }

    /**
     * Get callbacks for the view
     */
    getCallbacks(): IdeCallbacks {
        return {
            onFileSelect: this.selectFile.bind(this),
            onFileSave: this.saveFile.bind(this),
            onEditorChange: this.updateEditorContent.bind(this),
            onTerminalInput: this.executeCommand.bind(this),
            onTerminalInputChange: this.updateTerminalInput.bind(this),
            onTerminalKeyDown: this.handleTerminalKeyDown.bind(this),
            onChatSend: this.sendChatMessage.bind(this),
            onChatInputChange: this.updateChatInput.bind(this),
            onSettingsToggle: this.toggleSettings.bind(this),
            onThemeToggle: this.toggleTheme.bind(this),
            onTerminalToggle: this.toggleTerminal.bind(this),
            onRefreshFiles: this.loadFiles.bind(this),
        };
    }

    /**
     * Load file tree
     */
    async loadFiles(): Promise<void> {
        this.updateState({ filesLoading: true, filesError: null });

        try {
            const res = await fetch(`${this.baseUrl}/api/ide/fs/tree?path=.`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const files = (await res.json()) as IdeFile[];
            this.updateState({ files, filesLoading: false });
        } catch (err) {
            this.updateState({
                filesError: `Failed to load files: ${String(err)}`,
                filesLoading: false,
            });
        }
    }

    /**
     * Select and load a file
     */
    async selectFile(path: string): Promise<void> {
        try {
            const res = await fetch(`${this.baseUrl}/api/ide/fs/read?path=${encodeURIComponent(path)}`);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = (await res.json()) as { content: string; path: string };
            this.updateState({
                selectedFile: path,
                editorPath: path,
                editorContent: data.content,
                editorDirty: false,
                editorLanguage: this.detectLanguage(path),
            });
        } catch (err) {
            this.addTerminalLine("error", `Failed to load file: ${String(err)}`);
        }
    }

    /**
     * Save current file
     */
    async saveFile(): Promise<void> {
        if (!this.state.editorPath) return;

        try {
            const res = await fetch(`${this.baseUrl}/api/ide/fs/write`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    path: this.state.editorPath,
                    content: this.state.editorContent,
                }),
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            this.updateState({ editorDirty: false });
            this.addTerminalLine("system", `Saved: ${this.state.editorPath}`);
        } catch (err) {
            this.addTerminalLine("error", `Failed to save: ${String(err)}`);
        }
    }

    /**
     * Update editor content
     */
    updateEditorContent(content: string): void {
        this.updateState({
            editorContent: content,
            editorDirty: content !== this.state.editorContent,
        });
    }

    /**
     * Execute terminal command
     */
    async executeCommand(command: string): Promise<void> {
        if (!command.trim()) return;

        // Add to history
        const history = [...this.state.terminalHistory, command];
        this.addTerminalLine("input", command);
        this.updateState({
            terminalInput: "",
            terminalHistory: history,
            terminalHistoryIndex: -1,
        });

        // Handle built-in commands
        if (command === "help") {
            this.addTerminalLine("output", "Available commands:");
            this.addTerminalLine("output", "  help     - Show this help");
            this.addTerminalLine("output", "  clear    - Clear terminal");
            this.addTerminalLine("output", "  status   - Show IDE status");
            this.addTerminalLine("output", "  <cmd>    - Execute shell command");
            return;
        }

        if (command === "clear") {
            this.updateState({ terminalLines: [] });
            return;
        }

        if (command === "status") {
            try {
                const res = await fetch(`${this.baseUrl}/api/ide/status`);
                const data = await res.json();
                this.addTerminalLine("output", JSON.stringify(data, null, 2));
            } catch (err) {
                this.addTerminalLine("error", `Status error: ${String(err)}`);
            }
            return;
        }

        // Execute shell command
        try {
            const res = await fetch(`${this.baseUrl}/api/ide/terminal`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    command,
                    workspaceId: this.session.workspaceId,
                    identityId: this.session.identityId,
                    auditSessionId: this.session.auditSessionId,
                }),
            });

            const data = (await res.json()) as {
                stdout?: string;
                stderr?: string;
                exitCode?: number;
                error?: string;
            };

            if (data.error) {
                this.addTerminalLine("error", data.error);
            } else {
                if (data.stdout) {
                    data.stdout.split("\n").forEach((line) => {
                        if (line.trim()) this.addTerminalLine("output", line);
                    });
                }
                if (data.stderr) {
                    data.stderr.split("\n").forEach((line) => {
                        if (line.trim()) this.addTerminalLine("error", line);
                    });
                }
                if (data.exitCode !== undefined && data.exitCode !== 0) {
                    this.addTerminalLine("system", `Exit code: ${data.exitCode}`);
                }
            }
        } catch (err) {
            this.addTerminalLine("error", `Execution failed: ${String(err)}`);
        }
    }

    /**
     * Update terminal input
     */
    updateTerminalInput(value: string): void {
        this.updateState({ terminalInput: value });
    }

    /**
     * Handle terminal keydown
     */
    handleTerminalKeyDown(e: KeyboardEvent): void {
        if (e.key === "Enter") {
            this.executeCommand(this.state.terminalInput);
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            const idx = this.state.terminalHistoryIndex;
            const history = this.state.terminalHistory;
            if (history.length === 0) return;
            const newIdx = idx === -1 ? history.length - 1 : Math.max(0, idx - 1);
            this.updateState({
                terminalHistoryIndex: newIdx,
                terminalInput: history[newIdx] ?? "",
            });
        } else if (e.key === "ArrowDown") {
            e.preventDefault();
            const idx = this.state.terminalHistoryIndex;
            const history = this.state.terminalHistory;
            if (idx === -1) return;
            const newIdx = idx + 1 >= history.length ? -1 : idx + 1;
            this.updateState({
                terminalHistoryIndex: newIdx,
                terminalInput: newIdx === -1 ? "" : history[newIdx] ?? "",
            });
        }
    }

    /**
     * Send chat message
     */
    async sendChatMessage(): Promise<void> {
        const message = this.state.chatInput.trim();
        if (!message) return;

        this.addChatMessage("user", message);
        this.updateState({ chatInput: "", chatLoading: true });

        try {
            const res = await fetch(`${this.baseUrl}/api/ide/chat`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ message }),
            });

            const data = (await res.json()) as { response?: string; error?: string };
            if (data.error) {
                this.addChatMessage("assistant", `Error: ${data.error}`);
            } else {
                this.addChatMessage("assistant", data.response ?? "No response");
            }
        } catch (err) {
            this.addChatMessage("assistant", `Failed to get response: ${String(err)}`);
        } finally {
            this.updateState({ chatLoading: false });
        }
    }

    /**
     * Update chat input
     */
    updateChatInput(value: string): void {
        this.updateState({ chatInput: value });
    }

    /**
     * Toggle settings panel
     */
    toggleSettings(): void {
        this.updateState({ settingsOpen: !this.state.settingsOpen });
    }

    /**
     * Toggle theme
     */
    toggleTheme(): void {
        this.updateState({
            theme: this.state.theme === "dark" ? "light" : "dark",
        });
    }

    /**
     * Toggle terminal
     */
    toggleTerminal(): void {
        this.updateState({ terminalCollapsed: !this.state.terminalCollapsed });
    }

    /**
     * Connect to SSE log stream
     */
    private connectLogStream(): void {
        if (this.sseConnection) return;

        this.sseConnection = new EventSource(`${this.baseUrl}/api/ide/logs`);

        this.sseConnection.onmessage = (event) => {
            try {
                const entry = JSON.parse(event.data) as {
                    level?: string;
                    message?: string;
                };
                if (entry.message) {
                    const type =
                        entry.level === "error" || entry.level === "fatal"
                            ? "error"
                            : entry.level === "warn"
                                ? "error"
                                : "output";
                    this.addTerminalLine(type, `[${entry.level ?? "log"}] ${entry.message}`);
                }
            } catch {
                // Ignore parse errors
            }
        };

        this.sseConnection.onerror = () => {
            // Reconnect after 5 seconds
            setTimeout(() => {
                this.sseConnection = null;
                this.connectLogStream();
            }, 5000);
        };
    }

    /**
     * Add terminal line
     */
    private addTerminalLine(type: IdeTerminalLine["type"], content: string): void {
        const line: IdeTerminalLine = {
            type,
            content,
            timestamp: new Date().toISOString(),
        };
        const lines = [...this.state.terminalLines, line];
        // Keep last 500 lines
        if (lines.length > 500) lines.splice(0, lines.length - 500);
        this.updateState({ terminalLines: lines });
    }

    /**
     * Add chat message
     */
    private addChatMessage(role: IdeChatMessage["role"], content: string): void {
        const msg: IdeChatMessage = {
            role,
            content,
            timestamp: new Date().toISOString(),
        };
        this.updateState({ chatMessages: [...this.state.chatMessages, msg] });
    }

    /**
     * Update state
     */
    private updateState(partial: Partial<IdeState>): void {
        this.state = { ...this.state, ...partial };
        this.onStateChange(this.state);
    }

    /**
     * Get current state
     */
    getState(): IdeState {
        return this.state;
    }

    /**
     * Detect language from file path
     */
    private detectLanguage(path: string): string {
        const ext = path.split(".").pop()?.toLowerCase() ?? "";
        const map: Record<string, string> = {
            ts: "typescript",
            tsx: "typescript",
            js: "javascript",
            jsx: "javascript",
            json: "json",
            md: "markdown",
            css: "css",
            html: "html",
            py: "python",
            rs: "rust",
            go: "go",
            java: "java",
            yaml: "yaml",
            yml: "yaml",
            sh: "shell",
            sql: "sql",
        };
        return map[ext] ?? "plaintext";
    }
}
