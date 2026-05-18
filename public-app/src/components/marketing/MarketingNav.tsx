import Link from 'next/link'
import HiraLogo from './HiraLogo'

const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:5173'

const NAV = [
  { label: 'Product', href: '#product' },
  { label: 'Pipeline', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'Changelog', href: '#' },
  { label: 'Docs', href: '#' },
]

export default function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-dark-bg/70 border-b border-dark-border-soft">
      <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center gap-8">
        <Link href="/" className="flex items-center gap-2.5">
          <HiraLogo size={28} />
          <span className="font-medium text-[15px]">Hira</span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 ml-2">
          {NAV.map((n) => (
            <a key={n.label} href={n.href} className="text-[13.5px] text-dark-text-2 hover:text-dark-text transition-colors">
              {n.label}
            </a>
          ))}
        </nav>
        <div className="ml-auto flex items-center gap-2">
          <Link href={`${APP}/login`} className="text-[13.5px] text-dark-text-2 hover:text-dark-text px-3">Sign in</Link>
          <Link href={`${APP}/register`} className="btn-mk-primary !h-9 !px-4 !text-[13px]">Start free</Link>
        </div>
      </div>
    </header>
  )
}
