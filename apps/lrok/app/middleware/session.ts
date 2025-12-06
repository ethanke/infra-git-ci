/**
 * Session middleware for lrok
 * 
 * Shares session with platform via .lum.tools domain cookies.
 */

import type { Context, Next } from "@hono/hono";
import { getCookie } from "@hono/hono/cookie";
import type { SessionContext } from "@lum/core";
import { getUserById } from "@lum/db";

const SESSION_COOKIE = "lum_session";

function decodeSession(token: string): Record<string, unknown> | null {
  try {
    const json = atob(token);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function sessionMiddleware(c: Context<SessionContext>, next: Next) {
  const path = new URL(c.req.url).pathname;
  
  // Skip auth for health and static routes
  if (path === "/health" || path.startsWith("/static/") || path === "/robots.txt") {
    c.set("user", null);
    c.set("sessionCookie", "");
    return next();
  }

  // Get session cookie (shared with platform.lum.tools)
  const sessionToken = getCookie(c, SESSION_COOKIE);
  
  if (sessionToken) {
    const sessionData = decodeSession(sessionToken);
    
    if (sessionData?.user_id) {
      const user = await getUserById(sessionData.user_id as string);
      
      if (user) {
        c.set("user", {
          id: user.id,
          email: user.email,
          display_name: user.display_name,
          photo_url: user.photo_url,
          is_admin: user.is_admin,
        });
        c.set("sessionCookie", sessionToken);
        return next();
      }
    }
  }

  c.set("user", null);
  c.set("sessionCookie", "");
  return next();
}

export function requireAuth(c: Context<SessionContext>): Response | null {
  const user = c.get("user");
  
  if (!user) {
    const currentUrl = c.req.url;
    const loginUrl = `https://platform.lum.tools/auth/login?redirect_to=${encodeURIComponent(currentUrl)}`;
    return c.redirect(loginUrl);
  }
  
  return null;
}
