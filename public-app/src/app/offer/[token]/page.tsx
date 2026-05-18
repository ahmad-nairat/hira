'use client'

import { useEffect, useState } from 'react'
import OfferCard from '../../../components/offer/OfferCard'
import OfferAccepted from '../../../components/offer/OfferAccepted'
import OfferDeclined from '../../../components/offer/OfferDeclined'
import OfferExpired from '../../../components/offer/OfferExpired'
import { getOfferByToken, respondToOffer, ApiError } from '../../../lib/api'
import type { OfferPublicDTO } from '../../../types/api'

type State = 'loading' | 'active' | 'expired' | 'accepted' | 'declined' | 'error'

interface PageProps { params: { token: string } }

export default function OfferPage({ params }: PageProps) {
  const [state, setState] = useState<State>('loading')
  const [offer, setOffer] = useState<OfferPublicDTO | null>(null)

  useEffect(() => {
    getOfferByToken(params.token)
      .then((r) => {
        setOffer(r.data)
        if (r.data.status === 'accepted') setState('accepted')
        else if (r.data.status === 'declined') setState('declined')
        else setState('active')
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && (err.status === 410 || err.status === 404)) setState('expired')
        else setState('error')
      })
  }, [params.token])

  if (state === 'loading') return <OfferSkeleton />
  if (state === 'error') return <div className="min-h-screen grid place-items-center bg-white text-ink-2">Something went wrong. Please try again.</div>
  if (state === 'expired') return <OfferExpired orgName={offer?.orgName} />
  if (state === 'accepted' && offer) return <OfferAccepted offer={offer} />
  if (state === 'declined' && offer) return <OfferDeclined offer={offer} />
  if (!offer) return <OfferSkeleton />
  return (
    <OfferCard
      offer={offer}
      onAccept={async () => { await respondToOffer(params.token, 'accept'); setState('accepted') }}
      onDecline={async () => { await respondToOffer(params.token, 'decline'); setState('declined') }}
    />
  )
}

function OfferSkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-16 border-b border-lt-border" />
      <div className="max-w-[860px] mx-auto px-6 pt-16 pb-24">
        <div className="skel h-4 w-48 rounded-md mb-7" />
        <div className="skel h-5 w-56 rounded-md mb-3" />
        <div className="skel h-16 w-3/4 rounded-md mb-7" />
        <div className="space-y-3 mb-10">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="skel h-5 rounded-md" />)}
        </div>
        <div className="skel h-44 rounded-2xl mb-10" />
        <div className="grid grid-cols-2 gap-3">
          <div className="skel h-12 rounded-full" />
          <div className="skel h-12 rounded-full" />
        </div>
      </div>
    </div>
  )
}
