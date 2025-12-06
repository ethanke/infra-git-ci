/**
 * Users API
 */

import { Hono } from "@hono/hono";
import type { SessionContext } from "@lum/core";
import { getUserById } from "@lum/db";

export const usersAPI = new Hono<SessionContext>();

// Get current user
usersAPI.get("/me", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const fullUser = await getUserById(user.id);
  
  if (!fullUser) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    id: fullUser.id,
    email: fullUser.email,
    display_name: fullUser.display_name,
    photo_url: fullUser.photo_url,
    is_admin: fullUser.is_admin,
    created_at: fullUser.created_at,
    updated_at: fullUser.updated_at,
  });
});

// Get user by ID (admin only)
usersAPI.get("/:id", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!user.is_admin) {
    return c.json({ error: "Admin access required" }, 403);
  }

  const userId = c.req.param("id");
  const targetUser = await getUserById(userId);
  
  if (!targetUser) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    id: targetUser.id,
    email: targetUser.email,
    display_name: targetUser.display_name,
    is_admin: targetUser.is_admin,
    created_at: targetUser.created_at,
    updated_at: targetUser.updated_at,
  });
});
