/**
 * Subdomain management routes
 */

import { Hono } from "@hono/hono";
import type { SessionContext } from "@lum/core";
import { 
  renderShell, 
  lrokNavItems,
  renderCard,
  renderCardHeader,
  renderTable,
  renderBadge,
  renderInput,
} from "@lum/ui";
import { 
  getReservedSubdomains, 
  getReservedSubdomainByName,
  reserveSubdomain, 
  releaseSubdomain,
  getUserSubdomainCount,
  logActivity,
} from "@lum/db";
import { requireAuth } from "../middleware/session.ts";

export const subdomainsRoutes = new Hono<SessionContext>();

// List subdomains
subdomainsRoutes.get("/", async (c) => {
  const redirect = requireAuth(c);
  if (redirect) return redirect;
  
  const user = c.get("user")!;
  const subdomains = await getReservedSubdomains(user.id);

  const subdomainRows = subdomains.map(s => ({
    subdomain: `
      <code class="text-white font-medium">${s.subdomain}.${s.domain}</code>
    `,
    status: renderBadge("Reserved", { variant: "success" }),
    created: new Date(s.created_at).toLocaleDateString(),
    actions: `
      <button onclick="deleteSubdomain('${s.subdomain}', '${s.domain}')" 
              class="text-xs px-2 py-1 rounded text-red-500 hover:bg-red-500/10 transition-colors">
        Release
      </button>
    `,
  }));

  const content = `
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold text-white mb-2">Reserved Subdomains</h1>
      <p class="text-gray-400">Reserve custom subdomains for your tunnels.</p>
    </div>
    <button onclick="showReserveModal()" 
            class="px-4 py-2 font-medium text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            style="background: var(--gradient-brand);">
      + Reserve Subdomain
    </button>
  </div>

  <!-- Info -->
  <div class="mb-6 p-4 rounded-lg border flex items-center gap-4" style="background: var(--color-surface); border-color: var(--color-border);">
    <span class="text-2xl">💡</span>
    <div>
      <p class="text-white text-sm">Reserved subdomains are always available for your tunnels.</p>
      <p class="text-gray-500 text-xs">Use <code class="text-orange-500">lrok http 3000 --subdomain myapp</code> to use a reserved subdomain.</p>
    </div>
  </div>

  <!-- Subdomains Table -->
  ${renderCard(`
    ${renderTable({
      columns: [
        { key: "subdomain", header: "Subdomain" },
        { key: "status", header: "Status" },
        { key: "created", header: "Reserved" },
        { key: "actions", header: "", class: "text-right" },
      ],
      data: subdomainRows,
      emptyMessage: "No reserved subdomains. Reserve one to get started.",
    })}
  `)}
</div>

<!-- Reserve Modal -->
<div id="reserveModal" 
     class="fixed inset-0 bg-black/50 backdrop-blur-sm hidden items-center justify-center z-50"
     onclick="if(event.target === this) hideReserveModal()">
  <div class="max-w-md w-full mx-4 rounded-xl p-6" style="background: var(--color-surface); border: 1px solid var(--color-border);">
    <h3 class="text-xl font-bold text-white mb-4">Reserve Subdomain</h3>
    <form id="reserveForm" onsubmit="return reserveSubdomain(event)">
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-300 mb-2">Subdomain</label>
        <div class="flex items-center gap-2">
          <input type="text" name="subdomain" id="subdomainInput"
                 class="flex-1 px-3 py-2 rounded-lg text-white"
                 style="background: var(--color-surface-elevated); border: 1px solid var(--color-border);"
                 placeholder="myapp"
                 pattern="^[a-z0-9][a-z0-9-]{1,61}[a-z0-9]$"
                 oninput="checkAvailability()"
                 required>
          <span class="text-gray-500">.lrok.me</span>
        </div>
        <p id="availabilityMessage" class="text-xs mt-2 text-gray-500">Enter a subdomain to check availability</p>
      </div>
      <div class="flex gap-3 mt-6">
        <button type="button" onclick="hideReserveModal()" 
                class="flex-1 px-4 py-2 text-white rounded-lg border hover:bg-white/5 transition-colors"
                style="border-color: var(--color-border);">
          Cancel
        </button>
        <button type="submit" id="reserveBtn" disabled
                class="flex-1 px-4 py-2 font-medium text-white rounded-lg transition-all duration-200 disabled:opacity-50"
                style="background: var(--gradient-brand);">
          Reserve
        </button>
      </div>
    </form>
  </div>
</div>

<script>
let checkTimeout;

function showReserveModal() {
  document.getElementById('reserveModal').classList.remove('hidden');
  document.getElementById('reserveModal').classList.add('flex');
  document.getElementById('subdomainInput').focus();
}

function hideReserveModal() {
  document.getElementById('reserveModal').classList.add('hidden');
  document.getElementById('reserveModal').classList.remove('flex');
  document.getElementById('reserveForm').reset();
  document.getElementById('availabilityMessage').textContent = 'Enter a subdomain to check availability';
  document.getElementById('availabilityMessage').className = 'text-xs mt-2 text-gray-500';
  document.getElementById('reserveBtn').disabled = true;
}

function checkAvailability() {
  clearTimeout(checkTimeout);
  const input = document.getElementById('subdomainInput');
  const message = document.getElementById('availabilityMessage');
  const btn = document.getElementById('reserveBtn');
  
  const subdomain = input.value.toLowerCase().trim();
  
  if (subdomain.length < 3) {
    message.textContent = 'Subdomain must be at least 3 characters';
    message.className = 'text-xs mt-2 text-gray-500';
    btn.disabled = true;
    return;
  }
  
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(subdomain) && subdomain.length > 2) {
    message.textContent = 'Only lowercase letters, numbers, and hyphens allowed';
    message.className = 'text-xs mt-2 text-red-500';
    btn.disabled = true;
    return;
  }
  
  message.textContent = 'Checking availability...';
  message.className = 'text-xs mt-2 text-gray-500';
  
  checkTimeout = setTimeout(async () => {
    const res = await fetch('/api/subdomains/check?subdomain=' + subdomain);
    const data = await res.json();
    
    if (data.available) {
      message.textContent = '✓ ' + subdomain + '.lrok.me is available!';
      message.className = 'text-xs mt-2 text-green-500';
      btn.disabled = false;
    } else {
      message.textContent = '✕ ' + subdomain + '.lrok.me is already taken';
      message.className = 'text-xs mt-2 text-red-500';
      btn.disabled = true;
    }
  }, 300);
}

async function reserveSubdomain(e) {
  e.preventDefault();
  const subdomain = document.getElementById('subdomainInput').value.toLowerCase().trim();
  
  const res = await fetch('/subdomains/reserve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ subdomain }),
  });
  
  const data = await res.json();
  
  if (data.success) {
    hideReserveModal();
    location.reload();
  } else {
    alert(data.error || 'Failed to reserve subdomain');
  }
}

async function deleteSubdomain(subdomain, domain) {
  if (confirm('Release subdomain "' + subdomain + '.' + domain + '"? This cannot be undone.')) {
    await fetch('/subdomains/' + subdomain + '?domain=' + domain, { method: 'DELETE' });
    location.reload();
  }
}
</script>
`;

  return c.html(renderShell({
    head: {
      title: "Subdomains - lrok",
      description: "Manage your reserved subdomains",
    },
    nav: {
      items: lrokNavItems,
      currentPath: "/subdomains",
      user,
    },
    content,
    footer: true,
  }));
});

