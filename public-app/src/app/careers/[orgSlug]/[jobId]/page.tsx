import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import DOMPurify from 'isomorphic-dompurify'
import { ArrowLeft, ArrowRight, Briefcase, Calendar, Clock, Copy, Linkedin, MapPin } from 'lucide-react'
import CareersHeader from '../../../../components/careers/CareersHeader'
import CareersFooter from '../../../../components/careers/CareersFooter'
import { getJobDetail, ApiError } from '../../../../lib/api'
import { getBrandStyles } from '../../../../lib/brand'
import { formatJobType, formatSalary, timeAgo } from '../../../../lib/format'

interface PageProps { params: { orgSlug: string; jobId: string } }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  try {
    const { data: job } = await getJobDetail(params.orgSlug, params.jobId)
    return { title: `${job.title} at ${job.org.name}`, description: `${job.org.name} is hiring a ${job.title} in ${job.location}.` }
  } catch {
    return { title: 'Job not found' }
  }
}

export default async function JobDetailPage({ params }: PageProps) {
  let result
  try {
    result = await getJobDetail(params.orgSlug, params.jobId)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) notFound()
    throw err
  }
  const job = result.data
  const safe = DOMPurify.sanitize(job.description, { USE_PROFILES: { html: true } })
  const apply = `/careers/${params.orgSlug}/${params.jobId}/apply`

  return (
    <div style={getBrandStyles(job.org)} className="bg-white min-h-screen text-ink">
      <CareersHeader org={job.org} />

      <div className="max-w-[1180px] mx-auto px-6 pt-10">
        <Link href={`/careers/${params.orgSlug}`} className="inline-flex items-center gap-2 text-[13.5px] text-ink-2 hover:text-ink mb-6">
          <ArrowLeft size={14} /> Back to all jobs
        </Link>
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3 mb-3">Engineering</div>
        <h1 className="h-display-lt text-[clamp(36px,5.5vw,56px)] max-w-[880px]">{job.title}</h1>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-5 text-[14px] text-ink-2">
          <span className="inline-flex items-center gap-1.5"><MapPin size={13} /> {job.location}</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-ink-3" /> {formatJobType(job.type)}</span>
          {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency) ? (
            <span className="inline-flex items-center gap-1.5"><span className="w-1 h-1 rounded-full bg-ink-3" /> {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)}</span>
          ) : null}
          <span className="inline-flex items-center gap-1.5 text-ink-3"><span className="w-1 h-1 rounded-full bg-ink-3" /> Posted {timeAgo(job.publishedAt)}</span>
        </div>
      </div>

      <div className="max-w-[1180px] mx-auto px-6 mt-12 grid lg:grid-cols-[1fr_340px] gap-10 items-start">
        <main className="lt-card p-10">
          <div className="job-prose" dangerouslySetInnerHTML={{ __html: safe }} />
          {!job.description?.trim() && <p className="job-prose">No description provided.</p>}

          <div className="mt-14 pt-8 border-t border-lt-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <p className="text-ink-2 text-[14px]">Sound like you? The application takes about 8 minutes.</p>
            <Link href={apply} className="btn-brand">Apply for this role <ArrowRight size={15} /></Link>
          </div>
        </main>

        <aside className="lg:sticky lg:top-24">
          <div className="lt-card p-6">
            <div className="space-y-4 mb-6">
              <Item k="Department" v="Engineering" />
              <Item k="Location" v={job.location} />
              <Item k="Type" v={formatJobType(job.type)} />
              {formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency) ? (
                <Item k="Salary" v={formatSalary(job.salaryMin, job.salaryMax, job.salaryCurrency)} />
              ) : null}
              <Item k="Posted" v={timeAgo(job.publishedAt)} />
            </div>
            <Link href={apply} className="btn-brand w-full !justify-center">Apply for this role <ArrowRight size={15} /></Link>
            <div className="mt-6">
              <div className="font-mono text-[11px] uppercase tracking-[0.16em] text-ink-3 mb-3">Share</div>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-ghost-lt !h-10 !text-[13px] !px-3"><Copy size={13} /> Copy link</button>
                <button className="btn-ghost-lt !h-10 !text-[13px] !px-3"><Linkedin size={13} /> LinkedIn</button>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* mobile sticky apply */}
      <div className="lg:hidden sticky bottom-0 bg-white/95 backdrop-blur border-t border-lt-border p-3 z-30">
        <Link href={apply} className="btn-brand w-full !justify-center">Apply for this role <ArrowRight size={15} /></Link>
      </div>

      <CareersFooter org={job.org} />
    </div>
  )
}

function Item({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-3">{k}</span>
      <span className="text-[13.5px] text-ink font-medium text-right">{v}</span>
    </div>
  )
}
