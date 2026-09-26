/**
 * Database access.
 *
 * Two engines, one query language:
 *
 *   * PostgreSQL  — used whenever DATABASE_URL is set (Supabase, Railway, Neon…).
 *                   This is the production path.
 *   * SQLite      — the zero-config fallback via Node's built-in `node:sqlite`,
 *                   writing to .data/dev.db. Lets `npm run dev` work with no
 *                   external services on a fresh clone.
 *
 * Queries are written once, with Postgres-style `$1` placeholders; the SQLite
 * adapter rewrites them to `?`. Keep to the portable SQL subset documented at
 * the top of db/migrations/0001_initial.sql and both engines stay in sync for free.
 */

import { randomUUID } from "node:crypto";

export type Row = Record<string, any>;
export type Param = string | number | null;

export interface Database {
  dialect: "postgres" | "sqlite";
  query<T = Row>(sql: string, params?: unknown[]): Promise<T[]>;
  one<T = Row>(sql: string, params?: unknown[]): Promise<T | null>;
  run(sql: string, params?: unknown[]): Promise<void>;
  /** Execute a multi-statement script (schema/seed files). */
  exec(script: string): Promise<void>;
}

function normaliseParams(params: unknown[]): Param[] {
  return params.map((p) => {
    if (p === undefined || p === null) return null;
    if (typeof p === "boolean") return p ? 1 : 0;
    if (p instanceof Date) return p.toISOString();
    if (typeof p === "number" || typeof p === "string") return p;
    return JSON.stringify(p);
  });
}

/* -------------------------------------------------------------------------- */
/* PostgreSQL                                                                  */
/* -------------------------------------------------------------------------- */

async function createPostgres(url: string): Promise<Database> {
  const { Pool } = await import("pg");
  const pool = new Pool({
    connectionString: url,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? undefined : { rejectUnauthorized: false },
    max: 5,
  });

  return {
    dialect: "postgres",
    async query<T = Row>(sql: string, params: unknown[] = []) {
      const res = await pool.query(sql, normaliseParams(params));
      return res.rows as T[];
    },
    async one<T = Row>(sql: string, params: unknown[] = []) {
      const res = await pool.query(sql, normaliseParams(params));
      return (res.rows[0] as T) ?? null;
    },
    async run(sql: string, params: unknown[] = []) {
      await pool.query(sql, normaliseParams(params));
    },
    async exec(script: string) {
      await pool.query(script);
    },
  };
}

/* -------------------------------------------------------------------------- */
/* SQLite (dev fallback)                                                       */
/* -------------------------------------------------------------------------- */

function toSqlite(sql: string, params: Param[]): [string, Param[]] {
  const ordered: Param[] = [];
  const rewritten = sql.replace(/\$(\d+)/g, (_match, digits: string) => {
    ordered.push(params[Number(digits) - 1] ?? null);
    return "?";
  });
  return [rewritten, ordered];
}

async function createSqlite(file: string): Promise<Database> {
  const { DatabaseSync } = await import("node:sqlite");
  const { mkdirSync } = await import("node:fs");
  const { dirname } = await import("node:path");

  mkdirSync(dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec("PRAGMA journal_mode = WAL");
  db.exec("PRAGMA foreign_keys = ON");

  const plain = <T,>(row: unknown): T => ({ ...(row as object) }) as T;

  return {
    dialect: "sqlite",
    async query<T = Row>(sql: string, params: unknown[] = []) {
      const [text, values] = toSqlite(sql, normaliseParams(params));
      return db.prepare(text).all(...(values as never[])).map((row) => plain<T>(row));
    },
    async one<T = Row>(sql: string, params: unknown[] = []) {
      const [text, values] = toSqlite(sql, normaliseParams(params));
      const row = db.prepare(text).get(...(values as never[]));
      return row === undefined || row === null ? null : plain<T>(row);
    },
    async run(sql: string, params: unknown[] = []) {
      const [text, values] = toSqlite(sql, normaliseParams(params));
      db.prepare(text).run(...(values as never[]));
    },
    async exec(script: string) {
      db.exec(script);
    },
  };
}

/* -------------------------------------------------------------------------- */

const globalForDb = globalThis as unknown as { __mandateDb?: Promise<Database> };

export function getDb(): Promise<Database> {
  if (!globalForDb.__mandateDb) {
    const url = process.env.DATABASE_URL;
    globalForDb.__mandateDb = url
      ? createPostgres(url)
      : createSqlite(process.env.SQLITE_PATH || ".data/dev.db");
  }
  return globalForDb.__mandateDb;
}

export async function query<T = Row>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await getDb()).query<T>(sql, params);
}

export async function one<T = Row>(sql: string, params: unknown[] = []): Promise<T | null> {
  return (await getDb()).one<T>(sql, params);
}

export async function run(sql: string, params: unknown[] = []): Promise<void> {
  return (await getDb()).run(sql, params);
}

export const newId = (): string => randomUUID();
export const nowIso = (): string => new Date().toISOString();

export function parseJson<T>(value: unknown, fallback: T): T {
  if (value === null || value === undefined) return fallback;
  if (typeof value === "object") return value as T;
  try {
    return JSON.parse(String(value)) as T;
  } catch {
    return fallback;
  }
}
