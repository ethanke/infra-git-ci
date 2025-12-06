# Applications Migration Guide

Complete guide for migrating lum.tools web applications to the new Deno/Hono stack.

## Overview

This migration moves the following services from the legacy Python/Alpine stack to a modern Deno/Hono architecture:

| Service | Old Stack | New Stack | Status |
|---------|-----------|-----------|--------|
| `platform` | Python/FastAPI/Alpine | Deno/Hono | ✅ Rewritten |
| `lrok` | Python/FastAPI/Alpine | Deno/Hono | ✅ Rewritten |
| `landing` | Python/FastAPI/Alpine | Deno/Hono | ✅ Rewritten |
| `blog-next` | Next.js | Next.js | ✅ Migrated (no rewrite) |

## Architecture

### New Stack

```
┌─────────────────────────────────────────────────────────────────┐
│                      Deno/Hono Stack                             │
├─────────────────────────────────────────────────────────────────┤
│  Runtime:     Deno 2.1.4 (V8 engine, TypeScript native)         │
│  Framework:   Hono 4.x (Express-like, Edge-ready)               │
│  Validation:  Zod (Runtime type validation)                     │
│  Frontend:    Server-rendered HTML + Alpine.js + TailwindCSS    │
│  Database:    PostgreSQL via deno-postgres                      │
│  Auth:        Firebase Admin SDK (session cookies)              │
└─────────────────────────────────────────────────────────────────┘
```

### Zero-Build Philosophy

- **No webpack/vite/rollup** - Files served as-is
- **No transpilation** - TypeScript runs natively in Deno
- **No node_modules** - Dependencies cached by Deno
- **CDN assets** - TailwindCSS and Alpine.js from CDN
- **Server-rendered** - HTML generated on server, minimal JS on client

### Shared Libraries

```
libs/
├── shared-core/          # @lum/core - Schemas, types, errors
│   ├── src/schemas/      # Zod schemas (user, api-key, etc.)
│   ├── src/types/        # TypeScript interfaces
│   └── src/errors.ts     # Custom error classes
├── shared-ui/            # @lum/ui - UI components
│   ├── src/layout/       # HTML layouts (app, landing, admin)
│   ├── src/components/   # Reusable components
│   ├── src/patterns/     # Complex UI patterns
│   └── src/styles/       # Theme configuration
└── shared-db/            # @lum/db - Database access
    ├── src/client.ts     # PostgreSQL connection pool
    └── src/queries/      # Query functions by entity
```

## Application Structure

### Platform (`apps/platform/`)

User management, API keys, billing, and authentication.

```
apps/platform/
├── deno.json             # Dependencies and tasks
├── Dockerfile            # Multi-stage Deno build
├── app/
│   ├── server.ts         # Hono app entry point
│   ├── middleware/
│   │   └── session.ts    # Firebase session validation
│   └── routes/
│       ├── index.ts      # Dashboard
│       ├── auth.ts       # Login/logout/register
│       ├── keys.ts       # API key management
│       ├── account.ts    # Profile settings
│       ├── usage.ts      # Usage analytics
│       ├── billing.ts    # Stripe integration
│       └── api/          # REST API endpoints
│           ├── mod.ts    # API router
│           ├── middleware.ts
│           ├── keys.ts   # /api/keys
│           └── users.ts  # /api/users
└── k8s/
    ├── deployment.yaml
    ├── kustomization.yaml
    ├── namespace.yaml
    └── secrets.yaml
```

**Routes:**
- `GET /` - Dashboard (requires auth)
- `GET /login`, `POST /login` - Firebase auth
- `GET /register`, `POST /register` - User registration
- `GET /logout` - Session termination
- `GET /keys` - List API keys
- `POST /keys/create`, `POST /keys/revoke` - Key management
- `GET /account` - Profile settings
- `GET /usage` - Usage analytics
- `GET /billing` - Stripe billing portal
- `GET /api/keys` - REST API for keys
- `GET /api/users/me` - Current user info

### lrok (`apps/lrok/`)

Tunnel management and subdomain reservation.

