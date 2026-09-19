import {describe, expect, it} from 'vitest'
import {plainTextToPortableText} from '../../migrations/life-event-summary-to-portable-text/plainTextToPortableText'
import migration from '../../migrations/life-event-summary-to-portable-text'

describe('plainTextToPortableText', () => {
  it('wraps a line of text in one keyed normal block', () => {
    expect(plainTextToPortableText('Thirty-one watercolours.')).toEqual([
      {
        _type: 'block',
        _key: expect.any(String),
        style: 'normal',
        markDefs: [],
        children: [
          {_type: 'span', _key: expect.any(String), text: 'Thirty-one watercolours.', marks: []},
        ],
      },
    ])
  })

  it('turns each non-empty line into its own paragraph with distinct keys', () => {
    const blocks = plainTextToPortableText('First.\n\nSecond.\n')
    expect(blocks.map((block) => block.children[0].text)).toEqual(['First.', 'Second.'])
    expect(new Set(blocks.map((block) => block._key)).size).toBe(2)
  })
})

describe('life event summary migration', () => {
  const document = (summary: unknown) => ({_id: 'a', _type: 'lifeEvent', summary}) as never

  it('targets only life events', () => {
    expect(migration.documentTypes).toEqual(['lifeEvent'])
  })

  it('replaces a plain-text summary with Portable Text', () => {
    const patch = migration.migrate.document!(document('Words.'))
    expect(patch).toEqual({
      path: ['summary'],
      op: {type: 'set', value: plainTextToPortableText('Words.')},
    })
  })

  it('leaves summaries alone that are already rich text or missing', () => {
    expect(migration.migrate.document!(document(undefined))).toBeUndefined()
    expect(migration.migrate.document!(document([{_type: 'block'}]))).toBeUndefined()
  })
})
