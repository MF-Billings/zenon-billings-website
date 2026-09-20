'use client'

import Link from 'next/link'
import type { ComponentProps, MouseEvent } from 'react'

type HashLinkProps = Omit<ComponentProps<typeof Link>, 'href'> & { href: string }

// A link to a fragment on some page. Next's router treats a click whose URL is
// already the current one as nothing to do, so once the visitor has scrolled
// away from the fragment (the back-to-top button, say) a second click would
// leave them where they are. A browser re-scrolls to a fragment on every
// click; this restores that.
export default function HashLink({ href, onClick, ...rest }: HashLinkProps) {
  const scrollIfAlreadyThere = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event)
    if (event.defaultPrevented) return

    const target = new URL(href, window.location.href)
    if (target.href !== window.location.href) return

    const fragment = document.getElementById(decodeURIComponent(target.hash.slice(1)))
    if (!fragment) return

    event.preventDefault()
    fragment.scrollIntoView()
  }

  return <Link href={href} onClick={scrollIfAlreadyThere} {...rest} />
}
