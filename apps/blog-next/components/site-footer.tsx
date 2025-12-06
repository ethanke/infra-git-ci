"use client"

import Link from "next/link"

import { siteConfig, type SupportedLocale } from "@/config/site"
import { getTranslation } from "@/i18n/messages"
import { useIsMobile } from "@/lib/use-window-width"
import { Button } from "@/components/ui/button"
import { LocaleSwitcher } from "@/components/locale-switcher"
import { Separator } from "@/components/ui/separator"

interface SiteFooterProps {
  locale?: SupportedLocale
}

export function SiteFooter({ locale }: SiteFooterProps) {
  const policyPrefix = locale ? `/${locale}` : ""
  const isMobile = useIsMobile()
  const t = locale ? (key: any) => getTranslation(locale, key) : (key: string) => key
  return (
    <footer className="border-t border-border/40 bg-background/80 py-12">
      {/* Mobile-only language selector */}
      {isMobile && locale && (
        <div className="container mb-8">
          <div className="flex items-center justify-center">
            <LocaleSwitcher locale={locale} />
          </div>
        </div>
      )}
      
      <div className="container flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h2 className="text-lg font-semibold tracking-tight">{t("site.name")}</h2>
          <p className="max-w-xl text-sm text-muted-foreground">{t("site.description")}</p>
        </div>
        <div className="flex gap-6 text-sm text-muted-foreground">
          {/* <Link href={siteConfig.twitter} className="transition-colors hover:text-foreground">
            {t("common.twitter")}
          </Link> */}
          <Link href={siteConfig.github} className="transition-colors hover:text-foreground flex items-center gap-2">
            <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
            </svg>
            <span>{t("common.github")}</span>
          </Link>
          <Link href="https://platform.lum.tools/" className="transition-colors hover:text-foreground flex items-center gap-2">
            <img src="/logo.svg" alt="lum.tools" className="h-4 w-4" />
            <span>{t("common.platform")}</span>
          </Link>
          {/* <Link href="mailto:hello@lum.tools" className="transition-colors hover:text-foreground">
            {t("common.contact")}
          </Link> */}
        </div>
      </div>
      <Separator className="my-8" />
      <div className="container flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
        <p>© {new Date().getFullYear()} lum.tools. {t("common.allRightsReserved")}</p>
        <div className="flex gap-4">
          <Link href={`${policyPrefix}/privacy`} className="hover:text-foreground">
            {t("common.privacy")}
          </Link>
          <Link href={`${policyPrefix}/terms`} className="hover:text-foreground">
            {t("common.terms")}
          </Link>
        </div>
      </div>
    </footer>
  )
}
