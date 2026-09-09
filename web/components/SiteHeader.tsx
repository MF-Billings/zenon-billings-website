import Link from 'next/link'

const SITE_NAME = 'Zenon Billings'

export default function SiteHeader() {
  // The initial gets its own element so it can carry the business-card badge
  // styling. No whitespace between the span and the rest of the name, so the
  // accessible name stays a single unbroken string.
  const [initial, ...rest] = SITE_NAME

  return (
    <header className="container">
      <nav>
        <ul>
          <li>
            <Link href="/">
              <strong className="site-name">
                <span className="site-name__initial">{initial}</span>
                {rest.join('')}
              </strong>
            </Link>
          </li>
        </ul>
        <ul>
          <li>
            <Link href="/gallery">Gallery</Link>
          </li>
          <li>
            <Link href="/about">About</Link>
          </li>
          <li>
            <Link href="/contact">Contact</Link>
          </li>
        </ul>
      </nav>
    </header>
  )
}
