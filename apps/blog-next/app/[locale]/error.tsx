'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, Home, ArrowLeft, RefreshCw, Bug } from 'lucide-react'
import { getTranslation } from '@/i18n/messages'
import { supportedLocales, type SupportedLocale } from '@/config/site'

interface ErrorProps {
  error: Error & { digest?: string }
  reset: () => void
  params: Promise<{ locale: string }>
}

export default function Error({ error, reset, params }: ErrorProps) {
  const [locale, setLocale] = useState<SupportedLocale>('en')
  
  useEffect(() => {
    params.then(({ locale: paramLocale }) => {
      setLocale(supportedLocales.includes(paramLocale as SupportedLocale) ? paramLocale as SupportedLocale : 'en')
    })
  }, [params])

  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Error:', error)
  }, [error])

  const t = (key: any) => getTranslation(locale, key)

  return (
    <div className="flex min-h-screen flex-col gradient-bg">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 backdrop-blur bg-background/60">
        <div className="container flex h-16 items-center justify-between gap-4">
          <Link href={`/${locale}`} className="flex items-center gap-2 text-sm font-semibold tracking-tight hover:opacity-80 transition-opacity">
            <img src="/logo.svg" alt="lum.tools" className="h-8 w-8" />
            <span>{t("site.name")}</span>
          </Link>
          <div className="flex items-center gap-2">
            <Button asChild className="hidden sm:inline-flex btn-gradient">
              <Link href={`/${locale}`}>{t("error.goHome")}</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        <section className="container py-12 lg:py-16">
          <div className="mx-auto max-w-2xl">
            <Card className="border-border/40 bg-card/50 backdrop-blur-xl">
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="h-8 w-8 text-destructive" />
                </div>
                <CardTitle className="text-2xl font-semibold tracking-tight">
                  {t("error.somethingWentWrong")}
                </CardTitle>
                <CardDescription className="text-base">
                  {t("error.somethingWentWrongDescription")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Error Details (only in development) */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="rounded-lg border border-border/40 bg-muted/30 p-4">
                    <h4 className="mb-2 text-sm font-semibold text-muted-foreground">Error Details</h4>
                    <pre className="text-xs text-muted-foreground overflow-auto">
                      {error.message}
                      {error.digest && `\nDigest: ${error.digest}`}
                    </pre>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
                  <Button onClick={reset} className="btn-gradient">
                    <RefreshCw className="mr-2 h-4 w-4" />
                    {t("error.tryAgain")}
                  </Button>
                  <Button asChild variant="outline">
                    <Link href={`/${locale}`}>
                      <Home className="mr-2 h-4 w-4" />
                      {t("error.goHome")}
                    </Link>
                  </Button>
                  <Button asChild variant="outline" onClick={() => window.history.back()}>
                    <Link href="#" onClick={(e) => { e.preventDefault(); window.history.back(); }}>
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      {t("error.goBack")}
                    </Link>
                  </Button>
                </div>

                {/* Support Link */}
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    Still having issues?{' '}
                    <Link 
                      href="https://github.com/lum-tools/blog/issues" 
                      className="text-primary hover:underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Bug className="mr-1 inline h-3 w-3" />
                      {t("error.reportIssue")}
                    </Link>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-border/40 bg-background/80 py-12">
        <div className="container flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <h2 className="text-lg font-semibold tracking-tight">{t("site.name")}</h2>
            <p className="max-w-xl text-sm text-muted-foreground">{t("site.description")}</p>
          </div>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <Link href="https://github.com/lum-tools" className="transition-colors hover:text-foreground flex items-center gap-2">
              <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
              </svg>
              <span>{t("common.github")}</span>
            </Link>
            <Link href="https://platform.lum.tools/" className="transition-colors hover:text-foreground flex items-center gap-2">
              <img src="/logo.svg" alt="lum.tools" className="h-4 w-4" />
              <span>{t("common.platform")}</span>
            </Link>
          </div>
        </div>
        <div className="container mt-8 flex flex-col gap-2 text-xs text-muted-foreground md:flex-row md:items-center md:justify-between">
          <p>© {new Date().getFullYear()} lum.tools. {t("common.allRightsReserved")}</p>
          <div className="flex gap-4">
            <Link href={`/${locale}/privacy`} className="hover:text-foreground">{t("common.privacy")}</Link>
            <Link href={`/${locale}/terms`} className="hover:text-foreground">{t("common.terms")}</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
