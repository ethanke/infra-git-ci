/**
 * Tunnels API
 */

import { Hono } from "@hono/hono";
import type { SessionContext } from "@lum/core";
import { 
  getActiveTunnels,
  getTunnelStats,
  logActivity,
} from "@lum/db";

export const tunnelsAPI = new Hono<SessionContext>();

// List active tunnels
tunnelsAPI.get("/", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const tunnels = await getActiveTunnels(user.id);
  return c.json({ tunnels });
});

// Get tunnel stats
tunnelsAPI.get("/stats", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const stats = await getTunnelStats(user.id);
  return c.json({ stats });
});
