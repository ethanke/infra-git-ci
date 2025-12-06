/**
 * Billing routes
 */

import { Hono } from "@hono/hono";
import type { SessionContext } from "@lum/core";
import { 
  renderShell, 
  platformNavItems,
  renderCard,
  renderCardHeader,
  renderBadge,
} from "@lum/ui";
import { getUserSubscription, logActivity } from "@lum/db";
import { requireAuth } from "../middleware/session.ts";

export const billingRoutes = new Hono<SessionContext>();

const STRIPE_PUBLISHABLE_KEY = Deno.env.get("STRIPE_PUBLISHABLE_KEY") ?? "";
const STRIPE_PRICE_PRO_MONTHLY = Deno.env.get("STRIPE_PRICE_PRO_MONTHLY") ?? "";
const STRIPE_PRICE_PRO_YEARLY = Deno.env.get("STRIPE_PRICE_PRO_YEARLY") ?? "";

const plans = {
  free: {
    name: "Free",
    price: "$0",
    period: "/month",
    features: [
      "3 API Keys",
      "1,000 API calls/month",
      "Community support",
      "Basic analytics",
    ],
  },
  pro: {
    name: "Pro",
    price: "$9",
    period: "/month",
    yearlyPrice: "$90",
    yearlyPeriod: "/year",
    features: [
      "Unlimited API Keys",
      "100,000 API calls/month",
      "Priority support",
      "Advanced analytics",
      "Custom subdomains",
      "Team sharing",
    ],
  },
};

