import { TextareaHTMLAttributes, forwardRef } from 'react'
import clsx from 'clsx'

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, Props>(function Textarea(
  { label, error, hint, id, className, ...rest }, ref,
) {
  const inputId = id ?? rest.name
  return (
    <div className="field">
      {label ? <label htmlFor={inputId} className="label">{label}</label> : null}
      <textarea id={inputId} ref={ref} className={clsx('textarea', className)} {...rest} />
      {error ? <div className="field-error">{error}</div> : hint ? <div className="field-help">{hint}</div> : null}
    </div>
  )
})
export default Textarea
