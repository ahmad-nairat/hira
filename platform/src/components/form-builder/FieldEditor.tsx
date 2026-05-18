import { ReactNode } from 'react'
import clsx from 'clsx'
import { ChevronDown, ChevronUp, GripVertical, Lock, Trash2, Type, Hash, Calendar, Paperclip, ChevronDownSquare, CheckSquare } from 'lucide-react'
import type { FieldType, ReadJobFormFieldDTO } from '../../types/api'
import Input from '../ui/Input'
import Toggle from '../ui/Toggle'

const FIELD_ICONS: Record<FieldType, typeof Type> = {
  text: Type, textarea: Type, number: Hash,
  dropdown: ChevronDownSquare, checkbox: CheckSquare, date: Calendar, file: Paperclip,
}
const FIELD_LABELS: Record<FieldType, string> = {
  text: 'Short text', textarea: 'Long text', number: 'Number',
  dropdown: 'Dropdown', checkbox: 'Checkbox', date: 'Date', file: 'File',
}

interface Props {
  field: ReadJobFormFieldDTO
  expanded: boolean
  onToggle: () => void
  onUpdate: (patch: Partial<ReadJobFormFieldDTO>) => void
  onRemove: () => void
  renderControls?: () => ReactNode
}

export default function FieldEditor({ field: f, expanded, onToggle, onUpdate, onRemove, renderControls }: Props) {
  const Ico = FIELD_ICONS[f.type]

  const updateOption = (i: number, label: string) =>
    onUpdate({ options: (f.options ?? []).map((o, ix) => (ix === i ? { ...o, label, value: o.value || label.toLowerCase().replace(/\s+/g, '-') } : o)) })
  const addOption = () => onUpdate({ options: [...(f.options ?? []), { label: `Option ${(f.options?.length ?? 0) + 1}`, value: `opt${(f.options?.length ?? 0) + 1}` }] })
  const removeOption = (i: number) => onUpdate({ options: (f.options ?? []).filter((_, ix) => ix !== i) })

  return (
    <div className={clsx('bg-surface rounded-md overflow-hidden transition-colors border', expanded ? 'border-border-strong' : 'border-border-soft')}>
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="drag-handle"><GripVertical size={14} /></span>
        <div className="icon-tile" style={{ width: 28, height: 28 }}><Ico size={12} /></div>
        <button onClick={onToggle} className="flex-1 min-w-0 text-left bg-transparent border-0 text-ink p-0 cursor-pointer">
          <div className="text-sm font-medium truncate">{f.label || <span className="text-ink-4">Untitled field</span>}</div>
          <div className="text-ink-4 text-xs truncate mt-px">
            {FIELD_LABELS[f.type]}
            {f.options && (f.type === 'dropdown' || f.type === 'checkbox') ? ` · ${f.options.length} options` : ''}
            {f.isRequired ? ' · Required' : ''}
            {f.isResume ? ' · Resume' : ''}
          </div>
        </button>
        <label className="text-xs text-ink-3 flex items-center gap-1 cursor-pointer" onClick={(e) => e.stopPropagation()}>
          <Toggle checked={f.isRequired} onChange={(e) => onUpdate({ isRequired: e.target.checked })} />
          Required
        </label>
        {renderControls?.()}
        <button className="icon-btn btn-icon-sm" onClick={(e) => { e.stopPropagation(); onRemove() }} title="Delete field"><Trash2 size={13} /></button>
        <button className="icon-btn btn-icon-sm" onClick={onToggle}>
          {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>
      </div>

      {expanded && (
        <div className="px-3.5 pt-1 pb-3.5 border-t border-border-soft bg-surface-2 flex flex-col gap-3">
          <Input label="Label" value={f.label} onChange={(e) => onUpdate({ label: e.target.value })} placeholder="Question label…" />
          {(f.type === 'text' || f.type === 'textarea' || f.type === 'number' || f.type === 'date') && (
            <Input label="Placeholder" value={f.placeholder ?? ''} onChange={(e) => onUpdate({ placeholder: e.target.value || null })} hint="Hint shown in the empty input" />
          )}
          {f.type === 'number' && (
            <div className="grid grid-cols-2 gap-2.5">
              <Input label="Min" type="number" value={f.validation?.min ?? ''} onChange={(e) => onUpdate({ validation: { ...f.validation, min: e.target.value === '' ? undefined : Number(e.target.value) } })} />
              <Input label="Max" type="number" value={f.validation?.max ?? ''} onChange={(e) => onUpdate({ validation: { ...f.validation, max: e.target.value === '' ? undefined : Number(e.target.value) } })} />
            </div>
          )}
          {(f.type === 'text' || f.type === 'textarea') && (
            <div className="grid grid-cols-2 gap-2.5">
              <Input label="Min length" type="number" value={f.validation?.minLength ?? ''} onChange={(e) => onUpdate({ validation: { ...f.validation, minLength: e.target.value === '' ? undefined : Number(e.target.value) } })} />
              <Input label="Max length" type="number" value={f.validation?.maxLength ?? ''} onChange={(e) => onUpdate({ validation: { ...f.validation, maxLength: e.target.value === '' ? undefined : Number(e.target.value) } })} />
            </div>
          )}
          {(f.type === 'dropdown' || f.type === 'checkbox') && (
            <div className="field">
              <label className="label">{f.type === 'dropdown' ? 'Options' : 'Checkbox items'}</label>
              <div className="flex flex-col gap-1.5">
                {(f.options ?? []).map((opt, i) => (
                  <div key={i} className="flex items-center gap-1">
                    <span
                      className="w-[18px] h-[18px] inline-flex items-center justify-center border-[1.5px] border-ink-5 text-ink-5 shrink-0"
                      style={{ borderRadius: f.type === 'checkbox' ? 4 : 999 }}
                    />
                    <input className="input" value={opt.label} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Option ${i + 1}`} />
                    <button className="icon-btn btn-icon-sm" onClick={() => removeOption(i)}><Trash2 size={12} /></button>
                  </div>
                ))}
              </div>
              <button className="btn btn-ghost btn-sm self-start mt-2" onClick={addOption}>+ Add option</button>
            </div>
          )}
          {f.type === 'file' && (
            <label className="text-xs text-ink-3 flex items-center gap-2 px-3 py-2.5 bg-bg rounded-md border border-border-soft">
              <Toggle checked={f.isResume} onChange={(e) => onUpdate({ isResume: e.target.checked })} />
              <Lock size={11} /> This is the candidate's resume
            </label>
          )}
        </div>
      )}
    </div>
  )
}
