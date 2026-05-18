import { Upload } from 'lucide-react'
import type { FormDraft } from './FormBuilder'

interface Props { draft: FormDraft; jobTitle?: string }

export default function FormPreview({ draft, jobTitle }: Props) {
  return (
    <div className="card p-[22px] max-h-[640px] overflow-auto">
      <div className="text-[18px] font-serif font-medium mb-1">{jobTitle || 'Untitled job'}</div>
      <div className="text-ink-4 text-xs mb-4">Preview shown to candidates</div>
      {draft.fields.length === 0 ? (
        <div className="text-ink-4 text-sm italic py-6 text-center">Add fields to see the preview.</div>
      ) : (
        draft.fields.map((f) => (
          <div className="field mb-3.5" key={f.id}>
            <label className="label">
              {f.label || <span className="text-ink-4">Untitled field</span>}
              {f.isRequired && <span className="text-rose-ink ml-1">*</span>}
            </label>
            {f.type === 'text' && <input className="input" placeholder={f.placeholder ?? 'Type your answer…'} disabled />}
            {f.type === 'textarea' && <textarea className="textarea" rows={3} placeholder={f.placeholder ?? 'Type your answer…'} disabled />}
            {f.type === 'number' && <input className="input" type="number" placeholder={f.placeholder ?? '0'} disabled />}
            {f.type === 'date' && <input className="input" type="date" disabled />}
            {f.type === 'dropdown' && (
              <select className="select" disabled>
                <option>Select…</option>
                {(f.options ?? []).map((o) => <option key={o.value}>{o.label}</option>)}
              </select>
            )}
            {f.type === 'checkbox' && (
              <div className="flex flex-col gap-1.5 py-1">
                {(f.options ?? [{ label: 'Yes', value: 'yes' }]).map((o) => (
                  <label key={o.value} className="flex items-center gap-2 text-sm text-ink-2">
                    <span className="w-4 h-4 border-[1.5px] border-ink-5 rounded-[3px] shrink-0" />
                    {o.label}
                  </label>
                ))}
              </div>
            )}
            {f.type === 'file' && (
              <div className="p-4 border border-dashed border-border rounded-md text-center text-ink-4">
                <Upload size={16} className="mx-auto" />
                <div className="text-xs mt-1">Drag your {f.isResume ? 'resume' : 'file'} here</div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  )
}
