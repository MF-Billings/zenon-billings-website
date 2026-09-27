import type { Metadata } from 'next'
import { Archivo, Inter } from 'next/font/google'
import PaperDefs from '@/components/PaperDefs'
import SiteHeader from '@/components/SiteHeader'
import SiteFooter from '@/components/SiteFooter'
import '@/styles/style.scss'

// The width axis is what makes the wordmark wide; without it Archivo loads at
// its default width and the display type loses its whole character.
const archivo = Archivo({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-display',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
  title: {
    default: 'Zenon Billings',
    template: '%s | Zenon Billings',
  },
  description: 'Watercolour, drawing, and photography by Zenon Billings.',
  openGraph: {
    type: 'website',
    siteName: 'Zenon Billings',
    locale: 'en_US',
  },
  twitter: { card: 'summary_large_image' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    // Pico ships an automatic dark theme; watercolour is a light-ground medium,
    // so the light scheme is pinned rather than following the OS.
    <html lang="en" data-theme="light" className={`${archivo.variable} ${inter.variable}`}>
      <body>
        <PaperDefs />
        <SiteHeader />
        <main className="container">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
