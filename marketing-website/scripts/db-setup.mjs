#!/usr/bin/env node
/**
 * Applies any migrations in db/migrations that haven't run yet, in filename
 * order, recording each in `schema_migrations`.
 *
 *   npm run db:setup             apply what's pending
 *   npm run db:setup -- --force  drop every table first, then apply all
 */

import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

import { connect, TABLES } from "./db.mjs";

const MIGRATIONS_DIR = "db/migrations";
const force = process.argv.includes("--force");
const db = await connect();

try {
  if (force) {
    console.log("Dropping existing tables…");
    for (const table of [...TABLES, "schema_migrations"]) {
      await db.exec(`DROP TABLE IF EXISTS ${table}`);
    }
  }

  await db.exec(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       version    TEXT PRIMARY KEY,
       applied_at TEXT NOT NULL
     )`,
  );

  const applied = new Set(
    (await db.all(`SELECT version FROM schema_migrations`)).map((row) => row.version),
  );

  const files = readdirSync(MIGRATIONS_DIR)
    .filter((name) => name.endsWith(".sql"))
    .sort();

  let ran = 0;
  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    if (applied.has(version)) continue;

    await db.exec(readFileSync(join(MIGRATIONS_DIR, file), "utf8"));
    await db.run(`INSERT INTO schema_migrations (version, applied_at) VALUES ($1, $2)`, [
      version,
      new Date().toISOString(),
    ]);
    console.log(`  applied ${version}`);
    ran += 1;
  }

  console.log(
    ran === 0
      ? `${db.label} is already up to date (${files.length} migration${files.length === 1 ? "" : "s"}).`
      : `Applied ${ran} migration${ran === 1 ? "" : "s"} to ${db.label}.`,
  );
} finally {
  await db.close();
}
