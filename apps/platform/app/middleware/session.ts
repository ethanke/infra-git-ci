/**
 * Session middleware
 * 
 * Validates session cookies and sets user context.
 * Uses cookie-based sessions shared across lum.tools subdomains.
 */

import type { Context, Next } from "@hono/hono";
import { getCookie, setCookie, deleteCookie } from "@hono/hono/cookie";
import type { SessionContext } from "@lum/core";
import { getUserById } from "@lum/db";

const SESSION_COOKIE = "lum_session";
const SESSION_SECRET = Deno.env.get("SESSION_SECRET") ?? "dev-secret-change-me";

// Simple session encoding (in production, use proper JWT or encrypted cookies)
export function encodeSession(data: Record<string, unknown>): string {
  const json = JSON.stringify(data);
  return btoa(json);
}

export function decodeSession(token: string): Record<string, unknown> | null {
  try {
    const json = atob(token);
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export async function sessionMiddleware(c: Context<SessionContext>, next: Next) {
  // Skip auth for health and static routes
  const path = new URL(c.req.url).pathname;
  if (path === "/health" || path.startsWith("/static/") || path === "/robots.txt") {
    c.set("user", null);
    c.set("sessionCookie", "");
    return next();
  }

  // Get session cookie
  const sessionToken = getCookie(c, SESSION_COOKIE);
  
  if (sessionToken) {
    const sessionData = decodeSession(sessionToken);
    
    if (sessionData?.user_id) {
      // Validate user exists in database
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

  // No valid session
  c.set("user", null);
  c.set("sessionCookie", "");
  return next();
}

export function setSessionCookie(c: Context, data: {
  user_id: string;
  email: string;
  display_name?: string | null;
  is_admin?: boolean;
}): void {
  const token = encodeSession({
    user_id: data.user_id,
    email: data.email,
    display_name: data.display_name,
    is_admin: data.is_admin,
    created_at: Date.now(),
  });

  const isProduction = Deno.env.get("ENV") === "production";
  
  setCookie(c, SESSION_COOKIE, token, {
    path: "/",
    domain: isProduction ? ".lum.tools" : undefined,
    maxAge: 60 * 60 * 24 * 7, // 7 days
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "None" : "Lax",
  });
}

export function clearSessionCookie(c: Context): void {
  const isProduction = Deno.env.get("ENV") === "production";
  
  deleteCookie(c, SESSION_COOKIE, {
    path: "/",
    domain: isProduction ? ".lum.tools" : undefined,
  });
}

export function requireAuth(c: Context<SessionContext>): Response | null {
  const user = c.get("user");
  
  if (!user) {
    const currentUrl = c.req.url;
    const loginUrl = `/auth/login?redirect_to=${encodeURIComponent(currentUrl)}`;
    return c.redirect(loginUrl);
  }
  
  return null;
}
