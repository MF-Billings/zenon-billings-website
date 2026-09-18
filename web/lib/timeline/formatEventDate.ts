export type DatePrecision = 'day' | 'month' | 'year'

export type EventDate = {
  /** Full ISO date as Sanity stores it, `YYYY-MM-DD`. */
  date: string
  datePrecision?: DatePrecision | null
  endDate?: string | null
}

const PRECISION_LENGTH: Record<DatePrecision, number> = { year: 4, month: 7, day: 10 }

const resolvePrecision = (precision: DatePrecision | null | undefined): DatePrecision =>
  precision ?? 'day'

/** The ISO date cut down to what the precision actually asserts, for `<time datetime>`. */
export function isoForPrecision(date: string, precision: DatePrecision | null | undefined): string {
  return date.slice(0, PRECISION_LENGTH[resolvePrecision(precision)])
}

// Parsed in UTC and formatted in UTC: a date with no time of day must not slide
// to the previous day for a visitor west of Greenwich.
function utcDate(iso: string): Date {
  const [year, month, day] = iso.split('-').map(Number)
  return new Date(Date.UTC(year, month - 1, day))
}

function formatterFor(precision: DatePrecision): Intl.DateTimeFormat {
  const options: Intl.DateTimeFormatOptions = { year: 'numeric', timeZone: 'UTC' }
  if (precision !== 'year') options.month = 'long'
  if (precision === 'day') options.day = 'numeric'
  return new Intl.DateTimeFormat('en-US', options)
}

/**
 * "August 18, 1970", "September 1992" or "1988" depending on precision. A range
 * uses formatRange, which collapses the shared parts: "1997–2001",
 * "March–August 2015", "August 18–22, 1970".
 */
export function formatEventDate({ date, datePrecision, endDate }: EventDate): string {
  const precision = resolvePrecision(datePrecision)
  const formatter = formatterFor(precision)
  const isRange =
    endDate && isoForPrecision(endDate, precision) !== isoForPrecision(date, precision)
  return isRange
    ? closeUpRangeDash(formatter.formatRange(utcDate(date), utcDate(endDate)))
    : formatter.format(utcDate(date))
}

// ICU pads the range dash with thin spaces ("1997 – 2001"); the site's date
// style is the closed-up en dash, and the padding also varies between ICU
// versions, so it is removed rather than relied on.
const closeUpRangeDash = (range: string): string => range.replace(/\s*–\s*/gu, '–')
