/**
 * index.ts — snipr server entry point.
 *
 * Boots Fastify, registers plugins (static files, rate limiting),
 * wires up routes, and handles graceful shutdown.
 */

import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Fastify from "fastify";
import fastifyStatic from "@fastify/static";
import fastifyRateLimit from "@fastify/rate-limit";
import { registerRoutes } from "./routes.js";
import { closePool } from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Create and configure the Fastify instance. */
async function buildServer() {
  const app = Fastify({
    logger: { level: "info" },
  });

  // --- Plugins ---

  // Serve frontend static files from public/
  await app.register(fastifyStatic, {
    root: path.resolve(__dirname, "..", "public"),
    prefix: "/",
    wildcard: false, // Don't catch /:code routes
  });

  // Rate limit the shorten endpoint: 30 requests/min per IP
  await app.register(fastifyRateLimit, {
    max: 30,
    timeWindow: "1 minute",
    keyGenerator: (request) => request.ip,
    addHeadersOnExceeding: { "x-ratelimit-limit": true, "x-ratelimit-remaining": true, "x-ratelimit-reset": true },
    addHeaders: { "x-ratelimit-limit": true, "x-ratelimit-remaining": true, "x-ratelimit-reset": true, "retry-after": true },
    hook: "onRequest",
    allowList: [],
    // Only apply to POST /api/shorten
    onExceeding: () => {},
    onExceeded: () => {},
  });

  // --- Routes ---
  await app.register(registerRoutes);

  // --- Global error handler ---
  app.setErrorHandler((error, _request, reply) => {
    const statusCode = (error as { statusCode?: number }).statusCode ?? 500;

    if (statusCode >= 500) {
      app.log.error(error);
    }

    return reply.status(statusCode).send({
      error: statusCode >= 500 ? "Internal server error" : (error as Error).message,
    });
  });

  return app;
}

/** Start the server and wire up graceful shutdown. */
async function main(): Promise<void> {
  const app = await buildServer();
  const port = Number(process.env["PORT"] ?? 3000);

  // --- Graceful shutdown ---
  const shutdown = async (signal: string) => {
    app.log.info(`Received ${signal}, shutting down…`);
    await app.close();
    await closePool();
    process.exit(0);
  };

  process.on("SIGTERM", () => void shutdown("SIGTERM"));
  process.on("SIGINT", () => void shutdown("SIGINT"));

  // --- Listen ---
  await app.listen({ port, host: "0.0.0.0" });
  app.log.info(`snipr running on http://localhost:${port}`);
}

main().catch((err) => {
  console.error("Failed to start snipr:", err);
  process.exit(1);
});
