import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { ArrowLeft, Calendar, Info, Star, Video, MapPin } from 'lucide-react'
import { interviewsApi } from '../../api/interviews.api'
import { applicationsApi } from '../../api/applications.api'
import { useOrgId } from '../../hooks/useOrg'
import { useAuth } from '../../hooks/useAuth'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import Avatar from '../../components/ui/Avatar'
import Chip from '../../components/ui/Chip'
import Textarea from '../../components/ui/Textarea'
import { extractError } from '../../api/client'
import { formatDateTime, formatStage } from '../../utils/format'
import type { Recommendation } from '../../types/api'

const RECS: Array<{ v: Recommendation; label: string; tone: 'green' | 'teal' | 'neutral' | 'amber' | 'rose'; color: string }> = [
  { v: 'strong_yes', label: 'Strong Yes', tone: 'green', color: '#3FCB7E' },
  { v: 'yes', label: 'Yes', tone: 'teal', color: '#3DBFB1' },
  { v: 'neutral', label: 'Neutral', tone: 'neutral', color: '#898997' },
  { v: 'no', label: 'No', tone: 'amber', color: '#F4A857' },
  { v: 'strong_no', label: 'Strong No', tone: 'rose', color: '#FF6B7B' },
]

export default function InterviewDetailPage() {
  const { interviewId = '' } = useParams()
  const orgId = useOrgId()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { user } = useAuth()
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [rec, setRec] = useState<Recommendation>('neutral')

  const it = useQuery({ queryKey: ['interview', interviewId], queryFn: () => interviewsApi.get(orgId, interviewId) })
  const fb = useQuery({ queryKey: ['feedback', interviewId], queryFn: () => interviewsApi.getFeedback(orgId, interviewId), enabled: !!interviewId })
  const app = useQuery({
    queryKey: ['application', it.data?.applicationId],
    queryFn: () => applicationsApi.get(orgId, it.data!.applicationId),
    enabled: !!it.data?.applicationId,
  })

  const submit = useMutation({
    mutationFn: () => interviewsApi.submitFeedback(orgId, interviewId, { rating, notes, recommendation: rec }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['feedback', interviewId] }),
  })

  if (it.isLoading) return <Spinner block />
  if (!it.data) return <div className="p-7 text-rose-ink">Interview not found.</div>
  const interview = it.data
  const canSubmit = interview.interviewerId === user?.id && !fb.data

  return (
    <div className="p-7">
      <Button onClick={() => navigate('/interviews')} className="mb-4 pl-1"><ArrowLeft size={14} /> All interviews</Button>

      <div className="card p-[22px] mb-5">
        <div className="flex items-end justify-between gap-3 flex-wrap">
          <div>
            <div className="mono-label mb-1.5">Interview · {interview.status}</div>
            <h1 className="h-display text-[26px]">{formatStage(interview.stage)}</h1>
            <div className="flex items-center gap-3 text-ink-3 text-sm mt-2 flex-wrap">
              <span className="flex items-center gap-1"><Calendar size={12} /> {formatDateTime(interview.scheduledAt)}</span>
              <span className="text-ink-5">·</span>
              <Chip tone="neutral" size="sm">
                {interview.meetingType === 'online' ? <Video size={10} /> : <MapPin size={10} />} {interview.meetingType.replace('_', ' ')}
              </Chip>
            </div>
          </div>
          <div className="flex gap-2">
            {interview.meetingType === 'online' && interview.meetingLink && (
              <a className="btn btn-secondary" href={interview.meetingLink} target="_blank" rel="noreferrer"><Video size={13} /> Join meeting</a>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        <div className="card p-[18px]">
          <div className="mono-label mb-3">Feedback</div>
          {fb.data ? (
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-amber-ink">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Star key={n} size={14} className={n <= fb.data!.rating ? 'fill-current' : ''} />
                  ))}
                </div>
                <span className="text-ink-3 text-xs">{fb.data.rating} / 5</span>
                <span className="ml-auto"><Chip tone={RECS.find((r) => r.v === fb.data!.recommendation)?.tone ?? 'neutral'}>{RECS.find((r) => r.v === fb.data!.recommendation)?.label}</Chip></span>
              </div>
              <div className="text-sm whitespace-pre-wrap text-ink-2">{fb.data.notes}</div>
            </div>
          ) : canSubmit ? (
            <form onSubmit={(e) => { e.preventDefault(); submit.mutate() }} className="flex flex-col gap-3.5">
              <div className="field">
                <label className="label">Overall rating</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button key={n} type="button" className="icon-btn" onClick={() => setRating(n)} style={{ color: n <= rating ? '#f8c089' : '#3F3F4A' }}>
                      <Star size={20} className={n <= rating ? 'fill-current' : ''} />
                    </button>
                  ))}
                  <span className="text-ink-3 text-xs ml-2">{rating || '—'} / 5</span>
                </div>
              </div>
              <div className="field">
                <label className="label">Recommendation</label>
                <div className="flex flex-col gap-1.5">
                  {RECS.map((r) => (
                    <button
                      key={r.v} type="button"
                      onClick={() => setRec(r.v)}
                      className={clsx('flex items-center gap-3 px-3 py-2 rounded-md text-left text-sm border transition-colors', rec === r.v ? 'border-current' : 'border-border-soft bg-surface-2')}
                      style={{ color: rec === r.v ? r.color : undefined, background: rec === r.v ? `${r.color}19` : undefined }}
                    >
                      <span className="w-3 h-3 rounded-full border-[1.5px] inline-flex items-center justify-center" style={{ borderColor: rec === r.v ? r.color : '#3F3F4A' }}>
                        {rec === r.v && <span className="w-1.5 h-1.5 rounded-full" style={{ background: r.color }} />}
                      </span>
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <Textarea label="Detailed feedback" rows={6} value={notes} onChange={(e) => setNotes(e.target.value)} required />
              {submit.isError && <div className="field-error">{extractError(submit.error)}</div>}
              <Button type="submit" variant="primary" loading={submit.isPending}>Submit feedback</Button>
            </form>
          ) : (
            <p className="text-ink-4 italic">Awaiting feedback from the assigned interviewer.</p>
          )}
        </div>

        <div className="card p-[18px] self-start">
          <div className="mono-label mb-3">Candidate</div>
          {app.data ? (
            <div className="flex items-center gap-3">
              <Avatar size="lg" name="Candidate" />
              <div>
                <div className="text-sm font-semibold">Application #{app.data.id.slice(0, 6)}</div>
                <div className="text-ink-4 text-xs mt-0.5">Stage: {formatStage(app.data.currentStage)}</div>
              </div>
            </div>
          ) : null}
          <div className="text-ink-3 text-xs mt-4 leading-snug px-3 py-2.5 bg-surface-2 rounded-md flex gap-2">
            <Info size={11} className="shrink-0 mt-0.5" />
            <span>To preserve fairness, interviewers only see the candidate name and role applied for. Other context is intentionally hidden.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
