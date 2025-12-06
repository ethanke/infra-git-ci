import { notFound } from "next/navigation"
import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import { marketingNav, supportedLocales, type SupportedLocale } from "@/config/site"
import { getTranslation } from "@/i18n/messages"
import { getCategories } from "@/lib/content"

type PageProps = {
  params: Promise<{ locale: string }>
  searchParams: Promise<{ slug?: string }>
}

export default async function CategoriesPage({ params, searchParams }: PageProps) {
  const { locale } = await params
  if (!supportedLocales.includes(locale as SupportedLocale)) {
    return notFound()
  }

  const currentLocale = locale as SupportedLocale
  const t = (key: any) => getTranslation(currentLocale, key)
  const categories = await getCategories(currentLocale)
  const { slug } = await searchParams
  const activeSlug = slug

  return (
    <div className="space-y-10">
      <header className="space-y-3">
        <p className="text-sm uppercase tracking-wider text-muted-foreground">{marketingNav[2].label}</p>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{t("categories.exploreByTopic")}</h1>
        <p className="max-w-2xl text-sm text-muted-foreground">
          {t("categories.exploreDescription")}
        </p>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {categories.map((category) => {
          const href = `/${currentLocale}/posts?category=${category.slug}`
          const isActive = activeSlug === category.slug
          return (
            <Link
              key={category.id}
              href={href}
              className="group flex flex-col gap-3 rounded-2xl border border-border/60 bg-card/60 p-6 shadow-sm transition-colors hover:border-primary/60"
            >
              <div className="flex items-center gap-3">
                <Badge variant={isActive ? "default" : "muted"} className="uppercase tracking-wide">
                  {category.name}
                </Badge>
                {isActive && <span className="text-xs text-primary">{t("categories.following")}</span>}
              </div>
              <p className="text-sm text-muted-foreground">
                {t("categories.inDepthCoverage").replace('{category}', category.name.toLowerCase())}
              </p>
            </Link>
          )
        })}
      </div>
    </div>
  )
}