```
apps/lrok/
├── deno.json
├── Dockerfile
├── app/
│   ├── server.ts
│   ├── middleware/
│   │   └── session.ts
│   └── routes/
│       ├── index.ts      # Dashboard
│       ├── tunnels.ts    # Active tunnels
│       ├── subdomains.ts # Reserved subdomains
│       └── api/
│           ├── mod.ts
│           ├── tunnels.ts
│           └── subdomains.ts
└── k8s/
```

**Routes:**
- `GET /` - Tunnel dashboard
- `GET /tunnels` - Active tunnel list
- `GET /subdomains` - Reserved subdomain management
- `POST /subdomains/reserve` - Reserve new subdomain
- `POST /subdomains/release` - Release subdomain
- `GET /api/tunnels` - Active tunnels API
- `GET /api/subdomains` - Subdomains API

### Landing (`apps/landing/`)

Marketing landing page.

```
apps/landing/
├── deno.json
├── Dockerfile
├── app/
│   ├── server.ts
│   └── routes/
│       ├── index.ts      # Landing page
│       └── seo.ts        # robots.txt, sitemap.xml
└── k8s/
```

**Routes:**
- `GET /` - Landing page with features, pricing
- `GET /robots.txt` - SEO robots file
- `GET /sitemap.xml` - SEO sitemap

### blog-next (`apps/blog-next/`)

SEO-focused Next.js blog (not rewritten, only migrated).

```
apps/blog-next/
├── README.md             # Migration notes
├── Dockerfile            # Node 20 + pnpm build
└── k8s/
    ├── deployment.yaml
    ├── kustomization.yaml
    ├── namespace.yaml
    └── secrets.yaml
```

**Note:** The blog source code remains in `services/blog-next/`. Only the deployment configuration is in `apps/blog-next/`.

## Database Schema

All apps share the `lum_platform` PostgreSQL database:

```sql
-- Users
CREATE TABLE users (
  id UUID PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255),
  firebase_uid VARCHAR(255) UNIQUE NOT NULL,
  tier VARCHAR(50) DEFAULT 'free',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- API Keys
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(255) NOT NULL,
  key_hash VARCHAR(255) NOT NULL,
  key_prefix VARCHAR(10) NOT NULL,
  scopes JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Reserved Subdomains (lrok)
CREATE TABLE reserved_subdomains (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  name VARCHAR(63) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activity Logs (tunnels tracked here)
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(100),
  resource_id VARCHAR(255),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Authentication Flow

### Session Cookies

All apps share authentication via Firebase session cookies:

1. User logs in at `platform.lum.tools/login`
2. Firebase generates ID token
3. Server creates session cookie (domain: `.lum.tools`)
4. Cookie shared across all subdomains

```typescript
// Session cookie creation (platform auth route)
const expiresIn = 60 * 60 * 24 * 14 * 1000; // 14 days
const sessionCookie = await auth.createSessionCookie(idToken, { expiresIn });

