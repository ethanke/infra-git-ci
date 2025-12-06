/**
 * API Key management routes
 */

import { Hono } from "@hono/hono";
import type { SessionContext } from "@lum/core";
import { 
  renderShell, 
  platformNavItems,
  renderCard,
  renderCardHeader,
  renderButton,
  renderInput,
  renderTable,
  renderBadge,
} from "@lum/ui";
import { 
  getAPIKeysByUserId, 
  createAPIKey, 
  deleteAPIKey, 
  toggleAPIKey,
  generateAPIKey,
  hashAPIKey,
  getAPIKeyPrefix,
  logActivity,
} from "@lum/db";
import { requireAuth } from "../middleware/session.ts";

export const keysRoutes = new Hono<SessionContext>();

// API Keys page
keysRoutes.get("/", async (c) => {
  const redirect = requireAuth(c);
  if (redirect) return redirect;
  
  const user = c.get("user")!;
  const apiKeys = await getAPIKeysByUserId(user.id);

  const keyRows = apiKeys.map(key => ({
    name: `<span class="font-medium text-white">${key.name}</span>`,
    prefix: `<code class="text-xs px-2 py-1 rounded" style="background: var(--color-surface-elevated);">${key.prefix}...</code>`,
    status: key.is_active 
      ? renderBadge("Active", { variant: "success", dot: true })
      : renderBadge("Inactive", { variant: "error", dot: true }),
    created: new Date(key.created_at).toLocaleDateString(),
    last_used: key.last_used_at ? new Date(key.last_used_at).toLocaleDateString() : "-",
    actions: `
      <div class="flex items-center gap-2">
        <button onclick="toggleKey(${key.id})" 
                class="text-xs px-2 py-1 rounded transition-colors hover:bg-white/10"
                style="color: ${key.is_active ? '#F59E0B' : '#10B981'};">
          ${key.is_active ? 'Disable' : 'Enable'}
        </button>
        <button onclick="deleteKey(${key.id}, '${key.name}')" 
                class="text-xs px-2 py-1 rounded text-red-500 hover:bg-red-500/10 transition-colors">
          Delete
        </button>
      </div>
    `,
  }));

  const keysContent = `
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold text-white mb-2">API Keys</h1>
      <p class="text-gray-400">Manage your API keys for authentication.</p>
    </div>
    <button onclick="showCreateModal()" 
            class="px-4 py-2 font-medium text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            style="background: var(--gradient-brand);">
      + Create Key
    </button>
  </div>

  <!-- Keys Table -->
  ${renderTable({
    columns: [
      { key: "name", header: "Name" },
      { key: "prefix", header: "Key" },
      { key: "status", header: "Status" },
      { key: "created", header: "Created" },
      { key: "last_used", header: "Last Used" },
      { key: "actions", header: "", class: "text-right" },
    ],
    data: keyRows,
    emptyMessage: "No API keys yet. Create one to get started.",
  })}
</div>

<!-- Create Key Modal -->
<div id="createModal" 
     class="fixed inset-0 bg-black/50 backdrop-blur-sm hidden items-center justify-center z-50"
     onclick="if(event.target === this) hideCreateModal()">
  <div class="max-w-md w-full mx-4 rounded-xl p-6" style="background: var(--color-surface); border: 1px solid var(--color-border);">
    <h3 class="text-xl font-bold text-white mb-4">Create API Key</h3>
    <form id="createKeyForm" onsubmit="return createKey(event)">
      ${renderInput({
        name: "keyName",
        label: "Key Name",
        placeholder: "e.g., Production, Development",
        required: true,
        hint: "A memorable name for this key",
      })}
      <div class="flex gap-3 mt-6">
        <button type="button" onclick="hideCreateModal()" 
                class="flex-1 px-4 py-2 text-white rounded-lg border hover:bg-white/5 transition-colors"
                style="border-color: var(--color-border);">
          Cancel
        </button>
        <button type="submit"
                class="flex-1 px-4 py-2 font-medium text-white rounded-lg transition-all duration-200"
                style="background: var(--gradient-brand);">
          Create Key
        </button>
      </div>
    </form>
  </div>
</div>

<!-- Show Key Modal -->
<div id="showKeyModal" 
     class="fixed inset-0 bg-black/50 backdrop-blur-sm hidden items-center justify-center z-50"
     onclick="if(event.target === this) hideShowKeyModal()">
  <div class="max-w-lg w-full mx-4 rounded-xl p-6" style="background: var(--color-surface); border: 1px solid var(--color-border);">
    <div class="flex items-center gap-3 mb-4">
      <span class="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500">✓</span>
      <h3 class="text-xl font-bold text-white">API Key Created</h3>
    </div>
    <p class="text-gray-400 text-sm mb-4">
      <strong class="text-yellow-500">Important:</strong> Copy this key now. You won't be able to see it again!
    </p>
    <div class="relative">
      <input type="text" id="newKeyValue" readonly
             class="w-full px-3 py-3 pr-20 rounded-lg text-white font-mono text-sm"
             style="background: var(--color-surface-elevated); border: 1px solid var(--color-border);">
      <button onclick="copyKey()" 
              class="absolute right-2 top-1/2 -translate-y-1/2 px-3 py-1 text-sm text-orange-500 hover:bg-orange-500/10 rounded transition-colors">
        Copy
      </button>
    </div>
    <button onclick="hideShowKeyModal()" 
            class="w-full mt-6 px-4 py-2 font-medium text-white rounded-lg transition-all duration-200"
            style="background: var(--gradient-brand);">
      Done
    </button>
  </div>
</div>

<script>
function showCreateModal() {
  document.getElementById('createModal').classList.remove('hidden');
  document.getElementById('createModal').classList.add('flex');
}

function hideCreateModal() {
  document.getElementById('createModal').classList.add('hidden');
  document.getElementById('createModal').classList.remove('flex');
  document.getElementById('createKeyForm').reset();
}

function hideShowKeyModal() {
  document.getElementById('showKeyModal').classList.add('hidden');
  document.getElementById('showKeyModal').classList.remove('flex');
  location.reload();
}

async function createKey(e) {
  e.preventDefault();
  const name = document.querySelector('input[name="keyName"]').value;
  
  const res = await fetch('/keys/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  
  const data = await res.json();
  
  if (data.success && data.key) {
    hideCreateModal();
    document.getElementById('newKeyValue').value = data.key;
    document.getElementById('showKeyModal').classList.remove('hidden');
    document.getElementById('showKeyModal').classList.add('flex');
  } else {
    alert(data.error || 'Failed to create key');
  }
}

async function toggleKey(id) {
  await fetch('/keys/' + id + '/toggle', { method: 'PATCH' });
  location.reload();
}

async function deleteKey(id, name) {
  if (confirm('Delete API key "' + name + '"? This cannot be undone.')) {
    await fetch('/keys/' + id, { method: 'DELETE' });
    location.reload();
  }
}

function copyKey() {
  const input = document.getElementById('newKeyValue');
  input.select();
  document.execCommand('copy');
  const btn = document.querySelector('#showKeyModal button[onclick="copyKey()"]');
  btn.textContent = 'Copied!';
  setTimeout(() => btn.textContent = 'Copy', 2000);
}
</script>
`;

  return c.html(renderShell({
    head: {
      title: "API Keys - lum.tools",
      description: "Manage your lum.tools API keys",
    },
    nav: {
      items: platformNavItems,
      currentPath: "/keys",
      user,
    },
    content: keysContent,
    footer: true,
  }));
});

