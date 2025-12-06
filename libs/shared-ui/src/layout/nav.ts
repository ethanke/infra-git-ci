/**
 * Navigation component
 */

export interface NavItem {
  href: string;
  label: string;
  icon?: string;
  external?: boolean;
  highlight?: boolean;
}

export interface NavProps {
  items: NavItem[];
  currentPath: string;
  user?: {
    email: string;
    display_name?: string | null;
    photo_url?: string | null;
    is_admin?: boolean;
  } | null;
  logoHref?: string;
  showAuth?: boolean;
}

export function renderNav(props: NavProps): string {
  const { items, currentPath, user, logoHref = "/", showAuth = true } = props;

  const isActive = (href: string) => {
    if (href === "/") return currentPath === "/";
    return currentPath.startsWith(href);
  };

  const navItems = items.map(item => `
    <a href="${item.href}"
       ${item.external ? 'target="_blank" rel="noopener"' : ''}
       class="px-3 py-2 rounded-md text-sm font-medium transition-colors ${
         isActive(item.href)
           ? 'text-white bg-white/10'
           : item.highlight 
             ? 'text-amber-500 hover:text-amber-400'
             : 'text-gray-400 hover:text-white'
       }">
      ${item.icon ? `<span class="mr-1.5">${item.icon}</span>` : ''}${item.label}
    </a>
  `).join("");

  const userSection = showAuth ? (user ? `
    <div class="flex items-center gap-3">
      <span class="text-sm text-gray-400">${user.display_name || user.email.split("@")[0]}</span>
      <a href="/auth/logout" 
         class="px-3 py-1.5 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md transition-colors">
        Sign Out
      </a>
    </div>
  ` : `
    <a href="/auth/login" 
       class="px-4 py-2 text-sm font-medium text-white rounded-md transition-all"
       style="background: var(--gradient-brand);">
      Sign In
    </a>
  `) : "";

  return `
<header class="sticky top-0 z-50 border-b" style="background: var(--color-surface); border-color: var(--color-border);">
  <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div class="flex justify-between items-center h-16">
      <!-- Logo -->
      <a href="${logoHref}" class="flex items-center gap-2 hover:opacity-80 transition-opacity">
        <svg class="w-8 h-8" viewBox="0 0 32 32" fill="none">
          <rect width="32" height="32" rx="8" fill="url(#logo-gradient)"/>
          <path d="M8 12l8-4 8 4-8 4-8-4z" fill="white" fill-opacity="0.9"/>
          <path d="M8 16l8 4 8-4" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <path d="M8 20l8 4 8-4" stroke="white" stroke-width="2" stroke-linecap="round"/>
          <defs>
            <linearGradient id="logo-gradient" x1="0" y1="0" x2="32" y2="32">
              <stop stop-color="#FF8000"/>
              <stop offset="1" stop-color="#E94055"/>
            </linearGradient>
          </defs>
        </svg>
        <span class="text-xl font-bold" style="color: var(--lum-orange);">lum.tools</span>
      </a>
      
      <!-- Desktop Navigation -->
      <div class="hidden md:flex md:items-center md:gap-1">
        ${navItems}
      </div>
      
      <!-- User Section -->
      <div class="hidden md:flex md:items-center">
        ${userSection}
      </div>
      
      <!-- Mobile Menu Button -->
      <button x-data @click="$dispatch('toggle-mobile-menu')"
              class="md:hidden p-2 rounded-md text-gray-400 hover:text-white hover:bg-white/10">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
        </svg>
      </button>
    </div>
  </nav>
  
  <!-- Mobile Menu -->
  <div x-data="{ open: false }" 
       x-show="open" 
       @toggle-mobile-menu.window="open = !open"
       x-transition
       class="md:hidden border-t"
       style="border-color: var(--color-border); background: var(--color-surface);">
    <div class="px-4 py-3 space-y-1">
      ${items.map(item => `
        <a href="${item.href}" class="block px-3 py-2 rounded-md text-base font-medium text-gray-400 hover:text-white hover:bg-white/10">
          ${item.label}
        </a>
      `).join("")}
      ${showAuth ? (user ? `
        <a href="/auth/logout" class="block px-3 py-2 rounded-md text-base font-medium text-red-500 hover:bg-red-500/10">
          Sign Out
        </a>
      ` : `
        <a href="/auth/login" class="block px-3 py-2 rounded-md text-base font-medium text-white" style="background: var(--gradient-brand);">
          Sign In
        </a>
      `) : ""}
    </div>
  </div>
</header>
`;
}

// Predefined navigation configs
export const landingNavItems: NavItem[] = [
  { href: "#features", label: "Features" },
  { href: "#pricing", label: "Pricing" },
  { href: "https://blog.lum.tools", label: "Blog", external: true },
  { href: "https://docs.lum.tools", label: "Docs", external: true },
];

export const platformNavItems: NavItem[] = [
  { href: "/", label: "Home" },
  { href: "/keys", label: "API Keys" },
  { href: "https://lrok.lum.tools/tunnels", label: "Tunnels", external: true },
  { href: "/usage", label: "Usage" },
  { href: "/billing", label: "Pro", highlight: true },
  { href: "/account", label: "Account" },
];

export const lrokNavItems: NavItem[] = [
  { href: "https://platform.lum.tools", label: "Platform", external: true },
  { href: "/tunnels", label: "Tunnels" },
  { href: "/subdomains", label: "Subdomains" },
];
