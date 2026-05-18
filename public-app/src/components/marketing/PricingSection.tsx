import Link from 'next/link'
import { Check } from 'lucide-react'

const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:5173'

const PLANS = [
  {
    name: 'Starter', price: '$0', period: 'forever',
    tagline: 'For founders and tiny teams just starting to hire.',
    cta: 'Start free', href: `${APP}/register`,
    features: ['Up to 3 active jobs', 'Up to 3 team members', 'Basic AI scoring', 'Public careers page'],
  },
  {
    name: 'Growth', price: '$149', period: 'per workspace / month',
    tagline: 'For growing teams hiring across multiple roles.',
    cta: 'Start a free trial', href: `${APP}/register`, recommended: true,
    features: ['Unlimited active jobs', 'Up to 15 team members', 'Full AI suite + custom weights', 'Interview kits & feedback', 'Branded careers page', 'Priority support'],
  },
  {
    name: 'Enterprise', price: 'Custom', period: 'tailored to you',
    tagline: 'For organizations with compliance and scale needs.',
    cta: 'Talk to sales', href: '#',
    features: ['Everything in Growth', 'Custom domain on careers', 'SSO / SAML & SCIM', 'Audit log & SLA', 'Dedicated CSM'],
  },
]

export default function PricingSection() {
  return (
    <section id="pricing" className="py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center max-w-[860px] mx-auto mb-16">
          <div className="mono-eyebrow mb-4">Pricing</div>
          <h2 className="h-display-mk text-[clamp(32px,5vw,56px)]">
            Pricing that scales with <span className="ital">how much you're hiring</span>, not how many seats you bought.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          {PLANS.map((p) => (
            <div
              key={p.name}
              className={
                'relative rounded-3xl p-8 flex flex-col ' +
                (p.recommended
                  ? 'bg-dark-surface border border-mk-purple/40 shadow-[0_0_60px_-10px_rgba(139,111,255,0.45)]'
                  : 'bg-dark-surface/40 border border-dark-border')
              }
            >
              {p.recommended ? (
                <span className="absolute -top-3 right-6 px-3 h-6 inline-flex items-center rounded-full bg-mk-purple text-white text-[11.5px] font-medium">
                  Recommended
                </span>
              ) : null}
              <div className="text-[18px] font-medium">{p.name}</div>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-[40px] font-medium font-instr italic">{p.price}</span>
                <span className="text-dark-text-3 text-[13px]">{p.period}</span>
              </div>
              <p className="text-dark-text-2 text-[14px] mt-3 mb-7">{p.tagline}</p>
              <Link
                href={p.href}
                className={
                  p.recommended
                    ? 'btn-mk-primary w-full !justify-center !h-11 !rounded-xl !bg-mk-purple !text-white hover:!bg-mk-purple-2'
                    : 'btn-mk-ghost w-full !justify-center !h-11 !rounded-xl'
                }
              >
                {p.cta}
              </Link>
              <ul className="mt-8 space-y-3">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2.5 text-[13.5px] text-dark-text-2">
                    <Check size={14} className="text-mk-green mt-0.5 shrink-0" /> {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