billingRoutes.get("/", async (c) => {
  const redirect = requireAuth(c);
  if (redirect) return redirect;
  
  const user = c.get("user")!;
  const subscription = await getUserSubscription(user.id);
  
  const isPro = subscription?.status === "active";
  const currentPlan = isPro ? "pro" : "free";

  const billingContent = `
<div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
  <div class="mb-8">
    <h1 class="text-3xl font-bold text-white mb-2">Billing</h1>
    <p class="text-gray-400">Manage your subscription and billing details.</p>
  </div>

  <!-- Current Plan -->
  ${renderCard(`
    ${renderCardHeader("Current Plan", "Your subscription status")}
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-4">
        <span class="text-4xl">${isPro ? '⭐' : '📦'}</span>
        <div>
          <h3 class="text-xl font-bold text-white">${plans[currentPlan].name}</h3>
          <p class="text-gray-500">${isPro ? 'Thanks for supporting lum.tools!' : 'Upgrade to unlock more features'}</p>
        </div>
      </div>
      <div class="text-right">
        ${isPro ? renderBadge("Active", { variant: "success", dot: true }) : renderBadge("Free Tier", { variant: "default" })}
      </div>
    </div>
    ${isPro && subscription ? `
      <div class="mt-4 pt-4 border-t flex gap-4 text-sm" style="border-color: var(--color-border);">
        <span class="text-gray-500">Next billing: ${new Date(subscription.current_period_end || '').toLocaleDateString()}</span>
        <a href="/billing/portal" class="text-orange-500 hover:text-orange-400">Manage subscription →</a>
      </div>
    ` : ''}
  `)}

  <!-- Plans Comparison -->
  <h2 class="text-xl font-bold text-white mt-12 mb-6">Choose Your Plan</h2>
  
  <div class="grid md:grid-cols-2 gap-6">
    <!-- Free Plan -->
    <div class="rounded-xl p-6 border ${currentPlan === 'free' ? 'ring-2 ring-orange-500' : ''}" 
         style="background: var(--color-surface); border-color: var(--color-border);">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-white">Free</h3>
        ${currentPlan === 'free' ? renderBadge("Current", { variant: "success" }) : ''}
      </div>
      <div class="mb-6">
        <span class="text-4xl font-bold text-white">$0</span>
        <span class="text-gray-500">/month</span>
      </div>
      <ul class="space-y-3 mb-6">
        ${plans.free.features.map(f => `
          <li class="flex items-center gap-2 text-gray-300">
            <span class="text-green-500">✓</span> ${f}
          </li>
        `).join('')}
      </ul>
      <button disabled
              class="w-full py-2 px-4 rounded-lg border text-gray-500 cursor-not-allowed"
              style="border-color: var(--color-border);">
        ${currentPlan === 'free' ? 'Current Plan' : 'Downgrade'}
      </button>
    </div>

    <!-- Pro Plan -->
    <div class="rounded-xl p-6 border relative ${currentPlan === 'pro' ? 'ring-2 ring-orange-500' : ''}" 
         style="background: var(--color-surface); border-color: var(--color-border);">
      <div class="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 text-xs font-bold rounded-full"
           style="background: var(--gradient-brand); color: white;">
        POPULAR
      </div>
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-bold text-white">Pro</h3>
        ${currentPlan === 'pro' ? renderBadge("Current", { variant: "success" }) : ''}
      </div>
      <div class="mb-6">
        <span class="text-4xl font-bold text-white">$9</span>
        <span class="text-gray-500">/month</span>
        <span class="text-sm text-gray-500 ml-2">or $90/year</span>
      </div>
      <ul class="space-y-3 mb-6">
        ${plans.pro.features.map(f => `
          <li class="flex items-center gap-2 text-gray-300">
            <span class="text-green-500">✓</span> ${f}
          </li>
        `).join('')}
      </ul>
      ${currentPlan === 'pro' ? `
        <button disabled
                class="w-full py-2 px-4 rounded-lg border text-gray-500 cursor-not-allowed"
                style="border-color: var(--color-border);">
          Current Plan
        </button>
      ` : `
        <button onclick="subscribe('monthly')"
                class="w-full py-2 px-4 rounded-lg font-medium text-white transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
                style="background: var(--gradient-brand);">
          Upgrade to Pro
        </button>
      `}
    </div>
  </div>

  <!-- FAQ -->
  ${renderCard(`
    ${renderCardHeader("Frequently Asked Questions", "")}
    <div class="space-y-4">
      <details class="group">
        <summary class="flex items-center justify-between cursor-pointer text-white font-medium py-2">
          Can I cancel anytime?
          <span class="group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <p class="text-gray-400 pb-2">Yes, you can cancel your subscription at any time. You'll continue to have access until the end of your billing period.</p>
      </details>
      <details class="group">
        <summary class="flex items-center justify-between cursor-pointer text-white font-medium py-2">
          What payment methods do you accept?
          <span class="group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <p class="text-gray-400 pb-2">We accept all major credit cards (Visa, MasterCard, Amex) through Stripe.</p>
      </details>
      <details class="group">
        <summary class="flex items-center justify-between cursor-pointer text-white font-medium py-2">
          Do you offer refunds?
          <span class="group-open:rotate-180 transition-transform">▼</span>
        </summary>
        <p class="text-gray-400 pb-2">Yes, we offer a 14-day money-back guarantee if you're not satisfied.</p>
      </details>
    </div>
  `)}
</div>

<script>
async function subscribe(interval) {
  const res = await fetch('/billing/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ interval }),
  });
  
  const data = await res.json();
  
  if (data.url) {
    window.location.href = data.url;
  } else {
    alert(data.error || 'Failed to create checkout session');
  }
}
</script>
`;

  return c.html(renderShell({
    head: {
      title: "Billing - lum.tools",
      description: "Manage your lum.tools subscription",
    },
    nav: {
      items: platformNavItems,
      currentPath: "/billing",
      user,
    },
    content: billingContent,
    footer: true,
  }));
});

// Create Stripe checkout session
billingRoutes.post("/create-checkout", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ success: false, error: "Unauthorized" }, 401);
  }

  const { interval } = await c.req.json();
  const priceId = interval === "yearly" ? STRIPE_PRICE_PRO_YEARLY : STRIPE_PRICE_PRO_MONTHLY;
  
  // TODO: Implement Stripe checkout session creation
  // For now, return placeholder
  await logActivity({
    user_id: user.id,
    action: "checkout_initiated",
    resource: interval,
    status: "pending",
  });

  return c.json({ 
    error: "Stripe integration coming soon",
    // url: checkoutSession.url 
  });
});

// Stripe customer portal
billingRoutes.get("/portal", async (c) => {
  const user = c.get("user");
  if (!user) {
    return c.redirect("/auth/login");
  }

  // TODO: Implement Stripe customer portal
  return c.redirect("/billing");
});

// Stripe webhook
billingRoutes.post("/webhook", async (c) => {
  // TODO: Implement Stripe webhook handler
  return c.json({ received: true });
});
