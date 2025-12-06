import { prisma } from '@/lib/db'
import { NextRequest, NextResponse } from 'next/server'

import { isAdminRequest } from '@/lib/admin-auth'

export async function GET() {
  const cats = await prisma.category.findMany({ include: { translations: true } })
  return NextResponse.json(cats)
}

export async function POST(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return new NextResponse('Unauthorized', { status: 401 })
  }
  const { slug, translations = [] } = await req.json()
  if (!slug) {
    return new NextResponse('Missing slug', { status: 400 })
  }

  const formattedTranslations = translations.map((t: any) => ({ locale: t.locale, name: t.name })).filter((t: any) => t.locale && t.name)

  const existing = await prisma.category.findUnique({
    where: { slug },
    select: { id: true, name: true }
  })

  let category

  if (existing) {
    category = await prisma.category.update({
      where: { id: existing.id },
      data: {
        name: formattedTranslations[0]?.name ?? existing.name,
        translations: {
          upsert: formattedTranslations.map((translation: any) => ({
            where: { categoryId_locale: { categoryId: existing.id, locale: translation.locale } },
            update: { name: translation.name },
            create: translation
          }))
        }
      },
      include: { translations: true }
    })
  } else {
    category = await prisma.category.create({
      data: {
        slug,
        name: formattedTranslations[0]?.name ?? slug,
        translations: {
          create: formattedTranslations
        }
      },
      include: { translations: true }
    })
  }

  return NextResponse.json(category)
}
