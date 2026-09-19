import type { DatePrecision } from '@/lib/timeline/formatEventDate'
import { toParagraph, type Paragraph, type TextSegment } from '@/scripts/portableTextParagraph'

export type SampleLifeEvent = {
  title: string
  date: string
  datePrecision: DatePrecision
  endDate?: string
  summary?: TextSegment[]
  sortOrder?: number
  /** Seeding only: attach an image asset already in the dataset, if one exists. */
  withPicture?: boolean
  altText?: string
}

// Fictional sample biography for the development dataset. Chosen to exercise
// every shape the timeline handles: all three precisions, several multi-year
// ranges (two of them overlapping), years that hold more than one event, and
// events that share an identical date.
export const SAMPLE_LIFE_EVENTS: SampleLifeEvent[] = [
  {
    title: 'Born in Halifax',
    date: '1970-08-18',
    datePrecision: 'day',
    summary: [
      'The youngest of three, raised within earshot of the harbour foghorns that would later turn up as titles in the first watercolour series.',
    ],
    withPicture: true,
    altText: 'A family photograph from the early 1970s',
  },
  {
    title: 'A first box of half-pans',
    date: '1988-01-01',
    datePrecision: 'year',
    summary: [
      'A twelve-colour Winsor & Newton tin, a gift from a grandmother who painted. The indigo pan ran out first and has stayed the backbone of the palette since.',
    ],
  },
  {
    title: 'Foundation year at NSCAD',
    date: '1992-09-01',
    datePrecision: 'month',
    summary: [
      'Enrols at the ',
      { text: 'Nova Scotia College of Art and Design', href: 'https://nscad.ca' },
      '. Drawing from life every morning; the habit never stopped.',
    ],
  },
  {
    title: 'Graduates, BFA in Drawing',
    date: '1996-05-01',
    datePrecision: 'month',
    summary: ['Thesis show of harbour studies in graphite and wash.'],
  },
  {
    title: 'Teaches drawing at NSCAD',
    date: '1997-01-01',
    datePrecision: 'year',
    endDate: '2001-01-01',
    summary: [
      'Part-time, foundation year. Four autumns of first-morning life drawing classes, and a studio practice fitted around them.',
    ],
  },
  {
    title: 'Shares a studio on Agricola Street',
    date: '1999-01-01',
    datePrecision: 'year',
    endDate: '2004-01-01',
    summary: [
      'A cold-water loft split with two printmakers. The first large sheets were painted here, on the floor.',
    ],
  },
  {
    title: 'First solo exhibition, Tide Tables',
    date: '2003-01-01',
    datePrecision: 'year',
    sortOrder: 0,
    summary: [
      'Thirty-one small watercolours, one for each day of a single October, hung in the order they were painted at the Anna Leonowens Gallery.',
    ],
    withPicture: true,
    altText: 'Installation view of small framed watercolours in a row',
  },
  {
    title: 'Joins the board of Visual Arts Nova Scotia',
    date: '2003-01-01',
    datePrecision: 'year',
    sortOrder: 1,
    summary: [
      'Three years on the exhibitions committee, mostly arguing for more wall space for works on paper.',
    ],
  },
  {
    title: 'Tide Tables tours Atlantic Canada',
    date: '2008-01-01',
    datePrecision: 'year',
    endDate: '2012-01-01',
    summary: ['The series travels to five public galleries across the region.'],
  },
  {
    title: 'Moves the studio to Lunenburg',
    date: '2011-10-04',
    datePrecision: 'day',
    summary: [
      'A former sail loft over the water. North light, a tide clock on the wall, and the subject matter arriving at the window twice a day.',
    ],
  },
  {
    title: 'Begins the tide-clock drawings',
    date: '2011-01-01',
    datePrecision: 'year',
    summary: ['One graphite sheet per high tide for a full lunar month.'],
  },
  {
    title: 'Residency, Fogo Island',
    date: '2015-03-01',
    datePrecision: 'month',
    endDate: '2015-08-01',
    summary: ['Six months of weather. The photography series begins here.'],
  },
  {
    title: 'First photographs shown, Corner Brook',
    date: '2015-11-01',
    datePrecision: 'month',
    summary: ['Large-format film of the working waterfront at low tide.'],
  },
  {
    title: 'Twenty-year survey',
    date: '2024-03-01',
    datePrecision: 'month',
    summary: ['A retrospective of watercolour and photography at the Art Gallery of Nova Scotia.'],
  },
]

export type LifeEventDocument = {
  _type: 'lifeEvent'
  title: string
  date: string
  datePrecision: DatePrecision
  endDate?: string
  summary?: Paragraph[]
  sortOrder?: number
  image?: { _type: 'image'; asset: { _type: 'reference'; _ref: string } }
  altText?: string
}

export function toLifeEventDocument(
  sample: SampleLifeEvent,
  imageAssetId: string | null,
): LifeEventDocument {
  const { withPicture, altText, summary, ...fields } = sample
  const document: LifeEventDocument = { _type: 'lifeEvent', ...fields }
  if (summary) document.summary = [toParagraph(summary)]
  if (withPicture && imageAssetId) {
    document.image = { _type: 'image', asset: { _type: 'reference', _ref: imageAssetId } }
    document.altText = altText
  }
  return document
}
