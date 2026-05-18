import { ReactNode } from 'react'
import clsx from 'clsx'

type Tone = 'amber' | 'rose' | 'blue' | 'green'
interface Props { tone?: Tone; icon?: ReactNode; children: ReactNode; action?: ReactNode; className?: string }

export default function Banner({ tone = 'blue', icon, children, action, className }: Props) {
  return (
    <div className={clsx('banner', `banner-${tone}`, className)}>
      {icon ? <span className="mt-0.5">{icon}</span> : null}
      <div className="flex-1">{children}</div>
      {action}
    </div>
  )
}
