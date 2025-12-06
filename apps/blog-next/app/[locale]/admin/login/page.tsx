import { notFound } from "next/navigation"

import { AdminLoginForm } from "@/components/admin/admin-login-form"
import { Badge } from "@/components/ui/badge"
import { supportedLocales, type SupportedLocale } from "@/config/site"

type PageProps = {
  params: Promise<{ locale: string }>
}

export const metadata = {
  title: "Admin login | lum.tools Blog"
}

export default async function AdminLoginPage({ params }: PageProps) {
  const { locale } = await params
  if (!supportedLocales.includes(locale as SupportedLocale)) {
    return notFound()
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8 py-16">
      <div className="space-y-3 text-center">
        <Badge variant="secondary" className="rounded-full px-4 py-1 text-xs uppercase tracking-wider">
          Secure workspace
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Sign in to the editorial console
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the platform-issued admin key to publish posts, manage categories and refresh translations.
        </p>
      </div>
      <AdminLoginForm locale={locale as SupportedLocale} />
    </div>
  )
}
