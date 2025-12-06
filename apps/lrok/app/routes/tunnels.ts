/**
 * Tunnels routes
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
} from "@lum/ui";
import { getActiveTunnels, getTunnelStats } from "@lum/db";
import { requireAuth } from "../middleware/session.ts";

export const tunnelsRoutes = new Hono<SessionContext>();

// List tunnels
tunnelsRoutes.get("/", async (c) => {
  const redirect = requireAuth(c);
  if (redirect) return redirect;
  
  const user = c.get("user")!;
  const tunnels = await getActiveTunnels(user.id);

  const tunnelRows = tunnels.map(t => ({
    url: `
      <div class="flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        <a href="${t.url}" target="_blank" class="text-white hover:text-orange-500">
          ${t.subdomain ? `${t.subdomain}.t.lum.tools` : t.url}
        </a>
      </div>
    `,
    name: `<code class="text-xs text-gray-400">${t.tunnel_name}</code>`,
    status: renderBadge("Active", { variant: "success", dot: true }),
    protocol: `<span class="text-gray-400">${t.proxy_type.toUpperCase()}</span>`,
    started: new Date(t.connected_at).toLocaleString(),
  }));

  const content = `
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="flex items-center justify-between mb-8">
    <div>
      <h1 class="text-3xl font-bold text-white mb-2">Active Tunnels</h1>
      <p class="text-gray-400">Currently running tunnel connections.</p>
    </div>
  </div>

  <!-- Info -->
  <div class="mb-6 p-4 rounded-lg border flex items-center gap-4" style="background: var(--color-surface); border-color: var(--color-border);">
    <span class="text-2xl">💡</span>
    <div>
      <p class="text-white text-sm">Tunnels are managed via the lrok CLI.</p>
      <p class="text-gray-500 text-xs">Run <code class="text-orange-500">lrok http 3000</code> to start a new tunnel.</p>
    </div>
  </div>

  <!-- Tunnels Table -->
  ${renderCard(`
    ${renderTable({
      columns: [
        { key: "url", header: "Public URL" },
        { key: "name", header: "Tunnel Name" },
        { key: "protocol", header: "Protocol" },
        { key: "status", header: "Status" },
        { key: "started", header: "Connected" },
      ],
      data: tunnelRows,
      emptyMessage: "No active tunnels. Start one with the lrok CLI.",
    })}
  `)}
</div>
`;

  return c.html(renderShell({
    head: {
      title: "Tunnels - lrok",
      description: "View your active lrok tunnels",
    },
    nav: {
      items: lrokNavItems,
      currentPath: "/tunnels",
      user,
    },
    content,
    footer: true,
  }));
});
