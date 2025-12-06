/**
 * Subdomains API
 */

import { Hono } from "@hono/hono";
import type { SessionContext } from "@lum/core";
import { 
  getReservedSubdomains,
  getReservedSubdomainByName,
  reserveSubdomain,
  releaseSubdomain,
} from "@lum/db";

export const subdomainsAPI = new Hono<SessionContext>();

// Check availability
subdomainsAPI.get("/check", async (c) => {
  const subdomain = c.req.query("subdomain");
  const domain = c.req.query("domain") || "t.lum.tools";
  
  if (!subdomain) {
    return c.json({ error: "Subdomain required" }, 400);
  }

  const existing = await getReservedSubdomainByName(subdomain.toLowerCase(), domain);
  return c.json({ available: !existing, subdomain, domain });
});

// List subdomains
subdomainsAPI.get("/", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const subdomains = await getReservedSubdomains(user.id);
  return c.json({ subdomains });
});

// Reserve subdomain
subdomainsAPI.post("/", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { subdomain, domain = "t.lum.tools" } = await c.req.json();
  
  if (!subdomain || subdomain.length < 3) {
    return c.json({ error: "Subdomain must be at least 3 characters" }, 400);
  }

  const normalized = subdomain.toLowerCase().trim();
  
  const existing = await getReservedSubdomainByName(normalized, domain);
  if (existing) {
    return c.json({ error: "Subdomain is already taken" }, 400);
  }

  const created = await reserveSubdomain(user.id, normalized, domain);
  return c.json({ subdomain: created }, 201);
});

// Delete subdomain
subdomainsAPI.delete("/:subdomain", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const subdomain = c.req.param("subdomain");
  const domain = c.req.query("domain") || "t.lum.tools";
  
  const deleted = await releaseSubdomain(user.id, subdomain, domain);

  if (!deleted) {
    return c.json({ error: "Subdomain not found" }, 404);
  }

  return c.json({ deleted: true });
});
