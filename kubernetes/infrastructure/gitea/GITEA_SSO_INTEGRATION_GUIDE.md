# Gitea SSO Integration with Platform Authentication

## Overview
This guide documents the integration of Gitea into the lum.tools product ecosystem using Reverse Proxy Authentication (ForwardAuth) to leverage the shared session cookie domain (`.lum.tools`).

## Architecture

### Authentication Flow
1. User visits `git.lum.tools`
2. Traefik forwards request to Platform's `/internal/auth/verify` endpoint (ForwardAuth)
3. Platform checks for valid session cookie (domain: `.lum.tools`)
4. **If authenticated**: Platform returns 200 with user headers → User accesses Gitea
5. **If not authenticated**: Platform returns 302 redirect to login → User logs in → Redirect back to Gitea

### Key Components

#### 1. Platform Service (Auth Provider)
- **Endpoint**: `GET /internal/auth/verify`
- **Location**: `/home/ethan/Work/lum.tools/services/platform/app/routes/internal.py`
- **Responsibilities**:
  - Check session cookie for authenticated user
  - Return user headers for Gitea auto-registration
  - Redirect unauthenticated users to login with return URL

#### 2. Session Cookie Configuration
- **Cookie Name**: `session`
- **Domain**: `.lum.tools` (shared across all subdomains)
- **Max Age**: 7 days
- **Same Site**: `lax`
- **Secure**: `true` (production)
- **Set By**: `SessionDomainMiddleware` in platform service

#### 3. Traefik ForwardAuth Middleware
- **Resource**: `infra/k8s/gitea/middleware.yaml`
- **Middleware Name**: `gitea-auth`
- **Auth URL**: `http://platform-service.platform.svc.cluster.local:80/internal/auth/verify`
- **Headers Forwarded to Gitea**:
  - `X-WebAuth-User`: Sanitized username (email with '@' → '_')
  - `X-WebAuth-Email`: User's email address
  - `X-WebAuth-FullName`: User's display name

#### 4. Gitea Configuration
- **Reverse Proxy Auth**: Enabled in `app.ini`
- **Auto Registration**: Enabled (creates users automatically)
- **Username Source**: `X-WebAuth-User` header
- **Email Source**: `X-WebAuth-Email` header

## Current Issue: Cookie Domain Scoping

### Problem
Users who logged in before the domain change have cookies scoped to `platform.lum.tools` only. When they visit `git.lum.tools`, the browser doesn't send the cookie, causing a redirect loop.

### Root Cause
- **Old behavior**: SessionMiddleware set cookie without explicit domain → defaults to host-only (`platform.lum.tools`)
- **New behavior**: SessionDomainMiddleware should set `Domain=.lum.tools`
- **Issue**: Existing users still have old cookies

### Solution (Multi-Step)

#### Step 1: Force Cookie Domain Update (✅ Implemented)
Added session refresh in `/auth/login` when user is already authenticated:
```python
if user:
    # Force session update to ensure cookie domain is set correctly to .lum.tools
    request.session["_refresh"] = datetime.utcnow().isoformat()
    
    if redirect_to and validate_redirect_url(redirect_to):
        return RedirectResponse(url=redirect_to, status_code=302)
```

This triggers a new `Set-Cookie` header with the correct domain.

#### Step 2: Add Domain Upgrade Endpoint
Create an endpoint that existing users can visit to upgrade their cookie:

**File**: `services/platform/app/routes/auth.py`
```python
@router.get("/upgrade-session")
async def upgrade_session(
    request: Request,
    user: User = Depends(get_current_user)
):
    """
    Upgrade existing session cookie to use .lum.tools domain.
    This endpoint forces a cookie re-issue with the correct domain.
    """
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    # Touch session to trigger Set-Cookie with domain
    request.session["_upgraded"] = datetime.utcnow().isoformat()
    
    return JSONResponse({
        "success": True,
        "message": "Session cookie upgraded to .lum.tools domain"
    })
```

#### Step 3: Automatic Cookie Upgrade in ForwardAuth
Modify `/internal/auth/verify` to upgrade cookies automatically when a user is redirected from a subdomain:

