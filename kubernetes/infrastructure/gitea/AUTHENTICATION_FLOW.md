# Gitea SSO Authentication Flow

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         User visits git.lum.tools                           │
└────────────────────────────────┬────────────────────────────────────────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   Traefik Ingress      │
                    │   (git.lum.tools)      │
                    └────────────┬───────────┘
                                 │
                                 │ Apply gitea-auth middleware
                                 │ (ForwardAuth)
                                 ▼
                    ┌────────────────────────────────────────┐
                    │  Platform Service                      │
                    │  /internal/auth/verify                 │
                    │                                        │
                    │  1. Check session cookie               │
                    │  2. Verify user is authenticated       │
                    │  3. Touch session (upgrade cookie)     │
                    └────────┬───────────────────────────────┘
                             │
                ┌────────────┴────────────┐
                │                         │
                ▼                         ▼
    ┌───────────────────┐    ┌───────────────────────┐
    │  NOT Authenticated│    │    Authenticated      │
    └──────┬────────────┘    └───────┬───────────────┘
           │                         │
           │                         │ Return 200 OK + Headers:
           │                         │ - X-WebAuth-User: user_example_com
           │                         │ - X-WebAuth-Email: user@example.com
           │                         │ - X-WebAuth-FullName: John Doe
           │                         │ - Set-Cookie: session=...; Domain=.lum.tools
           │                         │
           │                         ▼
           │                ┌─────────────────────┐
           │                │  Traefik forwards   │
           │                │  request to Gitea   │
           │                │  with auth headers  │
           │                └──────┬──────────────┘
           │                       │
           │                       ▼
           │              ┌────────────────────────┐
           │              │  Gitea                 │
           │              │  1. Read X-WebAuth-*   │
           │              │  2. Auto-login user    │
           │              │  3. Auto-create if new │
           │              └────────────────────────┘
           │
           │ Return 302 Redirect:
           │ Location: https://platform.lum.tools/auth/login
           │          ?redirect_to=https://git.lum.tools/
           │
           ▼
    ┌──────────────────────────────┐
    │  Platform Login Page         │
    │  /auth/login                 │
    │                              │
    │  Check if user has session:  │
    │  - YES: Refresh cookie,      │
    │         redirect back        │
    │  - NO: Show Firebase login   │
    └──────┬───────────────────────┘
           │
           │ User logs in with Firebase
           │
           ▼
    ┌──────────────────────────────┐
    │  POST /auth/login            │
    │  1. Verify Firebase token    │
    │  2. Create/update user in DB │
    │  3. Set session cookie       │
    │     Domain=.lum.tools        │
    │  4. Redirect to redirect_to  │
    └──────┬───────────────────────┘
           │
           │ Redirect to: https://git.lum.tools/
           │
           ▼
    ┌──────────────────────────────┐
    │  Back to git.lum.tools       │
    │  (loop back to top)          │
    │  Now with valid session      │
    └──────────────────────────────┘
```

## Key Components

### 1. Session Cookie
```
Name:       session
Value:      <encrypted-session-data>
Domain:     .lum.tools          ← Shared across all subdomains
Path:       /
HttpOnly:   true
Secure:     true (production)
SameSite:   lax
Max-Age:    604800 (7 days)
```

### 2. ForwardAuth Headers (Request)
Traefik sends to Platform:
```
X-Forwarded-Host:  git.lum.tools
X-Forwarded-Uri:   /
X-Forwarded-Proto: https
Cookie:            session=...
```

### 3. Auth Response Headers
Platform returns to Traefik:
```
HTTP/1.1 200 OK
X-WebAuth-User: user_example_com
X-WebAuth-Email: user@example.com
X-WebAuth-FullName: John Doe
Set-Cookie: session=...; Domain=.lum.tools; Path=/; HttpOnly; Secure; SameSite=lax
```

### 4. Gitea Receives
After Traefik forwards:
```
GET / HTTP/1.1
Host: git.lum.tools
X-WebAuth-User: user_example_com
X-WebAuth-Email: user@example.com
X-WebAuth-FullName: John Doe
```

## Cookie Domain Upgrade Process

### Old Cookie (before fix)
```
Domain: platform.lum.tools  ← Host-only
```
**Problem**: Browser only sends this cookie to `platform.lum.tools`, not to `git.lum.tools`

### New Cookie (after fix)
```
Domain: .lum.tools  ← Shared across all subdomains
```
**Solution**: Browser sends this cookie to:
- ✅ `lum.tools`
- ✅ `platform.lum.tools`
- ✅ `git.lum.tools`
- ✅ `lrok.lum.tools`
- ✅ `*.lum.tools`

### Auto-Upgrade Trigger
```python
# In /internal/auth/verify:
request.session["_last_verified"] = datetime.utcnow().isoformat()
```
This modification triggers SessionMiddleware to issue a new `Set-Cookie` header.
SessionDomainMiddleware then adds `Domain=.lum.tools` to it.

## Session Data Structure

```python
# Stored in encrypted cookie
{
    "user_id": "firebase-uid-123",
    "user_email": "user@example.com",
    "user_display_name": "John Doe",
    "user_photo_url": "https://...",
    "is_admin": false,
    "_last_verified": "2025-11-29T12:34:56.789",
    "_refresh": "2025-11-29T12:30:00.123"
}
```

## Gitea Username Sanitization

```python
# Input: user@example.com
# Process:
username = user.email.replace("@", "_").replace(".", "_")
# Output: user_example_com

