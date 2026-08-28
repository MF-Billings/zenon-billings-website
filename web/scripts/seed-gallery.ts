import { createClient } from 'next-sanity'
import { assertSeedableDataset, toSeedArtwork, type MetObject, type SeedArtwork } from './metMuseum'

const MET_API = 'https://collectionapi.metmuseum.org/public/collection/v1'
const SEARCH_TERM = 'landscape'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'nlwxmhc1'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'development'
const apiVersion = '2026-08-24'
const token = process.env.SANITY_WRITE_TOKEN

type SeedClient = ReturnType<typeof createClient>

function parseArgs(argv: string[]) {
  const limitFlag = argv.indexOf('--limit')
  return {
    limit: limitFlag === -1 ? 20 : Number(argv[limitFlag + 1]),
    clear: argv.includes('--clear'),
  }
}

async function fetchCandidates(limit: number): Promise<MetObject[]> {
  const search = await fetch(`${MET_API}/search?hasImages=true&q=${SEARCH_TERM}`)
  const { objectIDs } = (await search.json()) as { objectIDs: number[] }

  const objects: MetObject[] = []
  for (const objectId of objectIDs) {
    if (objects.length >= limit) break
    const response = await fetch(`${MET_API}/objects/${objectId}`)
    if (response.ok) objects.push((await response.json()) as MetObject)
  }
  return objects
}

// Sanity's guidance is to let the Content Lake assign every _id. Re-runnability
// therefore comes from looking a document up before writing it, not from deriving
// a deterministic id from the slug or tag name.
async function resolveTagIds(client: SeedClient, names: string[]) {
  const wanted = [...new Set(names)]
  const existing: { _id: string; name: string }[] = await client.fetch(
    '*[_type == "tag" && name in $wanted]{ _id, name }',
    { wanted },
  )

  const idsByName = new Map(existing.map((tag) => [tag.name, tag._id]))

  for (const name of wanted) {
    if (idsByName.has(name)) continue
    const created = await client.create({
      _type: 'tag',
      name,
      slug: { _type: 'slug', current: name },
    })
    idsByName.set(name, created._id)
  }

  return idsByName
}

async function uploadArtwork(
  client: SeedClient,
  artwork: SeedArtwork,
  tagIds: Map<string, string>,
) {
  const image = await fetch(artwork.imageUrl)
  const asset = await client.assets.upload('image', Buffer.from(await image.arrayBuffer()), {
    filename: `${artwork.slug}.jpg`,
  })

  // Fields the Met is the source of truth for. Deliberately excludes isFeatured:
  // that is an editorial decision made in the Studio, and re-running the seed
  // must never reset the artist's curation.
  const sourceFields = {
    title: artwork.title,
    slug: { _type: 'slug', current: artwork.slug },
    description: artwork.description,
    medium: artwork.medium,
    altText: artwork.altText,
    yearCreated: artwork.yearCreated,
    image: { _type: 'image', asset: { _type: 'reference', _ref: asset._id } },
    tags: artwork.tagNames.map((name) => ({
      _type: 'reference',
      _key: name,
      _ref: tagIds.get(name),
    })),
  }

  const existingId: string | null = await client.fetch(
    '*[_type == "artwork" && slug.current == $slug][0]._id',
    { slug: artwork.slug },
  )

  if (existingId) {
    const patch = client.patch(existingId).set(sourceFields)
    await (
      artwork.dimensions
        ? patch.set({ dimensions: artwork.dimensions })
        : patch.unset(['dimensions'])
    ).commit()
    return
  }

  await client.create({
    _type: 'artwork',
    ...sourceFields,
    ...(artwork.dimensions ? { dimensions: artwork.dimensions } : {}),
    isFeatured: false,
  })
}

async function main() {
  assertSeedableDataset(dataset)
  if (!token) throw new Error('SANITY_WRITE_TOKEN is required. Add it to .env.local.')

  const { limit, clear } = parseArgs(process.argv)
  const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false })

  if (clear) {
    console.log(`Deleting all artwork and tags in "${dataset}"...`)
    await client.delete({ query: '*[_type in ["artwork", "tag"]]' })
  }

  const candidates = await fetchCandidates(limit * 2)
  const artworks = candidates
    .map(toSeedArtwork)
    .filter((artwork): artwork is SeedArtwork => artwork !== null)
    .slice(0, limit)

  const tagIds = await resolveTagIds(
    client,
    artworks.flatMap((artwork) => artwork.tagNames),
  )

  for (const artwork of artworks) {
    await uploadArtwork(client, artwork, tagIds)
    console.log(`Seeded: ${artwork.title}`)
  }
  console.log(`Done — ${artworks.length} artwork documents in "${dataset}".`)
}

main().catch((error: Error) => {
  console.error(error.message)
  process.exit(1)
})
