export const TAGS_PARAM = 'tags'

type ReadableParams = Pick<URLSearchParams, 'get'> | null

export function parseTagSlugs(params: ReadableParams): string[] {
  const raw = params?.get(TAGS_PARAM)
  if (!raw) return []
  return raw.split(',').filter((slug) => slug.length > 0)
}

export function withTagSlugs(path: string, tagSlugs: string[]): string {
  if (tagSlugs.length === 0) return path
  const params = new URLSearchParams({ [TAGS_PARAM]: tagSlugs.join(',') })
  return `${path}?${params}`
}
