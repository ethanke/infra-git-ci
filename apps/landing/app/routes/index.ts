/**
 * Landing page index route
 */

import type { Context } from "@hono/hono";
import { 
  renderShell, 
  landingNavItems,
  renderPricingGrid,
  renderFeatureGrid,
  type PricingCardProps,
  type FeatureCardProps,
} from "@lum/ui";

const features: FeatureCardProps[] = [
  {
    icon: "🔗",
    title: "lrok Tunnels",
    description: "Expose localhost to the internet instantly. Secure HTTPS tunnels with custom subdomains.",
    href: "https://lrok.lum.tools",
  },
  {
    icon: "🔑",
    title: "API Key Management",
    description: "Create and manage API keys for all your projects. Track usage and revoke access instantly.",
    href: "https://platform.lum.tools/keys",
  },
  {
    icon: "🤖",
    title: "MCP Servers",
    description: "Give your AI coding assistant real-world context. Web browsing, research, and more.",
    href: "https://docs.lum.tools/mcp",
    badge: "Coming Soon",
  },
  {
    icon: "📦",
    title: "Container Registry",
    description: "Private Docker registry for your team. Push, pull, and manage container images.",
    href: "https://ltcr.lum.tools",
  },
  {
    icon: "☁️",
    title: "Cloud Storage",
    description: "S3-compatible object storage. Store files, backups, and assets with ease.",
    href: "https://stash.lum.tools",
  },
  {
    icon: "📊",
    title: "Usage Analytics",
    description: "Track API usage, tunnel traffic, and storage consumption in real-time.",
    href: "https://platform.lum.tools/usage",
  },
];

const pricingPlans: PricingCardProps[] = [
  {
    name: "Free",
    description: "For hobbyists and exploration",
    price: "€0",
    features: [
      { text: "Basic MCP Tools Access", included: true },
      { text: "Limited API Calls", included: true },
      { text: "1 Tunnel at a time", included: true },
      { text: "Community Support", included: true },
      { text: "Reserved Subdomains", included: false },
      { text: "Priority Support", included: false },
    ],
    cta: { text: "Get Started", href: "https://platform.lum.tools/auth/login" },
  },
  {
    name: "Lum Pro",
    description: "For power users",
    price: "€9.99",
    features: [
      { text: "Everything in Free", included: true },
      { text: "Unlimited lrok tunnels", included: true },
      { text: "50 reserved subdomains", included: true },
      { text: "10GB cloud storage", included: true },
      { text: "Priority email support", included: true },
      { text: "Advanced analytics", included: true },
    ],
    cta: { text: "Upgrade to Pro", href: "https://platform.lum.tools/billing" },
    popular: true,
    highlight: true,
  },
  {
    name: "Enterprise",
    description: "For teams and organizations",
    price: "Custom",
    features: [
      { text: "Everything in Pro", included: true },
      { text: "Unlimited everything", included: true },
      { text: "SSO / SAML support", included: true },
      { text: "Custom domains", included: true },
      { text: "SLA guarantee", included: true },
      { text: "Dedicated support", included: true },
    ],
    cta: { text: "Contact Sales", href: "mailto:sales@lum.tools" },
  },
];

