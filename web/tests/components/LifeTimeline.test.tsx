import { render, screen, within } from '@testing-library/react'
import LifeTimeline from '@/components/LifeTimeline'
import type { LifeEvent } from '@/lib/sanity/types'

const event = (overrides: Partial<LifeEvent> & { _id: string }): LifeEvent =>
  ({
    title: 'An event',
    date: '2003-01-01',
    datePrecision: 'year',
    endDate: null,
    summary: null,
    image: null,
    altText: null,
    ...overrides,
  }) as LifeEvent

const paragraph = (text: string): LifeEvent['summary'] => [
  {
    _type: 'block',
    _key: 'b1',
    style: 'normal',
    markDefs: [],
    children: [{ _type: 'span', _key: 's1', text, marks: [] }],
  },
]

const image = { _type: 'image', asset: { _ref: 'image-abc-1200x900-jpg', _type: 'reference' } }

describe('LifeTimeline', () => {
  it('renders nothing when there are no events, so a fresh dataset leaves the page untouched', () => {
    const { container } = render(<LifeTimeline events={[]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('introduces the section with a lowercase chrome heading', () => {
    render(<LifeTimeline events={[event({ _id: 'a' })]} />)
    const heading = screen.getByRole('heading', { level: 2, name: 'CV (up to 2012)' })
    expect(heading).toHaveClass('lowercase-chrome')
  })

  it('lists events in the order the query gave them', () => {
    render(
      <LifeTimeline
        events={[
          event({ _id: 'a', title: 'Born in Halifax', date: '1970-08-18', datePrecision: 'day' }),
          event({ _id: 'b', title: 'A first box of half-pans', date: '1988-01-01' }),
        ]}
      />,
    )
    const headings = screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)
    expect(headings).toEqual(['Born in Halifax', 'A first box of half-pans'])
  })

  it('shows the formatted date in a time element carrying the ISO value at its precision', () => {
    render(
      <LifeTimeline events={[event({ _id: 'a', date: '1992-09-01', datePrecision: 'month' })]} />,
    )
    const time = screen.getByText('September 1992')
    expect(time.tagName).toBe('TIME')
    expect(time).toHaveAttribute('datetime', '1992-09')
  })

  it('marks a range so the rail node can stretch, and writes the range into datetime', () => {
    const { container } = render(
      <LifeTimeline events={[event({ _id: 'a', date: '1997-01-01', endDate: '2001-01-01' })]} />,
    )
    expect(screen.getByText('1997–2001')).toHaveAttribute('datetime', '1997/2001')
    expect(container.querySelector('.life-timeline__entry--range')).not.toBeNull()
  })

  it('shares one date cell between events on the same date', () => {
    render(
      <LifeTimeline
        events={[
          event({ _id: 'a', title: 'First solo show' }),
          event({ _id: 'b', title: 'Joins a board' }),
        ]}
      />,
    )
    const entries = screen.getAllByRole('listitem')
    expect(entries).toHaveLength(1)
    expect(screen.getAllByText('2003')).toHaveLength(1)
    expect(within(entries[0]).getAllByRole('heading', { level: 3 })).toHaveLength(2)
  })

  it('renders the summary as a paragraph when there is one', () => {
    render(
      <LifeTimeline
        events={[event({ _id: 'a', summary: paragraph('Thirty-one watercolours.') })]}
      />,
    )
    expect(screen.getByText('Thirty-one watercolours.').tagName).toBe('P')
  })

  it('renders a linked span in the summary as a hyperlink', () => {
    const summary: LifeEvent['summary'] = [
      {
        _type: 'block',
        _key: 'b1',
        style: 'normal',
        markDefs: [{ _type: 'link', _key: 'l1', href: 'https://nscad.ca' }],
        children: [
          { _type: 'span', _key: 's1', text: 'Enrols at ', marks: [] },
          { _type: 'span', _key: 's2', text: 'NSCAD', marks: ['l1'] },
        ],
      },
    ]
    render(<LifeTimeline events={[event({ _id: 'a', summary })]} />)
    expect(screen.getByRole('link', { name: 'NSCAD' })).toHaveAttribute('href', 'https://nscad.ca')
  })

  it('renders the picture with its alt text and marks the sheet as illustrated', () => {
    const { container } = render(
      <LifeTimeline
        events={[
          event({ _id: 'a', image, altText: 'Installation view' } as Partial<LifeEvent> & {
            _id: string
          }),
        ]}
      />,
    )
    expect(screen.getByRole('img', { name: 'Installation view' })).toBeInTheDocument()
    expect(container.querySelector('.life-timeline__sheet--illustrated')).not.toBeNull()
  })

  it('renders no image element when the event has no picture', () => {
    render(<LifeTimeline events={[event({ _id: 'a' })]} />)
    expect(screen.queryByRole('img')).toBeNull()
  })
})
