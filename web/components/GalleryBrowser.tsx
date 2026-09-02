'use client'

import { useMemo, useState } from 'react'
import ArtworkGrid from '@/components/ArtworkGrid'
import { collectTags, EMPTY_FILTER, filterArtworks } from '@/lib/gallery/filterArtworks'
import type { Artwork } from '@/lib/sanity/types'

export default function GalleryBrowser({ artworks }: { artworks: Artwork[] }) {
  const [filter, setFilter] = useState(EMPTY_FILTER)

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
                  className="visually-hidden"
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
    </>
  )
}
