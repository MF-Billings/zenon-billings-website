import { defineQuery } from 'next-sanity'

const ARTWORK_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  description,
  artistNote,
  medium,
  image,
  altText,
  dimensions { width, height, unit },
  yearCreated,
  isFeatured,
  price,
  "tags": tags[]->{ _id, name, "slug": slug.current, category }
`

export const ALL_ARTWORKS_QUERY = defineQuery(`
  *[_type == "artwork" && defined(slug.current)]
    | order(lower(title) asc) {${ARTWORK_FIELDS}}
`)

export const FEATURED_ARTWORKS_QUERY = defineQuery(`
  *[_type == "artwork" && isFeatured == true && defined(slug.current)]
    | order(coalesce(yearCreated, 0) desc, _createdAt desc)[0...6] {${ARTWORK_FIELDS}}
`)

export const ARTWORK_BY_SLUG_QUERY = defineQuery(`
  *[_type == "artwork" && slug.current == $slug][0] {${ARTWORK_FIELDS}}
`)

export const ARTWORK_SLUGS_QUERY = defineQuery(`
  *[_type == "artwork" && defined(slug.current)]{ "slug": slug.current }
`)

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_id == "siteSettings"][0] {
    artistName, tagline, bio, profileImage, publicContactAlias, priceCurrency
  }
`)
