import Link from 'next/link'

export default function SiteHeader() {
  return (
    <header className="container">
      <nav>
        <ul>
          <li>
            <Link href="/">
              {/* No whitespace after the span, so the accessible name stays unbroken. */}
              <strong className="site-name">
                <span className="site-name__initial">Z</span>enon Billings
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
