'use client'

import { useMemo, useRef, useState } from 'react'
import ArtworkGrid from '@/components/ArtworkGrid'
import BackToTopButton from '@/components/BackToTopButton'
import { collectTags, EMPTY_FILTER, filterArtworks } from '@/lib/gallery/filterArtworks'
import type { Artwork } from '@/lib/sanity/types'
import { useOutOfView } from '@/lib/viewport/useOutOfView'

export default function GalleryBrowser({ artworks }: { artworks: Artwork[] }) {
  const [filter, setFilter] = useState(EMPTY_FILTER)

  // The search field marks the top of the browsing experience: once it has
  // scrolled away, the visitor is deep enough in the grid to want a way back.
  const searchInput = useRef<HTMLInputElement>(null)
  const searchOutOfView = useOutOfView(searchInput)

  const tags = useMemo(() => collectTags(artworks), [artworks])
  const visible = useMemo(() => filterArtworks(artworks, filter), [artworks, filter])

  const toggleTag = (slug: string) =>
    setFilter((current) => ({
      ...current,
      tagSlugs: current.tagSlugs.includes(slug)
        ? current.tagSlugs.filter((selected) => selected !== slug)
        : [...current.tagSlugs, slug],
    }))

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

      <ArtworkGrid artworks={visible} emptyMessage="No artwork matches that search." />
      <BackToTopButton visible={searchOutOfView} />
    </>
  )
}
