"use client"

import { usePathname, useRouter } from "next/navigation"
import { useMemo } from "react"

import { supportedLocales, type SupportedLocale } from "@/config/site"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"

interface LocaleSwitcherProps {
  locale: SupportedLocale
}

export function LocaleSwitcher({ locale }: LocaleSwitcherProps) {
  const router = useRouter()
  const pathname = usePathname()

  const restOfPath = useMemo(() => {
    if (!pathname) return ""
    const segments = pathname.split("/").filter(Boolean)
    if (segments.length === 0) return ""
    const [, ...rest] = segments
    return rest.join("/")
  }, [pathname])

  const navigate = (nextLocale: SupportedLocale) => {
    const trailing = restOfPath ? `/${restOfPath}` : ""
    router.push(`/${nextLocale}${trailing}`)
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2 rounded-full border border-border/50 bg-background/60">
          <span className="text-xs uppercase text-muted-foreground">{locale}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {supportedLocales.map((loc) => (
          <DropdownMenuItem key={loc} onSelect={() => navigate(loc)} className={loc === locale ? "bg-muted/60" : undefined}>
            <span className="text-xs uppercase tracking-wide">{loc}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
