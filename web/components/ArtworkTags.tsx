import type { ArtworkTag } from '@/lib/sanity/types'

type ArtworkTagsProps = {
  tags: Pick<ArtworkTag, '_id' | 'name'>[] | null | undefined
}

// One list item per tag, never a run of adjacent inline elements: with no
// whitespace between them the browser treats the whole row as a single
// unbreakable word, and on a phone it widened the entire artwork column.
export default function ArtworkTags({ tags }: ArtworkTagsProps) {
  if (!tags || tags.length === 0) return null

  return (
    // Kept deliberately so list semantics don't depend on the marker styling
    <ul className="artwork-tags" role="list">
      {tags.map((tag) => (
        <li key={tag._id}>
          <mark>{tag.name}</mark>
        </li>
      ))}
    </ul>
  )
}
