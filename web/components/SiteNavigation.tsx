'use client'

import Link from 'next/link'
import { useEffect, useRef, useState, type MouseEvent, type RefObject } from 'react'
import HashLink from '@/components/HashLink'

const LINKS_ID = 'site-navigation-links'

const SECTION_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/gallery', label: 'Gallery' },
  { href: '/about', label: 'About' },
  { href: '/#contact', label: 'Contact' },
]

// An open overlay closes the way every overlay does: Escape, or a press
// anywhere outside it. Listeners are attached only while it is open.
function useDismissOnEscapeOrOutsidePress(
  isOpen: boolean,
  container: RefObject<HTMLElement | null>,
  close: () => void,
) {
  useEffect(() => {
    if (!isOpen) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close()
    }
    const onPointerDown = (event: PointerEvent) => {
      if (!container.current?.contains(event.target as Node)) close()
    }

    document.addEventListener('keydown', onKeyDown)
    document.addEventListener('pointerdown', onPointerDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.removeEventListener('pointerdown', onPointerDown)
    }
  }, [isOpen, container, close])
}

function SectionLink({ href, label }: { href: string; label: string }) {
  const LinkKind = href.includes('#') ? HashLink : Link
  return (
    <LinkKind href={href} className="lowercase-chrome">
      {label}
    </LinkKind>
  )
}

// The list of section links, behind a menu toggle on narrow screens. Whether
// the toggle shows, and whether the list hides behind it, is the stylesheet's
// call: this component only reports the menu's open state in markup.
export default function SiteNavigation() {
  const [isOpen, setIsOpen] = useState(false)
  const menu = useRef<HTMLDivElement>(null)
  const close = () => setIsOpen(false)

  useDismissOnEscapeOrOutsidePress(isOpen, menu, close)

  const closeOnLinkChoice = (event: MouseEvent<HTMLUListElement>) => {
    if ((event.target as HTMLElement).closest('a')) close()
  }

  return (
    <div className="site-header__menu" ref={menu}>
      <button
        type="button"
        className="site-header__menu-toggle"
        aria-label="Menu"
        aria-expanded={isOpen}
        aria-controls={LINKS_ID}
        onClick={() => setIsOpen((open) => !open)}
      >
        <svg
          className="site-header__menu-icon"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <path
            d="M4 7h16M4 12h16M4 17h16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
          />
        </svg>
      </button>
      {/* The sheet casts the shadow; the list inside it wears the torn edge. A
          mask clips everything its element paints, the shadow included, so the
          two cannot sit on one element. */}
      <div className="site-header__sheet">
        {/* role kept deliberately so list semantics don't depend on the marker styling */}
        <ul
          id={LINKS_ID}
          className="site-header__links"
          role="list"
          data-open={isOpen || undefined}
          onClick={closeOnLinkChoice}
        >
          {SECTION_LINKS.map((link) => (
            <li key={link.href}>
              <SectionLink {...link} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
