import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { getTranslation } from "@/i18n/messages"
import type { SupportedLocale } from "@/config/site"

interface ErrorPageProps {
  locale: SupportedLocale
  type: "404" | "500" | "error"
  title?: string
  description?: string
  showRetry?: boolean
  onRetry?: () => void
  customActions?: React.ReactNode
}

export function ErrorPage({
  locale,
  type,
  title,
  description,
  showRetry = false,
  onRetry,
  customActions
}: ErrorPageProps) {
  const t = (key: any) => getTranslation(locale, key)

  const getErrorConfig = () => {
    switch (type) {
      case "404":
        return {
          icon: (
            <svg className="w-12 h-12 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.009-5.824-2.709M15 6.291A7.962 7.962 0 0012 5c-2.34 0-4.29 1.009-5.824 2.709" />
            </svg>
          ),
          bgGradient: "from-primary/20 to-accent/20",
          glowGradient: "from-primary/10 to-accent/10",
          code: "404",
          defaultTitle: t("error.pageNotFound"),
          defaultDescription: t("error.pageNotFoundDescription"),
          primaryAction: {
            href: `/${locale}`,
            label: t("error.goHome"),
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )
          },
          secondaryAction: {
            href: `/${locale}/posts`,
            label: t("navigation.allArticles"),
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            )
          }
        }
      case "500":
      case "error":
      default:
        return {
          icon: (
            <svg className="w-12 h-12 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          ),
          bgGradient: "from-red-500/20 to-orange-500/20",
          glowGradient: "from-red-500/10 to-orange-500/10",
          code: "500",
          defaultTitle: t("error.somethingWentWrong"),
          defaultDescription: t("error.somethingWentWrongDescription"),
          primaryAction: {
            href: `/${locale}`,
            label: t("error.goHome"),
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            )
          },
          secondaryAction: showRetry ? {
            onClick: onRetry,
            label: t("error.tryAgain"),
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            )
          } : {
            href: `/${locale}/posts`,
            label: t("navigation.allArticles"),
            icon: (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
              </svg>
            )
          }
        }
    }
  }

  const config = getErrorConfig()

  return (
    <div className="flex min-h-screen flex-col gradient-bg">
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl mx-auto p-8 text-center border-border/40 bg-background/80 backdrop-blur-xl">
          <div className="space-y-6">
            {/* Error Icon */}
            <div className="flex justify-center">
              <div className="relative">
                <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${config.bgGradient} flex items-center justify-center`}>
                  {config.icon}
                </div>
                {/* Glow effect */}
                <div className={`absolute inset-0 w-24 h-24 rounded-full bg-gradient-to-br ${config.glowGradient} blur-xl`}></div>
              </div>
            </div>

            {/* Error Content */}
            <div className="space-y-4">
              {type === "404" && (
                <div className="space-y-2">
                  <h1 className="text-6xl font-bold tracking-tight lum-gradient-text">
                    {config.code}
                  </h1>
                  <h2 className="text-2xl font-semibold text-foreground">
                    {title || config.defaultTitle}
                  </h2>
                </div>
              )}
              
              {type !== "404" && (
                <h1 className="text-3xl font-bold tracking-tight text-foreground">
                  {title || config.defaultTitle}
                </h1>
              )}
              
              <p className="text-lg text-muted-foreground max-w-md mx-auto">
                {description || config.defaultDescription}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild className="btn-primary">
                <Link href={config.primaryAction.href}>
                  {config.primaryAction.icon}
                  <span className="ml-2">{config.primaryAction.label}</span>
                </Link>
              </Button>
              
              {config.secondaryAction && (
                <Button 
                  asChild={!!config.secondaryAction.href}
                  variant="outline" 
                  className="btn-secondary"
                  onClick={config.secondaryAction.onClick}
                >
                  {config.secondaryAction.href ? (
                    <Link href={config.secondaryAction.href}>
                      {config.secondaryAction.icon}
                      <span className="ml-2">{config.secondaryAction.label}</span>
                    </Link>
                  ) : (
                    <>
                      {config.secondaryAction.icon}
                      <span className="ml-2">{config.secondaryAction.label}</span>
                    </>
                  )}
                </Button>
              )}

              {customActions}
            </div>

            {/* Quick Links for 404 */}
            {type === "404" && (
              <div className="pt-6 border-t border-border/20">
                <p className="text-sm text-muted-foreground mb-4">
                  Looking for something specific?
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Link 
                    href={`/${locale}/posts`} 
                    className="text-sm text-primary hover:text-primary/80 transition-colors px-3 py-1 rounded-full bg-primary/5 hover:bg-primary/10"
                  >
                    {t("navigation.allArticles")}
                  </Link>
                  <Link 
                    href={`/${locale}/categories`} 
                    className="text-sm text-primary hover:text-primary/80 transition-colors px-3 py-1 rounded-full bg-primary/5 hover:bg-primary/10"
                  >
                    {t("navigation.categories")}
                  </Link>
                  <Link 
                    href="https://platform.lum.tools/" 
                    className="text-sm text-primary hover:text-primary/80 transition-colors px-3 py-1 rounded-full bg-primary/5 hover:bg-primary/10"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("common.platform")}
                  </Link>
                </div>
              </div>
            )}

            {/* Support Link for errors */}
            {type !== "404" && (
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
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
