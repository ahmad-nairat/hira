import { SelectHTMLAttributes, ReactNode, forwardRef } from 'react'
import clsx from 'clsx'

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  children: ReactNode
}

const Select = forwardRef<HTMLSelectElement, Props>(function Select(
  { label, error, hint, id, className, children, ...rest }, ref,
) {
  const inputId = id ?? rest.name
  return (
    <div className="field">
      {label ? <label htmlFor={inputId} className="label">{label}</label> : null}
      <select id={inputId} ref={ref} className={clsx('select', className)} {...rest}>{children}</select>
      {error ? <div className="field-error">{error}</div> : hint ? <div className="field-help">{hint}</div> : null}
    </div>
  )
})
export default Select
