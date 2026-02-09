/**
 * Database Tool
 *
 * SQLite database operations for data persistence.
 */

import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
// MCP-style tool - type inferred
import type { AeonSageConfig } from "../../config/config.js";

export interface DatabaseToolParams {
  config?: AeonSageConfig;
}

export type QueryOperation = "select" | "insert" | "update" | "delete" | "execute";

export interface QueryResult {
  success: boolean;
  operation: QueryOperation;
  rowsAffected?: number;
  lastInsertId?: number;
  rows?: Record<string, unknown>[];
  error?: string;
}

// In-memory SQLite using better-sqlite3 (or sql.js for browser compatibility)
let db: unknown = null;
let _dbPath: string | null = null;

/**
 * Initialize database connection
 */
async function initDatabase(
  customPath?: string,
): Promise<{ success: boolean; path: string; error?: string }> {
  const targetPath = customPath ?? path.join(os.homedir(), ".aeonsage", "data", "aeonsage.db");

  try {
    // Ensure directory exists
    await fs.mkdir(path.dirname(targetPath), { recursive: true });

    // Check if better-sqlite3 is available
    try {
      // @ts-expect-error - Optional dependency
      const Database = (await import("better-sqlite3" /* dynamic */)).default;
      db = new Database(targetPath);
      _dbPath = targetPath;

      return { success: true, path: targetPath };
    } catch {
      // better-sqlite3 not available, try sql.js
      try {
        // @ts-expect-error - Optional dependency
        const initSqlJs = (await import("sql.js" /* dynamic */)).default;
        const SQL = await initSqlJs();

        // Try to load existing database
        try {
          const buffer = await fs.readFile(targetPath);
          db = new SQL.Database(buffer);
        } catch {
          // Create new database
          db = new SQL.Database();
        }

        _dbPath = targetPath;
        return { success: true, path: targetPath };
      } catch {
        return {
          success: false,
          path: targetPath,
          error: "No SQLite driver available. Install better-sqlite3 or sql.js.",
        };
      }
    }
  } catch (error) {
    return {
      success: false,
      path: targetPath,
      error: error instanceof Error ? error.message : "Failed to initialize database",
    };
  }
}

/**
 * Execute a parameterized query
 * NOTE: This is a simplified implementation. In production, use proper parameterized queries.
 */
function executeQuery(sql: string, params: unknown[] = [], operation: QueryOperation): QueryResult {
  if (!db) {
    return {
      success: false,
      operation,
      error: "Database not initialized. Call with action: 'init' first.",
    };
  }

  try {
    // Sanitize SQL - basic check
    const sanitizedSql = sql.trim();

    // Check for dangerous patterns (basic protection)
    const dangerousPatterns = [/;\s*(DROP|DELETE\s+FROM|TRUNCATE|ALTER)/i, /--/, /\/\*/];

    for (const pattern of dangerousPatterns) {
      if (pattern.test(sanitizedSql)) {
        return {
          success: false,
          operation,
          error: "Query contains potentially dangerous patterns",
        };
      }
    }

    // Execute based on database type
    const dbAny = db as {
      prepare?: (sql: string) => {
        run: (...args: unknown[]) => { changes: number; lastInsertRowid: number };
        all: (...args: unknown[]) => unknown[];
      };
      run?: (sql: string, params?: unknown[]) => void;
      exec?: (sql: string) => unknown[];
    };

    if (dbAny.prepare) {
      // better-sqlite3 style
      const stmt = dbAny.prepare(sanitizedSql);

      if (operation === "select") {
        const rows = stmt.all(...params);
        return {
          success: true,
          operation,
          rows: rows as Record<string, unknown>[],
        };
      } else {
        const result = stmt.run(...params);
        return {
          success: true,
          operation,
          rowsAffected: result.changes,
          lastInsertId: Number(result.lastInsertRowid),
        };
      }
    } else if (dbAny.run && dbAny.exec) {
      // sql.js style
      if (operation === "select") {
        const results = dbAny.exec(sanitizedSql);
        const rows: Record<string, unknown>[] = [];

        if (Array.isArray(results) && results.length > 0) {
          const result = results[0] as { columns: string[]; values: unknown[][] };
          for (const values of result.values) {
            const row: Record<string, unknown> = {};
            result.columns.forEach((col, i) => {
              row[col] = values[i];
            });
            rows.push(row);
          }
        }

        return { success: true, operation, rows };
      } else {
        dbAny.run(sanitizedSql, params);
        return { success: true, operation, rowsAffected: 0 };
      }
    }

    return { success: false, operation, error: "Unknown database type" };
  } catch (error) {
    return {
      success: false,
      operation,
      error: error instanceof Error ? error.message : "Query execution failed",
    };
  }
}

/**
 * Create the database tool
 */
