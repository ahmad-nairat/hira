import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Download, Filter, MoreHorizontal, Plus, Search, AlertTriangle } from 'lucide-react'
import { jobsApi } from '../../api/jobs.api'
import { useOrgId } from '../../hooks/useOrg'
import { usePermission } from '../../hooks/usePermission'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import EmptyState from '../../components/ui/EmptyState'
import Segmented from '../../components/ui/Segmented'
import Avatar from '../../components/ui/Avatar'
import { formatDate } from '../../utils/format'
import type { JobStatus, JobType } from '../../types/api'

export default function JobsPage() {
  const orgId = useOrgId()
  const navigate = useNavigate()
  const { can } = usePermission()
  const [status, setStatus] = useState<JobStatus | 'all'>('all')
  const [type, setType] = useState<JobType | 'all'>('all')
  const [search, setSearch] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['jobs', orgId, { status, type, search }],
    queryFn: () =>
      jobsApi.list(orgId, {
        page: 1, limit: 100,
        status: status !== 'all' ? status : undefined,
        type: type !== 'all' ? type : undefined,
        search: search || undefined,
      }),
  })

  const total = data?.meta.total ?? 0
  const publishedCount = data?.data.filter((j) => j.status === 'published').length ?? 0

  return (
    <div className="p-7">
      <div className="flex items-end justify-between gap-4 mb-5">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.015em] m-0">Jobs</h1>
          <div className="text-ink-3 text-sm mt-1">{publishedCount} published · {total} total</div>
        </div>
        <div className="flex gap-2 items-center">
          <Button variant="secondary"><Download size={14} /> Export</Button>
          {can.manageJobs && <Button variant="primary" onClick={() => navigate('/jobs/new')}><Plus size={14} /> Post a job</Button>}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3.5 flex-wrap">
        <Segmented
          value={status}
          onChange={(v) => setStatus(v)}
          options={[
            { value: 'all', label: 'All' }, { value: 'draft', label: 'Draft' },
            { value: 'published', label: 'Published' }, { value: 'closed', label: 'Closed' },
            { value: 'archived', label: 'Archived' },
          ]}
        />
        <div className="input-icon-wrap w-[280px]">
          <span className="icon"><Search size={14} /></span>
          <input className="input" placeholder="Search jobs…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <select className="select w-[160px]" value={type} onChange={(e) => setType(e.target.value as JobType | 'all')}>
          <option value="all">All types</option>
          <option value="full_time">Full-time</option>
          <option value="part_time">Part-time</option>
          <option value="contract">Contract</option>
          <option value="internship">Internship</option>
        </select>
        <Button><Filter size={14} /> Filters</Button>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <Spinner block /> : !data?.data.length ? (
          <EmptyState
            title="No jobs match these filters"
            hint="Try clearing filters, or post your first job to start scoring candidates."
            action={can.manageJobs ? <Button variant="primary" onClick={() => navigate('/jobs/new')}><Plus size={14} /> Post a job</Button> : null}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11.5px] text-ink-4 font-medium tracking-wide">
                <th className="px-3.5 py-2.5 border-b border-border-soft bg-surface">Job</th>
                <th className="px-3.5 py-2.5 border-b border-border-soft bg-surface w-[100px]">Type</th>
                <th className="px-3.5 py-2.5 border-b border-border-soft bg-surface w-[110px]">Status</th>
                <th className="px-3.5 py-2.5 border-b border-border-soft bg-surface w-[120px]">Posted</th>
                <th className="px-3.5 py-2.5 border-b border-border-soft bg-surface w-[40px]" />
              </tr>
            </thead>
            <tbody>
              {data.data.map((j) => (
                <tr key={j.id} className="hover:bg-surface-2 transition-colors cursor-pointer border-b border-border-soft last:border-b-0" onClick={() => navigate(`/jobs/${j.id}`)}>
                  <td className="px-3.5 py-3.5">
                    <div className="text-[13.5px] font-medium">{j.title}</div>
                    <div className="text-ink-4 text-xs flex items-center gap-2 mt-1">
                      <span>{j.location}</span>
                      {j.hasOutdatedScores && <span className="chip chip-amber chip-sm"><AlertTriangle size={10} /> Outdated scores</span>}
                      {j.hasOutdatedRejections && <span className="chip chip-amber chip-sm"><AlertTriangle size={10} /> Outdated rejections</span>}
                    </div>
                  </td>
                  <td className="px-3.5 py-3.5"><Chip tone="neutral">{j.type.replace('_', ' ')}</Chip></td>
                  <td className="px-3.5 py-3.5">
                    <Chip
                      tone={j.status === 'published' ? 'green' : j.status === 'draft' ? 'neutral' : j.status === 'closed' ? 'amber' : 'neutral'}
                      withDot
                    >
                      {j.status}
                    </Chip>
                  </td>
                  <td className="px-3.5 py-3.5 text-ink-3 text-sm">{formatDate(j.publishedAt ?? j.createdAt)}</td>
                  <td className="px-3.5 py-3.5"><button className="icon-btn" onClick={(e) => e.stopPropagation()}><MoreHorizontal size={14} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
