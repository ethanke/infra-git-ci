/**
 * Index / Home routes
 */

import { Hono } from "@hono/hono";
import type { SessionContext } from "@lum/core";
import { 
  renderShell, 
  platformNavItems,
  renderStatsGrid,
  renderCard,
  renderCardHeader,
  type StatsCardProps,
} from "@lum/ui";
import { getAPIKeysByUserId, getUserSubscription, getRecentActivities } from "@lum/db";

export const indexRoutes = new Hono<SessionContext>();

indexRoutes.get("/", async (c) => {
  const user = c.get("user");

  // Not logged in - show landing-style welcome
  if (!user) {
    return c.redirect("https://lum.tools");
  }

  // Logged in - show dashboard
  const [apiKeys, subscription, recentActivity] = await Promise.all([
    getAPIKeysByUserId(user.id),
    getUserSubscription(user.id),
    getRecentActivities(user.id, 10),
  ]);

  const isPro = subscription?.status === "active";

  const stats: StatsCardProps[] = [
    {
      title: "API Keys",
      value: apiKeys.length,
      subtitle: `${apiKeys.filter(k => k.is_active).length} active`,
      icon: "🔑",
      color: "blue",
    },
    {
      title: "Subscription",
      value: isPro ? "Pro" : "Free",
      subtitle: isPro ? "Active" : "Upgrade available",
      icon: isPro ? "⭐" : "📦",
      color: isPro ? "orange" : "purple",
    },
    {
      title: "Recent Activity",
      value: recentActivity.length,
      subtitle: "Last 24 hours",
      icon: "📊",
      color: "green",
    },
    {
      title: "Account Status",
      value: "Active",
      subtitle: `Since ${new Date(user.id).toLocaleDateString()}`,
      icon: "✓",
      color: "green",
    },
  ];

  const activityList = recentActivity.slice(0, 5).map(a => `
    <div class="flex items-center justify-between py-3 border-b last:border-0" style="border-color: var(--color-border);">
      <div class="flex items-center gap-3">
        <span class="w-8 h-8 rounded-full flex items-center justify-center text-sm"
              style="background: ${a.status === 'success' ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'}; 
                     color: ${a.status === 'success' ? '#10B981' : '#EF4444'};">
          ${a.status === 'success' ? '✓' : '✕'}
        </span>
        <div>
          <p class="text-sm text-white font-medium">${a.action}</p>
          <p class="text-xs text-gray-500">${a.resource || '-'}</p>
        </div>
      </div>
      <span class="text-xs text-gray-500">${new Date(a.created_at).toLocaleTimeString()}</span>
    </div>
  `).join("");

  const dashboardContent = `
<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <!-- Welcome Header -->
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-white mb-2">
      Welcome back, ${user.display_name || user.email.split('@')[0]}! 👋
    </h1>
    <p class="text-gray-400">
      Here's an overview of your lum.tools account.
    </p>
  </div>

  <!-- Stats Grid -->
  <div class="mb-8">
    ${renderStatsGrid(stats)}
  </div>

  <!-- Two Column Layout -->
  <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
    <!-- Recent Activity -->
    ${renderCard(`
      ${renderCardHeader("Recent Activity", "Your latest actions", `<a href="/usage" class="text-sm text-orange-500 hover:text-orange-400">View all →</a>`)}
      <div class="divide-y" style="border-color: var(--color-border);">
        ${activityList || '<p class="text-gray-500 text-center py-4">No recent activity</p>'}
      </div>
    `)}

    <!-- Quick Actions -->
    ${renderCard(`
      ${renderCardHeader("Quick Actions", "Common tasks")}
      <div class="space-y-3">
        <a href="/keys" class="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
          <span class="text-xl">🔑</span>
          <div>
            <p class="text-sm font-medium text-white">Manage API Keys</p>
            <p class="text-xs text-gray-500">Create, view, or revoke keys</p>
          </div>
        </a>
        <a href="https://lrok.lum.tools/tunnels" class="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
          <span class="text-xl">🔗</span>
          <div>
            <p class="text-sm font-medium text-white">View Tunnels</p>
            <p class="text-xs text-gray-500">Monitor active lrok tunnels</p>
          </div>
        </a>
        <a href="/billing" class="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors">
          <span class="text-xl">${isPro ? '⭐' : '🚀'}</span>
          <div>
            <p class="text-sm font-medium text-white">${isPro ? 'Manage Subscription' : 'Upgrade to Pro'}</p>
            <p class="text-xs text-gray-500">${isPro ? 'View billing details' : 'Unlock all features'}</p>
          </div>
        </a>
      </div>
    `)}
  </div>
</div>
`;

  return c.html(renderShell({
    head: {
      title: "Dashboard - lum.tools",
      description: "Your lum.tools dashboard",
    },
    nav: {
      items: platformNavItems,
      currentPath: "/",
      user,
    },
    content: dashboardContent,
    footer: true,
  }));
});
