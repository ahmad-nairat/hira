'use client'

import { useState } from 'react'
import { ArrowRight, Clock, Mail } from 'lucide-react'
import OrgLogo from '../careers/OrgLogo'
import { resendOffer } from '../../lib/api'

interface Props { orgName?: string }

export default function OfferExpired({ orgName }: Props) {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setSubmitting(true)
    try { await resendOffer(email); setSent(true) } finally { setSubmitting(false) }
  }

  return (
    <main className="bg-white min-h-screen text-ink">
      <header className="border-b border-lt-border bg-white">
        <div className="max-w-[1100px] mx-auto px-6 h-16 flex items-center gap-2.5">
          <OrgLogo name={orgName ?? 'B'} size={28} />
          <span className="font-medium text-[15px]">{orgName ?? 'Hira'}</span>
        </div>
      </header>
      <div className="max-w-[560px] mx-auto px-6 pt-20 pb-24">
        <div className="w-14 h-14 rounded-full grid place-items-center mb-8 mx-auto" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
          <Clock size={22} strokeWidth={1.5} />
        </div>
        <h1 className="h-display-lt text-[clamp(32px,4.5vw,44px)] text-center mb-5">
          This offer link has <span className="ital">expired</span>
        </h1>
        <p className="text-ink-2 text-[15.5px] leading-relaxed text-center">
          Offer links from {orgName ?? 'this team'} are valid for 7 days. Enter the email address the offer was sent to and we'll resend you a fresh link, if the offer is still active.
        </p>
        <form onSubmit={submit} className="mt-9 space-y-4">
          <div>
            <label htmlFor="email" className="lt-label">Email address</label>
            <div className="relative">
              <Mail size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-3" />
              <input
                id="email"
                type="email"
                required
                className="lt-input pl-11"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>
          {sent ? (
            <div className="px-4 py-4 rounded-xl text-[14px]" style={{ background: 'var(--brand-soft)', color: 'var(--brand-ink)' }}>
              If an active offer exists for that email, a fresh link is on its way. It should arrive within a minute.
            </div>
          ) : (
            <button type="submit" className="btn-brand w-full !justify-center !h-12" disabled={submitting}>
              {submitting ? 'Sending…' : 'Resend offer link'} <ArrowRight size={15} />
            </button>
          )}
        </form>
        <p className="text-center text-[12.5px] text-ink-3 mt-10">
          Need help? Contact <a href="mailto:careers@hira.com" className="text-ink-2 underline">careers@{(orgName ?? 'hira').toLowerCase().replace(/\s+/g, '-')}.com</a>
        </p>
      </div>
    </main>
  )
}
