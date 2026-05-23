import clsx from 'clsx'
import { scoreClass } from '../../utils/format'
interface Props { value: number | null | undefined; className?: string }

const VARIANT_CLASS: Record<string, string> = {
  high: 'score-high',
  'mid': 'score-mid',
  'low': 'score-low',
  'none': 'score-none'
}

export default function Score({ value, className }: Props) {
  return <span className={clsx('score-badge', VARIANT_CLASS[scoreClass(value)], className)}>{value ?? '—'}</span>
}
