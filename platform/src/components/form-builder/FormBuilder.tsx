import { useState } from 'react'
import { Plus, Lock, Trash2, ChevronUp, ChevronDown, GripVertical, Type, Hash, Calendar, Paperclip, ChevronDownSquare, CheckSquare } from 'lucide-react'
import type { FieldType, ReadJobFormFieldDTO, ReadJobFormSectionDTO } from '../../types/api'
import Button from '../ui/Button'
import Toggle from '../ui/Toggle'
import FieldEditor from './FieldEditor'
import FormPreview from './FormPreview'

export interface FormDraft {
  sections: ReadJobFormSectionDTO[]
  fields: ReadJobFormFieldDTO[]
}

interface Props { draft: FormDraft; onChange: (d: FormDraft) => void; jobTitle?: string }

const FIELD_LABELS: Record<FieldType, string> = {
  text: 'Short text', textarea: 'Long text', number: 'Number',
  dropdown: 'Dropdown', checkbox: 'Checkbox', date: 'Date', file: 'File',
}
const FIELD_ICONS: Record<FieldType, typeof Type> = {
  text: Type, textarea: Type, number: Hash,
  dropdown: ChevronDownSquare, checkbox: CheckSquare, date: Calendar, file: Paperclip,
}

function uid(): string { return `tmp_${Math.random().toString(36).slice(2, 10)}` }

export default function FormBuilder({ draft, onChange, jobTitle }: Props) {
  const [showPicker, setShowPicker] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const addField = (type: FieldType) => {
    const id = uid()
    const isResume = type === 'file' && !draft.fields.some((f) => f.isResume)
    const newField: ReadJobFormFieldDTO = {
      id,
      sectionId: draft.sections[0]?.id ?? null,
      type,
      label: type === 'file' ? (isResume ? 'Resume / CV' : 'Untitled file') : `${FIELD_LABELS[type]} question`,
      placeholder: null,
      isRequired: false,
      isResume,
      sortOrder: draft.fields.length,
      options: type === 'dropdown' || type === 'checkbox' ? [{ label: 'Option 1', value: 'opt1' }] : null,
      validation: null,
    }
    onChange({ sections: draft.sections, fields: [...draft.fields, newField] })
    setExpandedId(id)
    setShowPicker(false)
  }

  const updateField = (id: string, patch: Partial<ReadJobFormFieldDTO>) => {
    let next = draft.fields.map((f) => (f.id === id ? { ...f, ...patch } : f))
    if (patch.isResume === true) next = next.map((f) => (f.id !== id && f.isResume ? { ...f, isResume: false } : f))
    onChange({ sections: draft.sections, fields: next })
  }
  const removeField = (id: string) => {
    onChange({ sections: draft.sections, fields: draft.fields.filter((f) => f.id !== id) })
    if (expandedId === id) setExpandedId(null)
  }
  const moveField = (id: string, dir: -1 | 1) => {
    const idx = draft.fields.findIndex((f) => f.id === id)
    if (idx < 0) return
    const swap = idx + dir
    if (swap < 0 || swap >= draft.fields.length) return
    const next = [...draft.fields]
    ;[next[idx], next[swap]] = [next[swap], next[idx]]
    next.forEach((f, i) => (f.sortOrder = i))
    onChange({ sections: draft.sections, fields: next })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1fr_420px] gap-5 items-start">
      <div className="card p-[18px]">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <div className="text-sm font-semibold">Fields</div>
            <div className="text-ink-4 text-xs">Click a field to edit it. Use arrows to reorder.</div>
          </div>
          <div className="relative">
            <Button variant="secondary" size="sm" onClick={() => setShowPicker((p) => !p)}>
              <Plus size={13} /> Add field
            </Button>
            {showPicker && (
              <div onMouseLeave={() => setShowPicker(false)} className="absolute top-9 right-0 z-30 bg-surface border border-border rounded-md p-1.5 min-w-[200px] shadow-pop">
                {(Object.keys(FIELD_LABELS) as FieldType[]).filter((k) => k !== 'file').map((k) => {
                  const Ico = FIELD_ICONS[k]
                  return (
                    <button key={k} className="nav-item" onClick={() => addField(k)}>
                      <Ico size={13} className="nav-icon" /> {FIELD_LABELS[k]}
                    </button>
                  )
                })}
                <button className="nav-item" onClick={() => addField('file')}>
                  <Paperclip size={13} className="nav-icon" /> File
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          {draft.fields.length === 0 ? (
            <div className="text-ink-4 text-sm italic py-6 text-center">Add fields from the picker above.</div>
          ) : null}
          {draft.fields.map((f, i) => (
            <div key={f.id}>
              <FieldEditor
                field={f}
                expanded={expandedId === f.id}
                onToggle={() => setExpandedId(expandedId === f.id ? null : f.id)}
                onUpdate={(patch) => updateField(f.id, patch)}
                onRemove={() => removeField(f.id)}
                renderControls={() => (
                  <>
                    <button className="icon-btn btn-icon-sm" onClick={() => moveField(f.id, -1)} disabled={i === 0}><ChevronUp size={12} /></button>
                    <button className="icon-btn btn-icon-sm" onClick={() => moveField(f.id, 1)} disabled={i === draft.fields.length - 1}><ChevronDown size={12} /></button>
                  </>
                )}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <div className="mono-label mb-2">Preview · How candidates see it</div>
        <FormPreview draft={draft} jobTitle={jobTitle} />
      </div>
    </div>
  )
}

export { FIELD_LABELS, FIELD_ICONS, FieldEditor }
