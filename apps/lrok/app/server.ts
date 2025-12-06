/**
 * lrok - Tunnel Management Service
 * 
 * Web UI for managing lrok tunnels and subdomains.
 * Built with Deno + Hono for maximum performance.
 */

import "@std/dotenv/load";
import { Hono } from "@hono/hono";
import { logger } from "@hono/hono/logger";
import { secureHeaders } from "@hono/hono/secure-headers";
import { compress } from "@hono/hono/compress";
import { cors } from "@hono/hono/cors";

import type { SessionContext } from "@lum/core";
import { sessionMiddleware } from "./middleware/session.ts";
import { closePool } from "@lum/db";

// Routes
import { indexRoutes } from "./routes/index.ts";
import { tunnelsRoutes } from "./routes/tunnels.ts";
import { subdomainsRoutes } from "./routes/subdomains.ts";
import { apiRoutes } from "./routes/api/mod.ts";

const app = new Hono<SessionContext>();

// Global middleware
app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", compress());

// CORS for API
app.use("/api/*", cors({
  origin: [
    "https://platform.lum.tools",
    "https://lrok.lum.tools",
    "http://localhost:3000",
  ],
  credentials: true,
  allowMethods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization", "Cookie"],
}));

// Session middleware
app.use("*", sessionMiddleware);

// Health check
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    service: "lrok",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
});

// Mount routes
app.route("/", indexRoutes);
app.route("/tunnels", tunnelsRoutes);
app.route("/subdomains", subdomainsRoutes);
app.route("/api", apiRoutes);

// 404 handler
app.notFound((c) => {
  return c.html(`
    <!DOCTYPE html>
    <html>
    <head><title>404 - Not Found</title></head>
    <body style="background: #0A0A0A; color: #fff; font-family: system-ui; display: flex; align-items: center; justify-content: center; min-height: 100vh;">
      <div style="text-align: center;">
        <h1 style="font-size: 6rem; margin: 0; color: #FF8000;">404</h1>
        <p style="color: #888;">Page not found</p>
        <a href="/" style="color: #FF8000;">← Back to home</a>
      </div>
    </body>
    </html>
  `, 404);
});

// Error handler
app.onError((err, c) => {
  console.error("lrok error:", err);
  return c.json({
    error: err.message,
    status: "error",
  }, 500);
});

// Graceful shutdown
globalThis.addEventListener("unload", async () => {
  console.log("Shutting down lrok service...");
  await closePool();
});

// Start server
const port = parseInt(Deno.env.get("PORT") ?? "3000");
console.log(`🔗 lrok service starting on http://localhost:${port}`);

Deno.serve({ port }, app.fetch);
