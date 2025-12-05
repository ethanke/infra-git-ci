# Gitea SSO Integration - Summary

## Problem
Users already logged into `platform.lum.tools` were being asked to log in again when visiting `git.lum.tools`, even though they already had a valid session.

## Root Cause
The session cookie was being set with `Domain=platform.lum.tools` (host-only) instead of `Domain=.lum.tools` (shared across all subdomains). When users visited `git.lum.tools`, the browser didn't send the cookie because it was scoped to `platform.lum.tools` only.

## Solution: Automatic Cookie Domain Upgrade

### 1. Session Domain Middleware Enhancement
**File**: `services/platform/app/core/session_domain.py`

The `SessionDomainMiddleware` now:
- Checks both `Host` and `X-Forwarded-Host` headers (for ForwardAuth scenarios)
- Automatically adds `Domain=.lum.tools` to all `session` cookies
- Ensures the cookie is shared across all `*.lum.tools` subdomains

### 2. ForwardAuth Endpoint with Auto-Upgrade
**File**: `services/platform/app/routes/internal.py`

The `/internal/auth/verify` endpoint now:
- **Touches the session** on every verification (`request.session["_last_verified"] = ...`)
- This triggers a new `Set-Cookie` header with the correct `.lum.tools` domain
- **Result**: Existing users with old cookies get automatically upgraded

### 3. Login Page Cookie Refresh
**File**: `services/platform/app/routes/auth.py`

The `/auth/login` page now:
- Refreshes the session when the user is already authenticated
- Ensures the redirect-back flow re-issues the cookie with correct domain

### 4. Traefik ForwardAuth Integration
**File**: `infra/k8s/gitea/middleware.yaml`

Created a Traefik ForwardAuth middleware that:
- Intercepts all requests to `git.lum.tools`
- Calls `platform-service.platform.svc.cluster.local:80/internal/auth/verify`
- Forwards authentication headers to Gitea (`X-WebAuth-User`, `X-WebAuth-Email`, etc.)

### 5. Gitea Reverse Proxy Authentication
**File**: `infra/k8s/gitea/configmap.yaml`

Enabled Gitea's reverse proxy authentication:
```ini
[service]
ENABLE_REVERSE_PROXY_AUTHENTICATION = true
ENABLE_REVERSE_PROXY_AUTO_REGISTRATION = true
ENABLE_REVERSE_PROXY_EMAIL = true

[security]
REVERSE_PROXY_AUTHENTICATION_USER = X-WebAuth-User
REVERSE_PROXY_AUTHENTICATION_EMAIL = X-WebAuth-Email
```

## User Experience Flow

### New User (Never Logged In)
1. Visits `git.lum.tools`
2. No session cookie exists
3. ForwardAuth redirects to `platform.lum.tools/auth/login?redirect_to=https://git.lum.tools/`
4. User logs in with Firebase
5. Session cookie is created with `Domain=.lum.tools`
6. User is redirected back to `git.lum.tools`
7. ForwardAuth recognizes the user and auto-creates Gitea account

### Existing User (Already Logged In to Platform)
1. Visits `git.lum.tools`
2. Browser sends session cookie (domain: `.lum.tools`)
3. ForwardAuth verifies session and returns user headers
4. Gitea recognizes user and grants access
5. **No login required!** ✅

### Legacy User (Old Cookie with platform.lum.tools Domain)
1. Visits `git.lum.tools`
2. Browser doesn't send cookie (wrong domain)
3. ForwardAuth redirects to `platform.lum.tools/auth/login?redirect_to=...`
4. Login page detects existing session
5. Session is refreshed with `Domain=.lum.tools`
6. User is redirected back to `git.lum.tools`
7. **Cookie is now upgraded!** Next visit works seamlessly

## Deployment

### Quick Deploy
```bash
cd /home/ethan/Work/lum.tools/infra/k8s/gitea
./deploy-sso.sh
```

### Verify Configuration
```bash
cd /home/ethan/Work/lum.tools/infra/k8s/gitea
./verify-sso.sh
```

