import { notFound } from "next/navigation"

import { supportedLocales, type SupportedLocale } from "@/config/site"

type PageProps = {
  params: Promise<{ locale: string }>
}

export default async function TermsOfUse({ params }: PageProps) {
  const { locale } = await params
  if (!supportedLocales.includes(locale as SupportedLocale)) {
    return notFound()
  }

  return (
    <article className="mx-auto flex max-w-3xl flex-col gap-6 text-sm leading-relaxed text-muted-foreground">
      <h1 className="text-3xl font-semibold tracking-tight text-foreground">Terms of service</h1>
      <p>
        The lum.tools platform is currently in active development. By accessing the blog and related admin tools you agree to use them responsibly, keep credentials private, and avoid uploading sensitive data until the final policies are published.
      </p>
      <ul className="list-disc space-y-2 pl-6">
        <li>Content published via the admin portal is immediately public.</li>
        <li>Do not distribute platform secrets or confidential roadmaps.</li>
        <li>Reach out to the lum.tools core team for product support.</li>
      </ul>
      <p>
        Updated: {new Date().toLocaleDateString(locale, { year: "numeric", month: "long", day: "numeric" })}
      </p>
    </article>
  )
}
