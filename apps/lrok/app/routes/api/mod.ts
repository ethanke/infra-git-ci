/**
 * API routes for lrok
 */

import { Hono } from "@hono/hono";
import type { SessionContext } from "@lum/core";
import { tunnelsAPI } from "./tunnels.ts";
import { subdomainsAPI } from "./subdomains.ts";

export const apiRoutes = new Hono<SessionContext>();

// Mount API routes
apiRoutes.route("/tunnels", tunnelsAPI);
apiRoutes.route("/subdomains", subdomainsAPI);

// API info
apiRoutes.get("/", (c) => {
  return c.json({
    name: "lrok API",
    version: "2.0.0",
    endpoints: {
      tunnels: "/api/tunnels",
      subdomains: "/api/subdomains",
    },
  });
});
