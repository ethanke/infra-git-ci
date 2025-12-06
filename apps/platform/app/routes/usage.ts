/**
 * Usage / Activity routes
 */

import { Hono } from "@hono/hono";
import type { SessionContext } from "@lum/core";
import { 
  renderShell, 
  platformNavItems,
  renderCard,
  renderCardHeader,
  renderTable,
  renderBadge,
  renderStatsGrid,
  type StatsCardProps,
} from "@lum/ui";
import { getRecentActivities, getActivityStats } from "@lum/db";
import { requireAuth } from "../middleware/session.ts";

export const usageRoutes = new Hono<SessionContext>();

usageRoutes.get("/", async (c) => {
  const redirect = requireAuth(c);
  if (redirect) return redirect;
  
  const user = c.get("user")!;
  
  // Get pagination params
  const page = parseInt(c.req.query("page") ?? "1");
  const limit = 50;
  
  const [activities, stats] = await Promise.all([
    getRecentActivities(user.id, limit),
    getActivityStats(7),
  ]);

  const statsCards: StatsCardProps[] = [
    {
      title: "Total Actions",
      value: stats.total,
      icon: "📊",
      color: "blue",
    },
    {
      title: "Successful",
      value: stats.success,
      subtitle: `${Math.round((stats.success / stats.total) * 100) || 0}%`,
      icon: "✓",
      color: "green",
    },
    {
      title: "Failed",
      value: stats.error,
      icon: "✕",
      color: "red",
    },
    {
      title: "Actions/Day",
      value: Math.round(stats.total / 7),
      icon: "📅",
      color: "orange",
    },
  ];

  const activityRows = activities.map(a => ({
    time: `<span class="text-gray-400">${new Date(a.created_at).toLocaleString()}</span>`,
    action: `<span class="text-white font-medium">${a.action}</span>`,
    resource: a.resource || '-',
    status: a.status === 'success' 
      ? renderBadge("Success", { variant: "success" })
      : a.status === 'error'
      ? renderBadge("Error", { variant: "error" })
      : renderBadge(a.status, { variant: "warning" }),
    ip: `<span class="text-xs text-gray-500 font-mono">${a.ip_address || '-'}</span>`,
  }));

  const usageContent = `
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-white mb-2">Usage & Activity</h1>
    <p class="text-gray-400">Monitor your account activity and API usage.</p>
  </div>

  <!-- Stats -->
  <div class="mb-8">
    ${renderStatsGrid(statsCards)}
  </div>

  <!-- Activity Table -->
  ${renderCard(`
    ${renderCardHeader("Activity Log", "Your recent actions")}
    ${renderTable({
      columns: [
        { key: "time", header: "Time" },
        { key: "action", header: "Action" },
        { key: "resource", header: "Resource" },
        { key: "status", header: "Status" },
        { key: "ip", header: "IP Address" },
      ],
      data: activityRows,
      emptyMessage: "No activity recorded yet.",
    })}
    
    <!-- Pagination -->
    ${activities.length >= limit ? `
      <div class="flex justify-center gap-2 mt-4 pt-4 border-t" style="border-color: var(--color-border);">
        ${page > 1 ? `<a href="?page=${page - 1}" class="px-3 py-1 text-sm rounded border hover:bg-white/5" style="border-color: var(--color-border);">← Previous</a>` : ''}
        <span class="px-3 py-1 text-sm text-gray-500">Page ${page}</span>
        <a href="?page=${page + 1}" class="px-3 py-1 text-sm rounded border hover:bg-white/5" style="border-color: var(--color-border);">Next →</a>
      </div>
    ` : ''}
  `)}
</div>
`;

  return c.html(renderShell({
    head: {
      title: "Usage & Activity - lum.tools",
      description: "Monitor your lum.tools activity",
    },
    nav: {
      items: platformNavItems,
      currentPath: "/usage",
      user,
    },
    content: usageContent,
    footer: true,
  }));
});
