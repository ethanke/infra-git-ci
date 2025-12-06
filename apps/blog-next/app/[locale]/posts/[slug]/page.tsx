import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { supportedLocales, type SupportedLocale } from "@/config/site"
import { getTranslation } from "@/i18n/messages"
import { prisma } from "@/lib/db"
import { markdownToHtml, isMarkdown } from "@/lib/markdown"

async function loadPost(locale: string, slug: string) {
  return prisma.post.findUnique({
    where: { 
      slug_locale: {
        slug,
        locale
      }
    },
    include: {
      categories: {
        include: {
          category: {
            include: { translations: true }
          }
        }
      },
      tags: {
        include: {
          tag: {
            include: { translations: true }
          }
        }
      }
    }
  })
}

async function getRelatedPosts(currentPostId: string, locale: string, limit = 4) {
  const currentPost = await prisma.post.findUnique({
    where: { id: currentPostId },
    include: { 
      categories: true,
      tags: true
    }
  })
  
  if (!currentPost) return []
  
  // Get all posts in the same language
  const allPosts = await prisma.post.findMany({
    where: {
      status: "PUBLISHED",
      locale,
      id: { not: currentPostId }
    },
    include: {
      categories: {
        include: {
          category: {
            select: { slug: true, name: true, translations: true }
          }
        }
      },
      tags: {
        include: {
          tag: {
            include: { translations: true }
          }
        }
      }
    }
  })
  
  // Simple semantic similarity based on title similarity and shared categories/tags
  const postsWithScore = allPosts.map((post: any) => {
    // Count shared categories
    const sharedCategories = currentPost.categories.filter((cp: any) =>
      post.categories.some((c: any) => c.categoryId === cp.categoryId)
    ).length
    
    // Count shared tags
    const sharedTags = currentPost.tags.filter((tp: any) =>
      post.tags.some((t: any) => t.tagId === tp.tagId)
    ).length
    
    // Simple title similarity (common words)
    const currentWords = currentPost.title.toLowerCase().split(/\s+/)
    const postWords = post.title.toLowerCase().split(/\s+/)
    const commonWords = currentWords.filter((w: string) => postWords.includes(w)).length
    const titleSimilarity = commonWords / Math.max(currentWords.length, postWords.length, 1)
    
    // Calculate score (categories worth more, tags moderate, title similarity moderate)
    const score = (sharedCategories * 3) + (sharedTags * 2) + (titleSimilarity * 5)
    
    return { post, score }
  })
  
  // Sort by score and return top N
  return postsWithScore
    .sort((a: any, b: any) => b.score - a.score)
    .slice(0, limit)
    .map((p: any) => ({
      id: p.post.id,
      slug: p.post.slug,
      title: p.post.title,
      summary: p.post.summary,
      categories: p.post.categories.map(({ category }: any) => {
        const localized = category.translations.find((t: any) => t.locale === locale)
        return { slug: category.slug, name: localized?.name ?? category.name }
      })
    }))
}

type PageParams = Promise<{ locale: string; slug: string }>

export async function generateMetadata({ params }: { params: PageParams }): Promise<Metadata> {
  const { locale, slug } = await params
  const post = await loadPost(locale, slug)
  if (!post) return {}

  return {
    title: post.title,
    description: post.summary ?? post.content.slice(0, 150)
  }
}

export default async function PostPage({ params }: { params: PageParams }) {
  const { locale, slug } = await params
  if (!supportedLocales.includes(locale as SupportedLocale)) {
    return notFound()
  }

  const post = await loadPost(locale, slug)

  if (!post || post.status !== "PUBLISHED") {
    return notFound()
  }

  const formattedDate = new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(post.createdAt)

  const relatedPosts = await getRelatedPosts(post.id, locale, 3)
  const currentLocale = locale as SupportedLocale
  const t = (key: any) => getTranslation(currentLocale, key)

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6">
      <div className="space-y-3">
        <Link href={`/${locale}/posts`} className="text-xs uppercase tracking-wider text-muted-foreground hover:text-primary">
          {t("posts.backToAllPosts")}
        </Link>
        <p className="text-xs uppercase tracking-wide text-muted-foreground">
          {formattedDate}
        </p>
        <h1 className="text-4xl font-semibold tracking-tight text-foreground md:text-5xl">{post.title}</h1>
        {post.summary && <p className="text-base text-muted-foreground">{post.summary}</p>}
        
        {/* Categories and Tags */}
        <div className="flex flex-wrap items-center gap-2">
          {post.categories.map(({ category }: any) => {
            const localized = category.translations.find((t: any) => t.locale === locale)
            return (
              <Link key={category.slug} href={`/${locale}/posts?category=${category.slug}`}>
                <Badge variant="muted" className="uppercase tracking-wide hover:bg-primary/20 hover:text-primary cursor-pointer transition-colors">
                  {localized?.name ?? category.name}
                </Badge>
              </Link>
            )
          })}
          {post.tags && post.tags.length > 0 && (
            <>
              {post.tags.map(({ tag }: any) => {
                const localized = tag.translations.find((t: any) => t.locale === locale)
                return (
                  <Link key={tag.slug} href={`/${locale}/posts?tag=${tag.slug}`}>
                    <Badge variant="secondary" className="uppercase tracking-wide hover:bg-primary/20 hover:text-primary cursor-pointer transition-colors">
                      #{localized?.name ?? tag.name}
                    </Badge>
                  </Link>
                )
              })}
            </>
          )}
        </div>
      </div>

      <div className="prose prose-invert max-w-none">
        <div 
          dangerouslySetInnerHTML={{ 
            __html: isMarkdown(post.content) 
              ? markdownToHtml(post.content) 
              : post.content 
          }} 
        />
      </div>

      {/* Related Posts */}
      {relatedPosts.length > 0 && (
        <div className="space-y-4 border-t border-border/60 pt-8">
          <h2 className="text-2xl font-semibold tracking-tight">{t("posts.relatedArticles")}</h2>
          <div className="grid gap-4">
            {relatedPosts.map((relatedPost: any) => (
              <Link key={relatedPost.slug} href={`/${locale}/posts/${relatedPost.slug}`} className="group block rounded-lg border border-border/60 bg-card/60 p-4 transition-all hover:border-primary/60 hover:bg-card/80">
                <h3 className="text-lg font-semibold group-hover:text-primary transition-colors">{relatedPost.title}</h3>
                {relatedPost.summary && <p className="text-sm text-muted-foreground mt-1">{relatedPost.summary}</p>}
                {relatedPost.categories && relatedPost.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {relatedPost.categories.map((cat: any) => (
                      <Badge key={cat.slug} variant="muted" className="text-xs">
                        {cat.name}
                      </Badge>
                    ))}
                  </div>
                )}
              </Link>
            ))}
          </div>
        </div>
      )}
    </article>
  )
}
