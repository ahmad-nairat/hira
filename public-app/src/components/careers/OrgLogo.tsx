import clsx from 'clsx'

interface Props {
  name: string
  src?: string | null
  size?: number
  className?: string
}

export default function OrgLogo({ name, src, size = 32, className }: Props) {
  if (src) {
    return <img src={src} alt={name} width={size} height={size} className={clsx('rounded-lg object-contain', className)} style={{ width: size, height: size }} />
  }
  return (
    <span
      className={clsx('inline-grid place-items-center font-medium text-white shrink-0', className)}
      style={{
        width: size, height: size, fontSize: size * 0.5, lineHeight: 1,
        borderRadius: size * 0.28, background: 'var(--brand)',
      }}
    >
      {name.charAt(0).toUpperCase()}
    </span>
  )
}
