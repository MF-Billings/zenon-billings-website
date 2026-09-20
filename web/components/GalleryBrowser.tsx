'use client'

import { useMemo, useRef, useState } from 'react'
import ArtworkGrid from '@/components/ArtworkGrid'
import { artworkPath } from '@/lib/artwork/artworkPath'
import BackToTopButton from '@/components/BackToTopButton'
import { collectTags, EMPTY_FILTER, filterArtworks } from '@/lib/gallery/filterArtworks'
import { withTagSlugs } from '@/lib/gallery/filterQuery'
import type { Artwork } from '@/lib/sanity/types'
import { useOutOfView } from '@/lib/viewport/useOutOfView'

export type GalleryBrowserProps = {
  artworks: Artwork[]
  initialTagSlugs?: string[]
  onTagSlugsChange?: (tagSlugs: string[]) => void
}

const toggle = (slugs: string[], slug: string) =>
  slugs.includes(slug) ? slugs.filter((selected) => selected !== slug) : [...slugs, slug]

export default function GalleryBrowser({
  artworks,
  initialTagSlugs = [],
  onTagSlugsChange,
}: GalleryBrowserProps) {
  const [filter, setFilter] = useState({ ...EMPTY_FILTER, tagSlugs: initialTagSlugs })

  // The search field marks the top of the browsing experience: once it has
  // scrolled away, the visitor is deep enough in the grid to want a way back.
  const searchInput = useRef<HTMLInputElement>(null)
  const searchOutOfView = useOutOfView(searchInput)

  const tags = useMemo(() => collectTags(artworks), [artworks])
  const visible = useMemo(() => filterArtworks(artworks, filter), [artworks, filter])

  const toggleTag = (slug: string) => {
    const tagSlugs = toggle(filter.tagSlugs, slug)
    setFilter((current) => ({ ...current, tagSlugs }))
    onTagSlugsChange?.(tagSlugs)
  }

  return (
    <>
      <search className="gallery-filters">
        <label htmlFor="artwork-search" className="studio-label">
          Search artwork
        </label>
        <input
          ref={searchInput}
          id="artwork-search"
          type="search"
          className="field-ruled"
          placeholder="Title or tag"
          value={filter.searchTerm}
          onChange={(event) =>
            setFilter((current) => ({ ...current, searchTerm: event.target.value }))
          }
        />

        {tags.length > 0 && (
          <fieldset className="tag-filter">
            <legend className="studio-label">Filter by tag</legend>
            {tags.map((tag) => (
              <label key={tag.slug} className="tag-chip">
                <input
                  type="checkbox"
                  className="tag-chip__input"
                  checked={filter.tagSlugs.includes(tag.slug!)}
                  onChange={() => toggleTag(tag.slug!)}
                />
                {tag.name}
              </label>
            ))}
          </fieldset>
        )}

        <p role="status" className="studio-label result-count">
          Showing {visible.length} of {artworks.length}
        </p>
      </search>

      <ArtworkGrid
        artworks={visible}
        emptyMessage="No artwork matches that search."
        hrefFor={(artwork) => withTagSlugs(artworkPath(artwork.slug), filter.tagSlugs)}
      />
      <BackToTopButton visible={searchOutOfView} />
    </>
  )
}
