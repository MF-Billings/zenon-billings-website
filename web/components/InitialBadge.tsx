// Renders text with its first letter wrapped for the badge styling, echoing
// the artist's business card. No whitespace is emitted between the badge and
// the rest, so the accessible name stays a single unbroken string.
export default function InitialBadge({ text }: { text: string }) {
  // Array.from splits by code point, so a first letter outside the BMP is not
  // cut in half the way text[0] would.
  const [initial, ...rest] = Array.from(text)
  if (!initial) return null

  return (
    <>
      <span className="initial-badge">{initial}</span>
      {rest.join('')}
    </>
  )
}
