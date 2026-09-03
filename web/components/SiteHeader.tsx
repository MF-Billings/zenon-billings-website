import Link from 'next/link'
import InkRule from '@/components/InkRule'

export default function SiteHeader() {
  return (
    <header className="site-header container">
      <nav className="site-header__nav">
        <Link href="/" className="site-header__wordmark lowercase-chrome">
          Zenon Billings
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