setCookie(c, 'session', sessionCookie, {
  httpOnly: true,
  secure: true,
  sameSite: 'Lax',
  domain: '.lum.tools',
  maxAge: expiresIn / 1000
});
```

### Session Middleware

```typescript
// middleware/session.ts - Used by all protected routes
export const sessionMiddleware = async (c, next) => {
  const session = getCookie(c, 'session');
  if (!session) {
    return c.redirect('https://platform.lum.tools/login');
  }
  
  const claims = await auth.verifySessionCookie(session);
  const user = await getUserByFirebaseUid(claims.uid);
  c.set('user', user);
  
  return next();
};
```

## Deployment

### CI/CD Pipeline

GitHub Actions workflow (`.github/workflows/apps.yaml`):

1. **Trigger**: Push to `main` or PR
2. **Matrix build**: Parallel builds for all apps
3. **Build**: Docker multi-stage build
4. **Push**: GHCR (`ghcr.io/lum-tools/{app}:{sha}`)
5. **Update**: Kustomize image tag
6. **Deploy**: FluxCD reconciles automatically

### Image Tags

- Production: `ghcr.io/lum-tools/{app}:{commit-sha}`
- Development: `ghcr.io/lum-tools/{app}:dev-{commit-sha}`
- Latest: `ghcr.io/lum-tools/{app}:latest`

### Kubernetes Resources

Each app deploys:
- **Namespace**: Isolated `{app}` namespace
- **Deployment**: 2 replicas for HA
- **Service**: ClusterIP for internal routing
- **Secret**: Database URL, Firebase credentials
- **IngressRoute**: Traefik routing rules

### Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `FIREBASE_PROJECT_ID` | Firebase project ID | Yes |
| `FIREBASE_CLIENT_EMAIL` | Service account email | Yes |
| `FIREBASE_PRIVATE_KEY` | Service account key | Yes |
| `STRIPE_SECRET_KEY` | Stripe API key | Platform only |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Platform only |

## Migration Checklist

### Pre-Migration

- [ ] Backup production database
- [ ] Document current service configurations
- [ ] Set up GHCR authentication in cluster
- [ ] Create SOPS-encrypted secrets

### Migration Steps

1. **Deploy Infrastructure**
   ```bash
   # Apply FluxCD Kustomization for apps
   kubectl apply -f kubernetes/apps/kustomization.yaml
   ```

2. **Verify Deployments**
   ```bash
   kubectl get pods -n platform
   kubectl get pods -n lrok
   kubectl get pods -n landing
   kubectl get pods -n blog-next
   ```

3. **Configure DNS**
   - Update A records to new cluster IP
   - Wait for propagation

4. **Test Services**
   ```bash
   curl https://platform.lum.tools/health
   curl https://lrok.lum.tools/health
   curl https://lum.tools/health
   curl https://blog.lum.tools/health
   ```

### Post-Migration

- [ ] Monitor error rates in Grafana
- [ ] Verify authentication flows
- [ ] Test API endpoints
- [ ] Validate billing integration
- [ ] Remove legacy services

## Rollback Procedure

If issues occur during migration:

1. **Revert DNS** to old cluster
2. **Scale down** new deployments
3. **Investigate** logs in Grafana

```bash
# Scale down all new apps
kubectl scale deployment platform -n platform --replicas=0
kubectl scale deployment lrok -n lrok --replicas=0
kubectl scale deployment landing -n landing --replicas=0
kubectl scale deployment blog-next -n blog-next --replicas=0
```

## Performance Considerations

### Memory Usage

| Service | Old (Python) | New (Deno) | Savings |
|---------|-------------|------------|---------|
| platform | ~256MB | ~64MB | 75% |
| lrok | ~128MB | ~48MB | 62% |
| landing | ~128MB | ~32MB | 75% |

### Startup Time

| Service | Old (Python) | New (Deno) |
|---------|-------------|------------|
| platform | ~3s | <500ms |
| lrok | ~2s | <300ms |
| landing | ~2s | <200ms |

### Cold Start

Deno applications have near-instant cold starts due to:
- No runtime compilation
- Small binary size
- Efficient V8 startup

## Troubleshooting

### Common Issues

**Session cookie not shared:**
- Verify cookie domain is `.lum.tools`
- Check sameSite attribute
- Ensure HTTPS on all services

**Database connection failed:**
- Check DATABASE_URL secret
- Verify network policy allows egress
- Check connection pool settings

**Firebase auth errors:**
- Verify service account credentials
- Check project ID matches
- Ensure IAM permissions

### Debug Commands

```bash
# View logs
kubectl logs -f deployment/platform -n platform

# Check events
kubectl get events -n platform --sort-by='.lastTimestamp'

# Exec into pod
kubectl exec -it deployment/platform -n platform -- sh

# Test database connection
kubectl exec -it deployment/platform -n platform -- \
  deno eval "console.log(Deno.env.get('DATABASE_URL'))"
```

## Related Documentation

- [Developer Guide](../DEVELOPER_GUIDE.md)
- [DNS Migration Guide](../DNS_MIGRATION_GUIDE.md)
- [Credentials](./CREDENTIALS.md)