// Create key API
keysRoutes.post("/create", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  const { name } = await c.req.json();
  
  if (!name || name.length < 3) {
    return c.json({ success: false, error: "Name must be at least 3 characters" }, 400);
  }

  const rawKey = generateAPIKey();
  const keyHash = await hashAPIKey(rawKey);
  const prefix = getAPIKeyPrefix(rawKey);
  
  // TODO: Encrypt the key properly in production
  const encryptedKey = btoa(rawKey);

  await createAPIKey(user.id, name, encryptedKey, keyHash, prefix);

  await logActivity({
    user_id: user.id,
    action: "api_key_created",
    resource: name,
    status: "success",
    ip_address: c.req.header("x-forwarded-for") || c.req.header("x-real-ip"),
    user_agent: c.req.header("user-agent"),
  });

  return c.json({ success: true, key: rawKey });
});

// Toggle key
keysRoutes.patch("/:id/toggle", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  const id = parseInt(c.req.param("id"));
  const key = await toggleAPIKey(id, user.id);

  if (!key) {
    return c.json({ success: false, error: "Key not found" }, 404);
  }

  await logActivity({
    user_id: user.id,
    action: key.is_active ? "api_key_enabled" : "api_key_disabled",
    resource: key.name,
    status: "success",
  });

  return c.json({ success: true, is_active: key.is_active });
});

// Delete key
keysRoutes.delete("/:id", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  const id = parseInt(c.req.param("id"));
  const deleted = await deleteAPIKey(id, user.id);

  if (!deleted) {
    return c.json({ success: false, error: "Key not found" }, 404);
  }

  await logActivity({
    user_id: user.id,
    action: "api_key_deleted",
    status: "success",
  });

  return c.json({ success: true });
});
