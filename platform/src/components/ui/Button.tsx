import { ButtonHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg' | 'icon' | 'icon-sm'

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, Props>(function Button(
  { variant = 'ghost', size = 'md', loading, disabled, className, children, ...rest }, ref,
) {
  return (
    <button
      ref={ref}
      className={clsx(
        size === 'icon' || size === 'icon-sm' ? 'icon-btn' : 'btn',
        size === 'icon-sm' && 'btn-icon-sm',
        size === 'sm' && 'btn-sm',
        size === 'lg' && 'btn-lg',
        variant === 'primary' && 'btn-primary',
        variant === 'secondary' && 'btn-secondary',
        variant === 'ghost' && 'btn-ghost',
        variant === 'danger' && 'btn-danger',
        className,
      )}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : null}
      {children}
    </button>
  )
})
export default Button
