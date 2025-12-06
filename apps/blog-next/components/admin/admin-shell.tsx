"use client"

import type { ReactNode } from "react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useState } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import type { SupportedLocale } from "@/config/site"
import { cn } from "@/lib/utils"

const navItems = [
  { label: "Dashboard", segment: "", href: (locale: SupportedLocale) => `/${locale}/admin` },
  { label: "Posts", segment: "/posts", href: (locale: SupportedLocale) => `/${locale}/admin/posts` },
  { label: "Categories", segment: "/categories", href: (locale: SupportedLocale) => `/${locale}/admin/categories` },
  { label: "Tags", segment: "/tags", href: (locale: SupportedLocale) => `/${locale}/admin/tags` }
] as const

export function AdminShell({ children, locale }: { children: ReactNode; locale: SupportedLocale }) {
  const router = useRouter()
  const pathname = usePathname()
  const [loading, setLoading] = useState(false)

  async function logout() {
    setLoading(true)
    try {
      await fetch("/api/admin/session", {
        method: "DELETE",
        credentials: "same-origin"
      })
    } catch (error) {
      console.error("Failed to clear admin session", error)
    } finally {
      router.replace(`/${locale}/admin/login`)
      router.refresh()
    }
  }

  return (
    <div className="space-y-10">
      <section className="rounded-3xl border border-border/50 bg-card/70 p-6 shadow-[var(--shadow-sm)]">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-2">
            <Badge variant="muted" className="uppercase tracking-wider">Editorial control</Badge>
            <h1 className="text-3xl font-semibold tracking-tight text-foreground">Manage the lum.tools stories</h1>
            <p className="text-sm text-muted-foreground">
              Create new posts, update taxonomy and keep all locales in sync. Changes go live instantly.
            </p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="ghost">
              <Link href={`/${locale}`} className="flex items-center gap-2">
                ← View site
              </Link>
            </Button>
            <Button onClick={logout} variant="outline" disabled={loading}>
              {loading ? "Signing out…" : "Sign out"}
            </Button>
          </div>
        </div>
        <Separator className="my-6 border-border/60" />
        <nav className="flex flex-wrap gap-2">
          {navItems.map((item) => {
            const href = item.href(locale)
            const isActive = pathname === href || pathname?.startsWith(`${href}/`)
            return (
              <Button
                key={href}
                asChild
                variant={isActive ? "default" : "ghost"}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition",
                  isActive ? "bg-primary text-primary-foreground shadow-[var(--shadow-sm)]" : "hover:bg-muted/70"
                )}
              >
                <Link href={href}>{item.label}</Link>
              </Button>
            )
          })}
        </nav>
      </section>
      <div>{children}</div>
    </div>
  )
}
