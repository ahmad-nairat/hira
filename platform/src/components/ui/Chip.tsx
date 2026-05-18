import { ReactNode } from 'react'
import clsx from 'clsx'

type Tone = 'neutral' | 'primary' | 'green' | 'amber' | 'rose' | 'blue' | 'teal' | 'pink'
interface Props {
  tone?: Tone
  size?: 'sm' | 'md'
  className?: string
  children: ReactNode
  withDot?: boolean
}
export default function Chip({ tone = 'neutral', size = 'md', className, children, withDot }: Props) {
  return (
    <span className={clsx('chip', `chip-${tone}`, size === 'sm' && 'chip-sm', className)}>
      {withDot ? <span className="dot" /> : null}
      {children}
    </span>
  )
}
