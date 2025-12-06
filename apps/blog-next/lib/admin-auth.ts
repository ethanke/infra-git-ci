import { NextRequest } from 'next/server'

export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  const platformAuth = process.env.PLATFORM_AUTH_URL
  if (platformAuth) {
    try {
      const res = await fetch(platformAuth, {
        headers: {
          cookie: req.headers.get('cookie') ?? ''
        },
        cache: 'no-store'
      })
      if (res.ok) return true
    } catch {
      // fall through to cookie fallback
    }
  }

  const key = process.env.ADMIN_API_KEY
  const cookie = req.cookies.get('admin_key')?.value
  if (key && cookie && cookie === key) {
    return true
  }

  return false
}
