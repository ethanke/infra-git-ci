import type { ReactNode } from "react"
import { notFound } from "next/navigation"

import { SiteHeader } from "@/components/site-header"
import { SiteFooter } from "@/components/site-footer"
import { supportedLocales, type SupportedLocale } from "@/config/site"
import { cn } from "@/lib/utils"
import { getCategories, getTags } from "@/lib/content"

type LocaleLayoutProps = {
  children: ReactNode
  params: Promise<{ locale: string }>
}

export default async function LocaleLayout({ children, params }: LocaleLayoutProps) {
  const { locale } = await params
  if (!supportedLocales.includes(locale as SupportedLocale)) {
    return notFound()
  }
  const currentLocale = locale as SupportedLocale

  // Fetch categories and tags for navigation with error handling
  let categories: Array<{ id: string; slug: string; name: string }> = []
  let tags: Array<{ id: string; slug: string; name: string }> = []
  
  try {
    const [categoriesResult, tagsResult] = await Promise.all([
      getCategories(currentLocale),
      getTags(currentLocale)
    ])
    categories = categoriesResult || []
    tags = tagsResult || []
  } catch (error) {
    console.error('Failed to load navigation data:', error)
    // Use empty arrays as fallback
    categories = []
    tags = []
  }

  return (
    <div className={cn("flex min-h-screen flex-col gradient-bg")}> 
      <SiteHeader locale={currentLocale} categories={categories} tags={tags} />
      <main className="flex-1">
        <section className="container py-12 lg:py-16">{children}</section>
      </main>
      <SiteFooter locale={currentLocale} />
    </div>
  )
}