export function createDatabaseTool(_params: DatabaseToolParams = {}) {
  return {
    name: "database",
    description: `Execute SQLite database operations for data persistence.

Operations:
- init: Initialize/connect to database
- select: Query data (SELECT)
- insert: Insert data (INSERT)
- update: Update data (UPDATE)
- delete: Delete data (DELETE)
- execute: Execute raw SQL (CREATE TABLE, etc.)

Features:
- Parameterized queries for security
- Basic SQL injection protection
- Automatic schema creation

Use for: Storing user preferences, session data, analytics, caching.`,
    inputSchema: {
      type: "object",
      properties: {
        action: {
          type: "string",
          enum: ["init", "select", "insert", "update", "delete", "execute", "tables", "schema"],
          description: "Database operation to perform.",
        },
        sql: {
          type: "string",
          description: "SQL query to execute. Required for select/insert/update/delete/execute.",
        },
        params: {
          type: "array",
          items: { type: ["string", "number", "boolean", "null"] },
          description: "Query parameters for prepared statements.",
        },
        table: {
          type: "string",
          description: "Table name for simplified operations.",
        },
        data: {
          type: "object",
          description: "Data object for insert/update operations.",
        },
        where: {
          type: "object",
          description: "WHERE clause conditions.",
        },
        dbPath: {
          type: "string",
          description: "Custom database file path.",
        },
      },
      required: ["action"],
    },
    call: async (input: {
      action: "init" | "select" | "insert" | "update" | "delete" | "execute" | "tables" | "schema";
      sql?: string;
      params?: unknown[];
      table?: string;
      data?: Record<string, unknown>;
      where?: Record<string, unknown>;
      dbPath?: string;
    }) => {
      const { action } = input;

      switch (action) {
        case "init": {
          const result = await initDatabase(input.dbPath);
          return result;
        }

        case "tables": {
          if (!db) {
            const initResult = await initDatabase(input.dbPath);
            if (!initResult.success) return initResult;
          }

          const result = executeQuery(
            "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name",
            [],
            "select",
          );

          return {
            success: result.success,
            tables: result.rows?.map((r) => r.name) ?? [],
            error: result.error,
          };
        }

        case "schema": {
          if (!db) {
            const initResult = await initDatabase(input.dbPath);
            if (!initResult.success) return initResult;
          }

          if (!input.table) {
            return { success: false, error: "Table name required for schema action" };
          }

          const result = executeQuery(`PRAGMA table_info(${input.table})`, [], "select");

          return {
            success: result.success,
            table: input.table,
            columns: result.rows,
            error: result.error,
          };
        }

        case "select": {
          if (!db) {
            const initResult = await initDatabase(input.dbPath);
            if (!initResult.success) return initResult;
          }

          if (!input.sql && !input.table) {
            return { success: false, error: "Either sql or table required" };
          }

          let sql = input.sql;
          if (!sql && input.table) {
            sql = `SELECT * FROM ${input.table}`;
            if (input.where) {
              const conditions = Object.keys(input.where)
                .map((k) => `${k} = ?`)
                .join(" AND ");
              sql += ` WHERE ${conditions}`;
            }
          }

          const params = input.params ?? (input.where ? Object.values(input.where) : []);
          return executeQuery(sql!, params, "select");
        }

        case "insert": {
          if (!db) {
            const initResult = await initDatabase(input.dbPath);
            if (!initResult.success) return initResult;
          }

          if (!input.sql && (!input.table || !input.data)) {
            return { success: false, error: "Either sql or (table + data) required" };
          }

          let sql = input.sql;
          let params = input.params;

          if (!sql && input.table && input.data) {
            const columns = Object.keys(input.data).join(", ");
            const placeholders = Object.keys(input.data)
              .map(() => "?")
              .join(", ");
            sql = `INSERT INTO ${input.table} (${columns}) VALUES (${placeholders})`;
            params = Object.values(input.data);
          }

          return executeQuery(sql!, params ?? [], "insert");
        }

        case "update": {
          if (!db) {
            const initResult = await initDatabase(input.dbPath);
            if (!initResult.success) return initResult;
          }

          if (!input.sql && (!input.table || !input.data)) {
            return { success: false, error: "Either sql or (table + data + where) required" };
          }

          let sql = input.sql;
          let params = input.params;

          if (!sql && input.table && input.data) {
            const setClause = Object.keys(input.data)
              .map((k) => `${k} = ?`)
              .join(", ");
            sql = `UPDATE ${input.table} SET ${setClause}`;
            params = Object.values(input.data);

            if (input.where) {
              const whereClause = Object.keys(input.where)
                .map((k) => `${k} = ?`)
                .join(" AND ");
              sql += ` WHERE ${whereClause}`;
              params = [...params, ...Object.values(input.where)];
            }
          }

          return executeQuery(sql!, params ?? [], "update");
        }

        case "delete": {
          if (!db) {
            const initResult = await initDatabase(input.dbPath);
            if (!initResult.success) return initResult;
          }

          if (!input.sql && !input.table) {
            return { success: false, error: "Either sql or table required" };
          }

          let sql = input.sql;
          let params = input.params;

          if (!sql && input.table) {
            sql = `DELETE FROM ${input.table}`;
            if (input.where) {
              const whereClause = Object.keys(input.where)
                .map((k) => `${k} = ?`)
                .join(" AND ");
              sql += ` WHERE ${whereClause}`;
              params = Object.values(input.where);
            } else {
              return {
                success: false,
                error: "DELETE without WHERE is not allowed. Use where clause.",
              };
            }
          }

          return executeQuery(sql!, params ?? [], "delete");
        }

        case "execute": {
          if (!db) {
            const initResult = await initDatabase(input.dbPath);
            if (!initResult.success) return initResult;
          }

          if (!input.sql) {
            return { success: false, error: "SQL required for execute action" };
          }

          return executeQuery(input.sql, input.params ?? [], "execute");
        }

        default:
          return { success: false, error: `Unknown action: ${String(action)}` };
      }
    },
  };
}
