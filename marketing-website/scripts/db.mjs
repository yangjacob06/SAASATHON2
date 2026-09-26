/**
 * Shared database helper for the CLI scripts.
 *
 * Mirrors lib/db.ts (Postgres when DATABASE_URL is set, otherwise SQLite at
 * .data/dev.db) but in plain JS so it can run outside the Next.js build.
 */

import { readFileSync, existsSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";

export function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    if (!existsSync(file)) continue;
    for (const line of readFileSync(file, "utf8").split("\n")) {
      const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key] !== undefined) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, "");
    }
  }
}

function toSqlite(sql, params) {
  const ordered = [];
  const rewritten = sql.replace(/\$(\d+)/g, (_match, digits) => {
    ordered.push(params[Number(digits) - 1] ?? null);
    return "?";
  });
  return [rewritten, ordered];
}

export async function connect() {
  loadEnv();
  const url = process.env.DATABASE_URL;

  if (url) {
    const { default: pg } = await import("pg");
    const client = new pg.Client({
      connectionString: url,
      ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
    });
    await client.connect();
    return {
      label: "PostgreSQL",
      async exec(script) {
        await client.query(script);
      },
      async run(sql, params = []) {
        await client.query(sql, params);
      },
      async all(sql, params = []) {
        return (await client.query(sql, params)).rows;
      },
      async close() {
        await client.end();
      },
    };
  }

  const file = process.env.SQLITE_PATH || ".data/dev.db";
  mkdirSync(dirname(file), { recursive: true });
  const { DatabaseSync } = await import("node:sqlite");
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  return {
    label: `SQLite (${file})`,
    async exec(script) {
      db.exec(script);
    },
    async run(sql, params = []) {
      const [text, values] = toSqlite(sql, params);
      db.prepare(text).run(...values);
    },
    async all(sql, params = []) {
      const [text, values] = toSqlite(sql, params);
      return db.prepare(text).all(...values);
    },
    async close() {
      db.close();
    },
  };
}

/** Dropped in this order so foreign keys never block a --force reset. */
export const TABLES = [
  "application_events",
  "application_lender_events",
  "application_lenders",
  "lenders",
  "deal_summaries",
  "application_documents",
  "applications",
  "sessions",
  "users",
];
