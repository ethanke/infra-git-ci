/**
 * API routes module
 * 
 * RESTful API endpoints for programmatic access.
 */

import { Hono } from "@hono/hono";
import type { SessionContext } from "@lum/core";
import { apiKeyMiddleware } from "./middleware.ts";

// Import API route modules
import { keysAPI } from "./keys.ts";
import { usersAPI } from "./users.ts";

export const apiRoutes = new Hono<SessionContext>();

// API key verification middleware
apiRoutes.use("/v1/*", apiKeyMiddleware);

// Mount API routes
apiRoutes.route("/v1/keys", keysAPI);
apiRoutes.route("/v1/users", usersAPI);

// API info
apiRoutes.get("/", (c) => {
  return c.json({
    name: "lum.tools Platform API",
    version: "1.0.0",
    documentation: "https://docs.lum.tools",
    endpoints: {
      keys: "/api/v1/keys",
      users: "/api/v1/users",
    },
  });
});

// API status
apiRoutes.get("/status", (c) => {
  return c.json({
    status: "operational",
    timestamp: new Date().toISOString(),
  });
});
