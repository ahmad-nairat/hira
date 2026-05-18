import { Github, Linkedin, Twitter } from 'lucide-react'
import Link from 'next/link'
import HiraLogo from './HiraLogo'

const COLS = [
  { title: 'Product', links: ['Features', 'Pipeline', 'AI scoring', 'Careers pages', 'Changelog'] },
  { title: 'Company', links: ['About', 'Blog', 'Customers', 'Contact'] },
  { title: 'Resources', links: ['Docs', 'Hiring playbook', 'Templates', 'Status'] },
  { title: 'Legal', links: ['Privacy', 'Terms', 'Security', 'DPA'] },
]

export default function MarketingFooter() {
  return (
    <footer className="border-t border-dark-border-soft pt-20 pb-10">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="grid md:grid-cols-[1.6fr_repeat(4,1fr)] gap-10">
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-5">
              <HiraLogo size={28} />
              <span className="font-medium text-[15px]">Hira</span>
            </Link>
            <p className="text-[14px] text-dark-text-3 max-w-[320px] leading-relaxed">
              Hiring that thinks alongside your team. Built by engineers and recruiters in Amman, Lisbon, and Brooklyn.
            </p>
          </div>
          {COLS.map((col) => (
            <div key={col.title}>
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-dark-text-3 mb-4">{col.title}</div>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={l}><a href="#" className="text-[13.5px] text-dark-text-2 hover:text-dark-text transition-colors">{l}</a></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-16 pt-6 border-t border-dark-border-soft flex flex-col md:flex-row md:items-center justify-between gap-4 text-[12.5px] text-dark-text-3">
          <span>© 2026 Hira Labs Inc.</span>
          <div className="flex items-center gap-3">
            <a href="#" className="w-8 h-8 rounded-full border border-dark-border-soft inline-flex items-center justify-center hover:bg-white/[0.04] transition-colors" aria-label="Twitter"><Twitter size={14} /></a>
            <a href="#" className="w-8 h-8 rounded-full border border-dark-border-soft inline-flex items-center justify-center hover:bg-white/[0.04] transition-colors" aria-label="GitHub"><Github size={14} /></a>
            <a href="#" className="w-8 h-8 rounded-full border border-dark-border-soft inline-flex items-center justify-center hover:bg-white/[0.04] transition-colors" aria-label="LinkedIn"><Linkedin size={14} /></a>
          </div>
        </div>
      </div>
    </footer>
  )
}
