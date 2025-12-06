/**
 * HTML Head component with all required assets
 */

import { lumThemeCSS, tailwindConfig } from "../styles/theme.ts";

export interface HeadProps {
  title: string;
  description?: string;
  canonical?: string;
  ogImage?: string;
  scripts?: string;
  styles?: string;
}

export function renderHead(props: HeadProps): string {
  const {
    title,
    description = "lum.tools — Developer toolkit with MCP servers for AI-assisted development",
    canonical,
    ogImage = "https://lum.tools/og-image.png",
    scripts = "",
    styles = "",
  } = props;

  return `
<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${description}">
  <meta name="theme-color" content="#0A0A0A">
  
  <title>${title}</title>
  
  <!-- Favicon -->
  <link rel="icon" type="image/svg+xml" href="/static/favicon.svg">
  <link rel="apple-touch-icon" sizes="180x180" href="/static/apple-touch-icon.png">
  
  <!-- Open Graph -->
  <meta property="og:title" content="${title}">
  <meta property="og:description" content="${description}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:type" content="website">
  ${canonical ? `<meta property="og:url" content="${canonical}">` : ""}
  
  <!-- Twitter -->
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="${title}">
  <meta name="twitter:description" content="${description}">
  <meta name="twitter:image" content="${ogImage}">
  
  ${canonical ? `<link rel="canonical" href="${canonical}">` : ""}
  
  <!-- Fonts -->
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  
  <!-- TailwindCSS -->
  <script src="https://cdn.tailwindcss.com"></script>
  <script>${tailwindConfig}</script>
  
  <!-- Alpine.js -->
  <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.14.1/dist/cdn.min.js"></script>
  
  <!-- Theme CSS -->
  <style>${lumThemeCSS}</style>
  
  <!-- Additional styles -->
  ${styles}
  
  <!-- Analytics (Umami) -->
  <script defer src="https://umami.lum.tools/script.js" data-website-id="199d62d1-5fca-4add-85cd-06d44c22d020"></script>
</head>
`;
}
