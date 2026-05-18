import Link from 'next/link'
import { ArrowUpRight, Calendar } from 'lucide-react'

const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:5173'

export default function CtaSection() {
  return (
    <section className="pt-20 pb-32">
      <div className="max-w-[1100px] mx-auto px-6">
        <div
          className="relative rounded-3xl border border-mk-purple/30 bg-dark-surface p-14 text-center overflow-hidden"
          style={{ background: 'radial-gradient(120% 80% at 50% 0%, rgba(139,111,255,0.18), transparent), #14141F' }}
        >
          <h2 className="h-display-mk text-[clamp(32px,5vw,56px)] max-w-[680px] mx-auto">
            Start hiring <span className="ital">smarter</span> today.
          </h2>
          <p className="text-dark-text-2 text-[16px] leading-relaxed max-w-[520px] mx-auto mt-5">
            Set up your workspace in minutes. Free for the first three users. No credit card needed to start.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-9">
            <Link href={`${APP}/register`} className="btn-mk-primary">
              Get started free <ArrowUpRight size={16} />
            </Link>
            <a href="#" className="btn-mk-ghost">
              <Calendar size={15} /> Book a demo
            </a>
          </div>
        </div>
      </div>
    </section>
  )
}
