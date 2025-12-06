/**
 * API Keys API
 */

import { Hono } from "@hono/hono";
import type { SessionContext } from "@lum/core";
import { getAPIKeysByUserId, createAPIKey, deleteAPIKey, generateAPIKey, hashAPIKey, getAPIKeyPrefix, logActivity } from "@lum/db";

export const keysAPI = new Hono<SessionContext>();

// List keys
keysAPI.get("/", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const keys = await getAPIKeysByUserId(user.id);
  
  return c.json({
    keys: keys.map(k => ({
      id: k.id,
      name: k.name,
      prefix: k.prefix,
      is_active: k.is_active,
      created_at: k.created_at,
      last_used_at: k.last_used_at,
    })),
  });
});

// Create key
keysAPI.post("/", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const { name } = await c.req.json();
  
  if (!name || typeof name !== "string" || name.length < 3) {
    return c.json({ error: "Name must be at least 3 characters" }, 400);
  }

  const rawKey = generateAPIKey();
  const keyHash = await hashAPIKey(rawKey);
  const prefix = getAPIKeyPrefix(rawKey);
  const encryptedKey = btoa(rawKey);

  const key = await createAPIKey(user.id, name, encryptedKey, keyHash, prefix);

  await logActivity({
    user_id: user.id,
    action: "api_key_created_via_api",
    resource: name,
    status: "success",
  });

  return c.json({
    id: key.id,
    name: key.name,
    key: rawKey, // Only returned once
    prefix: prefix,
    created_at: key.created_at,
  }, 201);
});

// Delete key
keysAPI.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const id = parseInt(c.req.param("id"));
  const deleted = await deleteAPIKey(id, user.id);

  if (!deleted) {
    return c.json({ error: "Key not found" }, 404);
  }

  await logActivity({
    user_id: user.id,
    action: "api_key_deleted_via_api",
    status: "success",
  });

  return c.json({ deleted: true });
});
