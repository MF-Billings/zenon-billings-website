import Link from 'next/link'

export default function SiteHeader() {
  return (
    <header className="container">
      <nav>
        <ul>
          <li>
            <Link href="/">
              <strong>Zenon Billings</strong>
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
