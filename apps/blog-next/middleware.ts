import { NextRequest, NextResponse } from 'next/server'

const supportedLocales = ['en', 'fr', 'es', 'zh', 'hi', 'ar', 'bn', 'pt'] as const

// Protect admin routes. Prefer platform identity via PLATFORM_AUTH_URL, else fallback to ADMIN_API_KEY cookie.
export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const pathname = url.pathname
  
  // Handle root redirect to /en
  if (pathname === '/') {
    return NextResponse.redirect(new URL('/en', req.url))
  }
  
  const isAdmin = pathname.match(/^\/(en|fr|es|zh|hi|ar|bn|pt)\/admin(\/.*)?$/)
  if (!isAdmin) return NextResponse.next()

  const locale = isAdmin[1]
  const subPath = isAdmin[2] ?? ""
  const isLoginRoute = subPath.startsWith("/login")

  const platformAuth = process.env.PLATFORM_AUTH_URL
  const adminKey = process.env.ADMIN_API_KEY

  async function isAuthorised(): Promise<boolean> {
    if (platformAuth) {
      try {
        const res = await fetch(platformAuth, {
          headers: { cookie: req.headers.get('cookie') || '' },
          cache: 'no-store'
        })
        if (res.ok) return true
      } catch {
        // fall through to cookie fallback
      }
    }
    const cookie = req.cookies.get('admin_key')?.value
    if (adminKey && cookie && cookie === adminKey) {
      return true
    }
    return false
  }

  const authorised = await isAuthorised()

  if (isLoginRoute) {
    if (authorised) {
      return NextResponse.redirect(new URL(`/${locale}/admin`, req.url))
    }
    return NextResponse.next()
  }

  // Try platform identity
  if (authorised) {
    return NextResponse.next()
  }

  const redirect = new URL(`/${locale}/admin/login`, req.url)
  return NextResponse.redirect(redirect)
}

export const config = {
  matcher: [
    '/',
    '/en/admin/:path*',
    '/fr/admin/:path*',
    '/es/admin/:path*',
    '/zh/admin/:path*',
    '/hi/admin/:path*',
    '/ar/admin/:path*',
    '/bn/admin/:path*',
    '/pt/admin/:path*'
  ]
}