**File**: `services/platform/app/routes/internal.py`
```python
@router.get("/auth/verify")
async def verify_session(
    request: Request,
    response: Response,
    user: Optional[User] = Depends(get_current_user)
):
    """
    Verify session for internal services (ForwardAuth).
    Returns 200 with X-WebAuth headers if authenticated.
    Redirects to login if not authenticated.
    """
    if not user:
        # Get original URL from Traefik headers
        forwarded_host = request.headers.get("X-Forwarded-Host", "")
        forwarded_uri = request.headers.get("X-Forwarded-Uri", "")
        
        # Build redirect URL
        login_url = "https://platform.lum.tools/auth/login"
        if forwarded_host:
            scheme = request.headers.get("X-Forwarded-Proto", "https")
            original_url = f"{scheme}://{forwarded_host}{forwarded_uri}"
            login_url = f"https://platform.lum.tools/auth/login?redirect_to={original_url}"
            
        return RedirectResponse(url=login_url)
    
    # User is authenticated - set headers for Gitea
    username = user.email.replace("@", "_").replace(".", "_")
    response.headers["X-WebAuth-User"] = username
    response.headers["X-WebAuth-Email"] = user.email
    if user.display_name:
        try:
            response.headers["X-WebAuth-FullName"] = user.display_name.encode("latin1").decode("latin1")
        except UnicodeEncodeError:
            response.headers["X-WebAuth-FullName"] = user.email.split("@")[0]
    
    # CRITICAL: Touch session to ensure cookie is re-issued with .lum.tools domain
    # This fixes the cookie scoping issue for existing users
    request.session["_last_verified"] = datetime.utcnow().isoformat()
        
    return {"status": "authenticated", "user": user.email}
```

## Testing the Integration

### 1. Test New User Flow
```bash
# Clear all cookies for lum.tools
# Visit https://git.lum.tools
# Should redirect to https://platform.lum.tools/auth/login?redirect_to=https://git.lum.tools/
# Log in with Firebase
# Should redirect back to Gitea and auto-create account
```

### 2. Test Existing User Cookie Upgrade
```bash
# With existing platform.lum.tools cookie
# Visit https://git.lum.tools
# Should redirect to login
# Login page detects existing session and upgrades cookie
# Redirects back to Gitea
```

### 3. Verify Cookie Domain
```javascript
// In browser console on git.lum.tools
document.cookie
// Should show: session=...; domain=.lum.tools
```

### 4. Test Cross-Subdomain Session Sharing
```bash
# Log in on platform.lum.tools
# Visit git.lum.tools → should NOT require login
# Visit lrok.lum.tools → should NOT require login
```

## Deployment Steps

### 1. Deploy Platform Service
```bash
cd /home/ethan/Work/lum.tools/services/platform
./deploy.sh
```

### 2. Apply Gitea Kubernetes Resources
```bash
cd /home/ethan/Work/lum.tools/infra/k8s/gitea

# Apply middleware (ForwardAuth)
kubectl apply -f middleware.yaml

# Apply updated Gitea config (reverse proxy auth enabled)
kubectl apply -f configmap.yaml

# Apply updated ingress (middleware attached)
kubectl apply -f ingress.yaml

# Restart Gitea to pick up config changes
kubectl rollout restart deployment/gitea -n gitea
kubectl rollout status deployment/gitea -n gitea
```

### 3. Verify Deployment
```bash
# Check middleware is created
kubectl get middleware -n gitea

# Check Gitea is running
kubectl get pods -n gitea

# Test ForwardAuth endpoint
curl -I http://platform-service.platform.svc.cluster.local:80/internal/auth/verify
```

## Troubleshooting

### Issue: Redirect Loop at git.lum.tools
**Symptom**: User keeps getting redirected between login and Gitea
**Cause**: Cookie domain mismatch (old cookie scoped to platform.lum.tools)
**Solution**: 
1. Clear cookies for `.lum.tools` domain
2. OR visit `platform.lum.tools/auth/login` to upgrade cookie
3. Then revisit `git.lum.tools`