export function indexRoute(c: Context) {
  const heroContent = `
<!-- Hero Section -->
<section class="relative overflow-hidden py-24 sm:py-32 px-4 sm:px-6 lg:px-8">
  <!-- Animated Background -->
  <div class="absolute inset-0 opacity-30 pointer-events-none">
    <div class="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-glow"
         style="background: radial-gradient(circle, rgba(255, 128, 0, 0.3) 0%, transparent 70%);"></div>
    <div class="absolute top-1/3 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse-glow"
         style="background: radial-gradient(circle, rgba(233, 64, 85, 0.3) 0%, transparent 70%); animation-delay: 1s;"></div>
    <div class="absolute bottom-0 left-1/2 w-96 h-96 rounded-full blur-3xl animate-pulse-glow"
         style="background: radial-gradient(circle, rgba(138, 43, 226, 0.3) 0%, transparent 70%); animation-delay: 2s;"></div>
  </div>
  
  <div class="relative max-w-6xl mx-auto text-center">
    <!-- Badge -->
    <div class="inline-flex items-center px-4 py-2 rounded-full mb-8"
         style="background: rgba(255, 128, 0, 0.1); border: 1px solid rgba(255, 128, 0, 0.3);">
      <span class="w-2 h-2 rounded-full mr-2" style="background: #FF8000;"></span>
      <span class="text-sm font-medium" style="color: #FF8000;">Developer Toolkit</span>
    </div>
    
    <!-- Headline -->
    <h1 class="text-5xl sm:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
      <span class="text-white">Build faster.</span><br>
      <span class="text-white" style="text-shadow: 0 0 40px rgba(255, 128, 0, 0.3);">Ship better.</span>
    </h1>
    
    <!-- Subheadline -->
    <p class="text-xl sm:text-2xl text-gray-400 max-w-3xl mx-auto mb-12 leading-relaxed">
      Give your AI coding assistant real-world context. Web browsing, deep research, and secure tunneling—plug-and-play MCP servers for your IDE.
    </p>
    
    <!-- CTAs -->
    <div class="flex flex-col sm:flex-row gap-4 justify-center items-center">
      <a href="https://platform.lum.tools/auth/login" 
         class="px-8 py-4 text-lg font-medium text-white rounded-lg transition-all duration-200 
                hover:shadow-lg hover:-translate-y-0.5 inline-flex items-center group"
         style="background: var(--gradient-brand);">
        Get Started Free
        <svg class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
        </svg>
      </a>
      <a href="#pricing" 
         class="px-8 py-4 text-lg font-medium text-white rounded-lg border transition-all duration-200 hover:bg-white/5"
         style="border-color: var(--color-border);">
        View Plans
      </a>
    </div>
    
    <!-- Trust indicators -->
    <div class="mt-12 flex items-center justify-center gap-2 text-sm text-gray-500">
      <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
      </svg>
      <span>Free tier • No credit card required • Open source components</span>
    </div>
  </div>
</section>

<!-- Features Section -->
<section id="features" class="py-24 px-4 sm:px-6 lg:px-8 scroll-mt-20">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-white mb-4">Everything you need to build</h2>
      <p class="text-xl text-gray-400 max-w-2xl mx-auto">
        A complete toolkit for modern development. From tunnels to storage, we've got you covered.
      </p>
    </div>
    ${renderFeatureGrid(features)}
  </div>
</section>

<!-- Pricing Section -->
<section id="pricing" class="py-24 px-4 sm:px-6 lg:px-8 scroll-mt-20" style="background: var(--color-surface);">
  <div class="max-w-6xl mx-auto">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-bold text-white mb-4">Simple, transparent pricing</h2>
      <p class="text-xl text-gray-400 max-w-2xl mx-auto">
        Start for free, upgrade when you need more power.
      </p>
    </div>
    ${renderPricingGrid(pricingPlans)}
  </div>
</section>

<!-- CTA Section -->
<section class="py-24 px-4 sm:px-6 lg:px-8">
  <div class="max-w-4xl mx-auto text-center">
    <h2 class="text-4xl font-bold text-white mb-6">Ready to supercharge your workflow?</h2>
    <p class="text-xl text-gray-400 mb-8">
      Join thousands of developers who trust lum.tools for their daily development needs.
    </p>
    <a href="https://platform.lum.tools/auth/login" 
       class="px-8 py-4 text-lg font-medium text-white rounded-lg inline-flex items-center group transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
       style="background: var(--gradient-brand);">
      Get Started for Free
      <svg class="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6"/>
      </svg>
    </a>
  </div>
</section>
`;

  return c.html(renderShell({
    head: {
      title: "lum.tools — Developer Toolkit",
      description: "Give your AI coding assistant real-world context. Web browsing, deep research, and secure tunneling—plug-and-play MCP servers for your IDE.",
      canonical: "https://lum.tools",
    },
    nav: {
      items: landingNavItems,
      currentPath: "/",
      user: null,
      showAuth: true,
    },
    content: heroContent,
    footer: true,
  }));
}
