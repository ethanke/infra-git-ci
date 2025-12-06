import { notFound } from "next/navigation"

import { PostCard } from "@/components/post-card"
import { EmptyState } from "@/components/empty-state"
import { marketingNav, supportedLocales, type SupportedLocale } from "@/config/site"
import { getTranslation } from "@/i18n/messages"
import { getLatestPosts, getCategoryBySlug, getTagBySlug } from "@/lib/content"

export const metadata = {
  title: "Articles | lum.tools Blog"
}

type PageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ category?: string; tag?: string }>
}

export default async function PostsIndex({ params, searchParams }: PageProps) {
  const { locale } = await params
  if (!supportedLocales.includes(locale as SupportedLocale)) {
    return notFound()
  }

  const { category, tag } = await searchParams
  const currentLocale = locale as SupportedLocale
  const t = (key: any) => getTranslation(currentLocale, key)
  
  const [posts, categoryData, tagData] = await Promise.all([
    getLatestPosts(currentLocale, {
      take: 24,
      categorySlug: category,
      tagSlug: tag
    }),
    category ? getCategoryBySlug(category, currentLocale) : null,
    tag ? getTagBySlug(tag, currentLocale) : null
  ])

  if (posts.length === 0) {
    return <EmptyState locale={currentLocale} />
  }

  const displayTitle = categoryData?.name || tagData?.name || t("posts.storiesAndUpdates")
  const showDescription = !category && !tag

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wider text-muted-foreground">{marketingNav[1].label}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {displayTitle}
        </h1>
        {showDescription && (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {t("posts.description")}
          </p>
        )}
      </header>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {posts.map((post) => (
          <PostCard key={post.id} post={post} locale={currentLocale} />
        ))}
      </div>
    </div>
  )
}
