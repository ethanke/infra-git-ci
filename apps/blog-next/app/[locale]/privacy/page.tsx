import { notFound } from "next/navigation"

import { supportedLocales, type SupportedLocale } from "@/config/site"

type PageProps = {
  params: Promise<{ locale: string }>
}

export default async function PrivacyPolicy({ params }: PageProps) {
  const { locale } = await params
  if (!supportedLocales.includes(locale as SupportedLocale)) {
    return notFound()
  }

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 text-sm leading-relaxed text-muted-foreground">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Privacy policy</h1>
      <p>
        We value privacy and transparency. This placeholder policy summarises how lum.tools processes minimal telemetry purely for product analytics and reliability monitoring. A full policy will be published before public launch.
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>Analytics are aggregated and never shared with third-parties.</li>
        <li>Customer data remains in-region within our managed infrastructure.</li>
        <li>Contact hello@lum.tools for deletion requests or compliance questions.</li>
      </ul>
      <p>
        Updated: {new Date().toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
      </p>
    </article>
  )
}
