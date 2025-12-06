/**
 * Account settings routes
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
} from "@lum/ui";
import { getUserById, updateUser, logActivity } from "@lum/db";
import { requireAuth } from "../middleware/session.ts";

export const accountRoutes = new Hono<SessionContext>();

accountRoutes.get("/", async (c) => {
  const redirect = requireAuth(c);
  if (redirect) return redirect;
  
  const user = c.get("user")!;
  const fullUser = await getUserById(user.id);

  const accountContent = `
<div class="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-white mb-2">Account Settings</h1>
    <p class="text-gray-400">Manage your profile and preferences.</p>
  </div>

  <!-- Profile Card -->
  ${renderCard(`
    ${renderCardHeader("Profile Information", "Your public profile details")}
    <form id="profileForm" onsubmit="return updateProfile(event)" class="space-y-4">
      <div class="flex items-center gap-4 mb-6">
        <img src="${fullUser?.photo_url || 'https://www.gravatar.com/avatar/?d=mp&s=80'}" 
             alt="Profile" 
             class="w-16 h-16 rounded-full border-2"
             style="border-color: var(--color-border);">
        <div>
          <p class="text-white font-medium">${fullUser?.display_name || 'Anonymous'}</p>
          <p class="text-gray-500 text-sm">${fullUser?.email}</p>
        </div>
      </div>
      
      ${renderInput({
        name: "display_name",
        label: "Display Name",
        value: fullUser?.display_name || '',
        placeholder: "Your name",
      })}
      
      ${renderInput({
        name: "email",
        label: "Email",
        type: "email",
        value: fullUser?.email || '',
        disabled: true,
        hint: "Email cannot be changed (managed by authentication provider)",
      })}
      
      <div class="pt-4">
        <button type="submit"
                class="px-4 py-2 font-medium text-white rounded-lg transition-all duration-200 hover:shadow-lg"
                style="background: var(--gradient-brand);">
          Save Changes
        </button>
      </div>
    </form>
  `)}

  <!-- Preferences -->
  ${renderCard(`
    ${renderCardHeader("Preferences", "Customize your experience")}
    <div class="space-y-4">
      <label class="flex items-center justify-between cursor-pointer">
        <div>
          <p class="text-white font-medium">Email Notifications</p>
          <p class="text-gray-500 text-sm">Receive updates about your account</p>
        </div>
        <input type="checkbox" checked 
               class="w-5 h-5 rounded text-orange-500 bg-transparent border-gray-600 focus:ring-orange-500">
      </label>
      <label class="flex items-center justify-between cursor-pointer">
        <div>
          <p class="text-white font-medium">Security Alerts</p>
          <p class="text-gray-500 text-sm">Get notified about security events</p>
        </div>
        <input type="checkbox" checked 
               class="w-5 h-5 rounded text-orange-500 bg-transparent border-gray-600 focus:ring-orange-500">
      </label>
    </div>
  `)}

  <!-- Danger Zone -->
  ${renderCard(`
    ${renderCardHeader("Danger Zone", "Irreversible actions")}
    <div class="space-y-4">
      <div class="flex items-center justify-between p-4 rounded-lg border border-red-500/30 bg-red-500/5">
        <div>
          <p class="text-white font-medium">Export Data</p>
          <p class="text-gray-500 text-sm">Download all your data</p>
        </div>
        <button onclick="exportData()"
                class="px-4 py-2 text-sm border border-gray-600 text-gray-300 rounded-lg hover:bg-white/5 transition-colors">
          Export
        </button>
      </div>
      <div class="flex items-center justify-between p-4 rounded-lg border border-red-500/30 bg-red-500/5">
        <div>
          <p class="text-red-400 font-medium">Delete Account</p>
          <p class="text-gray-500 text-sm">Permanently delete your account and all data</p>
        </div>
        <button onclick="confirmDelete()"
                class="px-4 py-2 text-sm border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors">
          Delete
        </button>
      </div>
    </div>
  `)}
</div>

<script>
async function updateProfile(e) {
  e.preventDefault();
  const form = e.target;
  const data = {
    display_name: form.display_name.value,
  };
  
  const res = await fetch('/account/update', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  
  if (res.ok) {
    alert('Profile updated successfully!');
    location.reload();
  } else {
    alert('Failed to update profile');
  }
}

function exportData() {
  window.location.href = '/account/export';
}

function confirmDelete() {
  if (confirm('Are you sure you want to delete your account? This cannot be undone.')) {
    if (confirm('This is your last chance to cancel. All your data will be permanently deleted.')) {
      fetch('/account/delete', { method: 'DELETE' }).then(() => {
        window.location.href = 'https://lum.tools';
      });
    }
  }
}
</script>
`;

  return c.html(renderShell({
    head: {
      title: "Account Settings - lum.tools",
      description: "Manage your lum.tools account",
    },
    nav: {
      items: platformNavItems,
      currentPath: "/account",
      user,
    },
    content: accountContent,
    footer: true,
  }));
});

// Update profile
accountRoutes.patch("/update", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  const { display_name } = await c.req.json();
  
  await updateUser(user.id, { display_name });

  await logActivity({
    user_id: user.id,
    action: "profile_updated",
    status: "success",
  });

  return c.json({ success: true });
});

// Export data
accountRoutes.get("/export", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.redirect("/auth/login");
  }

  // TODO: Implement actual data export
  const userData = {
    user: {
      id: user.id,
      email: user.email,
      display_name: user.display_name,
    },
    exported_at: new Date().toISOString(),
    message: "Full export coming soon",
  };

  c.header("Content-Disposition", `attachment; filename="lum-tools-export-${Date.now()}.json"`);
  c.header("Content-Type", "application/json");
  
  return c.body(JSON.stringify(userData, null, 2));
});

// Delete account
accountRoutes.delete("/delete", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  // TODO: Implement proper account deletion
  await logActivity({
    user_id: user.id,
    action: "account_deletion_requested",
    status: "pending",
  });

  return c.json({ success: true, message: "Account deletion scheduled" });
});
