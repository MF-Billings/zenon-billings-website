export default function ContactAliasLink({ alias }: { alias?: string | null }) {
  if (!alias) return null

  return (
    <p>
      Prefer your own mail client? <a href={`mailto:${alias}`}>{alias}</a>
    </p>
  )
}
