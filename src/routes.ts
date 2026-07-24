/**
 * routes.ts — Fastify route definitions for snipr.
 *
 * Registers all API endpoints and the catch-all redirect handler.
 */

import type { FastifyInstance, FastifyRequest, FastifyReply } from "fastify";
import { shortenBodySchema } from "./validation.js";
import {
  createShortLink,
  resolveCode,
  incrementClicks,
  getStats,
  getTotalCount,
  CodeError,
} from "./shortener.js";

/** Register all routes on the Fastify instance. */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  // ---------- Health check ----------
  app.get("/health", async () => {
    return { status: "ok" };
  });

  // ---------- Shorten a URL ----------
  app.post("/api/shorten", async (request: FastifyRequest, reply: FastifyReply) => {
    const parsed = shortenBodySchema.safeParse(request.body);

    if (!parsed.success) {
      return reply.status(400).send({
        error: "Validation failed",
        issues: parsed.error.issues.map((i) => i.message),
      });
    }

    const { url, customCode } = parsed.data;

    try {
      const link = await createShortLink(url, customCode);
      const baseUrl = (process.env["BASE_URL"] ?? "http://localhost:3000").replace(/\/+$/, "");

      return reply.status(201).send({
        shortUrl: `${baseUrl}/${link.shortCode}`,
        code: link.shortCode,
        originalUrl: link.originalUrl,
      });
    } catch (err) {
      if (err instanceof CodeError) {
        return reply.status(err.statusCode).send({ error: err.message });
      }
      throw err; // Let the global error handler deal with unexpected errors
    }
  });

  // ---------- Link stats ----------
  app.get("/api/stats/:code", async (request: FastifyRequest, reply: FastifyReply) => {
    const { code } = request.params as { code: string };
    const stats = await getStats(code);

    if (!stats) {
      return reply.status(404).send({ error: "Short link not found" });
    }

    return stats;
  });

  // ---------- Total link count ----------
  app.get("/api/count", async () => {
    const count = await getTotalCount();
    return { count };
  });

  // ---------- Redirect (must be registered last) ----------
  app.get("/:code", async (request: FastifyRequest, reply: FastifyReply) => {
    const { code } = request.params as { code: string };
    const link = await resolveCode(code);

    if (!link) {
      return reply.status(404).type("text/html").send(notFoundPage(code));
    }

    // Fire-and-forget click increment — don't block the redirect
    incrementClicks(code);

    return reply.redirect(link.original_url, 302);
  });
}

/** Minimal 404 HTML page for unknown short codes. */
function notFoundPage(code: string): string {
  const escaped = code.replace(/[&<>"']/g, (c) => {
    const map: Record<string, string> = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };
    return map[c] ?? c;
  });

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>404 — snipr</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
           display: flex; align-items: center; justify-content: center; min-height: 100vh;
           margin: 0; background: #f9fafb; color: #111827; }
    .box { text-align: center; }
    h1 { font-size: 4rem; margin: 0; color: #4F46E5; }
    p  { color: #6b7280; margin-top: 0.5rem; }
    a  { color: #4F46E5; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="box">
    <h1>404</h1>
    <p>No link found for <code>${escaped}</code></p>
    <a href="/">← Back to snipr</a>
  </div>
</body>
</html>`;
}
