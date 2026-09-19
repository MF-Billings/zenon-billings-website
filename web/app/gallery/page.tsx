import type { Metadata } from 'next'
import GalleryBrowser from '@/components/GalleryBrowser'
import { client } from '@/lib/sanity/client'
import { ALL_ARTWORKS_QUERY } from '@/lib/sanity/queries'

export const metadata: Metadata = {
  title: 'Gallery',
  description: 'Browse watercolour, drawing, and photography by Zenon Billings.',
}

export default async function GalleryPage() {
  const artworks = await client.fetch(ALL_ARTWORKS_QUERY)

  return (
    <div className="page">
      <h1 className="lowercase-chrome">Gallery</h1>
      <GalleryBrowser artworks={artworks} />
    </div>
  )
}
