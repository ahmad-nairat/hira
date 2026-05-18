import clsx from 'clsx'
import { initials, avTint } from '../../utils/format'

interface Props {
  name?: string | null
  src?: string | null
  size?: 'sm' | 'md' | 'lg' | 'xl'
  square?: boolean
  className?: string
}

export default function Avatar({ name, src, size = 'md', square, className }: Props) {
  return (
    <span
      className={clsx(
        'avatar',
        size === 'sm' && 'avatar-sm',
        size === 'lg' && 'avatar-lg',
        size === 'xl' && 'avatar-xl',
        square && 'avatar-square',
        avTint(name),
        className,
      )}
    >
      {src ? <img src={src} alt={name ?? ''} className="w-full h-full object-cover" /> : initials(name)}
    </span>
  )
}
