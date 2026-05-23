import { ReactNode } from 'react'
import clsx from 'clsx'

type Tone = 'neutral' | 'primary' | 'green' | 'amber' | 'rose' | 'blue' | 'teal' | 'pink'

// Tailwind's content scanner only does plain string matching — it can't
// resolve template literals like `chip-${tone}`. Keep an explicit literal map
// so each `chip-*` class actually appears in source and survives the purge.
const TONE_CLASS: Record<Tone, string> = {
  neutral: 'chip-neutral',
  primary: 'chip-primary',
  green: 'chip-green',
  amber: 'chip-amber',
  rose: 'chip-rose',
  blue: 'chip-blue',
  teal: 'chip-teal',
  pink: 'chip-pink',
}

interface Props {
  tone?: Tone
  size?: 'sm' | 'md'
  className?: string
  children: ReactNode
  withDot?: boolean
}
export default function Chip({ tone = 'neutral', size = 'md', className, children, withDot }: Props) {
  return (
    <span className={clsx('chip', TONE_CLASS[tone], size === 'sm' && 'chip-sm', className)}>
      {withDot ? <span className="dot" /> : null}
      {children}
    </span>
  )
}
