/**
 * Index routes
 */

import { Hono } from "@hono/hono";
import type { SessionContext } from "@lum/core";
import { 
  renderShell, 
  lrokNavItems,
  renderStatsGrid,
  renderCard,
  renderCardHeader,
  type StatsCardProps,
} from "@lum/ui";
import { getActiveTunnels, getReservedSubdomains, getTunnelStats } from "@lum/db";
import { requireAuth } from "../middleware/session.ts";

export const indexRoutes = new Hono<SessionContext>();

indexRoutes.get("/", async (c) => {
  const redirect = requireAuth(c);
  if (redirect) return redirect;
  
  const user = c.get("user")!;
  
  const [tunnels, subdomains, stats] = await Promise.all([
    getActiveTunnels(user.id, 24),
    getReservedSubdomains(user.id),
    getTunnelStats(user.id),
  ]);

  const statsCards: StatsCardProps[] = [
    {
      title: "Active Tunnels",
      value: tunnels.length,
      icon: "🔗",
      color: "green",
    },
    {
      title: "Total Sessions",
      value: stats.total_sessions,
      subtitle: "Last 30 days",
      icon: "📊",
      color: "blue",
    },
    {
      title: "Reserved Subdomains",
      value: subdomains.length,
      icon: "🏷️",
      color: "purple",
    },
    {
      title: "Data Transferred",
      value: formatBytes(stats.total_bytes_in + stats.total_bytes_out),
      subtitle: "This month",
      icon: "📈",
      color: "orange",
    },
  ];

  const tunnelsList = tunnels.length > 0 ? tunnels.map(t => `
    <div class="flex items-center justify-between py-3 border-b last:border-0" style="border-color: var(--color-border);">
      <div class="flex items-center gap-3">
        <span class="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        <div>
          <p class="text-sm font-medium text-white">
            ${t.subdomain ? `${t.subdomain}.t.lum.tools` : t.url}
          </p>
          <p class="text-xs text-gray-500">
            ${t.proxy_type.toUpperCase()} • ${t.tunnel_name}
          </p>
        </div>
      </div>
      <div class="text-right">
        <p class="text-xs text-gray-500">${timeAgo(t.connected_at)}</p>
      </div>
    </div>
  `).join("") : '<p class="text-gray-500 text-center py-4">No active tunnels</p>';

  const content = `
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <!-- Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-white mb-2">lrok Dashboard</h1>
    <p class="text-gray-400">Manage your tunnels and reserved subdomains.</p>
  </div>

  <!-- Quick Start -->
  <div class="mb-8 p-4 rounded-xl border" style="background: linear-gradient(135deg, rgba(255,128,0,0.1), rgba(233,64,85,0.1)); border-color: var(--lum-orange);">
    <div class="flex items-center gap-4">
      <span class="text-3xl">🚀</span>
      <div class="flex-1">
        <h3 class="text-lg font-bold text-white mb-1">Start a tunnel in seconds</h3>
        <p class="text-gray-400 text-sm">Expose your local server to the internet with one command</p>
      </div>
      <code class="px-4 py-2 rounded-lg text-sm" style="background: var(--color-surface-elevated); color: var(--lum-orange);">
        lrok http 3000
      </code>
    </div>
  </div>

  <!-- Stats -->
  <div class="mb-8">
    ${renderStatsGrid(statsCards)}
  </div>

  <!-- Two Column Layout -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Active Tunnels -->
    ${renderCard(`
      ${renderCardHeader("Active Tunnels", "Currently running", `<a href="/tunnels" class="text-sm text-orange-500 hover:text-orange-400">View all →</a>`)}
      <div class="divide-y" style="border-color: var(--color-border);">
        ${tunnelsList}
      </div>
    `)}

    <!-- Reserved Subdomains -->
    ${renderCard(`
      ${renderCardHeader("Reserved Subdomains", "Your custom domains", `<a href="/subdomains" class="text-sm text-orange-500 hover:text-orange-400">Manage →</a>`)}
      <div class="space-y-2">
        ${subdomains.length > 0 ? subdomains.slice(0, 5).map(s => `
          <div class="flex items-center justify-between py-2">
            <code class="text-sm text-white">${s.subdomain}.t.lum.tools</code>
            <span class="text-xs px-2 py-1 rounded bg-green-500/20 text-green-500">Reserved</span>
          </div>
        `).join("") : '<p class="text-gray-500 text-center py-4">No reserved subdomains</p>'}
      </div>
    `)}
  </div>

  <!-- Installation -->
  ${renderCard(`
    ${renderCardHeader("Installation", "Get lrok on your machine")}
    <div class="grid md:grid-cols-3 gap-4">
      <div class="p-4 rounded-lg" style="background: var(--color-surface-elevated);">
        <p class="text-xs text-gray-500 mb-2">npm / Node.js</p>
        <code class="text-sm text-white">npm i -g lrok</code>
      </div>
      <div class="p-4 rounded-lg" style="background: var(--color-surface-elevated);">
        <p class="text-xs text-gray-500 mb-2">pip / Python</p>
        <code class="text-sm text-white">pip install lrok</code>
      </div>
      <div class="p-4 rounded-lg" style="background: var(--color-surface-elevated);">
        <p class="text-xs text-gray-500 mb-2">Go</p>
        <code class="text-sm text-white">go install lum.tools/lrok</code>
      </div>
    </div>
  `)}
</div>
`;

  return c.html(renderShell({
    head: {
      title: "lrok Dashboard - lum.tools",
      description: "Manage your lrok tunnels",
    },
    nav: {
      items: lrokNavItems,
      currentPath: "/",
      user,
    },
    content,
    footer: true,
  }));
});

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
}

function timeAgo(date: string | Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}