### Manual Steps
```bash
# 1. Deploy platform service
cd /home/ethan/Work/lum.tools/services/platform
./deploy.sh

# 2. Apply Gitea manifests
kubectl apply -f /home/ethan/Work/lum.tools/infra/k8s/gitea/middleware.yaml
kubectl apply -f /home/ethan/Work/lum.tools/infra/k8s/gitea/configmap.yaml
kubectl apply -f /home/ethan/Work/lum.tools/infra/k8s/gitea/ingress.yaml

# 3. Restart Gitea
kubectl rollout restart deployment/gitea -n gitea
kubectl rollout status deployment/gitea -n gitea
```

## Testing

### Test Cookie Domain
```javascript
// In browser console on git.lum.tools
document.cookie.split(';').find(c => c.trim().startsWith('session='))
// Should show: session=...; (check browser DevTools → Application → Cookies)
// Domain should be: .lum.tools
```

### Test SSO Flow
1. Clear all cookies for `lum.tools` domain
2. Visit `https://platform.lum.tools` and log in
3. Visit `https://git.lum.tools`
4. Should NOT be asked to log in again

### Test Auto-Registration
1. Log in to platform with a new account
2. Visit `git.lum.tools`
3. Check that Gitea account is auto-created:
   ```bash
   kubectl exec -it deployment/gitea -n gitea -- gitea admin user list
   ```

## Security Features

✅ **Cookie Domain Scoping**: Only `*.lum.tools` subdomains can access the cookie
✅ **HttpOnly**: Cookie cannot be accessed via JavaScript (XSS protection)
✅ **Secure**: Cookie only sent over HTTPS (production)
✅ **SameSite=lax**: CSRF protection
✅ **Redirect Validation**: Only allows redirects to `*.lum.tools` domains
✅ **Session Timeout**: 7 days max age

## Extending to Other Services

The same pattern can be applied to other services:

### Example: n8n SSO
```yaml
# infra/k8s/n8n/middleware.yaml
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: n8n-auth
  namespace: n8n
spec:
  forwardAuth:
    address: http://platform-service.platform.svc.cluster.local:80/internal/auth/verify
    trustForwardHeader: true
    authResponseHeaders:
      - X-WebAuth-User
      - X-WebAuth-Email
```

### Services Ready for SSO Integration
- ✅ **Gitea**: Implemented (Reverse Proxy Auth)
- 🚧 **n8n**: Can use ForwardAuth + custom auth backend
- 🚧 **Umami**: Can use ForwardAuth (limited auth support)
- 🚧 **Miniflux**: Supports Proxy auth via `PROXY_AUTHENTICATION_HEADER`
- 🚧 **Grafana**: Supports OAuth or Auth Proxy

## Next Steps

1. **Test with real users**: Have team members test the flow
2. **Monitor session upgrades**: Check platform logs for `_last_verified` updates
3. **Add activity logging**: Track ForwardAuth verifications in ActivityLog
4. **Extend to other services**: Apply SSO to n8n, Umami, etc.
5. **Add session management UI**: Allow users to view/revoke active sessions

## Troubleshooting

### Issue: Still getting redirected to login
**Solution**: Clear browser cookies for `.lum.tools` and log in fresh

### Issue: Gitea shows "Username already exists"
**Check**: Username sanitization might have collision
**Fix**: Improve username generation in `/internal/auth/verify`

### Issue: Headers not passing to Gitea
**Check**: `kubectl get middleware gitea-auth -n gitea`
**Verify**: `authResponseHeaders` list is correct

### Issue: Platform ForwardAuth endpoint not responding
**Check**: `kubectl logs deployment/platform -n platform`
**Test**: `kubectl run test-curl --rm -i --restart=Never --image=curlimages/curl:latest -- curl -v http://platform-service.platform.svc.cluster.local:80/internal/auth/verify`

## Documentation
- Full guide: `/home/ethan/Work/lum.tools/infra/k8s/gitea/GITEA_SSO_INTEGRATION_GUIDE.md`
- Deploy script: `/home/ethan/Work/lum.tools/infra/k8s/gitea/deploy-sso.sh`
- Verify script: `/home/ethan/Work/lum.tools/infra/k8s/gitea/verify-sso.sh`
