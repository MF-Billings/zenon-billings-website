import type {
  ALL_ARTWORKS_QUERY_RESULT,
  LIFE_EVENTS_QUERY_RESULT,
  SITE_SETTINGS_QUERY_RESULT,
} from './sanity.types'

export type Artwork = ALL_ARTWORKS_QUERY_RESULT[number]
export type ArtworkTag = NonNullable<Artwork['tags']>[number]
export type SiteSettings = NonNullable<SITE_SETTINGS_QUERY_RESULT>
export type LifeEvent = LIFE_EVENTS_QUERY_RESULT[number]
