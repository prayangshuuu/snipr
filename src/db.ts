/**
 * db.ts — PostgreSQL connection pool and query helper.
 *
 * Uses the `pg` library with a connection string from DATABASE_URL.
 * Exports a thin `query()` wrapper and a `closePool()` for graceful shutdown.
 */

import pg from "pg";

const { Pool } = pg;

/** Shared connection pool — created once at import time. */
const pool = new Pool({
  connectionString: process.env["DATABASE_URL"],
});

/** Log when the pool connects for the first time. */
pool.on("connect", () => {
  console.log("[db] new client connected to PostgreSQL");
});

/** Log pool-level errors (e.g. idle client disconnects). */
pool.on("error", (err) => {
  console.error("[db] unexpected pool error:", err.message);
});

/**
 * Run a parameterised SQL query against the pool.
 * Returns the full pg.QueryResult so callers can read `rows`, `rowCount`, etc.
 */
export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(
  text: string,
  params?: unknown[],
): Promise<pg.QueryResult<T>> {
  return pool.query<T>(text, params);
}

/** Drain the pool — call this on graceful shutdown. */
export async function closePool(): Promise<void> {
  await pool.end();
  console.log("[db] pool closed");
}