// Reserve subdomain
subdomainsRoutes.post("/reserve", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  const { subdomain, domain = "t.lum.tools" } = await c.req.json();
  
  // Validate
  if (!subdomain || subdomain.length < 3 || subdomain.length > 63) {
    return c.json({ success: false, error: "Subdomain must be 3-63 characters" }, 400);
  }

  const normalized = subdomain.toLowerCase().trim();
  
  if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(normalized) && normalized.length > 2) {
    return c.json({ success: false, error: "Invalid subdomain format" }, 400);
  }

  // Check availability
  const existing = await getReservedSubdomainByName(normalized, domain);
  if (existing) {
    return c.json({ success: false, error: "Subdomain is already taken" }, 400);
  }

  // Reserve
  await reserveSubdomain(user.id, normalized, domain);

  await logActivity({
    user_id: user.id,
    action: "subdomain_reserved",
    resource: `${normalized}.${domain}`,
    status: "success",
  });

  return c.json({ success: true });
});

// Delete subdomain
subdomainsRoutes.delete("/:subdomain", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  const subdomain = c.req.param("subdomain");
  const domain = c.req.query("domain") || "t.lum.tools";
  
  const deleted = await releaseSubdomain(user.id, subdomain, domain);

  if (!deleted) {
    return c.json({ success: false, error: "Subdomain not found" }, 404);
  }

  await logActivity({
    user_id: user.id,
    action: "subdomain_released",
    resource: `${subdomain}.${domain}`,
    status: "success",
  });

  return c.json({ success: true });
});