### Issue: Gitea shows "Username already exists"
**Symptom**: Gitea rejects auto-registration
**Cause**: Username sanitization produced collision (e.g., test@example.com → test_example_com)
**Solution**: Improve username generation in `/internal/auth/verify`:
```python
# Better sanitization: use hash for uniqueness
import hashlib
username_base = user.email.replace("@", "_").replace(".", "_")
if len(username_base) > 40:  # Gitea username limit
    # Use first part + hash of email
    email_hash = hashlib.sha256(user.email.encode()).hexdigest()[:8]
    username = f"{username_base[:30]}_{email_hash}"
else:
    username = username_base
```

### Issue: Headers not passing to Gitea
**Symptom**: ForwardAuth returns 200 but Gitea doesn't recognize user
**Cause**: Traefik not forwarding auth response headers
**Solution**: Verify middleware configuration has `authResponseHeaders` list

### Issue: Session cookie not being set with correct domain
**Symptom**: Cookie shows `domain=platform.lum.tools` instead of `.lum.tools`
**Cause**: SessionDomainMiddleware not working correctly
**Solution**: 
1. Check middleware order in `main.py` (SessionDomainMiddleware must be after SessionMiddleware)
2. Add debug logging to SessionDomainMiddleware
3. Verify request host header is correct

## Security Considerations

### 1. Session Security
- ✅ Cookie uses `HttpOnly` flag (prevents XSS access)
- ✅ Cookie uses `Secure` flag in production (HTTPS only)
- ✅ Cookie uses `SameSite=lax` (CSRF protection)
- ✅ Session secret is cryptographically secure

### 2. Redirect Validation
- ✅ Only allows redirects to `*.lum.tools` and `lum.tools`
- ✅ Requires HTTPS for production domains
- ❌ TODO: Remove localhost support in production

### 3. Internal Endpoint Security
- ⚠️ `/internal/auth/verify` is accessible cluster-wide
- ✅ Only returns user info for authenticated sessions
- ✅ Does not expose sensitive data in headers
- ✅ Username sanitization prevents injection

### 4. Gitea Account Security
- ✅ Auto-registration uses verified email from Firebase
- ✅ Email is authoritative identity source
- ⚠️ Consider disabling Gitea's built-in registration UI
- ⚠️ Consider requiring admin approval for first-time users

## Future Enhancements

### 1. Add API Key Authentication Fallback
Support both session cookies AND API keys for programmatic access:
```python
@router.get("/auth/verify")
async def verify_session(
    request: Request,
    authorization: Optional[str] = Header(None),
    user: Optional[User] = Depends(get_current_user)
):
    # Try session first
    if user:
        return set_auth_headers(response, user)
    
    # Try API key as fallback
    if authorization and authorization.startswith("Bearer "):
        api_key = authorization[7:]
        user = await verify_api_key(db, api_key)
        if user:
            return set_auth_headers(response, user)
    
    # Not authenticated
    return redirect_to_login(...)
```

### 2. Add SSO for Other Services
Apply the same pattern to other services:
- **n8n**: Add ForwardAuth middleware
- **Umami**: Add ForwardAuth middleware  
- **Miniflux**: Add ForwardAuth middleware (or use their OAuth support)

### 3. Add Session Activity Tracking
Log ForwardAuth verifications to ActivityLog table:
```python
activity = ActivityLog(
    user_id=user.id,
    action="sso_verify",
    status="success",
    metadata={"service": "gitea", "ip": request.client.host},
    ip_address=request.client.host,
    user_agent=request.headers.get("user-agent")
)
db.add(activity)
```

### 4. Add Session Revocation
Allow users to revoke sessions from account settings:
- Track session IDs in Redis
- Add "Sign out everywhere" button
- Invalidate all sessions for a user

## References

- Gitea Reverse Proxy Auth: https://docs.gitea.com/usage/reverse-proxies
- Traefik ForwardAuth: https://doc.traefik.io/traefik/middlewares/http/forwardauth/
- Starlette SessionMiddleware: https://www.starlette.io/middleware/#sessionmiddleware
- Cookie Domain RFC: https://datatracker.ietf.org/doc/html/rfc6265#section-5.1.3
