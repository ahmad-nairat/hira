import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { AlertCircle, Briefcase, MapPin, Video } from 'lucide-react'
import { interviewsApi } from '../../api/interviews.api'
import { useOrgId } from '../../hooks/useOrg'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import Segmented from '../../components/ui/Segmented'
import { formatDateTime, formatStage } from '../../utils/format'

export default function InterviewsPage() {
  const orgId = useOrgId()
  const navigate = useNavigate()
  const { data, isLoading } = useQuery({ queryKey: ['interviews', orgId], queryFn: () => interviewsApi.list(orgId) })
  const [tab, setTab] = useState<'upcoming' | 'past' | 'all'>('upcoming')
  if (isLoading) return <Spinner block />

  const all = data ?? []
  const upcoming = all.filter((i) => i.status === 'scheduled')
  const past = all.filter((i) => i.status !== 'scheduled')
  const list = tab === 'upcoming' ? upcoming : tab === 'past' ? past : all

  return (
    <div className="p-7">
      <div className="flex items-end justify-between mb-5">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.015em]">My interviews</h1>
          <div className="text-ink-3 text-sm mt-1">{upcoming.length} upcoming · {past.length} past</div>
        </div>
      </div>

      <Segmented
        value={tab}
        onChange={setTab}
        className="mb-5"
        options={[{ value: 'upcoming', label: 'Upcoming' }, { value: 'past', label: 'Past' }, { value: 'all', label: 'All' }]}
      />

      {!list.length ? (
        <EmptyState title="Nothing scheduled" hint="When someone schedules an interview for you, it'll show up here." />
      ) : (
        <div className="flex flex-col gap-2.5">
          {list.map((iv) => (
            <div key={iv.id} className="card p-4 flex items-center gap-4">
              <div className="w-[100px] shrink-0">
                <div className="mono-label mb-1">{iv.status === 'scheduled' ? 'Upcoming' : iv.status === 'completed' ? 'Past' : 'Cancelled'}</div>
                <div className="text-sm font-semibold">{formatDateTime(iv.scheduledAt).split(',')[0]}</div>
                <div className="text-ink-3 text-xs">{formatDateTime(iv.scheduledAt).split(',').slice(1).join(',').trim()}</div>
              </div>
              <div className="w-px self-stretch bg-border-soft" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold mb-1">{formatStage(iv.stage)}</div>
                <div className="text-ink-3 text-xs flex items-center gap-2">
                  <Briefcase size={11} /> Interview
                  <span className="text-ink-5">·</span>
                  <Chip tone="neutral" size="sm">{iv.meetingType === 'online' ? <Video size={10} /> : <MapPin size={10} />} {iv.meetingType.replace('_', ' ')}</Chip>
                </div>
              </div>
              <div className="flex gap-2 shrink-0">
                {iv.status === 'scheduled' && iv.meetingType === 'online' && iv.meetingLink && (
                  <a href={iv.meetingLink} target="_blank" rel="noreferrer" className="btn btn-secondary"><Video size={13} /> Join</a>
                )}
                <Button variant={iv.status === 'scheduled' ? 'primary' : 'secondary'} onClick={() => navigate(`/interviews/${iv.id}`)}>
                  {iv.status === 'scheduled' ? 'View / feedback' : 'View'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
