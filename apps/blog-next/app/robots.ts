export default function robots() {
  const host = process.env.SITE_URL || 'https://blog.lum.tools'
  return {
    rules: [{ userAgent: '*', allow: '/' }],
    sitemap: `${host}/sitemap.xml`,
    host
  }
}
