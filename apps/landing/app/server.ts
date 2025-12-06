/**
 * lum.tools Landing Page
 * 
 * High-performance marketing site built with Deno + Hono.
 * Server-rendered HTML with minimal JS for maximum performance.
 */

import "@std/dotenv/load";
import { Hono } from "@hono/hono";
import { logger } from "@hono/hono/logger";
import { secureHeaders } from "@hono/hono/secure-headers";
import { compress } from "@hono/hono/compress";

import { indexRoute } from "./routes/index.ts";
import { seoRoutes } from "./routes/seo.ts";

const app = new Hono();

// Global middleware
app.use("*", logger());
app.use("*", secureHeaders());
app.use("*", compress());

// Health check (must be fast, uncached)
app.get("/health", (c) => {
  return c.json({
    status: "healthy",
    service: "landing",
    version: "2.0.0",
    timestamp: new Date().toISOString(),
  });
});

// SEO routes (robots.txt, sitemap.xml)
app.route("/", seoRoutes);

// Main landing page
app.get("/", indexRoute);

// Static files (if needed in the future)
// app.use("/static/*", serveStatic({ root: "./" }));

// 404 handler
app.notFound((c) => {
  return c.redirect("https://lum.tools");
});

// Start server
const port = parseInt(Deno.env.get("PORT") ?? "3000");
console.log(`🚀 Landing page starting on http://localhost:${port}`);

Deno.serve({ port }, app.fetch);
