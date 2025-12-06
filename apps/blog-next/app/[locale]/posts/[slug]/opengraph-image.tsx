import { ImageResponse } from 'next/og'

export const runtime = 'nodejs'

export default async function Image({ params }: { params: { locale: string, slug: string }}) {
  const title = `lum.tools Blog`
  return new ImageResponse(
    (
      <div style={{ display: 'flex', background: '#0b0e14', color: 'white', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', fontSize: 64, padding: 40 }}>{title}</div>
    ),
    { width: 1200, height: 630 }
  )
}
