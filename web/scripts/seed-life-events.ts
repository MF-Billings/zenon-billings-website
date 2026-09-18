import { createClient } from 'next-sanity'
import { SAMPLE_LIFE_EVENTS, toLifeEventDocument } from './lifeEventSeed'
import { assertSeedableDataset } from './metMuseum'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'nlwxmhc1'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'development'
const apiVersion = '2026-08-24'
const token = process.env.SANITY_WRITE_TOKEN

type SeedClient = ReturnType<typeof createClient>

// The sample events have no photographs of their own; borrowing an image asset
// the gallery seed already uploaded shows the illustrated sheet without a
// second download. Events flagged withPicture simply go without one when the
// dataset has no artwork yet.
async function findBorrowableImageAsset(client: SeedClient): Promise<string | null> {
  return client.fetch('*[_type == "artwork" && defined(image.asset)][0].image.asset._ref')
}

async function main() {
  assertSeedableDataset(dataset)
  if (!token) throw new Error('SANITY_WRITE_TOKEN is required. Add it to .env.local.')

  const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false })

  if (process.argv.includes('--clear')) {
    console.log(`Deleting all life events in "${dataset}"...`)
    await client.delete({ query: '*[_type == "lifeEvent"]' })
  }

  const imageAssetId = await findBorrowableImageAsset(client)

  for (const sample of SAMPLE_LIFE_EVENTS) {
    const document = toLifeEventDocument(sample, imageAssetId)
    // Same re-run rule as the gallery seed: match on the human key, patch in place.
    const existingId: string | null = await client.fetch(
      '*[_type == "lifeEvent" && title == $title][0]._id',
      { title: sample.title },
    )
    if (existingId) {
      await client.createOrReplace({ ...document, _id: existingId })
    } else {
      await client.create(document)
    }
    console.log(`Seeded: ${sample.title}`)
  }
  console.log(`Done — ${SAMPLE_LIFE_EVENTS.length} life events in "${dataset}".`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
