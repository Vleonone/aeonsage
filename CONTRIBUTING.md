# Contributing to AeonSage

Thanks for taking the time to contribute! We're happy you're here.

This guide will help you get started with the codebase and our development workflow.

---

## Project Structure

AeonSage is a modular Node.js application. Here's a quick overview:

*   `src/kernel/`: Core logic and state management.
*   `src/router/`: Handles LLM routing and decision making.
*   `src/skills/`: Individual capability modules (e.g., file system, web search).
*   `ui/`: The dashboard frontend (React + Vite).

---

## Setup Guide

### prerequisites
*   **Node.js**: v22.0.0+
*   **Package Manager**: `pnpm` (recommended) or `npm`.

### Running Locally

1.  **Clone the repo**:
    ```bash
    git clone https://github.com/velonone/Aeonsage.git
    cd Aeonsage
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start development server**:
    ```bash
    npm run dev
    ```

---

## How to Contribute

### 1. Reporting Bugs
Found a bug? Please open an issue on GitHub.
Include:
*   Steps to reproduce.
*   Expected vs. actual behavior.
*   Screenshots or logs if available.

### 2. Pull Requests (PRs)
We welcome PRs for bug fixes and new features.

1.  **Fork** the repository.
2.  Create a branch: `git checkout -b feature/my-cool-feature`.
3.  Make your changes.
4.  **Test** your changes locally.
5.  Commit with a clear message: `feat: add telegram support`.
    *   *Note: We use DCO sign-off (`git commit -s`), so please sign your commits.*
6.  Push and open a Pull Request.

### 3. AI Usage
You are welcome to use AI tools (like Copilot or ChatGPT) to write code.
Just make sure you **review and test** the code before submitting. You are responsible for the code you ship.

---

## Need Help?

*   **Documentation**: [docs.aeonsage.org](https://docs.aeonsage.org)
*   **Discussions**: [GitHub Discussions](https://github.com/velonone/Aeonsage/discussions)

Happy coding!
