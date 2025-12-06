# Why I Built **lrok** — A Simple, Free Tunneling Service with Custom Subdomains

---

## TL;DR
I needed a **predictable, free** tunneling tool with **human‑readable HTTPS subdomains** for callback/webhook development. Existing services worked—but the setup friction and surprise costs didn’t fit my workflow. So I built **lrok**: a fast, secure tunnel powered by **FRP** (Fast Reverse Proxy) and the **lum.tools** platform. It gives you:

- **Choose your own subdomain:** https://`your-name`.t.lum.tools (e.g., https://my-app.t.lum.tools).
Don’t want to choose? We’ll generate a fun one (e.g., happy-dolphin.t.lum.tools).
- **HTTPS by default**, valid TLS certs
- **Built‑in request inspector** at `http://localhost:4242`
- **Zero-config CLI** (`lrok`) for macOS, Linux, Windows
- **HTTP, TCP, STCP, XTCP** (P2P) support

Use it for **webhooks**, **mobile app callbacks**, **sharing dev servers**, and **client demos**—with **no credit card** required.

---

## The Backstory (and the $245 lesson)
A few months ago I was wiring **multiple callback URLs** across dev and staging. The provider required **HTTPS** endpoints—so I turned to a popular tunneling service.

It worked, but for my use case **subdomains** were essential. I didn’t want to keep updating random URLs like `furiously-hungry-panda.ngrok.io` in half a dozen dashboards. I enabled **custom domain/subdomain** features to stabilize my webhooks across **dev → staging → more envs**.

A month later, I received a **$245 invoice**. For my modest usage, that felt off. I dug through pricing pages and realized how quickly costs can add up when you rely on **fixed subdomains** across multiple environments and want a hassle‑free DX.

> This is not a dig at any vendor—their products are strong and feature‑rich. But I wanted something **simpler and predictable** for my workflow.

So I built **lrok**.

---

## What is lrok?
**lrok** (short for **lum‑rok**) is a **fast, secure tunneling service** that exposes your localhost to the internet with **HTTPS** and **human‑readable URLs**—like ngrok, but built on **platform.lum.tools** infrastructure.

```bash
# Random name (we pick one)
lrok 8000
# → https://happy-dolphin.t.lum.tools

# Your own name (you pick it)
lrok 3000 --name my-app
# → https://my-app.t.lum.tools
```

**Perfect for:**
- Testing **webhooks** locally (Stripe, GitHub, etc.)
- Sharing **dev environments** with teammates
- **Demoing** work‑in‑progress to clients
- **Remote access** to local services
- **Mobile app** deep‑link/callback testing

**100% Free—no credit card.** No usage limits (for now). If we add limits later, the plan is a fair, **metered traffic** model (e.g., ~1 GB/week free) to keep it sustainable.

---

## Quick Start
### 1) Install
**Recommended (macOS/Linux):**
```bash
curl -fsSL https://platform.lum.tools/install.sh | bash
```

**npm (cross‑platform):**
```bash
npm install -g lrok
```

**PyPI (cross‑platform):**
```bash
pip install lrok
```

**Direct download:** latest binaries on GitHub Releases.

### 2) Get a Free API Key
1. Visit **https://platform.lum.tools/keys**  
2. Sign in (Google/GitHub/email)  
3. Click **Create New Key** → copy your key (starts with `lum_`)

### 3) Log in once
```bash
lrok login lum_your_api_key_here
# Saves to ~/.lrok/config.toml (0600 perms)
```

(Or set an env var: `export LUM_API_KEY='lum_your_key'`)

### 4) Start tunneling
```bash
# Random name
lrok 8000

# Custom name
lrok http 3000 --name my-app
# → https://my-app.t.lum.tools
```

Your terminal prints the **local address**, **public URL**, **tunnel name**, and a **dashboard URL**.

---

## Features
- **🎯 Readable URLs** — memorable subdomains instead of random hashes.
- **🔒 HTTPS by Default** — auto TLS via Let’s Encrypt wildcard certs.
- **📊 Built‑in Request Inspector** — `http://localhost:4242` with headers, bodies, status codes, timing, and *Copy as cURL*.
- **🌍 Cross‑Platform** — single binary for macOS/Linux/Windows.
- **🔌 Multi‑Protocol** — HTTP, TCP, **STCP** (secret), **XTCP** (P2P).
- **⚡ P2P Mode** — direct client‑to‑client via XTCP when possible.
- **📈 Monitoring** — per‑tunnel stats; Prometheus metrics on the platform.
- **🧰 Zero Config** — pre‑wired to lum.tools infra; just run `lrok`.

