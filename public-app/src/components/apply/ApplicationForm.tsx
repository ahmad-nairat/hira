'use client'

import { useMemo, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { JobFormFieldDTO, JobFormSectionDTO, OrgBranding } from '../../types/api'
import FormField from './FormField'

interface Props {
  org: OrgBranding
  form: { sections: JobFormSectionDTO[]; fields: JobFormFieldDTO[] }
  onSubmit: (formData: FormData) => Promise<void>
  errorMessage?: string | null
}

export default function ApplicationForm({ org, form, onSubmit, errorMessage }: Props) {
  const [values, setValues] = useState<Record<string, unknown>>({})
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)
  const files = useRef<Record<string, File | null>>({})

  const grouped = useMemo(() => {
    const sections = [...form.sections].sort((a, b) => a.sortOrder - b.sortOrder)
    const noSection = form.fields.filter((f) => !f.sectionId).sort((a, b) => a.sortOrder - b.sortOrder)
    return {
      ungrouped: noSection,
      sections: sections.map((s) => ({
        section: s,
        fields: form.fields.filter((f) => f.sectionId === s.id).sort((a, b) => a.sortOrder - b.sortOrder),
      })),
    }
  }, [form])

  const validate = () => {
    const next: Record<string, string> = {}
    for (const f of form.fields) {
      const v = f.isResume ? files.current[f.id] : values[f.id]
      if (f.isRequired && (v === undefined || v === '' || v === null)) {
        next[f.id] = `${f.label} is required`
        continue
      }
      if (f.validation && f.type === 'number' && v !== undefined && v !== '') {
        const n = Number(v)
        if (f.validation.min !== undefined && n < f.validation.min) next[f.id] = `Minimum is ${f.validation.min}`
        if (f.validation.max !== undefined && n > f.validation.max) next[f.id] = `Maximum is ${f.validation.max}`
      }
      if (f.validation && (f.type === 'text' || f.type === 'textarea') && typeof v === 'string') {
        if (f.validation.minLength !== undefined && v.length < f.validation.minLength) next[f.id] = `Minimum ${f.validation.minLength} characters`
        if (f.validation.maxLength !== undefined && v.length > f.validation.maxLength) next[f.id] = `Maximum ${f.validation.maxLength} characters`
      }
    }
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validate()) return
    setSubmitting(true)
    const fd = new FormData()
    const answers: Record<string, unknown> = {}
    for (const f of form.fields) {
      if (f.isResume) {
        const file = files.current[f.id]
        if (file) fd.append('resume', file)
      } else {
        answers[f.id] = values[f.id] ?? ''
      }
    }
    fd.append('answers', JSON.stringify(answers))
    try { await onSubmit(fd) } finally { setSubmitting(false) }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-12">
      {grouped.ungrouped.length > 0 && (
        <FieldsSection title="About you" fields={grouped.ungrouped} values={values} errors={errors} setValues={setValues} files={files} />
      )}
      {grouped.sections.map(({ section, fields }) => (
        <FieldsSection
          key={section.id}
          title={section.title}
          fields={fields}
          values={values}
          errors={errors}
          setValues={setValues}
          files={files}
        />
      ))}

      <div className="pt-2">
        <p className="text-[12.5px] text-ink-3 mb-4">
          By submitting you agree to {org.name}'s privacy policy. We'll only use your information for this application.
        </p>
        {errorMessage ? (
          <div className="mb-4 px-4 py-3 rounded-xl bg-rose/[0.08] border border-rose/30 text-rose text-[13.5px]">
            {errorMessage}
          </div>
        ) : null}
        <button type="submit" className="btn-brand w-full !justify-center !h-12" disabled={submitting}>
          {submitting ? 'Submitting…' : 'Submit application'} <ArrowRight size={15} />
        </button>
      </div>
    </form>
  )
}

interface SectionProps {
  title: string
  fields: JobFormFieldDTO[]
  values: Record<string, unknown>
  errors: Record<string, string>
  setValues: React.Dispatch<React.SetStateAction<Record<string, unknown>>>
  files: React.MutableRefObject<Record<string, File | null>>
}

function FieldsSection({ title, fields, values, errors, setValues, files }: SectionProps) {
  return (
    <section>
      <h2 className="font-instr italic text-[26px] text-ink mb-6">{title}</h2>
      <div className="space-y-5">
        {fields.map((f) => (
          <FormField
            key={f.id}
            field={f}
            value={values[f.id]}
            error={errors[f.id]}
            onChange={(v) => setValues((p) => ({ ...p, [f.id]: v }))}
            onFileChange={(file) => { files.current[f.id] = file }}
          />
        ))}
      </div>
    </section>
  )
}
