import { defineQuery } from 'next-sanity'

const ARTWORK_FIELDS = `
  _id,
  title,
  "slug": slug.current,
  description,
  artistNote,
  medium,
  image,
  "imageWidth": image.asset->metadata.dimensions.width,
  displayMaxWidth,
  altText,
  dimensions { width, height, unit },
  yearCreated,
  isFeatured,
  price,
  "tags": tags[]->{ _id, name, "slug": slug.current, category }
`

// The one place the gallery sequence is decided. Every query that walks artwork in
// display order must reuse it so prev/next on the detail page match the grid.
export const ARTWORK_ORDER = 'order(lower(title) asc)'

export const ALL_ARTWORKS_QUERY = defineQuery(`
  *[_type == "artwork" && defined(slug.current)]
    | ${ARTWORK_ORDER} {${ARTWORK_FIELDS}}
`)

export const FEATURED_ARTWORKS_QUERY = defineQuery(`
  *[_type == "artwork" && isFeatured == true && defined(slug.current)]
    | order(coalesce(yearCreated, 0) desc, _createdAt desc)[0...6] {${ARTWORK_FIELDS}}
`)

export const ARTWORK_NAVIGATION_QUERY = defineQuery(`
  *[_type == "artwork" && defined(slug.current)]
    | ${ARTWORK_ORDER} {
      title,
      "slug": slug.current,
      image,
      "imageWidth": image.asset->metadata.dimensions.width,
      "imageHeight": image.asset->metadata.dimensions.height,
      altText,
      displayMaxWidth,
      "tags": tags[]->{ name, "slug": slug.current }
    }
`)

export const ARTWORK_BY_SLUG_QUERY = defineQuery(`
  *[_type == "artwork" && slug.current == $slug][0] {${ARTWORK_FIELDS}}
`)

export const ARTWORK_SLUGS_QUERY = defineQuery(`
  *[_type == "artwork" && defined(slug.current)]{ "slug": slug.current }
`)

export const SITE_SETTINGS_QUERY = defineQuery(`
  *[_id == "siteSettings"][0] {
    artistName, tagline, bio, profileImage, priceCurrency,
    statementHeading, statement, statementImage, statementAttribution
  }
`)

// sortOrder only breaks ties between events on the same date, so it is used in
// the ordering and not projected; _createdAt is the last resort so the order is
// stable when the editor has not set one.
export const LIFE_EVENTS_QUERY = defineQuery(`
  *[_type == "lifeEvent" && defined(date)]
    | order(date asc, coalesce(sortOrder, 0) asc, _createdAt asc) {
    _id, title, date, datePrecision, endDate, summary, image, altText
  }
`)
