/**
 * Authentication routes
 */

import { Hono } from "@hono/hono";
import type { SessionContext } from "@lum/core";
import { renderShell } from "@lum/ui";
import { createOrUpdateUser, logActivity } from "@lum/db";
import { setSessionCookie, clearSessionCookie } from "../middleware/session.ts";

export const authRoutes = new Hono<SessionContext>();

// Firebase config from environment
const FIREBASE_API_KEY = Deno.env.get("FIREBASE_API_KEY") ?? "";
const FIREBASE_AUTH_DOMAIN = Deno.env.get("FIREBASE_AUTH_DOMAIN") ?? "";
const FIREBASE_PROJECT_ID = Deno.env.get("FIREBASE_PROJECT_ID") ?? "";

// Login page
authRoutes.get("/login", (c) => {
  const user = c.get("user");
  const redirectTo = c.req.query("redirect_to") ?? "/";
  
  // Already logged in
  if (user) {
    return c.redirect(redirectTo);
  }

  const loginContent = `
<div class="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
  <div class="max-w-md w-full">
    <!-- Logo -->
    <div class="text-center mb-8">
      <a href="https://lum.tools" class="inline-flex items-center gap-2">
        <svg class="w-12 h-12" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="url(#logo-gradient)"/>
          <path d="M8 12l8-4 8 4-8 4-8-4z" fill="white" fill-opacity="0.9"/>
          <path d="M8 16l8 4 8-4" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M8 20l8 4 8-4" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <defs>
            <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
              <stop stop-color="#FF8000"/>
              <stop offset="1" stop-color="#E94055"/>
            </linearGradient>
          </defs>
        </svg>
        <span class="text-2xl font-bold" style="color: var(--lum-orange);">lum.tools</span>
      </a>
    </div>

    <!-- Login Card -->
    <div class="rounded-xl p-8 border" style="background: var(--color-surface); border-color: var(--color-border);">
      <h2 class="text-2xl font-bold text-white text-center mb-2">Welcome back</h2>
      <p class="text-gray-400 text-center mb-8">Sign in to your account</p>

      <!-- Firebase UI Container -->
      <div id="firebaseui-auth-container"></div>

      <!-- Loading state -->
      <div id="loading" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent"></div>
        <p class="text-gray-400 mt-4">Loading authentication...</p>
      </div>
    </div>

    <!-- Footer -->
    <p class="text-center text-gray-500 text-sm mt-8">
      By signing in, you agree to our
      <a href="/terms" class="text-orange-500 hover:text-orange-400">Terms of Service</a>
      and
      <a href="/privacy" class="text-orange-500 hover:text-orange-400">Privacy Policy</a>.
    </p>
  </div>
</div>

<!-- Firebase Auth -->
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/10.7.1/firebase-auth-compat.js"></script>
<script src="https://www.gstatic.com/firebasejs/ui/6.1.0/firebase-ui-auth.js"></script>
<link type="text/css" rel="stylesheet" href="https://www.gstatic.com/firebasejs/ui/6.1.0/firebase-ui-auth.css" />

<script>
  const firebaseConfig = {
    apiKey: "${FIREBASE_API_KEY}",
    authDomain: "${FIREBASE_AUTH_DOMAIN}",
    projectId: "${FIREBASE_PROJECT_ID}",
  };
  
  firebase.initializeApp(firebaseConfig);
  
  const ui = new firebaseui.auth.AuthUI(firebase.auth());
  
  const uiConfig = {
    callbacks: {
      signInSuccessWithAuthResult: function(authResult, redirectUrl) {
        // Get ID token and send to server
        authResult.user.getIdToken().then(function(idToken) {
          fetch('/auth/callback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              idToken: idToken,
              redirectTo: '${redirectTo}'
            }),
          }).then(res => res.json()).then(data => {
            if (data.success) {
              window.location.href = data.redirectTo || '/';
            } else {
              alert('Login failed: ' + data.error);
            }
          });
        });
        return false; // Prevent default redirect
      },
      uiShown: function() {
        document.getElementById('loading').style.display = 'none';
      }
    },
    signInFlow: 'popup',
    signInOptions: [
      firebase.auth.GoogleAuthProvider.PROVIDER_ID,
      firebase.auth.GithubAuthProvider.PROVIDER_ID,
      firebase.auth.EmailAuthProvider.PROVIDER_ID,
    ],
    tosUrl: '/terms',
    privacyPolicyUrl: '/privacy',
  };
  
  ui.start('#firebaseui-auth-container', uiConfig);
</script>
`;

  return c.html(renderShell({
    head: {
      title: "Sign In - lum.tools",
      description: "Sign in to your lum.tools account",
    },
    content: loginContent,
    footer: false,
  }));
});

// Auth callback (receives Firebase token)
authRoutes.post("/callback", async (c) => {
  try {
    const { idToken, redirectTo } = await c.req.json();
    
    // Verify Firebase token
    // In production, verify with Firebase Admin SDK
    // For now, decode the JWT payload
    const parts = idToken.split(".");
    if (parts.length !== 3) {
      return c.json({ success: false, error: "Invalid token" }, 400);
    }
    
    const payload = JSON.parse(atob(parts[1]));
    
    const uid = payload.user_id || payload.sub;
    const email = payload.email;
    const displayName = payload.name;
    const photoUrl = payload.picture;
    
    if (!uid || !email) {
      return c.json({ success: false, error: "Invalid token data" }, 400);
    }

    // Create or update user in database
    const user = await createOrUpdateUser({
      id: uid,
      email,
      display_name: displayName,
      photo_url: photoUrl,
    });

    // Log activity
    await logActivity({
      user_id: user.id,
      action: "login",
      status: "success",
      ip_address: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      user_agent: c.req.header("user-agent"),
    });

    // Set session cookie
    setSessionCookie(c, {
      user_id: user.id,
      email: user.email,
      display_name: user.display_name,
      is_admin: user.is_admin,
    });

    // Validate redirect URL (prevent open redirects)
    let safeRedirect = "/";
    if (redirectTo) {
      try {
        const url = new URL(redirectTo, "https://lum.tools");
        if (url.hostname.endsWith("lum.tools") || url.hostname === "localhost") {
          safeRedirect = redirectTo;
        }
      } catch {
        // Invalid URL, use default
      }
    }

    return c.json({ success: true, redirectTo: safeRedirect });
  } catch (error) {
    console.error("Auth callback error:", error);
    return c.json({ success: false, error: "Authentication failed" }, 500);
  }
});

// Logout
authRoutes.get("/logout", async (c) => {
  const user = c.get("user");
  
  if (user) {
    await logActivity({
      user_id: user.id,
      action: "logout",
      status: "success",
      ip_address: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
      user_agent: c.req.header("user-agent"),
    });
  }

  clearSessionCookie(c);
  return c.redirect("https://lum.tools");
});

// Auth check API (for extensions, other services)
authRoutes.get("/check", (c) => {
  const user = c.get("user");
  
  if (user) {
    return c.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        display_name: user.display_name,
        is_admin: user.is_admin,
      },
    });
  }
  
  return c.json({
    authenticated: false,
    login_url: "https://platform.lum.tools/auth/login",
  }, 401);
});
