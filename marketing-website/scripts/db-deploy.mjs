/**
 * Apply database migrations during the Vercel Production build. Preview and
 * local builds never mutate the production database.
 */
if (process.env.VERCEL_ENV !== "production") {
  process.exit(0);
}

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl || !/^postgres(?:ql)?:\/\//i.test(databaseUrl)) {
  throw new Error("Production deploy requires a persistent PostgreSQL DATABASE_URL.");
}

await import("./db-setup.mjs");
