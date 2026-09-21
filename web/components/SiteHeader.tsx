import InkRule from '@/components/InkRule'
import SiteNavigation from '@/components/SiteNavigation'

export default function SiteHeader() {
  return (
    <header className="site-header container">
      <nav className="site-header__nav">
        {/* No whitespace after the span, so the text stays unbroken. Plain text,
            not a link: "Home" in the nav is the one way back. */}
        <p className="site-header__wordmark lowercase-chrome">
          <span className="initial-badge">Z</span>enon Billings
        </p>
        <SiteNavigation />
      </nav>
      <InkRule className="site-header__rule" />
    </header>
  )
}
