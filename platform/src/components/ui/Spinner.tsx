import { Loader2 } from 'lucide-react'
import clsx from 'clsx'

interface Props { size?: number; block?: boolean; className?: string }
export default function Spinner({ size = 18, block, className }: Props) {
  if (block) {
    return (
      <div className="grid place-items-center py-16">
        <Loader2 size={28} className={clsx('animate-spin text-ink-3', className)} />
      </div>
    )
  }
  return <Loader2 size={size} className={clsx('animate-spin text-ink-3', className)} />
}
