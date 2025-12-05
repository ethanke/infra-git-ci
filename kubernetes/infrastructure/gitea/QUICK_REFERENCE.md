# Gitea SSO - Quick Reference

## ✅ What Was Implemented

### The Problem
Users logged into `platform.lum.tools` had to log in again when visiting `git.lum.tools` because the session cookie was scoped to `platform.lum.tools` instead of `.lum.tools`.

### The Solution
**Automatic cookie domain upgrade** via ForwardAuth middleware:
1. Every request to `git.lum.tools` passes through Platform's `/internal/auth/verify`
2. The endpoint **touches the session**, triggering a new `Set-Cookie` with `Domain=.lum.tools`
3. Users with old cookies get automatically upgraded on their first redirect
4. All future requests work seamlessly across all `*.lum.tools` subdomains

## 🚀 Deployment Commands

```bash
# Quick deploy everything
cd /home/ethan/Work/lum.tools/infra/k8s/gitea
./deploy-sso.sh

# Verify it's working
./verify-sso.sh
```

## 🔧 What Changed

### Platform Service
- ✅ Added `/internal/auth/verify` ForwardAuth endpoint
- ✅ Auto-upgrades session cookies to `.lum.tools` domain
- ✅ Improved `SessionDomainMiddleware` to handle ForwardAuth headers

### Gitea Configuration  
- ✅ Enabled Reverse Proxy Authentication
- ✅ Enabled Auto-Registration (creates accounts automatically)
- ✅ Configured to trust `X-WebAuth-User` and `X-WebAuth-Email` headers

### Traefik Configuration
- ✅ Created `gitea-auth` ForwardAuth middleware
- ✅ Attached middleware to Gitea ingress
- ✅ Forwards auth headers from Platform to Gitea

## 🧪 Testing

### Test 1: New User
```
1. Clear all cookies
2. Visit https://git.lum.tools
3. Should redirect to login
4. After login, should auto-create Gitea account
5. ✅ Success: Logged into Gitea without separate registration
```

### Test 2: Existing Platform User
```
1. Log into https://platform.lum.tools
2. Visit https://git.lum.tools
3. ✅ Success: Should NOT ask for login again
```

### Test 3: Check Cookie Domain
```javascript
// Browser DevTools → Application → Cookies → git.lum.tools
// Look for "session" cookie
// Domain should be: .lum.tools (note the leading dot)
```

## 📝 Key Files Modified

```
services/platform/app/routes/internal.py          # ForwardAuth endpoint
services/platform/app/routes/auth.py              # Login page refresh
services/platform/app/core/session_domain.py      # Cookie domain middleware
infra/k8s/gitea/configmap.yaml                    # Gitea reverse proxy config
infra/k8s/gitea/middleware.yaml                   # Traefik ForwardAuth
infra/k8s/gitea/ingress.yaml                      # Ingress with middleware
```

## 🔍 Debugging

### Check Platform ForwardAuth is responding
```bash
kubectl run test-curl --rm -i --restart=Never --image=curlimages/curl:latest -- \
  curl -v http://platform-service.platform.svc.cluster.local:80/internal/auth/verify
# Should return: 302 redirect to login (when unauthenticated)
```

### Check Gitea logs
```bash
kubectl logs deployment/gitea -n gitea --tail=50 | grep -i auth
```

### Check middleware is applied
```bash
kubectl get middleware gitea-auth -n gitea
kubectl describe ingress gitea-ingress -n gitea | grep middleware
```

## 🎯 Expected Behavior

| Scenario | Expected Result |
|----------|----------------|
| Visit `git.lum.tools` (not logged in) | Redirect to `platform.lum.tools/auth/login?redirect_to=https://git.lum.tools/` |
| Visit `git.lum.tools` (logged in) | Direct access to Gitea, no login required |
| Visit `git.lum.tools` (first time, new user) | Account auto-created in Gitea |
| Visit `git.lum.tools` (old cookie domain) | One redirect to upgrade cookie, then seamless access |

## 🔒 Security

- ✅ Session cookie is HttpOnly (XSS protection)
- ✅ Session cookie is Secure in production (HTTPS only)
- ✅ Session cookie uses SameSite=lax (CSRF protection)
- ✅ Domain is restricted to `.lum.tools` (no other domains can read it)
- ✅ Redirect validation prevents open redirects
- ✅ Username sanitization prevents injection

## 📚 Documentation

- **Full Implementation Guide**: `GITEA_SSO_INTEGRATION_GUIDE.md`
- **Summary**: `SSO_IMPLEMENTATION_SUMMARY.md`
- **This File**: `QUICK_REFERENCE.md`

## 🛠️ Rollback (If Needed)

```bash
# Remove ForwardAuth middleware from ingress
kubectl patch ingress gitea-ingress -n gitea --type=json \
  -p='[{"op": "remove", "path": "/metadata/annotations/traefik.ingress.kubernetes.io~1router.middlewares"}]'

# Disable reverse proxy auth in Gitea
kubectl edit configmap gitea-config -n gitea
# Set: ENABLE_REVERSE_PROXY_AUTHENTICATION = false

# Restart Gitea
kubectl rollout restart deployment/gitea -n gitea
```

## ✨ Next: Apply to Other Services

This same pattern works for:
- **n8n**: Add ForwardAuth middleware
- **Umami**: Add ForwardAuth middleware
- **Miniflux**: Supports `PROXY_AUTHENTICATION_HEADER`
- **Grafana**: Supports Auth Proxy mode

Template:
```yaml
apiVersion: traefik.containo.us/v1alpha1
kind: Middleware
metadata:
  name: <service>-auth
  namespace: <service>
spec:
  forwardAuth:
    address: http://platform-service.platform.svc.cluster.local:80/internal/auth/verify
    trustForwardHeader: true
    authResponseHeaders:
      - X-WebAuth-User
      - X-WebAuth-Email
```
