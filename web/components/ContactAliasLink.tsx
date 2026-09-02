export default function ContactAliasLink({ alias }: { alias?: string | null }) {
  if (!alias) return null

  return (
    <p className="contact-alias">
      Prefer your own mail client?{' '}
      <a href={`mailto:${alias}`} className="brush-underline">
        {alias}
      </a>
    </p>
  )
}
