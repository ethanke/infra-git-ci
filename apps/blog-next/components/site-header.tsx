"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { marketingNav, siteConfig, type SupportedLocale } from "@/config/site"
import { getTranslation } from "@/i18n/messages"
import { cn } from "@/lib/utils"
import { useIsMobile, useWindowWidth } from "@/lib/use-window-width"
import { Button } from "@/components/ui/button"
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuTrigger
} from "@/components/ui/navigation-menu"
import { LocaleSwitcher } from "@/components/locale-switcher"

interface SiteHeaderProps {
  locale: SupportedLocale
  categories?: Array<{ id: string; slug: string; name: string }>
  tags?: Array<{ id: string; slug: string; name: string }>
}

export function SiteHeader({ locale, categories = [], tags = [] }: SiteHeaderProps) {
  const pathname = usePathname()
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const isMobile = useIsMobile()
  const width = useWindowWidth()
  const t = (key: any) => getTranslation(locale, key)

  const isActive = (href: string) => {
    if (href === `/${locale}`) {
      // Home is only active at exactly /{locale}
      return pathname === `/${locale}` || pathname === `/${locale}/`
    }
    // Other paths match if they start with the href
    return pathname?.startsWith(href)
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 backdrop-blur bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <Link href={`/${locale}`} className="flex items-center gap-2 text-sm font-semibold tracking-tight hover:opacity-80 transition-opacity">
          {width > 400 && <img src="/logo.svg" alt="lum.tools" className="h-8 w-8" />}
          <span className="hidden sm:inline">{t("site.name")}</span>
        </Link>
        <NavigationMenu className="hidden lg:flex">
          <>
            {/* Home */}
            <NavigationMenuItem>
              <NavigationMenuTrigger asChild>
                <Link 
                  href={marketingNav[0].href(locale)} 
                  className={cn(
                    "rounded-full px-3 py-1 text-muted-foreground", 
                    isActive(marketingNav[0].href(locale)) && "bg-primary/10 text-primary"
                  )}
                >
                  {t("navigation.home")}
                </Link>
              </NavigationMenuTrigger>
            </NavigationMenuItem>

            {/* Articles with Tags dropdown */}
            <NavigationMenuItem>
              <div 
                className="relative"
                onMouseEnter={() => setOpenDropdown('articles')}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link href={marketingNav[1].href(locale)}>
                  <NavigationMenuTrigger 
                    className={cn(
                      "rounded-full px-3 py-1 text-muted-foreground", 
                      isActive(marketingNav[1].href(locale)) && "bg-primary/10 text-primary"
                    )}
                  >
                    {t("navigation.articles")}
                  </NavigationMenuTrigger>
                </Link>
                <div className={cn(
                  "absolute left-0 top-full mt-2 w-[400px] rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl p-4 shadow-2xl transition-all duration-200 z-50",
                  openDropdown === 'articles' ? "opacity-100 visible" : "opacity-0 invisible"
                )}>
                  <div className="space-y-4">
                    <Link
                      href={marketingNav[1].href(locale)}
                      className="block rounded-lg border border-border/40 bg-card/50 p-3 hover:bg-card/80 hover:border-primary/60 transition-all"
                    >
                      <div className="text-sm font-medium">{t("navigation.allArticles")}</div>
                      <div className="text-xs text-muted-foreground mt-1">{t("navigation.browseAllPosts")}</div>
                    </Link>
                    {tags.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-3 px-2 uppercase tracking-wider">{t("navigation.filterByTag")}</div>
                        <div className="grid grid-cols-1 gap-1 max-h-64 overflow-y-auto">
                          {tags.slice(0, 10).map((tag) => (
                            <Link
                              key={tag.id}
                              href={`/${locale}/posts?tag=${tag.slug}`}
                              className="block rounded-lg px-3 py-2 text-sm hover:bg-primary/10 hover:text-primary transition-colors truncate"
                            >
                              #{tag.name}
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </NavigationMenuItem>

            {/* Categories dropdown */}
            <NavigationMenuItem>
              <div 
                className="relative"
                onMouseEnter={() => setOpenDropdown('categories')}
                onMouseLeave={() => setOpenDropdown(null)}
              >
                <Link href={marketingNav[2].href(locale)}>
                  <NavigationMenuTrigger 
                    className={cn(
                      "rounded-full px-3 py-1 text-muted-foreground", 
                      isActive(marketingNav[2].href(locale)) && "bg-primary/10 text-primary"
                    )}
                  >
                    {t("navigation.categories")}
                  </NavigationMenuTrigger>
                </Link>
                <div className={cn(
                  "absolute left-0 top-full mt-2 w-[400px] rounded-2xl border border-border/60 bg-background/95 backdrop-blur-xl p-4 shadow-2xl transition-all duration-200 z-50",
                  openDropdown === 'categories' ? "opacity-100 visible" : "opacity-0 invisible"
                )}>
                  <div className="space-y-4">
                    <Link
                      href={marketingNav[2].href(locale)}
                      className="block rounded-lg border border-border/40 bg-card/50 p-3 hover:bg-card/80 hover:border-primary/60 transition-all"
                    >
                      <div className="text-sm font-medium">{t("posts.allCategories")}</div>
                      <div className="text-xs text-muted-foreground mt-1">{t("categories.viewAllTopics")}</div>
                    </Link>
                    {categories.length > 0 && (
                      <div>
                        <div className="text-xs font-semibold text-muted-foreground mb-3 px-2 uppercase tracking-wider">{t("navigation.browseByTopic")}</div>
                        <div className="grid grid-cols-2 gap-2 max-h-80 overflow-y-auto">
                          {categories.map((category) => (
                            <Link
                              key={category.id}
                              href={`/${locale}/posts?category=${category.slug}`}
                              className="flex items-center rounded-lg px-3 py-2 text-sm hover:bg-primary/10 hover:text-primary transition-colors"
                            >
                              <span className="truncate">{category.name}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </NavigationMenuItem>
          </>
        </NavigationMenu>
        <nav className="flex gap-2 text-sm font-medium text-muted-foreground lg:hidden">
          <Link href={marketingNav[0].href(locale)} className={cn("rounded-full px-3 py-1", isActive(marketingNav[0].href(locale)) ? "bg-primary/10 text-primary" : "hover:text-foreground")}>{t("navigation.home")}</Link>
          <Link href={marketingNav[1].href(locale)} className={cn("rounded-full px-3 py-1", isActive(marketingNav[1].href(locale)) ? "bg-primary/10 text-primary" : "hover:text-foreground")}>{t("navigation.articles")}</Link>
          <Link href={marketingNav[2].href(locale)} className={cn("rounded-full px-3 py-1", isActive(marketingNav[2].href(locale)) ? "bg-primary/10 text-primary" : "hover:text-foreground")}>{t("navigation.categories")}</Link>
          <Link href={`/${locale}/subscribe`} className="rounded-full px-3 py-1 hover:text-foreground">{t("navigation.subscribe")}</Link>
        </nav>
        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <LocaleSwitcher locale={locale} />
          </div>
          {!isMobile && (
            <Button asChild className="btn-gradient">
              <Link href={`/${locale}/subscribe`}>{t("navigation.subscribe")}</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  )
}
