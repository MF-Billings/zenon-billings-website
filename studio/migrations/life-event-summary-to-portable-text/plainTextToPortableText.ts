export type Paragraph = {
  _type: 'block'
  _key: string
  style: 'normal'
  markDefs: []
  children: [{_type: 'span'; _key: string; text: string; marks: []}]
}

// Keys only need to be unique within their array; a positional key is enough and
// keeps a re-run of the migration idempotent.
export function plainTextToPortableText(text: string): Paragraph[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line, index) => ({
      _type: 'block',
      _key: `paragraph-${index}`,
      style: 'normal',
      markDefs: [],
      children: [{_type: 'span', _key: `span-${index}`, text: line, marks: []}],
    }))
}
