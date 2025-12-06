/**
 * SEO routes - robots.txt and sitemap.xml
 */

import { Hono } from "@hono/hono";

export const seoRoutes = new Hono();

seoRoutes.get("/robots.txt", (c) => {
  const content = `# lum.tools robots.txt
User-agent: *
Allow: /

# Sitemap location
Sitemap: https://lum.tools/sitemap.xml

# Crawl-delay (be nice to our servers)
Crawl-delay: 1
`;
  return c.text(content, 200, { "Content-Type": "text/plain; charset=utf-8" });
});

seoRoutes.get("/sitemap.xml", (c) => {
  const now = new Date().toISOString().split("T")[0];
  
  const urls = [
    { loc: "https://lum.tools/", priority: "1.0", changefreq: "weekly" },
    { loc: "https://platform.lum.tools/", priority: "0.9", changefreq: "weekly" },
    { loc: "https://lrok.lum.tools/", priority: "0.8", changefreq: "weekly" },
    { loc: "https://blog.lum.tools/", priority: "0.8", changefreq: "daily" },
    { loc: "https://docs.lum.tools/", priority: "0.7", changefreq: "weekly" },
  ];
  
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    <lastmod>${now}</lastmod>
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  return c.body(xml, 200, { "Content-Type": "application/xml; charset=utf-8" });
});