# This ensures:
# 1. Gitea accepts it (no special chars)
# 2. Consistent across sessions
# 3. No SQL injection risk
```

## Security Boundaries

```
┌──────────────────────────────────────────────────────────┐
│                    .lum.tools domain                     │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │ platform.  │  │   git.     │  │   lrok.    │        │
│  │ lum.tools  │  │ lum.tools  │  │ lum.tools  │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│       ▲              ▲              ▲                    │
│       │              │              │                    │
│       └──────────────┴──────────────┘                    │
│         All share session cookie                         │
│         (Domain=.lum.tools)                              │
└──────────────────────────────────────────────────────────┘
                        │
                        │ Cookie NOT sent to:
                        ▼
               ┌─────────────────┐
               │  example.com    │
               │  google.com     │
               │  other domains  │
               └─────────────────┘
```

## Error Scenarios

### Scenario 1: Expired Session
```
User → git.lum.tools
       ↓ (session expired)
Platform → 302 Redirect to login
       ↓
User → platform.lum.tools/auth/login?redirect_to=...
       ↓ (Firebase login)
       ↓ (new session created)
User → git.lum.tools (with new session)
       ✅ Success
```

### Scenario 2: Session Exists but Wrong Domain
```
User → git.lum.tools
       ↓ (cookie not sent - wrong domain)
Platform → 302 Redirect to login
       ↓
User → platform.lum.tools/auth/login
       ↓ (detects existing session)
       ↓ (upgrades cookie to .lum.tools)
       ↓ (302 redirect back)
User → git.lum.tools (with upgraded session)
       ✅ Success
```

### Scenario 3: Gitea User Already Exists
```
Platform → Returns X-WebAuth-Email: existing@example.com
           ↓
Gitea → Checks if user exists
        ↓ (YES, found by email)
        ↓ (login as existing user)
        ✅ Success
```

### Scenario 4: New Gitea User
```
Platform → Returns X-WebAuth-Email: new@example.com
           ↓
Gitea → Checks if user exists
        ↓ (NO, not found)
        ↓ (ENABLE_REVERSE_PROXY_AUTO_REGISTRATION = true)
        ↓ (creates new user automatically)
        ✅ Success, account created
```

## Performance Impact

- **ForwardAuth call**: ~5-20ms (internal cluster)
- **Session read**: ~1-2ms (cookie decryption)
- **Cookie upgrade**: ~0ms (happens asynchronously)
- **Total overhead**: ~10-30ms per request

**Mitigation**: Consider caching ForwardAuth responses for 30-60 seconds using Traefik's `authResponseHeadersRegex` and custom caching.

## Monitoring

### Check ForwardAuth Activity
```bash
kubectl logs deployment/platform -n platform | grep "internal/auth/verify"
```

### Check Session Upgrades
```bash
kubectl logs deployment/platform -n platform | grep "_last_verified"
```

### Check Gitea Auto-Registrations
```bash
kubectl logs deployment/gitea -n gitea | grep "auto-registration"
```

### Check User Count in Gitea
```bash
kubectl exec -it deployment/gitea -n gitea -- gitea admin user list
```
