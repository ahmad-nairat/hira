import { DragEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import clsx from 'clsx'
import { Clock } from 'lucide-react'
import Avatar from '../ui/Avatar'
import Score from '../ui/Score'
import type { ReadApplicationDTO, ReadCandidateDTO } from '../../types/api'
import { formatDate } from '../../utils/format'

interface Props {
  application: ReadApplicationDTO
  candidate?: ReadCandidateDTO
  draggable?: boolean
  showScore?: boolean
  onDragStart?: (e: DragEvent<HTMLDivElement>) => void
  onDragEnd?: (e: DragEvent<HTMLDivElement>) => void
  isDragging?: boolean
}

export default function CandidateCard({ application, candidate, draggable, showScore = true, onDragStart, onDragEnd, isDragging }: Props) {
  const navigate = useNavigate()
  return (
    <div
      className={clsx(
        'bg-surface border border-border-soft rounded-lg px-3 py-[11px] cursor-grab transition-all',
        'hover:border-border-strong active:cursor-grabbing',
        isDragging && 'opacity-40',
      )}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={() => navigate(`/applications/${application.id}`)}
    >
      <div className="flex items-center gap-2 mb-2">
        <Avatar size="sm" name={candidate?.fullName} />
        <span className="text-[13px] font-medium flex-1 min-w-0 truncate">{candidate?.fullName ?? 'Candidate'}</span>
        {showScore ? <Score value={application.score} /> : null}
      </div>
      <div className="flex items-center gap-1.5 text-[11.5px] text-ink-4">
        <Clock size={10} />
        <span>{formatDate(application.updatedAt)}</span>
        <span className="text-ink-5">·</span>
        <span>{candidate?.source ? candidate.source.replace('_', ' ') : '—'}</span>
      </div>
    </div>
  )
}
