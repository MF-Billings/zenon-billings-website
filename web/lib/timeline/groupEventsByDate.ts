import { isoForPrecision, type EventDate } from './formatEventDate'

export type DatedEvent = EventDate & { _id: string }

export type DateGroup<Event extends DatedEvent> = {
  /** ISO value for the group's `<time datetime>`; a range is written `start/end`. */
  key: string
  events: Event[]
}

export function dateKey({ date, datePrecision, endDate }: EventDate): string {
  const start = isoForPrecision(date, datePrecision)
  return endDate ? `${start}/${isoForPrecision(endDate, datePrecision)}` : start
}

/**
 * Consecutive events with the same date (and the same end date) share one date
 * cell in the timeline. The input is already sorted by the query, so only
 * neighbours are compared.
 */
export function groupEventsByDate<Event extends DatedEvent>(events: Event[]): DateGroup<Event>[] {
  return events.reduce<DateGroup<Event>[]>((groups, event) => {
    const key = dateKey(event)
    const last = groups.at(-1)
    if (last && last.key === key) {
      last.events.push(event)
    } else {
      groups.push({ key, events: [event] })
    }
    return groups
  }, [])
}
