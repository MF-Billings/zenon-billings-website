export default function InkRule({ className }: { className?: string }) {
  return (
    <svg
      className={className ? `ink-rule ${className}` : 'ink-rule'}
      viewBox="0 0 1200 8"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M0 4.6 C 180 2.1, 360 6.4, 540 4.2 S 900 1.8, 1200 4.9"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  )
}
