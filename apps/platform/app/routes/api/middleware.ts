/**
 * API Authentication Middleware
 */

import type { Context, Next } from "@hono/hono";
import type { SessionContext } from "@lum/core";
import { verifyAPIKey as verifyAPIKeyDB, getUserById } from "@lum/db";

export async function apiKeyMiddleware(c: Context<SessionContext>, next: Next) {
  const authHeader = c.req.header("Authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({
      error: "Missing or invalid Authorization header",
      hint: "Use: Authorization: Bearer lum_your_api_key",
    }, 401);
  }

  const apiKey = authHeader.slice(7); // Remove "Bearer "
  
  if (!apiKey.startsWith("lum_")) {
    return c.json({
      error: "Invalid API key format",
      hint: "API keys start with 'lum_'",
    }, 401);
  }

  // Verify key against database
  const result = await verifyAPIKeyDB(apiKey);
  
  if (!result) {
    return c.json({
      error: "Invalid or inactive API key",
    }, 401);
  }

  // Get user info
  const user = await getUserById(result.user_id);
  if (!user) {
    return c.json({
      error: "User not found",
    }, 401);
  }

  // Set user context from API key
  c.set("user", {
    id: user.id,
    email: user.email,
    display_name: user.display_name,
    photo_url: user.photo_url,
    is_admin: user.is_admin,
  });

  return next();
}