---

## Usage Reference
**CLI overview**
```
lrok [port]                 Quick HTTP tunnel with random name
lrok http [port] [flags]    HTTP tunnel with options
lrok tcp <port> [flags]     TCP tunnel for direct port forwarding
lrok stcp <port> [flags]    Secret TCP tunnel (requires visitor)
lrok xtcp <port> [flags]    P2P tunnel (direct if possible)
lrok visitor <name> [flags] Connect to STCP/XTCP as visitor
```

**Examples**
```bash
# Web dev server
lrok 3000 -n my-project

# Webhooks
lrok 8000
# → https://clever-fox.t.lum.tools
# Watch live requests at http://localhost:4242

# TCP: expose PostgreSQL
lrok tcp 5432 --remote-port 10001
# psql -h frp.lum.tools -p 10001 -U myuser mydb

# STCP: secure SSH
lrok stcp 22 --secret-key ssh-secret-123
lrok visitor tunnel-name --type stcp --secret-key ssh-secret-123 --bind-port 2222
# ssh -p 2222 user@127.0.0.1

# XTCP: P2P dev server
lrok xtcp 3000 --secret-key dev-p2p-key
lrok visitor tunnel-name --type xtcp --secret-key dev-p2p-key --bind-port 3000
# http://127.0.0.1:3000
```

---

## How it Works (Architecture)
```
Your App (localhost:8000)
    ↓
lrok CLI (local proxy + frpc)
    ↓ (secure tunnel)
frp.lum.tools (FRP server)
    ↓ (HTTPS with TLS)
Public Internet → https://your-tunnel.t.lum.tools
```
- Built on **FRP (Fast Reverse Proxy)** → https://github.com/fatedier/frp  
- **Pre‑configured** to connect to lum.tools servers  
- **API Key auth**, **TLS**, **metrics**, and **audit logging** baked in

---

## Security Notes
- **HTTPS everywhere** with valid certificates  
- **API keys** authenticate and authorize tunnel creation  
- **Logs & metrics** for your account (rotate keys anytime)  
- Local config `~/.lrok/config.toml` is created with **0600** permissions

> Reminder: tunneling exposes local services to the internet. Keep your apps patched, require auth on admin endpoints, and avoid exposing secrets.

---

## Pricing & Sustainability
Today, **lrok is 100% free**. No tiers, no usage caps. Long term, we plan **metered traffic** (e.g., ~**1 GB/week** free with weekly reset) so we can fund bandwidth and keep the service healthy. Advanced features may be optional add‑ons; the **core developer workflows** stay free.

---

## Why not just keep using ngrok (or others)?
If the feature set and pricing of existing services work for you—great, keep using them. **lrok** is for developers like me who want:
- **Stable custom subdomains** without surprises
- **Simple, CLI‑first UX**
- **Open‑source core (FRP)** with a minimal, transparent platform

> This post shares my personal experience and design goals. It’s not a claim of feature parity with any vendor.

---

## Roadmap
- **Traffic‑metered free tier** with weekly reset  
- **Per‑user subdomain namespaces** (e.g., `alice.t.lum.tools`)  
- **Org/team keys** with scoped capabilities  
- **More protocols & auth modes** based on feedback  
- **One‑click self‑host** for private networks (bring‑your‑domain)

---

## Frequently Asked Questions
**Is it really free?**  
Yes. No credit card. We may introduce **fair metering** later to cover bandwidth.

**Can I pick *any* subdomain?**  
Use `--name` to request one (first‑come, first‑served). Reserved/system names are blocked.

**Does it work behind corporate firewalls?**  
Usually yes; the client initiates an outbound connection. If port `7000` is blocked, try a different network.

**How do I see requests?**  
Open `http://localhost:4242` while your tunnel is running.

**Can I self‑host?**  
`lrok` uses **FRP** under the hood. You can self‑host FRP, but you’ll lose lum.tools integrations (keys, metrics, TLS automation). We plan to document a private‑cluster option.

---

## Get Started
```bash
# Install
curl -fsSL https://platform.lum.tools/install.sh | bash

# Get a free key (no card): https://platform.lum.tools/keys

# Expose a port
lrok 8000
```

**GitHub:** https://github.com/lum-tools/lrok  
**Platform:** https://platform.lum.tools  
**Dashboard:** https://platform.lum.tools/tunnels

— Made with ❤️ by platform.lum.tools

