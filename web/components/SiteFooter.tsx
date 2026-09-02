import InkRule from '@/components/InkRule'

export default function SiteFooter() {
  return (
    <footer className="site-footer container">
      <InkRule className="site-footer__rule" />
      <p className="studio-label">&copy; {new Date().getFullYear()} Zenon Billings</p>
    </footer>
  )
}
