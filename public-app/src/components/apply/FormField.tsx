'use client'

import clsx from 'clsx'
import { ChevronDown } from 'lucide-react'
import type { JobFormFieldDTO } from '../../types/api'
import FileUploadField from './FileUploadField'

interface Props {
  field: JobFormFieldDTO
  value: unknown
  error?: string
  onChange: (v: unknown) => void
  onFileChange: (f: File | null) => void
}

export default function FormField({ field, value, error, onChange, onFileChange }: Props) {
  const id = `field-${field.id}`

  return (
    <div>
      <label htmlFor={id} className="lt-label">
        {field.label}
        {field.isRequired && <span className="text-rose ml-1" aria-hidden>*</span>}
      </label>

      {field.type === 'text' && (
        <input id={id} type="text" className={clsx('lt-input', error && 'border-rose')}
          placeholder={field.placeholder ?? ''} value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)} />
      )}

      {field.type === 'textarea' && (
        <textarea id={id} rows={5} className={clsx('lt-textarea', error && 'border-rose')}
          placeholder={field.placeholder ?? ''} value={String(value ?? '')}
          onChange={(e) => onChange(e.target.value)} />
      )}

      {field.type === 'number' && (
        <input id={id} type="number" className={clsx('lt-input', error && 'border-rose')}
          placeholder={field.placeholder ?? ''} value={String(value ?? '')}
          min={field.validation?.min} max={field.validation?.max}
          onChange={(e) => onChange(e.target.value)} />
      )}

      {field.type === 'dropdown' && (
        <div className="relative">
          <select id={id} className={clsx('lt-select pr-10', error && 'border-rose')}
            value={String(value ?? '')} onChange={(e) => onChange(e.target.value)}>
            <option value="">Select an option…</option>
            {(field.options ?? []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-ink-3 pointer-events-none" />
        </div>
      )}

      {field.type === 'checkbox' && (
        <fieldset className="space-y-2.5">
          {(field.options ?? [{ label: 'Yes', value: 'yes' }]).map((o) => {
            const arr: string[] = Array.isArray(value) ? value as string[] : []
            const checked = arr.includes(o.value)
            return (
              <label key={o.value} className="flex items-center gap-2.5 cursor-pointer text-[14px] text-ink">
                <span
                  className={clsx(
                    'w-5 h-5 rounded-md border-2 grid place-items-center transition-colors',
                    checked ? 'bg-[var(--brand)] border-[var(--brand)] text-white' : 'border-lt-border bg-white',
                  )}
                >
                  {checked ? '✓' : null}
                </span>
                <input type="checkbox" id={id} className="sr-only"
                  checked={checked}
                  onChange={() => onChange(checked ? arr.filter((v) => v !== o.value) : [...arr, o.value])} />
                {o.label}
              </label>
            )
          })}
        </fieldset>
      )}

      {field.type === 'date' && (
        <input id={id} type="date" className={clsx('lt-input', error && 'border-rose')}
          value={String(value ?? '')} onChange={(e) => onChange(e.target.value)} />
      )}

      {field.type === 'file' && (
        <FileUploadField id={id} isResume={field.isResume} onChange={onFileChange} />
      )}

      {field.validation && (field.validation.min !== undefined || field.validation.max !== undefined) ? (
        <div className="lt-help">Between {field.validation.min ?? 0} and {field.validation.max ?? '∞'}.</div>
      ) : null}
      {error ? <div className="text-rose text-[12px] mt-1.5">{error}</div> : null}
    </div>
  )
}
