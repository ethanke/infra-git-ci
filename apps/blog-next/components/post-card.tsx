import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import type { SupportedLocale } from "@/config/site"
import { getTranslation } from "@/i18n/messages"

interface PostCardProps {
  locale: SupportedLocale
  post: {
    slug: string
    title: string
    summary?: string | null
    createdAt: Date
    categories: { name: string; slug: string }[]
  }
}

export function PostCard({ post, locale }: PostCardProps) {
  const formattedDate = new Intl.DateTimeFormat(locale, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(post.createdAt)

  const t = (key: any) => getTranslation(locale, key)

  return (
    <Card className="group h-full bg-card/80 transition-transform hover:-translate-y-1">
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span>{formattedDate}</span>
          {post.categories.map((category) => (
            <Badge key={category.slug} variant="muted" className="uppercase tracking-wide">
              {category.name}
            </Badge>
          ))}
        </div>
        <CardTitle className="text-2xl">
          <Link href={`/${locale}/posts/${post.slug}`} className="transition-colors hover:text-primary">
            {post.title}
          </Link>
        </CardTitle>
        {post.summary && <CardDescription className="text-base text-muted-foreground">{post.summary}</CardDescription>}
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {!post.summary && <p>{t("posts.discoverLatest")}</p>}
      </CardContent>
      <CardFooter>
        <Button asChild variant="ghost" className="btn-gradient">
          <Link href={`/${locale}/posts/${post.slug}`}>{t("posts.readStory")}</Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
