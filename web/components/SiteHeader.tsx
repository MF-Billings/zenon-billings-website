import Link from 'next/link'
import InkRule from '@/components/InkRule'

export default function SiteHeader() {
  return (
    <header className="site-header container">
      <nav className="site-header__nav">
        {/* No whitespace after the span, so the accessible name stays unbroken. */}
        <Link href="/" className="site-header__wordmark lowercase-chrome">
          <span className="site-header__initial">Z</span>enon Billings
        </Link>
        {/* Kept deliberately so list semantics don't depend on the marker styling */}
        <ul className="site-header__links" role="list">
          <li>
            <Link href="/gallery" className="lowercase-chrome">
              Gallery
            </Link>
          </li>
          <li>
            <Link href="/about" className="lowercase-chrome">
              About
            </Link>
          </li>
          <li>
            <Link href="/contact" className="lowercase-chrome">
              Contact
            </Link>
          </li>
        </ul>
      </nav>
      <InkRule className="site-header__rule" />
    </header>
  )
}
