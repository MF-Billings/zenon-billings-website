/** A run of plain text, or a run that links somewhere. */
export type TextSegment = string | { text: string; href: string }

export type LinkDefinition = { _type: 'link'; _key: string; href: string }
export type Span = { _type: 'span'; _key: string; text: string; marks: string[] }
export type Paragraph = {
  _type: 'block'
  _key: string
  style: 'normal'
  markDefs: LinkDefinition[]
  children: Span[]
}

// Keys only need to be unique within their array, so positional keys are enough
// and keep re-runs of the seed stable.
export function toParagraph(segments: TextSegment[]): Paragraph {
  const markDefs: LinkDefinition[] = []
  const children = segments.map((segment, index): Span => {
    if (typeof segment === 'string') {
      return { _type: 'span', _key: `span-${index}`, text: segment, marks: [] }
    }
    const link: LinkDefinition = { _type: 'link', _key: `link-${index}`, href: segment.href }
    markDefs.push(link)
    return { _type: 'span', _key: `span-${index}`, text: segment.text, marks: [link._key] }
  })
  return { _type: 'block', _key: 'paragraph', style: 'normal', markDefs, children }
}
