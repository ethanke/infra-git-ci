# DNS Migration Guide

Examples of converting manual DNS config to Ingress annotations for external-dns automation.

## Before: Manual DNS Config (OLD)

```yaml
# infra/scripts/dns-config.yaml
subdomains:
  - name: platform
    type: A
    values: [138.199.130.187]
  - name: platform
    type: AAAA
    values: [2a01:4f8:c01e:1a19::1]
```

## After: Ingress Annotation (NEW)

```yaml
# kubernetes/apps/platform/ingress.yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: platform
  namespace: platform
  annotations:
    # Automated DNS management via external-dns
    external-dns.alpha.kubernetes.io/hostname: platform.lum.tools
    external-dns.alpha.kubernetes.io/ttl: "300"
spec:
  ingressClassName: traefik
  rules:
  - host: platform.lum.tools
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: platform
            port:
              number: 8000
```

---

## Example Service Conversions

### Gitea (git.lum.tools)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: gitea
  namespace: gitea
  annotations:
    external-dns.alpha.kubernetes.io/hostname: git.lum.tools
spec:
  rules:
  - host: git.lum.tools
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: gitea
            port:
              number: 3000
```

### lrok (lrok.lum.tools)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: lrok
  namespace: lrok
  annotations:
    external-dns.alpha.kubernetes.io/hostname: lrok.lum.tools
spec:
  rules:
  - host: lrok.lum.tools
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: lrok
            port:
              number: 5000
```

### Wildcard for lrok tunnels (*.t.lum.tools)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: frp-tunnels-wildcard
  namespace: frp
  annotations:
    external-dns.alpha.kubernetes.io/hostname: "*.t.lum.tools"
spec:
  rules:
  - host: "*.t.lum.tools"
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frps-service
            port:
              number: 8080
```

### Registry (registry.lum.tools)

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: registry
  namespace: registry
  annotations:
    external-dns.alpha.kubernetes.io/hostname: registry.lum.tools
spec:
  rules:
  - host: registry.lum.tools
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: registry
            port:
              number: 5000
```

---

## Migration Checklist

For each service in `dns-config.yaml`:

- [ ] Create/update Ingress manifest
- [ ] Add `external-dns.alpha.kubernetes.io/hostname` annotation
- [ ] Verify `host` matches annotation
- [ ] Deploy to cluster
- [ ] Check external-dns logs: `kubectl logs -n external-dns -l app=external-dns -f`
- [ ] Verify DNS record created: `dig <hostname> +short`

---

## Services to Migrate (from dns-config.yaml)

Based on old config, these services need Ingress annotations:

- [ ] platform.lum.tools
- [ ] git.lum.tools
- [ ] lrok.lum.tools
- [ ] registry.lum.tools
- [ ] *.t.lum.tools (wildcard)
- [ ] blog.lum.tools
- [ ] grafana.lum.tools
- [ ] litellm.lum.tools
- [ ] n8n.lum.tools
- [ ] umami.lum.tools
- [ ] stash.lum.tools (MinIO)
- [ ] judge.lum.tools
- [ ] ci-builder.lum.tools
- [ ] browserless.lum.tools
- [ ] argo-workflows.lum.tools
- [ ] miniflux.lum.tools
- [ ] lum.tools (root domain)
- [ ] www.lum.tools

---

## Verification Commands

```bash
# Watch external-dns logs
kubectl logs -n external-dns -l app=external-dns -f

# Check if DNS record was created
dig platform.lum.tools +short

# List all DNS TXT records (external-dns ownership)
dig _external-dns.platform.lum.tools TXT +short

# Force external-dns to re-sync
kubectl delete pod -n external-dns -l app=external-dns
```

---

## Notes

- external-dns creates both A and AAAA records automatically
- Load balancer IP is fetched from Ingress status
- No need to manually specify IPs anymore
- DNS changes happen within ~1 minute of Ingress creation
