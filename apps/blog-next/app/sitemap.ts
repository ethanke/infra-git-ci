import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

const locales = ['en','fr','es','zh','hi','ar','bn','pt']

export default async function sitemap() {
  const base = process.env.SITE_URL || 'https://blog.lum.tools'
  const posts = await prisma.post.findMany({
    where: { status: 'PUBLISHED' },
    select: {
      slug: true,
      locale: true,
      updatedAt: true
    }
  })

  const staticEntries = locales.flatMap(locale => ([
    { url: `${base}/${locale}`, lastModified: new Date() },
    { url: `${base}/${locale}/posts`, lastModified: new Date() },
    { url: `${base}/${locale}/categories`, lastModified: new Date() },
    { url: `${base}/${locale}/privacy`, lastModified: new Date() },
    { url: `${base}/${locale}/terms`, lastModified: new Date() }
  ]))

  const postEntries = posts.map((post: { slug: string; locale: string; updatedAt: Date }) => ({
    url: `${base}/${post.locale}/posts/${post.slug}`,
    lastModified: post.updatedAt
  }))

  return [
    { url: base, lastModified: new Date() },
    ...staticEntries,
    ...postEntries
  ]
}
