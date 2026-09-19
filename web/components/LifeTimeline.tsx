import { PortableText } from 'next-sanity'
import InkRule from '@/components/InkRule'
import SanityImage from '@/components/SanityImage'
import type { LifeEvent } from '@/lib/sanity/types'
import { formatEventDate } from '@/lib/timeline/formatEventDate'
import { groupEventsByDate, type DateGroup } from '@/lib/timeline/groupEventsByDate'

type LifeTimelineProps = {
  events: LifeEvent[]
}

// Sized for the sheet's picture column (see _life-timeline.scss); the picture is
// an aside to the text, never the subject, so it never needs a wide rendition.
const PICTURE_WIDTHS = [200, 400]

function EventSheet({ event }: { event: LifeEvent }) {
  const illustrated = Boolean(event.image && event.altText)
  const sheetClass = illustrated
    ? 'paper-sheet life-timeline__sheet life-timeline__sheet--illustrated'
    : 'paper-sheet life-timeline__sheet'

  return (
    <article className={sheetClass}>
      <div>
        <h3>{event.title}</h3>
        {event.summary && <PortableText value={event.summary} />}
      </div>
      {illustrated && (
        <figure className="life-timeline__picture">
          <SanityImage
            source={event.image!}
            alt={event.altText!}
            widths={PICTURE_WIDTHS}
            sizes="200px"
          />
        </figure>
      )}
    </article>
  )
}

function TimelineEntry({ group }: { group: DateGroup<LifeEvent> }) {
  const first = group.events[0]
  const entryClass = first.endDate
    ? 'life-timeline__entry life-timeline__entry--range'
    : 'life-timeline__entry'

  return (
    <li className={entryClass}>
      <time className="life-timeline__date" dateTime={group.key}>
        {formatEventDate(first)}
      </time>
      <div className="life-timeline__sheets">
        {group.events.map((event) => (
          <EventSheet key={event._id} event={event} />
        ))}
      </div>
    </li>
  )
}

export default function LifeTimeline({ events }: LifeTimelineProps) {
  if (events.length === 0) return null

  return (
    <section className="life-timeline" aria-labelledby="life-timeline-heading">
      <h2 id="life-timeline-heading" className="lowercase-chrome">
        Key dates
      </h2>
      <InkRule className="life-timeline__rule" />
      <ol className="life-timeline__entries">
        {groupEventsByDate(events).map((group) => (
          <TimelineEntry key={group.key} group={group} />
        ))}
      </ol>
    </section>
  )
}
