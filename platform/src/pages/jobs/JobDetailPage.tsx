import { useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { AlertTriangle, BarChart3, Copy, ExternalLink, Kanban, List, MoreHorizontal, RefreshCw, Settings as SettingsIcon, Filter, Search } from 'lucide-react'
import { jobsApi } from '../../api/jobs.api'
import { applicationsApi } from '../../api/applications.api'
import { candidatesApi } from '../../api/candidates.api'
import { useOrgId } from '../../hooks/useOrg'
import { usePermission } from '../../hooks/usePermission'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import Score from '../../components/ui/Score'
import StageDot from '../../components/ui/StageDot'
import Avatar from '../../components/ui/Avatar'
import EmptyState from '../../components/ui/EmptyState'
import Banner from '../../components/ui/Banner'
import KanbanBoard from '../../components/pipeline/KanbanBoard'
import { extractError } from '../../api/client'
import { formatDate, formatStage } from '../../utils/format'
import type { PipelineStage, ReadCandidateDTO } from '../../types/api'

type ViewMode = 'pipeline' | 'table' | 'analytics' | 'settings'

export default function JobDetailPage() {
  const { jobId = '' } = useParams()
  const orgId = useOrgId()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { can } = usePermission()
  const [view, setView] = useState<ViewMode>('pipeline')

  const job = useQuery({ queryKey: ['jobs', orgId, jobId], queryFn: () => jobsApi.get(orgId, jobId) })
  const apps = useQuery({
    queryKey: ['applications', 'job', jobId],
    queryFn: () => applicationsApi.listByJob(orgId, jobId, { page: 1, limit: 200 }),
    enabled: !!jobId,
  })
  const candidateIds = apps.data?.data.map((a) => a.candidateId) ?? []
  const candidates = useQuery({
    queryKey: ['candidates-by-id', orgId, candidateIds],
    enabled: candidateIds.length > 0,
    queryFn: async () => {
      const list = await Promise.all(candidateIds.map((id) => candidatesApi.get(orgId, id).catch(() => null)))
      const map: Record<string, ReadCandidateDTO> = {}
      list.forEach((c) => { if (c) map[c.id] = c })
      return map
    },
  })

  const move = useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: PipelineStage }) =>
      applicationsApi.move(orgId, id, stage),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['applications', 'job', jobId] }),
  })
  const publish = useMutation({
    mutationFn: () => jobsApi.publish(orgId, jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs', orgId, jobId] }),
  })
  const rescore = useMutation({
    mutationFn: () => jobsApi.rescore(orgId, jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs', orgId, jobId] }),
  })
  const reeval = useMutation({
    mutationFn: () => jobsApi.reevaluateRejections(orgId, jobId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['jobs', orgId, jobId] }),
  })

  const counts = useMemo(() => {
    const c: Record<string, number> = {}
    for (const a of apps.data?.data ?? []) c[a.currentStage] = (c[a.currentStage] ?? 0) + 1
    return c
  }, [apps.data])

  if (job.isLoading) return <Spinner block />
  if (!job.data) return <div className="p-7 text-rose-ink">Job not found.</div>
  const j = job.data

  return (
    <div className="page-wide">
      <div className="px-7 pt-5">
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <Chip tone={j.status === 'published' ? 'green' : 'neutral'} withDot>{j.status}</Chip>
          <Chip tone="neutral">{j.type.replace('_', ' ')}</Chip>
          <span className="font-mono text-ink-4 text-xs ml-1.5">{j.location} · Posted {formatDate(j.publishedAt ?? j.createdAt)}</span>
        </div>
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <h1 className="h-display text-[30px] tracking-[-0.015em] m-0">{j.title}</h1>
          </div>
          <div className="flex gap-2 items-center">
            {j.status === 'draft' && can.manageJobs && (
              <Button variant="primary" onClick={() => publish.mutate()} loading={publish.isPending}>Publish</Button>
            )}
            <Button><ExternalLink size={14} /> Careers page</Button>
            <Button variant="secondary"><Copy size={14} /> Copy link</Button>
            <Button variant="secondary" size="icon"><MoreHorizontal size={14} /></Button>
          </div>
        </div>

        {(j.hasOutdatedScores || j.hasOutdatedRejections) && can.manageJobs && (
          <div className="mt-5 flex flex-col gap-2">
            {j.hasOutdatedScores && (
              <Banner tone="amber" icon={<AlertTriangle size={14} />}
                action={<Button size="sm" className="bg-amber text-bg" onClick={() => rescore.mutate()} loading={rescore.isPending}><RefreshCw size={12} /> Re-score now</Button>}
              >
                <strong>Scoring criteria changed.</strong> Some candidates have outdated scores.
              </Banner>
            )}
            {j.hasOutdatedRejections && (
              <Banner tone="amber" icon={<AlertTriangle size={14} />}
                action={<Button size="sm" className="bg-amber text-bg" onClick={() => reeval.mutate()} loading={reeval.isPending}><RefreshCw size={12} /> Re-evaluate</Button>}
              >
                <strong>Rejection criteria changed.</strong> Re-evaluate to apply the new rules.
              </Banner>
            )}
          </div>
        )}

        <div className="tabs mt-5">
          {[
            { id: 'pipeline' as const, label: 'Pipeline', Icon: Kanban },
            { id: 'table' as const, label: 'Table', Icon: List },
            { id: 'analytics' as const, label: 'Analytics', Icon: BarChart3 },
            { id: 'settings' as const, label: 'Settings', Icon: SettingsIcon },
          ].map((t) => {
            const I = t.Icon
            return (
              <button key={t.id} className={clsx('tab', view === t.id && 'active')} onClick={() => t.id === 'settings' ? navigate(`/jobs/${jobId}/settings`) : setView(t.id)}>
                <I size={13} className="mr-1.5 -mt-0.5 inline-block" />{t.label}
              </button>
            )
          })}
        </div>
      </div>

      {publish.isError && <div className="px-7 mt-3"><div className="field-error">{extractError(publish.error)}</div></div>}

      {view === 'pipeline' && (
        <>
          <div className="flex items-center gap-2 px-7 pb-3.5 pt-3.5 flex-wrap">
            <div className="input-icon-wrap w-[280px]">
              <span className="icon"><Search size={13} /></span>
              <input className="input" placeholder="Search candidates in this pipeline…" />
            </div>
            <Button><Filter size={13} /> Score: All</Button>
            <Button><Filter size={13} /> Source: All</Button>
            <div className="ml-auto text-ink-3 text-xs">Drag cards between stages. Invalid moves rejected.</div>
          </div>
          {apps.isLoading ? <Spinner block /> :
            !apps.data?.data.length ? (
              <div className="px-7"><EmptyState title="No applications yet" hint="Once candidates apply or are added, they'll appear here." /></div>
            ) : (
              <KanbanBoard
                applications={apps.data.data}
                candidates={candidates.data ?? {}}
                canMove={can.moveStage}
                onMove={(id, stage) => move.mutate({ id, stage })}
              />
            )
          }
        </>
      )}

      {view === 'table' && (
        <div className="px-7 pb-7 pt-4">
          {apps.isLoading ? <Spinner block /> :
            !apps.data?.data.length ? (
              <EmptyState title="No applications yet" />
            ) : (
              <div className="card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-[11.5px] text-ink-4 font-medium">
                      <th className="px-3.5 py-2.5 border-b border-border-soft bg-surface">Candidate</th>
                      <th className="px-3.5 py-2.5 border-b border-border-soft bg-surface w-20 text-right">Score</th>
                      <th className="px-3.5 py-2.5 border-b border-border-soft bg-surface w-40">Stage</th>
                      <th className="px-3.5 py-2.5 border-b border-border-soft bg-surface w-32">Applied</th>
                      <th className="px-3.5 py-2.5 border-b border-border-soft bg-surface w-10" />
                    </tr>
                  </thead>
                  <tbody>
                    {apps.data.data.map((a) => {
                      const c = candidates.data?.[a.candidateId]
                      return (
                        <tr key={a.id} className="hover:bg-surface-2 cursor-pointer border-b border-border-soft last:border-b-0" onClick={() => navigate(`/applications/${a.id}`)}>
                          <td className="px-3.5 py-3.5">
                            <div className="flex items-center gap-2">
                              <Avatar size="sm" name={c?.fullName} />
                              <div className="min-w-0">
                                <div className="text-sm font-medium truncate">{c?.fullName ?? '—'}</div>
                                <div className="text-ink-4 text-xs truncate">{c?.email ?? '—'}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3.5 py-3.5 text-right"><Score value={a.score} /></td>
                          <td className="px-3.5 py-3.5">
                            <span className="flex items-center gap-2 text-sm">
                              <StageDot stage={a.currentStage} /> {formatStage(a.currentStage)}
                            </span>
                          </td>
                          <td className="px-3.5 py-3.5 text-ink-3 text-sm">{formatDate(a.createdAt)}</td>
                          <td className="px-3.5 py-3.5"><button className="icon-btn" onClick={(e) => e.stopPropagation()}><MoreHorizontal size={14} /></button></td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
        </div>
      )}

      {view === 'analytics' && (
        <div className="px-7 pb-7 pt-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Total applications', val: apps.data?.meta.total ?? 0 },
              { label: 'Avg score', val: Math.round((apps.data?.data.filter((a) => a.score != null).reduce((s, a) => s + (a.score ?? 0), 0) ?? 0) / Math.max(1, apps.data?.data.filter((a) => a.score != null).length ?? 1)) || '—' },
              { label: 'In pipeline', val: apps.data?.data.filter((a) => !['rejected', 'declined', 'early_rejection', 'hired'].includes(a.currentStage)).length ?? 0 },
              { label: 'Hired', val: counts.hired ?? 0 },
            ].map((s) => (
              <div className="stat-card" key={s.label}>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value">{s.val}</div>
              </div>
            ))}
          </div>
          <div className="card p-5">
            <div className="mono-label mb-1">Hiring funnel</div>
            <div className="text-[15px] font-semibold mb-4">Stage-by-stage breakdown</div>
            {(['ai_evaluation', 'screening', 'interview', 'review', 'hm_approved', 'offer_accepted', 'hired'] as PipelineStage[]).map((s, i) => {
              const n = counts[s] ?? 0
              const max = Math.max(1, ...Object.values(counts))
              return (
                <div key={s} className="grid items-center gap-3 py-1.5" style={{ gridTemplateColumns: '160px 1fr 40px' }}>
                  <div className="text-sm">{formatStage(s)}</div>
                  <div className="h-4 bg-surface-2 rounded-md overflow-hidden">
                    <div className="h-full bg-primary" style={{ width: `${Math.max(2, (n / max) * 100)}%`, opacity: 1 - i * 0.1 }} />
                  </div>
                  <div className="font-mono text-xs text-right">{n}</div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
