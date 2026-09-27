import { PortableText } from 'next-sanity'
import InkRule from '@/components/InkRule'
import SanityImage from '@/components/SanityImage'
import type { SiteSettings } from '@/lib/sanity/types'

type StatementSectionProps = {
  artistName: string
  statement: SiteSettings['statement']
  heading?: string | null
  image?: SiteSettings['statementImage']
  attribution?: string | null
}

// The portrait is a signature-sized aside beside the words, never the subject,
// so it is capped well below the About page's 18rem column (see _statement.scss).
const PORTRAIT_WIDTHS = [200, 400]

export default function StatementSection({
  artistName,
  statement,
  heading,
  image,
  attribution,
}: StatementSectionProps) {
  if (!statement || statement.length === 0) return null

  return (
    <section
      className="statement"
      aria-labelledby={heading ? 'statement-heading' : undefined}
      aria-label={heading ? undefined : 'Statement'}
    >
      {heading && (
        <>
          <h2 id="statement-heading" className="lowercase-chrome">
            {heading}
          </h2>
          <InkRule className="statement__rule" />
        </>
      )}
      <div className="statement__spread">
        <div className="statement__words">
          <PortableText value={statement} />
          {attribution && <p className="statement__signature">{attribution}</p>}
        </div>
        {image && (
          <figure className="paper-sheet statement__portrait">
            <SanityImage
              source={image}
              alt={`Portrait of ${artistName}`}
              widths={PORTRAIT_WIDTHS}
              sizes="200px"
            />
          </figure>
        )}
      </div>
    </section>
  )
}
