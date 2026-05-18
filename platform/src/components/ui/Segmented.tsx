import clsx from 'clsx'

interface Item<T extends string> { value: T; label: string }
interface Props<T extends string> {
  value: T
  onChange: (v: T) => void
  options: Item<T>[]
  subtle?: boolean
  className?: string
  full?: boolean
}
export default function Segmented<T extends string>({ value, onChange, options, subtle, className, full }: Props<T>) {
  return (
    <div className={clsx('segmented', subtle && 'subtle', full && 'flex', className)}>
      {options.map((opt) => (
        <button
          key={opt.value}
          className={clsx('seg', opt.value === value && 'active', full && 'flex-1')}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </button>
      ))}
    </div>
  )
}
