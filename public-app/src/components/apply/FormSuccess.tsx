import Link from 'next/link'
import { ArrowLeft, CheckCircle } from 'lucide-react'

interface Props { jobTitle: string; orgName: string; orgSlug: string }

export default function FormSuccess({ jobTitle, orgName, orgSlug }: Props) {
  return (
    <div className="max-w-[640px] mx-auto px-6 py-20 text-center">
      <div className="w-16 h-16 rounded-full mx-auto grid place-items-center mb-7" style={{ background: 'var(--brand-soft)', color: 'var(--brand)' }}>
        <CheckCircle size={28} strokeWidth={1.5} />
      </div>
      <h1 className="h-display-lt text-[clamp(28px,4vw,40px)] mb-4">
        Application <span className="ital">received</span>.
      </h1>
      <p className="text-ink-2 text-[15px] leading-relaxed">
        Thanks for applying to <strong className="text-ink">{jobTitle}</strong> at <strong className="text-ink">{orgName}</strong>. We'll be in touch by email — most teams respond within a week.
      </p>
      <Link href={`/careers/${orgSlug}`} className="btn-ghost-lt mt-8">
        <ArrowLeft size={14} /> Browse more open roles
      </Link>
    </div>
  )
}
