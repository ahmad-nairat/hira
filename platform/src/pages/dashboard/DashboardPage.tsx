import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import { ArrowRight, Plus, TrendingUp } from 'lucide-react'
import { jobsApi } from '../../api/jobs.api'
import { candidatesApi } from '../../api/candidates.api'
import { interviewsApi } from '../../api/interviews.api'
import { useOrgId } from '../../hooks/useOrg'
import { useAuth } from '../../hooks/useAuth'
import Spinner from '../../components/ui/Spinner'
import Chip from '../../components/ui/Chip'
import Button from '../../components/ui/Button'
import { formatDate, formatDateTime } from '../../utils/format'

export default function DashboardPage() {
  const orgId = useOrgId()
  const { user } = useAuth()

  const jobs = useQuery({ queryKey: ['jobs', orgId, { page: 1, limit: 10 }], queryFn: () => jobsApi.list(orgId, { page: 1, limit: 10 }) })
  const cands = useQuery({ queryKey: ['candidates', orgId, { page: 1, limit: 5 }], queryFn: () => candidatesApi.list(orgId, { page: 1, limit: 5 }) })
  const interviews = useQuery({ queryKey: ['interviews', orgId], queryFn: () => interviewsApi.list(orgId) })

  if (jobs.isLoading || cands.isLoading || interviews.isLoading) return <Spinner block />

  const published = jobs.data?.data.filter((j) => j.status === 'published').length ?? 0
  const upcoming = (interviews.data ?? []).filter((i) => i.status === 'scheduled').slice(0, 5)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })

  return (
    <div className="p-7 grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-7 items-start">
      <div>
        <div className="mb-6">
          <div className="mono-label mb-2">{today}</div>
          <h1 className="h-display text-[36px] m-0">
            Good morning, <span className="ital">{user?.fullName?.split(' ')[0] ?? 'there'}</span>.
          </h1>
          <p className="text-ink-3 mt-2 text-sm">
            {published} open jobs · {cands.data?.meta.total ?? 0} candidates · {upcoming.length} upcoming interviews
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[
            { label: 'Open jobs', val: published, trend: '' },
            { label: 'Total candidates', val: cands.data?.meta.total ?? 0, trend: '' },
            { label: 'Upcoming interviews', val: upcoming.length, trend: '' },
            { label: 'Total jobs', val: jobs.data?.meta.total ?? 0, trend: '' },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.val}</div>
              {s.trend ? <div className="stat-trend up"><TrendingUp size={11} /> {s.trend}</div> : null}
            </div>
          ))}
        </div>

        <div className="card p-[18px] mb-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="mono-label">Recent jobs</div>
              <div className="text-[15px] font-semibold mt-1">Your latest postings</div>
            </div>
            <Link to="/jobs" className="btn btn-ghost btn-sm">View all <ArrowRight size={12} /></Link>
          </div>
          {(jobs.data?.data?.length ?? 0) === 0 ? (
            <div className="text-ink-3 text-sm py-3">No jobs yet.</div>
          ) : (
            <div className="flex flex-col gap-3.5">
              {jobs.data!.data.slice(0, 5).map((j) => (
                <Link key={j.id} to={`/jobs/${j.id}`} className="grid items-center gap-4 hover:bg-surface-2 -mx-2 px-2 py-1.5 rounded-md" style={{ gridTemplateColumns: '1fr auto auto' }}>
                  <div className="min-w-0">
                    <div className="text-[13.5px] font-medium truncate">{j.title}</div>
                    <div className="text-ink-4 text-xs truncate">{j.location} · {j.type.replace('_', ' ')}</div>
                  </div>
                  <Chip tone={j.status === 'published' ? 'green' : 'neutral'} withDot>{j.status}</Chip>
                  <span className="text-ink-3 text-sm">{formatDate(j.publishedAt ?? j.createdAt)}</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <Link to="/jobs/new" className="btn btn-primary btn-lg w-full justify-start pl-4">
          <Plus size={16} /> Post a new job
        </Link>

        <div className="card p-4">
          <div className="mono-label mb-3">Upcoming interviews</div>
          {upcoming.length === 0 ? (
            <div className="text-ink-4 text-sm py-2">Nothing scheduled.</div>
          ) : (
            <div className="flex flex-col">
              {upcoming.map((iv, i) => (
                <div key={iv.id} className={`flex gap-2.5 py-2.5 items-center ${i < upcoming.length - 1 ? 'border-b border-border-soft' : ''}`}>
                  <span className="w-1 h-7 rounded-sm" style={{ background: iv.stage === 'specialist_interview' ? '#6D5EF7' : '#5B9DF8' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {iv.stage === 'specialist_interview' ? 'Specialist interview' : 'Interview'}
                    </div>
                    <div className="text-ink-4 text-xs">{formatDateTime(iv.scheduledAt)}</div>
                  </div>
                  <Chip size="sm" tone="neutral">{iv.meetingType.replace('_', ' ')}</Chip>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-4">
          <div className="mono-label mb-3">Latest candidates</div>
          {(cands.data?.data?.length ?? 0) === 0 ? (
            <div className="text-ink-4 text-sm py-2">No candidates yet.</div>
          ) : (
            <div className="flex flex-col">
              {cands.data!.data.map((c, i) => (
                <Link
                  key={c.id}
                  to={`/candidates/${c.id}`}
                  className={`flex items-center gap-2.5 py-2 ${i < cands.data!.data.length - 1 ? 'border-b border-border-soft' : ''}`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium truncate">{c.fullName}</div>
                    <div className="text-ink-4 text-xs truncate">{c.email}</div>
                  </div>
                  <Chip tone="neutral" size="sm">{c.source.replace('_', ' ')}</Chip>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
