import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { SupportedLocale } from "@/config/site"
import { getTranslation } from "@/i18n/messages"

interface FeaturedPostProps {
  locale: SupportedLocale
  post: {
    slug: string
    title: string
    summary?: string | null
    createdAt: Date
    categories: { name: string; slug: string }[]
  }
}

export function FeaturedPost({ post, locale }: FeaturedPostProps) {
  const formattedDate = new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    year: "numeric"
  }).format(post.createdAt)

  const t = (key: any) => getTranslation(locale, key)

  return (
    <div className="relative overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-primary/15 via-background to-background/60 p-8 md:p-12">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_20%_20%,hsl(223_86%_25%)/.35,transparent_55%),radial-gradient(circle_at_80%_0%,hsl(280_80%_30%)/.25,transparent_50%)]" />
      <div className="flex flex-col gap-4 md:max-w-2xl">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
          <span className="rounded-full bg-primary/20 px-3 py-1 text-primary">{t("common.editorsPick")}</span>
          <span>{formattedDate}</span>
          {post.categories.map((category) => (
            <Link key={category.slug} href={`/${locale}/posts?category=${category.slug}`}>
              <Badge variant="secondary" className="uppercase tracking-wider hover:bg-primary/20 hover:text-primary cursor-pointer transition-colors">
                {category.name}
              </Badge>
            </Link>
          ))}
        </div>
        <h1 className="text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl md:text-5xl">
          {post.title}
        </h1>
        {post.summary && <p className="text-base text-muted-foreground md:text-lg">{post.summary}</p>}
        <div className="flex flex-wrap gap-3">
          <Button asChild size="lg" className="btn-gradient">
            <Link href={`/${locale}/posts/${post.slug}`}>{t("posts.readArticle")}</Link>
          </Button>
          <Button asChild variant="ghost">
            <Link href={`/${locale}/posts`}>{t("posts.browseAllPosts")}</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
