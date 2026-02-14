# Contributing to AeonSage

Thanks for your interest in contributing! This guide will help you get started.

---

## Project Structure

AeonSage is a modular monorepo built with **pnpm workspaces**.

```
AeonSage/
├── src/
│   ├── kernel/          # Core runtime & state management
│   ├── router/          # LLM routing & Cognitive Router logic
│   ├── skills/          # Individual capability modules
│   ├── gateway/         # HTTP + WebSocket server (Hono)
│   └── channels/        # Bridge adapters (Telegram, Discord, etc.)
├── ui/                  # Web dashboard (Lit + Vite)
├── packages/            # Shared libraries
├── extensions/          # Channel extensions
├── docs/                # Documentation
└── assets/              # Brand assets & icons
```

---

## Prerequisites

*   **Node.js** v22.0.0+
*   **pnpm** (recommended) — `npm install -g pnpm`

---

## Setup

1.  **Clone the repo**:
    ```bash
    git clone https://github.com/velonone/Aeonsage.git
    cd Aeonsage
    ```

2.  **Install dependencies**:
    ```bash
    pnpm install
    ```

3.  **Start the development server**:
    ```bash
    pnpm dev
    ```

---

## How to Contribute

### Reporting Bugs

Found a bug? Please [open an issue](https://github.com/velonone/Aeonsage/issues) with:

*   Steps to reproduce
*   Expected vs. actual behavior
*   Node.js version and OS
*   Screenshots or logs if available

### Pull Requests

We welcome PRs for bug fixes, new features, and documentation improvements.

1.  **Fork** the repository.
2.  Create a branch: `git checkout -b feature/my-feature`
3.  Make your changes.
4.  **Test** your changes locally.
5.  Commit with a clear message following [Conventional Commits](https://www.conventionalcommits.org/):
    ```
    feat: add telegram bridge support
    fix: resolve websocket reconnection issue
    docs: update setup guide
    ```
6.  Push and open a Pull Request against `main`.

### Commit Signing

We use DCO sign-off. Please sign your commits:

```bash
git commit -s -m "feat: your feature description"
```

### Code Style

*   TypeScript strict mode
*   ESM imports (`import` / `export`, no `require`)
*   Prefer small, focused modules

---

## Contributing to Opensage (Cognitive Router)

The Cognitive Router is independently open-sourced at **[velonone/Opensage](https://github.com/velonone/Opensage)**. If you want to improve the routing logic, model orchestration, or add new providers, please contribute there directly. The codebase is lightweight and designed to be integrated into any environment.

---

## AI Usage

You are welcome to use AI tools to assist with writing code. Please **review and test** thoroughly before submitting. You are responsible for the code you ship.

---

## Need Help?

*   **Documentation**: [docs.aeonsage.org](https://docs.aeonsage.org)
*   **Discussions**: [GitHub Discussions](https://github.com/velonone/Aeonsage/discussions)
*   **Issues**: [GitHub Issues](https://github.com/velonone/Aeonsage/issues)

Happy coding!
