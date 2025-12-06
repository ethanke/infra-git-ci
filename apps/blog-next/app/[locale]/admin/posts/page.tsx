import { notFound } from "next/navigation"

import { PostsManager } from "@/components/admin/posts-manager"
import { AdminShell } from "@/components/admin/admin-shell"
import { supportedLocales, type SupportedLocale } from "@/config/site"

type PageProps = {
  params: Promise<{ locale: string }>
}

export default async function AdminPostsPage({ params }: PageProps) {
  const { locale } = await params
  if (!supportedLocales.includes(locale as SupportedLocale)) {
    return notFound()
  }
  const currentLocale = locale as SupportedLocale
  return (
    <AdminShell locale={currentLocale}>
      <PostsManager locale={currentLocale} />
    </AdminShell>
  )
}
