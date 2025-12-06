/**
 * Shell layout component - wraps all pages
 */

import { renderHead, type HeadProps } from "./head.ts";
import { renderNav, type NavProps } from "./nav.ts";

export interface ShellProps {
  head: HeadProps;
  nav?: NavProps;
  content: string;
  footer?: boolean;
  scripts?: string;
}

export function renderShell(props: ShellProps): string {
  const { head, nav, content, footer = true, scripts = "" } = props;

  const footerHTML = footer ? `
<footer class="border-t mt-auto" style="border-color: var(--color-border); background: var(--color-surface);">
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
    <div class="grid grid-cols-2 md:grid-cols-4 gap-8">
      <!-- Brand -->
      <div class="col-span-2 md:col-span-1">
        <a href="/" class="flex items-center gap-2 mb-4">
          <span class="text-xl font-bold" style="color: var(--lum-orange);">lum.tools</span>
        </a>
        <p class="text-sm text-gray-500">
          Developer toolkit for AI-assisted development.
        </p>
      </div>
      
      <!-- Products -->
      <div>
        <h4 class="text-sm font-semibold text-white mb-4">Products</h4>
        <ul class="space-y-2 text-sm text-gray-400">
          <li><a href="https://platform.lum.tools" class="hover:text-white transition-colors">Platform</a></li>
          <li><a href="https://lrok.lum.tools" class="hover:text-white transition-colors">lrok Tunnels</a></li>
          <li><a href="https://blog.lum.tools" class="hover:text-white transition-colors">Blog</a></li>
        </ul>
      </div>
      
      <!-- Resources -->
      <div>
        <h4 class="text-sm font-semibold text-white mb-4">Resources</h4>
        <ul class="space-y-2 text-sm text-gray-400">
          <li><a href="https://docs.lum.tools" class="hover:text-white transition-colors">Documentation</a></li>
          <li><a href="https://github.com/lumintools" class="hover:text-white transition-colors">GitHub</a></li>
          <li><a href="mailto:support@lum.tools" class="hover:text-white transition-colors">Support</a></li>
        </ul>
      </div>
      
      <!-- Legal -->
      <div>
        <h4 class="text-sm font-semibold text-white mb-4">Legal</h4>
        <ul class="space-y-2 text-sm text-gray-400">
          <li><a href="/privacy" class="hover:text-white transition-colors">Privacy Policy</a></li>
          <li><a href="/terms" class="hover:text-white transition-colors">Terms of Service</a></li>
        </ul>
      </div>
    </div>
    
    <div class="border-t mt-8 pt-8 flex flex-col md:flex-row justify-between items-center" style="border-color: var(--color-border);">
      <p class="text-sm text-gray-500">
        © ${new Date().getFullYear()} lum.tools. All rights reserved.
      </p>
      <div class="flex items-center gap-4 mt-4 md:mt-0">
        <a href="https://github.com/lumintools" class="text-gray-400 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
        </a>
        <a href="https://twitter.com/lumtools" class="text-gray-400 hover:text-white transition-colors">
          <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
        </a>
      </div>
    </div>
  </div>
</footer>
` : "";

  return `
${renderHead(head)}
<body class="min-h-screen flex flex-col" style="background: var(--color-background); color: var(--color-text-primary);">
  ${nav ? renderNav(nav) : ""}
  
  <main class="flex-1">
    ${content}
  </main>
  
  ${footerHTML}
  
  ${scripts}
</body>
</html>
`;
}
