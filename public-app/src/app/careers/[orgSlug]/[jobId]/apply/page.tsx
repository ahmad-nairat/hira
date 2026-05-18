'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import CareersHeader from '../../../../../components/careers/CareersHeader'
import CareersFooter from '../../../../../components/careers/CareersFooter'
import ApplicationForm from '../../../../../components/apply/ApplicationForm'
import FormSuccess from '../../../../../components/apply/FormSuccess'
import { getJobDetail, submitApplication, ApiError } from '../../../../../lib/api'
import { getBrandStyles } from '../../../../../lib/brand'
import { formatJobType } from '../../../../../lib/format'
import type { JobDetailDTO } from '../../../../../types/api'

interface PageProps { params: { orgSlug: string; jobId: string } }

export default function ApplyPage({ params }: PageProps) {
  const [job, setJob] = useState<JobDetailDTO | null>(null)
  const [pageErr, setPageErr] = useState<string | null>(null)
  const [submitErr, setSubmitErr] = useState<string | null>(null)
  const [done, setDone] = useState(false)

  useEffect(() => {
    getJobDetail(params.orgSlug, params.jobId)
      .then((r) => setJob(r.data))
      .catch((err: unknown) => {
        setPageErr(err instanceof ApiError && err.status === 404 ? 'This job is no longer available.' : 'Could not load this job.')
      })
  }, [params.orgSlug, params.jobId])

  if (pageErr) return <div className="min-h-screen bg-white grid place-items-center text-ink-2">{pageErr}</div>
  if (!job) return <ApplySkeleton />

  if (done) {
    return (
      <div style={getBrandStyles(job.org)} className="bg-white min-h-screen text-ink">
        <CareersHeader org={job.org} />
        <FormSuccess jobTitle={job.title} orgName={job.org.name} orgSlug={params.orgSlug} />
        <CareersFooter org={job.org} />
      </div>
    )
  }

  return (
    <div style={getBrandStyles(job.org)} className="bg-white min-h-screen text-ink">
      <CareersHeader org={job.org} />
      <div className="max-w-[760px] mx-auto px-6 pt-10 pb-20">
        <Link href={`/careers/${params.orgSlug}/${params.jobId}`} className="inline-flex items-center gap-2 text-[13.5px] text-ink-2 hover:text-ink mb-7">
          <ArrowLeft size={14} /> Back to {job.title}
        </Link>
        <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-ink-3 mb-3">Apply for</div>
        <h1 className="h-display-lt text-[clamp(36px,5vw,48px)] max-w-[640px]">{job.title}</h1>
        <p className="text-ink-2 text-[14.5px] mt-3">
          at <strong className="text-ink">{job.org.name}</strong> · {job.location} · {formatJobType(job.type)}
        </p>

        <div className="lt-card p-8 mt-10">
          <ApplicationForm
            org={job.org}
            form={job.form}
            onSubmit={async (fd) => {
              setSubmitErr(null)
              try { await submitApplication(params.orgSlug, params.jobId, fd); setDone(true) }
              catch (err: unknown) { setSubmitErr(err instanceof ApiError ? err.message : 'Submission failed. Try again.') }
            }}
            errorMessage={submitErr}
          />
        </div>
      </div>
      <CareersFooter org={job.org} />
    </div>
  )
}

function ApplySkeleton() {
  return (
    <div className="min-h-screen bg-white">
      <div className="h-16 border-b border-lt-border" />
      <div className="max-w-[760px] mx-auto px-6 pt-10 pb-20">
        <div className="skel h-5 w-40 rounded-md mb-7" />
        <div className="skel h-4 w-24 rounded-md mb-3" />
        <div className="skel h-12 w-3/4 rounded-md mb-3" />
        <div className="skel h-5 w-2/3 rounded-md mb-10" />
        <div className="space-y-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i}>
              <div className="skel h-4 w-32 rounded-md mb-2" />
              <div className="skel h-12 rounded-xl" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
