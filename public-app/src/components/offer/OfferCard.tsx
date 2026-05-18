'use client'

import { useState } from 'react'
import { Check, ShieldCheck } from 'lucide-react'
import OrgLogo from '../careers/OrgLogo'
import type { OfferPublicDTO } from '../../types/api'
import { formatDate } from '../../lib/format'

interface Props {
  offer: OfferPublicDTO
  onAccept: () => Promise<void>
  onDecline: () => Promise<void>
}

export default function OfferCard({ offer, onAccept, onDecline }: Props) {
  const [confirming, setConfirming] = useState<'accept' | 'decline' | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const run = async (action: 'accept' | 'decline') => {
    setSubmitting(true)
    try { action === 'accept' ? await onAccept() : await onDecline() } finally { setSubmitting(false) }
  }

  return (
    <main className="bg-white min-h-screen text-ink">
      <header className="border-b border-lt-border bg-white">
        <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <OrgLogo name={offer.orgName} size={28} />
            <span className="font-medium text-[15px]">{offer.orgName}</span>
          </div>
          <div className="ml-auto flex items-center gap-2 text-[12.5px] text-ink-3">
            <ShieldCheck size={14} /> This link is unique to you
          </div>
        </div>
      </header>

      <div className="max-w-[860px] mx-auto px-6 pt-16 pb-24">
        <div className="flex items-center gap-2 text-[12.5px] text-ink-3 font-mono uppercase tracking-[0.18em] mb-7">
          Offer · {offer.orgName}
        </div>
        <p className="text-ink-2 text-[15px] mb-2">You've received an offer</p>
        <h1 className="h-display-lt text-[clamp(40px,5.5vw,64px)] mb-7">
          Welcome, <span className="ital">{(offer as unknown as { candidateName?: string }).candidateName ?? 'there'}</span>.
        </h1>
        <p className="text-ink-2 text-[16px] leading-relaxed max-w-[640px]">
          <strong className="text-ink">{offer.orgName}</strong> would like to formally offer you the role of{' '}
          <strong className="text-ink">{offer.jobTitle}</strong>.
        </p>

        {offer.welcomeMessage ? (
          <article className="mt-10 p-8 rounded-2xl bg-surface-2 border border-lt-border text-ink-2 text-[15.5px] leading-[1.75] whitespace-pre-wrap">
            {offer.welcomeMessage}
          </article>
        ) : null}

        <section className="mt-10 lt-card overflow-hidden">
          <div className="px-6 py-4 border-b border-lt-border bg-white">
            <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3">The details</div>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-px bg-lt-border">
            <Row k="Role" v={offer.jobTitle} />
            <Row k="Department" v="Engineering" />
            {offer.salary ? <Row k="Salary" v={`${offer.currency ?? ''} ${Number(offer.salary).toLocaleString()} / year`} /> : null}
            {offer.contractType ? <Row k="Contract" v={offer.contractType} /> : null}
            {offer.startDate ? <Row k="Start date" v={formatDate(offer.startDate)} /> : null}
            <Row k="Valid until" v={formatDate(offer.expiresAt)} />
          </dl>
        </section>

        {confirming ? (
          <div className="mt-10 p-6 rounded-2xl border-2 border-dashed text-center" style={{ borderColor: 'var(--brand)' }}>
            <p className="text-ink text-[16px] mb-5">
              {confirming === 'accept' ? 'Ready to accept this offer?' : 'Are you sure you want to decline?'}
            </p>
            <div className="flex justify-center gap-3">
              <button className="btn-ghost-lt" onClick={() => setConfirming(null)} disabled={submitting}>Cancel</button>
              <button
                className={confirming === 'accept' ? 'btn-brand' : 'btn-ghost-lt'}
                style={confirming === 'decline' ? { background: '#E54664', color: '#fff', borderColor: '#E54664' } : undefined}
                onClick={() => run(confirming)}
                disabled={submitting}
              >
                {submitting ? 'Saving…' : confirming === 'accept' ? 'Yes, accept' : 'Yes, decline'}
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-10 flex flex-col sm:flex-row gap-3">
            <button className="btn-brand flex-1 !justify-center !h-12" onClick={() => setConfirming('accept')}>
              <Check size={16} /> Accept offer
            </button>
            <button className="btn-ghost-lt flex-1 !justify-center !h-12" onClick={() => setConfirming('decline')}>
              Decline
            </button>
          </div>
        )}

        <footer className="mt-16 text-center text-[12.5px] text-ink-3">
          Powered by <span className="font-medium text-ink-2">Hira</span> · This link is unique to you and expires {formatDate(offer.expiresAt)}.
        </footer>
      </div>
    </main>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="bg-white px-6 py-4">
      <div className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3 mb-1.5">{k}</div>
      <div className="text-[15px] text-ink font-medium">{v}</div>
    </div>
  )
}
