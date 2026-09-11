'use client'

import type { MouseEvent } from 'react'

export default function BackToTopButton({ visible }: { visible: boolean }) {
  // `smooth` makes the return a visible glide rather than an instant jump, so
  // the visitor can see where on the page they came from.
  //
  // Focus is released first. The button hides once the top of the page comes
  // back into view, and Chrome cancels an in-flight smooth scroll the moment
  // the focused element stops being focusable (measured: the glide stalled
  // part-way at exactly the point the button disappeared). Focus could not
  // stay on a control that is about to vanish anyway.
  const scrollToTop = (event: MouseEvent<HTMLButtonElement>) => {
    event.currentTarget.blur()
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <button
      type="button"
      className="back-to-top"
      aria-label="Back to top"
      hidden={!visible}
      onClick={scrollToTop}
    >
      <svg className="back-to-top__arrow" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path
          d="M12 20V5M5.5 11.5 12 5l6.5 6.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  )
}
