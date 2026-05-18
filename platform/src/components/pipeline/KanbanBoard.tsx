import { DragEvent, useState } from 'react'
import clsx from 'clsx'
import { Plus } from 'lucide-react'
import CandidateCard from './CandidateCard'
import { STAGE_ORDER, formatStage, stageDotClass } from '../../utils/format'
import type { PipelineStage, ReadApplicationDTO, ReadCandidateDTO } from '../../types/api'

interface Props {
  applications: ReadApplicationDTO[]
  candidates: Record<string, ReadCandidateDTO>
  canMove: boolean
  onMove: (applicationId: string, toStage: PipelineStage) => void
}

const NO_SCORE_STAGES: PipelineStage[] = ['early_rejection', 'blacklisted', 'ai_evaluation']

export default function KanbanBoard({ applications, candidates, canMove, onMove }: Props) {
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<PipelineStage | null>(null)

  const grouped: Record<PipelineStage, ReadApplicationDTO[]> = STAGE_ORDER.reduce((acc, s) => {
    acc[s] = []
    return acc
  }, {} as Record<PipelineStage, ReadApplicationDTO[]>)
  for (const app of applications) grouped[app.currentStage]?.push(app)

  return (
    <div className="flex gap-3 overflow-x-auto px-7 pb-6 items-start min-h-[calc(100vh-260px)]">
      {STAGE_ORDER.map((stage) => {
        const cards = grouped[stage]
        const isTarget = dropTarget === stage
        return (
          <div
            key={stage}
            className="flex-none w-[268px] bg-bg border border-border-soft rounded-md flex flex-col max-h-[calc(100vh-260px)]"
          >
            <div className="flex items-center px-3 py-2.5 gap-2 border-b border-border-soft shrink-0">
              <span className={clsx('stage-dot', stageDotClass(stage))} />
              <span className="text-[12.5px] font-semibold tracking-tight">{formatStage(stage)}</span>
              <span className="text-ink-4 font-mono text-[11px]">{cards.length}</span>
              <button className="icon-btn btn-icon-sm ml-auto"><Plus size={13} /></button>
            </div>
            <div
              className={clsx(
                'p-2.5 flex flex-col gap-2 overflow-y-auto flex-1',
                isTarget && 'bg-primary/[0.04]',
              )}
              onDragOver={(e: DragEvent) => {
                if (!canMove) return
                e.preventDefault()
                setDropTarget(stage)
              }}
              onDragLeave={() => setDropTarget((t) => (t === stage ? null : t))}
              onDrop={(e: DragEvent) => {
                e.preventDefault()
                setDropTarget(null)
                if (canMove && draggingId) onMove(draggingId, stage)
                setDraggingId(null)
              }}
            >
              {cards.length === 0 && (
                <div className="text-ink-4 text-xs text-center py-4">—</div>
              )}
              {cards.map((app) => (
                <CandidateCard
                  key={app.id}
                  application={app}
                  candidate={candidates[app.candidateId]}
                  draggable={canMove}
                  showScore={!NO_SCORE_STAGES.includes(stage)}
                  isDragging={draggingId === app.id}
                  onDragStart={() => setDraggingId(app.id)}
                  onDragEnd={() => setDraggingId(null)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
