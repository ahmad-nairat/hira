import { InputHTMLAttributes, ReactNode, forwardRef } from 'react'
import clsx from 'clsx'

interface Props extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: ReactNode
  right?: ReactNode
}

const Input = forwardRef<HTMLInputElement, Props>(function Input(
  { label, error, hint, leftIcon, right, id, className, ...rest }, ref,
) {
  const inputId = id ?? rest.name
  const inputEl = (
    <input id={inputId} ref={ref} className={clsx('input', className)} {...rest} />
  )
  return (
    <div className="field">
      {label ? <label htmlFor={inputId} className="label">{label}</label> : null}
      {leftIcon || right ? (
        <div className="input-icon-wrap">
          {leftIcon ? <span className="icon">{leftIcon}</span> : null}
          {inputEl}
          {right ? <span className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">{right}</span> : null}
        </div>
      ) : (
        inputEl
      )}
      {error ? <div className="field-error">{error}</div> : hint ? <div className="field-help">{hint}</div> : null}
    </div>
  )
})
export default Input
