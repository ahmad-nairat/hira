import Link from 'next/link'
import { ArrowUpRight, LifeBuoy } from 'lucide-react'
import HiraLogo from '../components/marketing/HiraLogo'

const RECENT = [
  { name: 'Byte Center', meta: '6 open roles · Remote', href: '/careers/byte-center' },
  { name: 'Eon Dental', meta: '12 open roles · Amman', href: '/careers/eon-dental' },
  { name: 'Lumen Studio', meta: '3 open roles · Lisbon', href: '/careers/lumen-studio' },
  { name: 'Carbide', meta: '8 open roles · Distributed', href: '/careers/carbide' },
]

export default function NotFound() {
  return (
    <div className="mk min-h-screen mk-grid">
      <header className="max-w-[1100px] mx-auto px-6 h-16 flex items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <HiraLogo size={28} />
          <span className="font-medium text-[15px]">Hira</span>
        </Link>
        <Link href="/" className="ml-auto text-[13px] text-dark-text-3 hover:text-dark-text">← hira.com</Link>
      </header>

      <main className="max-w-[760px] mx-auto px-6 pt-24 pb-24 text-center">
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-dark-text-3 mb-5">404 · Careers page</div>
        <h1 className="h-display-mk text-[clamp(48px,7vw,96px)] mb-7">
          This careers page <span className="ital">doesn't exist</span> — or has moved.
        </h1>
        <p className="text-dark-text-2 text-[16px] leading-relaxed max-w-[540px] mx-auto">
          The link you followed may have been removed, the URL may be mistyped, or the workspace's careers page may not be published yet. If you were looking for a specific role, the team there can help.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 mt-9">
          <Link href="/" className="btn-mk-primary">
            Go to hira.com <ArrowUpRight size={15} />
          </Link>
          <a href="#" className="btn-mk-ghost"><LifeBuoy size={14} /> Contact support</a>
        </div>

        <div className="mt-24">
          <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-dark-text-3 mb-5">Recently published on Hira</div>
          <div className="grid sm:grid-cols-2 gap-3 text-left">
            {RECENT.map((r) => (
              <Link key={r.name} href={r.href} className="group rounded-2xl border border-dark-border bg-dark-surface/60 p-5 flex items-center justify-between hover:border-mk-purple/40 transition-colors">
                <div>
                  <div className="text-[14px] font-medium">{r.name}</div>
                  <div className="text-[12.5px] text-dark-text-3 mt-1">{r.meta}</div>
                </div>
                <ArrowUpRight size={16} className="text-dark-text-3 group-hover:text-mk-purple-2 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}
