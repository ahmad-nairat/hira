import clsx from 'clsx'
import type { PipelineStage } from '../../types/api'
import { stageDotClass } from '../../utils/format'

interface Props { stage: PipelineStage; className?: string; size?: number }
export default function StageDot({ stage, className, size = 7 }: Props) {
  return <span className={clsx('stage-dot', stageDotClass(stage), className)} style={{ width: size, height: size }} />
}
