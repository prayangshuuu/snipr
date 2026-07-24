/**
 * validation.ts — Zod schemas for request validation.
 *
 * Keeps all validation logic in one place so routes stay lean.
 */

import { z } from "zod/v4";

/** Codes that are reserved for internal routes and must not be used as short codes. */
export const RESERVED_CODES = new Set(["api", "health", "static"]);

/**
 * Schema for POST /api/shorten request body.
 *
 * - `url` must be a valid http or https URL.
 * - `customCode` (optional) must be 3-32 alphanumeric / dash / underscore chars.
 */
export const shortenBodySchema = z.object({
  url: z
    .url()
    .refine(
      (u) => u.startsWith("http://") || u.startsWith("https://"),
      { message: "Only http and https URLs are allowed" },
    ),
  customCode: z
    .string()
    .regex(
      /^[a-zA-Z0-9_-]{3,32}$/,
      "Custom code must be 3-32 characters: letters, digits, hyphens, underscores",
    )
    .optional(),
});

/** Inferred type for a validated shorten request body. */
export type ShortenBody = z.infer<typeof shortenBodySchema>;
