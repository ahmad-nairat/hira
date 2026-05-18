import clsx from 'clsx'

interface Props {
  size?: number
  className?: string
}

export default function HiraLogo({ size = 32, className }: Props) {
  return (
    <span
      className={clsx('inline-grid place-items-center font-instr italic font-medium text-white', className)}
      style={{
        width: size, height: size,
        fontSize: size * 0.6, lineHeight: 1,
        background: 'linear-gradient(135deg, #8B6FFF, #6E58E6)',
        borderRadius: size * 0.28,
      }}
    >
      H
    </span>
  )
}
