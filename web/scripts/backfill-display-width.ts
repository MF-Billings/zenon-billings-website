import { createClient } from 'next-sanity'
import {
  BACKFILL_CANDIDATES_QUERY,
  planDisplayWidthBackfill,
  type BackfillCandidate,
} from './displayWidthBackfill'

const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID ?? 'nlwxmhc1'
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET ?? 'development'
const apiVersion = '2026-08-24'
const token = process.env.SANITY_WRITE_TOKEN

function parseArgs(argv: string[]) {
  return { dryRun: argv.includes('--dry-run') }
}

async function main() {
  if (!token) throw new Error('SANITY_WRITE_TOKEN is required. Add it to .env.local.')

  const { dryRun } = parseArgs(process.argv)
  const client = createClient({ projectId, dataset, apiVersion, token, useCdn: false })

  const candidates: BackfillCandidate[] = await client.fetch(BACKFILL_CANDIDATES_QUERY)
  const { patches, skipped } = planDisplayWidthBackfill(candidates)

  for (const { title, reason } of skipped) {
    console.log(`Skipped (${reason}): ${title ?? '(untitled)'}`)
  }

  if (patches.length === 0) {
    console.log(`Nothing to backfill in "${dataset}".`)
    return
  }

  const transaction = client.transaction()
  for (const { _id, title, displayMaxWidth } of patches) {
    console.log(`${dryRun ? 'Would set' : 'Set'} ${displayMaxWidth}px: ${title ?? '(untitled)'}`)
    transaction.patch(_id, (patch) => patch.set({ displayMaxWidth }))
  }

  if (dryRun) {
    console.log(`Dry run — ${patches.length} artwork documents would be patched in "${dataset}".`)
    return
  }

  await transaction.commit()
  console.log(`Done — ${patches.length} artwork documents patched in "${dataset}".`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
