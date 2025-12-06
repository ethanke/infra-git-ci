import type { ReactNode } from "react"
import { Inter, JetBrains_Mono as JetBrainsMono } from "next/font/google"

import "./globals.css"
import "../styles/prism.css"

import { siteConfig, supportedLocales } from "@/config/site"
import { cn } from "@/lib/utils"
import { CopyCodeScript } from "@/components/copy-code-script"

const fontSans = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap", weight: ["400", "500", "600", "700"] })
const fontMono = JetBrainsMono({ subsets: ["latin"], variable: "--font-mono", display: "swap", weight: ["400", "500", "600"] })

export const metadata = {
  metadataBase: new URL("https://blog.lum.tools"),
  title: siteConfig.name,
  description: siteConfig.description,
  alternates: {
    canonical: "/",
    languages: Object.fromEntries(supportedLocales.map((locale) => [locale, `/${locale}`]))
  },
  openGraph: {
    title: siteConfig.name,
    description: siteConfig.description,
    url: "https://blog.lum.tools",
    siteName: siteConfig.name,
    type: "website",
    images: [
      {
        url: "/web-app-manifest-512x512.png",
        width: 512,
        height: 512,
        alt: "lum.tools Logo"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/web-app-manifest-512x512.png"]
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", sizes: "96x96", type: "image/png" }
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }
    ]
  },
  manifest: "/site.webmanifest"
}

export const viewport = {
  themeColor: "#FF8000"
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script defer src="https://umami.lum.tools/script.js" data-website-id="14c5d4a1-7fcf-4d6b-9056-f8f2589aa11c"></script>
      </head>
      <body className={cn("min-h-screen bg-background text-foreground antialiased", fontSans.variable, fontMono.variable)}>
        <CopyCodeScript />
        {children}
      </body>
    </html>
  )
}
