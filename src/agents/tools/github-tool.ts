/**
 * GitHub Tool
 *
 * Interact with GitHub repositories, issues, and pull requests.
 */

// MCP-style tool - type inferred
import type { AeonSageConfig } from "../../config/config.js";

export interface GitHubToolParams {
  config?: AeonSageConfig;
}

export interface GitHubResult {
  success: boolean;
  operation: string;
  data?: unknown;
  error?: string;
}

/**
 * Make authenticated GitHub API request
 */
async function githubRequest(
  endpoint: string,
  token: string,
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE" = "GET",
  body?: unknown,
): Promise<{ ok: boolean; data: unknown; status: number }> {
  const url = endpoint.startsWith("https://") ? endpoint : `https://api.github.com${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "User-Agent": "AeonSage-Bot/1.0",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(method !== "GET" && body ? { body: JSON.stringify(body) } : {}),
    signal: AbortSignal.timeout(30000),
  });

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  return { ok: response.ok, data, status: response.status };
}

/**
 * Create the GitHub tool
 */
export function createGitHubTool(params: GitHubToolParams = {}) {
  return {
    name: "github",
    description: `Interact with GitHub repositories, issues, and pull requests.

Operations:
- repos: List user's repositories
- repo: Get repository details
- issues: List repository issues
- issue: Get/create/update an issue
- prs: List pull requests
- pr: Get/create pull request details
- commits: List recent commits
- contents: Get file contents
- search: Search repositories/issues/code

Requires GitHub Personal Access Token (GITHUB_TOKEN env var or config).`,
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: [
            "repos",
            "repo",
            "issues",
            "issue",
            "prs",
            "pr",
            "commits",
            "contents",
            "search",
            "create-issue",
            "create-pr",
          ],
          description: "GitHub operation to perform.",
        },
        owner: {
          type: "string",
          description: "Repository owner (username or organization).",
        },
        repo: {
          type: "string",
          description: "Repository name.",
        },
        number: {
          type: "number",
          description: "Issue or PR number.",
        },
        path: {
          type: "string",
          description: "File path for contents operation.",
        },
        query: {
          type: "string",
          description: "Search query.",
        },
        searchType: {
          type: "string",
          enum: ["repositories", "issues", "code"],
          description: "Search type. Default is 'repositories'.",
        },
        title: {
          type: "string",
          description: "Issue/PR title for create operations.",
        },
        body: {
          type: "string",
          description: "Issue/PR body for create operations.",
        },
        labels: {
          type: "array",
          items: { type: "string" },
          description: "Labels for issue creation.",
        },
        base: {
          type: "string",
          description: "Base branch for PR.",
        },
        head: {
          type: "string",
          description: "Head branch for PR.",
        },
        state: {
          type: "string",
          enum: ["open", "closed", "all"],
          description: "Filter by state.",
        },
        perPage: {
          type: "number",
          description: "Results per page (max 100).",
        },
        token: {
          type: "string",
          description: "GitHub token override.",
        },
      },
      required: ["action"],
    },
    call: async (input: {
      action:
        | "repos"
        | "repo"
        | "issues"
        | "issue"
        | "prs"
        | "pr"
        | "commits"
        | "contents"
        | "search"
        | "create-issue"
        | "create-pr";
      owner?: string;
      repo?: string;
      number?: number;
      path?: string;
      query?: string;
      searchType?: "repositories" | "issues" | "code";
      title?: string;
      body?: string;
      labels?: string[];
      base?: string;
      head?: string;
      state?: "open" | "closed" | "all";
      perPage?: number;
      token?: string;
    }): Promise<GitHubResult> => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const token =
        input.token ?? (params.config?.tools as any)?.github?.token ?? process.env.GITHUB_TOKEN;

      if (!token) {
        return {
          success: false,
          operation: input.action,
          error: "GitHub token not configured. Set GITHUB_TOKEN environment variable.",
        };
      }

      const {
        action,
        owner,
        repo,
        number,
        path,
        query,
        title,
        body,
        labels,
        base,
        head,
        state,
        perPage,
      } = input;

      try {
        switch (action) {
          case "repos": {
            const result = await githubRequest(
              `/user/repos?per_page=${perPage ?? 30}&sort=updated`,
              token,
            );
            if (!result.ok) {
              return { success: false, operation: action, error: `API error: ${result.status}` };
            }
            return {
              success: true,
              operation: action,
              data: (
                result.data as Array<{
                  name: string;
                  full_name: string;
                  description: string;
                  html_url: string;
                  updated_at: string;
                }>
              ).map((r) => ({
                name: r.name,
                fullName: r.full_name,
                description: r.description,
                url: r.html_url,
                updatedAt: r.updated_at,
              })),
            };
          }

          case "repo": {
            if (!owner || !repo) {
              return { success: false, operation: action, error: "owner and repo required" };
            }
            const result = await githubRequest(`/repos/${owner}/${repo}`, token);
            if (!result.ok) {
              return { success: false, operation: action, error: `API error: ${result.status}` };
            }
            return { success: true, operation: action, data: result.data };
          }

          case "issues": {
            if (!owner || !repo) {
              return { success: false, operation: action, error: "owner and repo required" };
            }
            const params = new URLSearchParams();
            if (state) params.set("state", state);
            if (perPage) params.set("per_page", String(perPage));

            const result = await githubRequest(`/repos/${owner}/${repo}/issues?${params}`, token);
            if (!result.ok) {
              return { success: false, operation: action, error: `API error: ${result.status}` };
            }
            return {
              success: true,
              operation: action,
              data: (
                result.data as Array<{
                  number: number;
                  title: string;
                  state: string;
                  labels: Array<{ name: string }>;
                  created_at: string;
                  html_url: string;
                }>
              ).map((i) => ({
                number: i.number,
                title: i.title,
                state: i.state,
                labels: i.labels.map((l) => l.name),
                createdAt: i.created_at,
                url: i.html_url,
              })),
            };
          }

          case "issue": {
            if (!owner || !repo || !number) {
              return {
                success: false,
                operation: action,
                error: "owner, repo, and number required",
              };
            }
            const result = await githubRequest(`/repos/${owner}/${repo}/issues/${number}`, token);
            if (!result.ok) {
              return { success: false, operation: action, error: `API error: ${result.status}` };
            }
            return { success: true, operation: action, data: result.data };
          }

          case "create-issue": {
            if (!owner || !repo || !title) {
              return {
                success: false,
                operation: action,
                error: "owner, repo, and title required",
              };
            }
            const result = await githubRequest(`/repos/${owner}/${repo}/issues`, token, "POST", {
              title,
              body,
              labels,
            });
            if (!result.ok) {
              return {
                success: false,
                operation: action,
                error: `API error: ${result.status}`,
                data: result.data,
              };
            }
            return { success: true, operation: action, data: result.data };
          }

          case "prs": {
            if (!owner || !repo) {
              return { success: false, operation: action, error: "owner and repo required" };
            }
            const params = new URLSearchParams();
            if (state) params.set("state", state);
            if (perPage) params.set("per_page", String(perPage));

            const result = await githubRequest(`/repos/${owner}/${repo}/pulls?${params}`, token);
            if (!result.ok) {
              return { success: false, operation: action, error: `API error: ${result.status}` };
            }
            return {
              success: true,
              operation: action,
              data: (
                result.data as Array<{
                  number: number;
                  title: string;
                  state: string;
                  head: { ref: string };
                  base: { ref: string };
                  html_url: string;
                }>
              ).map((pr) => ({
                number: pr.number,
                title: pr.title,
                state: pr.state,
                head: pr.head.ref,
                base: pr.base.ref,
                url: pr.html_url,
              })),
            };
          }

          case "pr": {
            if (!owner || !repo || !number) {
              return {
                success: false,
                operation: action,
                error: "owner, repo, and number required",
              };
            }
            const result = await githubRequest(`/repos/${owner}/${repo}/pulls/${number}`, token);
            if (!result.ok) {
              return { success: false, operation: action, error: `API error: ${result.status}` };
            }
            return { success: true, operation: action, data: result.data };
          }

          case "create-pr": {
            if (!owner || !repo || !title || !base || !head) {
              return {
                success: false,
                operation: action,
                error: "owner, repo, title, base, and head required",
              };
            }
            const result = await githubRequest(`/repos/${owner}/${repo}/pulls`, token, "POST", {
              title,
              body,
              base,
              head,
            });
            if (!result.ok) {
              return {
                success: false,
                operation: action,
                error: `API error: ${result.status}`,
                data: result.data,
              };
            }
            return { success: true, operation: action, data: result.data };
          }

          case "commits": {
            if (!owner || !repo) {
              return { success: false, operation: action, error: "owner and repo required" };
            }
            const result = await githubRequest(
              `/repos/${owner}/${repo}/commits?per_page=${perPage ?? 20}`,
              token,
            );
            if (!result.ok) {
              return { success: false, operation: action, error: `API error: ${result.status}` };
            }
            return {
              success: true,
              operation: action,
              data: (
                result.data as Array<{
                  sha: string;
                  commit: { message: string; author: { name: string; date: string } };
                  html_url: string;
                }>
              ).map((c) => ({
                sha: c.sha.substring(0, 7),
                message: c.commit.message.split("\n")[0],
                author: c.commit.author.name,
                date: c.commit.author.date,
                url: c.html_url,
              })),
            };
          }

          case "contents": {
            if (!owner || !repo || !path) {
              return { success: false, operation: action, error: "owner, repo, and path required" };
            }
            const result = await githubRequest(`/repos/${owner}/${repo}/contents/${path}`, token);
            if (!result.ok) {
              return { success: false, operation: action, error: `API error: ${result.status}` };
            }

            const data = result.data as { content?: string; encoding?: string; type: string };
            if (data.content && data.encoding === "base64") {
              return {
                success: true,
                operation: action,
                data: {
                  ...data,
                  content: Buffer.from(data.content, "base64").toString("utf-8"),
                },
              };
            }
            return { success: true, operation: action, data: result.data };
          }

          case "search": {
            if (!query) {
              return { success: false, operation: action, error: "query required for search" };
            }
            const searchType = input.searchType ?? "repositories";
            const result = await githubRequest(
              `/search/${searchType}?q=${encodeURIComponent(query)}&per_page=${perPage ?? 10}`,
              token,
            );
            if (!result.ok) {
              return { success: false, operation: action, error: `API error: ${result.status}` };
            }
            return { success: true, operation: action, data: result.data };
          }

          default:
            return {
              success: false,
              operation: action,
              error: `Unknown action: ${String(action)}`,
            };
        }
      } catch (error) {
        return {
          success: false,
          operation: action,
          error: error instanceof Error ? error.message : "GitHub operation failed",
        };
      }
    },
  };
}
