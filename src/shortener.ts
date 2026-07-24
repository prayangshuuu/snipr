/**
 * shortener.ts — Core URL-shortening logic.
 *
 * Handles code generation, link creation (with collision retry),
 * resolution, click tracking, and stats retrieval.
 */

import crypto from "node:crypto";
import { query } from "./db.js";
import { RESERVED_CODES } from "./validation.js";

/** Base62 alphabet used for random short codes. */
const BASE62 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
const CODE_LENGTH = 6;
const MAX_RETRIES = 5;

/** Generate a cryptographically random 6-char base62 code. */
export function generateCode(): string {
  const bytes = crypto.randomBytes(CODE_LENGTH);
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i++) {
    code += BASE62[bytes[i]! % BASE62.length];
  }
  return code;
}

/** Row shape returned by link queries. */
export interface LinkRow {
  id: string;
  short_code: string;
  original_url: string;
  is_custom: boolean;
  clicks: string; // BIGINT comes back as string from pg
  created_at: Date;
}

/**
 * Create a shortened link.
 *
 * If `customCode` is provided, attempts a single insert (409 on conflict).
 * Otherwise generates random codes, retrying up to MAX_RETRIES on collision.
 */
export async function createShortLink(
  url: string,
  customCode?: string,
): Promise<{ shortCode: string; originalUrl: string; isCustom: boolean }> {
  // --- Custom code path ---
  if (customCode) {
    if (RESERVED_CODES.has(customCode.toLowerCase())) {
      throw new CodeError(409, `Code "${customCode}" is reserved`);
    }

    const result = await query<LinkRow>(
      `INSERT INTO links (short_code, original_url, is_custom)
       VALUES ($1, $2, true)
       ON CONFLICT (short_code) DO NOTHING
       RETURNING short_code`,
      [customCode, url],
    );

    if (result.rowCount === 0) {
      throw new CodeError(409, `Code "${customCode}" is already taken`);
    }

    return { shortCode: customCode, originalUrl: url, isCustom: true };
  }

  // --- Random code path (retry on collision) ---
  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const code = generateCode();
    if (RESERVED_CODES.has(code.toLowerCase())) continue;

    const result = await query<LinkRow>(
      `INSERT INTO links (short_code, original_url, is_custom)
       VALUES ($1, $2, false)
       ON CONFLICT (short_code) DO NOTHING
       RETURNING short_code`,
      [code, url],
    );

    if (result.rowCount && result.rowCount > 0) {
      return { shortCode: code, originalUrl: url, isCustom: false };
    }
  }

  throw new CodeError(500, "Unable to generate a unique code. Please try again.");
}

/** Look up a short code. Returns the row or null if not found. */
export async function resolveCode(code: string): Promise<LinkRow | null> {
  const { rows } = await query<LinkRow>(
    "SELECT * FROM links WHERE short_code = $1",
    [code],
  );
  return rows[0] ?? null;
}

/** Increment the click counter (fire-and-forget). */
export function incrementClicks(code: string): void {
  query("UPDATE links SET clicks = clicks + 1 WHERE short_code = $1", [code]).catch(
    (err: unknown) => {
      console.error("[shortener] failed to increment clicks:", err);
    },
  );
}

/** Get stats for a short code. Returns the row or null. */
export async function getStats(
  code: string,
): Promise<{ code: string; originalUrl: string; clicks: number; createdAt: Date } | null> {
  const row = await resolveCode(code);
  if (!row) return null;
  return {
    code: row.short_code,
    originalUrl: row.original_url,
    clicks: Number(row.clicks),
    createdAt: row.created_at,
  };
}

/** Get total number of shortened links. */
export async function getTotalCount(): Promise<number> {
  const { rows } = await query<{ count: string }>("SELECT COUNT(*) AS count FROM links");
  return Number(rows[0]?.count ?? 0);
}

/** Custom error with an HTTP status code. */
export class CodeError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string,
  ) {
    super(message);
    this.name = "CodeError";
  }
}
