import Link from "next/link"
import { notFound } from "next/navigation"

import { EmptyState } from "@/components/empty-state"
import { FeaturedPost } from "@/components/featured-post"
import { PostCard } from "@/components/post-card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { marketingNav, supportedLocales, type SupportedLocale } from "@/config/site"
import { getTranslation } from "@/i18n/messages"
import { getCategories, getLatestPosts, getPinnedPost } from "@/lib/content"

type PageProps = {
  params: Promise<{ locale: string }>
}

export default async function Home({ params }: PageProps) {
  const { locale } = await params
  if (!supportedLocales.includes(locale as SupportedLocale)) {
    return notFound()
  }

  const currentLocale = locale as SupportedLocale
  const t = (key: any) => getTranslation(currentLocale, key)

  const [featured, latestPosts, categories] = await Promise.all([
    getPinnedPost(currentLocale),
    getLatestPosts(currentLocale, { take: 7 }),
    getCategories(currentLocale)
  ])

  if (!featured && latestPosts.length === 0) {
    return <EmptyState locale={currentLocale} />
  }

  const remainingPosts = latestPosts.filter((post) => post.slug !== featured?.slug)

  return (
    <div className="flex flex-col gap-16">
      {featured && <FeaturedPost locale={currentLocale} post={featured} />}

      <section className="space-y-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{t("posts.browseByCategory")}</h2>
            <p className="text-sm text-muted-foreground">{t("posts.browseByCategoryDescription")}</p>
          </div>
          <Link href={marketingNav[2].href(currentLocale)} className="text-sm font-medium text-muted-foreground hover:text-foreground">
            {t("posts.viewAllCategories")}
          </Link>
        </div>
        <div className="flex flex-wrap gap-3">
          {categories.slice(0, 8).map((category) => (
            <Link key={category.id} href={`/${currentLocale}/categories?slug=${category.slug}`} className="transition-transform hover:-translate-y-0.5">
              <Badge variant="muted" className="rounded-full px-4 py-2 text-xs uppercase tracking-wide hover:bg-primary/20 hover:text-primary">
                {category.name}
              </Badge>
            </Link>
          ))}
        </div>
      </section>

      <Separator className="border-border/50" />

      <section className="space-y-8">
        <div className="flex flex-col gap-3">
          <h2 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{t("posts.latestStories")}</h2>
          <p className="text-sm text-muted-foreground">{t("posts.latestStoriesDescription")}</p>
        </div>
        {remainingPosts.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
            {remainingPosts.map((post) => (
              <PostCard key={post.id} locale={currentLocale} post={post} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border border-dashed border-border/60 p-12 text-center text-sm text-muted-foreground">
            {t("posts.moreContentComing")}
          </div>
        )}
      </section>
    </div>
  )
}
