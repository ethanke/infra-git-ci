export const supportedLocales = ["en", "fr", "es", "zh", "hi", "ar", "bn", "pt"] as const
export type SupportedLocale = (typeof supportedLocales)[number]

export const siteConfig = {
  name: "lum.tools Blog",
  description: "Insights, research and updates from the lum.tools platform.",
  twitter: "https://twitter.com/lumtools",
  github: "https://github.com/lum-tools"
}

export const marketingNav = [
  { label: "Home", href: (locale: SupportedLocale) => `/${locale}` },
  { label: "Articles", href: (locale: SupportedLocale) => `/${locale}/posts` },
  { label: "Categories", href: (locale: SupportedLocale) => `/${locale}/categories` }
]
