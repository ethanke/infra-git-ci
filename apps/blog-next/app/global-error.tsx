"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getTranslation } from "@/i18n/messages"
import { supportedLocales, type SupportedLocale } from "@/config/site"

interface GlobalErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global application error:", error)
  }, [error])

  // Try to detect locale from URL or default to English
  const getCurrentLocale = (): SupportedLocale => {
    if (typeof window !== 'undefined') {
      const pathSegments = window.location.pathname.split('/').filter(Boolean)
      const firstSegment = pathSegments[0]
      if (supportedLocales.includes(firstSegment as SupportedLocale)) {
        return firstSegment as SupportedLocale
      }
    }
    return "en"
  }

  const currentLocale = getCurrentLocale()
  const t = (key: any) => getTranslation(currentLocale, key)

  return (
    <html lang={currentLocale}>
      <body className="min-h-screen bg-background text-foreground antialiased">
        <div className="flex min-h-screen flex-col gradient-bg">
          <div className="flex-1 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl mx-auto p-8 text-center border-border/40 bg-background/80 backdrop-blur-xl">
              <div className="space-y-6">
                {/* Error Icon */}
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center">
                      <svg 
                        className="w-12 h-12 text-red-500" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          strokeWidth={2} 
                          d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" 
                        />
                      </svg>
                    </div>
                    {/* Glow effect */}
                    <div className="absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br from-red-500/10 to-orange-500/10 blur-xl"></div>
                  </div>
                </div>

                {/* Error Content */}
                <div className="space-y-4">
                  <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    {t("error.somethingWentWrong")}
                  </h1>
                  <p className="text-lg text-muted-foreground max-w-md mx-auto">
                    {t("error.somethingWentWrongDescription")}
                  </p>
                  
                  {/* Error Details (only in development) */}
                  {process.env.NODE_ENV === 'development' && (
                    <details className="mt-6 p-4 bg-muted/30 rounded-lg border border-border/20 text-left">
                      <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground">
                        Error Details (Development)
                      </summary>
                      <pre className="mt-2 text-xs text-muted-foreground overflow-auto">
                        {error.message}
                        {error.stack && `\n\n${error.stack}`}
                      </pre>
                    </details>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    onClick={reset}
                    className="btn-primary"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    {t("error.tryAgain")}
                  </Button>
                  
                  <Button asChild variant="outline" className="btn-secondary">
                    <Link href={`/${currentLocale}`}>
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                      </svg>
                      {t("error.goHome")}
                    </Link>
                  </Button>
                </div>

                {/* Support Link */}
                <div className="pt-4 border-t border-border/20">
                  <p className="text-sm text-muted-foreground">
                    Still having issues?{" "}
                    <Link 
                      href="https://github.com/lum-tools" 
                      className="text-primary hover:text-primary/80 transition-colors"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {t("error.reportIssue")}
                    </Link>
                  </p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </body>
    </html>
  )
}