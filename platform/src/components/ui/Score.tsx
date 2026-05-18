import clsx from 'clsx'
import { scoreClass } from '../../utils/format'
interface Props { value: number | null | undefined; className?: string }
export default function Score({ value, className }: Props) {
  return <span className={clsx('score-badge', `score-${scoreClass(value)}`, className)}>{value ?? '—'}</span>
}
