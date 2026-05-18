import { CheckCircle } from 'lucide-react'
import OrgLogo from '../careers/OrgLogo'
import type { OfferPublicDTO } from '../../types/api'

export default function OfferAccepted({ offer }: { offer: OfferPublicDTO }) {
  return (
    <main className="bg-white min-h-screen text-ink">
      <header className="border-b border-lt-border bg-white">
        <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center gap-2.5">
          <OrgLogo name={offer.orgName} size={28} />
          <span className="font-medium text-[15px]">{offer.orgName}</span>
        </div>
      </header>
      <div className="max-w-[640px] mx-auto px-6 pt-24 pb-24 text-center">
        <div className="w-20 h-20 rounded-full mx-auto grid place-items-center mb-8" style={{ background: 'var(--brand-soft-strong)', color: 'var(--brand)' }}>
          <CheckCircle size={32} strokeWidth={1.5} />
        </div>
        <h1 className="h-display-lt text-[clamp(36px,5vw,52px)] mb-5">
          Welcome <span className="ital">aboard</span>.
        </h1>
        <p className="text-ink-2 text-[16px] leading-relaxed">
          You've accepted the offer from <strong className="text-ink">{offer.orgName}</strong>. Their team will be in touch with next steps — contract details, start-date logistics, and anything you'll need before day one.
        </p>
      </div>
    </main>
  )
}
