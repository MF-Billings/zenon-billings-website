import { render, screen } from '@testing-library/react'
import ArtworkTags from '@/components/ArtworkTags'

const tags = [
  { _id: 'a', name: 'boat', slug: 'boat' },
  { _id: 'b', name: 'nature', slug: 'nature' },
]

describe('ArtworkTags', () => {
  it('lists one item per tag', () => {
    render(<ArtworkTags tags={tags} />)
    const items = screen.getAllByRole('listitem')
    expect(items.map((item) => item.textContent)).toEqual(['boat', 'nature'])
  })

  it('renders nothing when there are no tags', () => {
    const { container } = render(<ArtworkTags tags={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('renders nothing when tags are unknown', () => {
    const { container } = render(<ArtworkTags tags={null} />)
    expect(container).toBeEmptyDOMElement()
  })
})
