import { Button } from "@/components/ui/button"
import type { SupportedLocale } from "@/config/site"
import { getTranslation } from "@/i18n/messages"
import Link from "next/link"

export function EmptyState({ locale }: { locale: SupportedLocale }) {
  const t = (key: any) => getTranslation(locale, key)
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-3xl border border-dashed border-border/60 bg-background/40 p-12 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold">{t("empty.noArticles")}</h2>
        <p className="max-w-md text-sm text-muted-foreground">
          {t("empty.description")}
        </p>
      </div>
      <Button asChild>
        <Link href={`/${locale}/admin`}>{t("empty.createFirstPost")}</Link>
      </Button>
    </div>
  )
}
