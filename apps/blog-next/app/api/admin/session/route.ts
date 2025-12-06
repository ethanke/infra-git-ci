import { NextRequest, NextResponse } from "next/server"

const COOKIE_NAME = "admin_key"
const TWELVE_HOURS = 60 * 60 * 12

export async function POST(req: NextRequest) {
  const adminKey = process.env.ADMIN_API_KEY
  if (!adminKey) {
    return NextResponse.json({ error: "Admin key not configured" }, { status: 500 })
  }

  const { key } = await req.json().catch(() => ({}))
  if (!key || key !== adminKey) {
    return NextResponse.json({ error: "Invalid admin key" }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.cookies.set({
    name: COOKIE_NAME,
    value: adminKey,
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "lax",
    maxAge: TWELVE_HOURS
  })
  res.headers.set("Cache-Control", "no-store")
  return res
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true })
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    secure: true,
    path: "/",
    sameSite: "lax",
    maxAge: 0
  })
  res.headers.set("Cache-Control", "no-store")
  return res
}
