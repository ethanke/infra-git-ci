import { notFound } from "next/navigation"

import { CategoriesManager } from "@/components/admin/categories-manager"
import { AdminShell } from "@/components/admin/admin-shell"
import { supportedLocales, type SupportedLocale } from "@/config/site"

type PageProps = {
  params: Promise<{ locale: string }>
}

export default async function CategoriesPage({ params }: PageProps) {
  const { locale } = await params
  if (!supportedLocales.includes(locale as SupportedLocale)) {
    return notFound()
  }
  const currentLocale = locale as SupportedLocale
  return (
    <AdminShell locale={currentLocale}>
      <CategoriesManager locale={currentLocale} />
    </AdminShell>
  )
}
