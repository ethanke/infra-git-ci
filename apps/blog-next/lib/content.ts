import { prisma } from "@/lib/db"
import type { SupportedLocale } from "@/config/site"

type PostSummary = {
  id: string
  slug: string
  title: string
  summary?: string | null
  createdAt: Date
  categories: { name: string; slug: string }[]
}

type LatestPostOptions = {
  take?: number
  categorySlug?: string
  tagSlug?: string
}

export async function getLatestPosts(
  locale: SupportedLocale,
  { take = 6, categorySlug, tagSlug }: LatestPostOptions = {}
): Promise<PostSummary[]> {
  try {
    const posts = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        locale,
        ...(categorySlug
          ? {
              categories: {
                some: {
                  category: {
                    slug: categorySlug
                  }
                }
              }
            }
          : {}),
        ...(tagSlug
          ? {
              tags: {
                some: {
                  tag: {
                    slug: tagSlug
                  }
                }
              }
            }
          : {})
      },
      include: {
        categories: {
          include: {
            category: {
              select: {
                slug: true,
                name: true,
                translations: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take
    })

    return posts.map((post) => {
      return {
        id: post.id,
        slug: post.slug,
        title: post.title,
        summary: post.summary,
        createdAt: post.createdAt,
        categories: post.categories.map(({ category }) => {
          const localized = category.translations.find((t) => t.locale === locale)
          return { slug: category.slug, name: localized?.name ?? category.name }
        })
      }
    })
  } catch (error) {
    console.error('[content] Failed to load latest posts', error)
    return []
  }
}

export async function getPinnedPost(locale: SupportedLocale): Promise<PostSummary | null> {
  try {
    const [post] = await prisma.post.findMany({
      where: {
        status: "PUBLISHED",
        locale
      },
      orderBy: { createdAt: "desc" },
      take: 1,
      include: {
        categories: {
          include: {
            category: {
              select: {
                slug: true,
                name: true,
                translations: true
              }
            }
          }
        }
      }
    })

    if (!post) return null

    return {
      id: post.id,
      slug: post.slug,
      title: post.title,
      summary: post.summary,
      createdAt: post.createdAt,
      categories: post.categories.map(({ category }) => {
        const localized = category.translations.find((t) => t.locale === locale)
        return { slug: category.slug, name: localized?.name ?? category.name }
      })
    }
  } catch (error) {
    console.error('[content] Failed to load pinned post', error)
    return null
  }
}

export async function getCategories(locale: SupportedLocale) {
  try {
    const categories = await prisma.category.findMany({
      include: { translations: true },
      orderBy: { name: "asc" }
    })

    return categories.map((category) => {
      const translation = category.translations.find((t) => t.locale === locale)
      return {
        id: category.id,
        slug: category.slug,
        name: translation?.name ?? category.name
      }
    })
  } catch (error) {
    console.error('[content] Failed to load categories', error)
    return []
  }
}

export async function getCategoryBySlug(slug: string, locale: SupportedLocale) {
  try {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: { translations: true }
    })

    if (!category) return null

    const translation = category.translations.find((t) => t.locale === locale)
    return {
      id: category.id,
      slug: category.slug,
      name: translation?.name ?? category.name
    }
  } catch (error) {
    console.error('[content] Failed to load category by slug', error)
    return null
  }
}

export async function getTags(locale: SupportedLocale) {
  try {
    const tags = await prisma.tag.findMany({
      include: { translations: true },
      orderBy: { name: "asc" }
    })

    return tags.map((tag) => {
      const translation = tag.translations.find((t) => t.locale === locale)
      return {
        id: tag.id,
        slug: tag.slug,
        name: translation?.name ?? tag.name
      }
    })
  } catch (error) {
    console.error('[content] Failed to load tags', error)
    return []
  }
}

export async function getTagBySlug(slug: string, locale: SupportedLocale) {
  try {
    const tag = await prisma.tag.findUnique({
      where: { slug },
      include: { translations: true }
    })

    if (!tag) return null

    const translation = tag.translations.find((t) => t.locale === locale)
    return {
      id: tag.id,
      slug: tag.slug,
      name: translation?.name ?? tag.name
    }
  } catch (error) {
    console.error('[content] Failed to load tag by slug', error)
    return null
  }
}
