import Link from 'next/link'
import { ArrowUpRight, MapPin } from 'lucide-react'
import type { ReadJobSummaryDTO } from '../../types/api'
import { formatJobType, formatSalary, timeAgo } from '../../lib/format'

interface Props { job: ReadJobSummaryDTO; orgSlug: string; featured?: boolean }

export default function JobCard({ job, orgSlug, featured }: Props) {
  return (
    <Link
      href={`/careers/${orgSlug}/${job.id}`}
      className="group flex items-center gap-5 p-5 lt-card hover:shadow-lift transition-all hover:-translate-y-[1px]"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          {featured ? (
            <span className="px-2 h-5 inline-flex items-center rounded-full text-[10.5px] font-medium uppercase tracking-[0.12em]" style={{ background: 'var(--brand-soft)', color: 'var(--brand-ink)' }}>
              Featured
            </span>
          ) : null}
          <span className="text-[12px] uppercase tracking-[0.14em] text-ink-3 font-mono">Engineering</span>
        </div>
        <h3 className="text-[20px] font-medium text-ink mb-2 group-hover:[color:var(--brand)] transition-colors">{job.title}</h3>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-2">
          <span className="inline-flex items-center gap-1.5"><MapPin size={12} /> {job.location}</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-ink-3" /> {formatJobType(job.type)}
          </span>
          {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency) ? (
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1 h-1 rounded-full bg-ink-3" /> {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}
            </span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 text-ink-3">
            <span className="w-1 h-1 rounded-full bg-ink-3" /> {timeAgo(job.publishedAt)}
          </span>
        </div>
      </div>
      <span className="inline-flex items-center gap-1.5 text-[13px] font-medium shrink-0 group-hover:translate-x-0.5 transition-transform" style={{ color: 'var(--brand)' }}>
        Apply now <ArrowUpRight size={14} />
      </span>
    </Link>
  )
}
