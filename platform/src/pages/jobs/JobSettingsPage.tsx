import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { ArrowLeft } from 'lucide-react'
import { jobsApi } from '../../api/jobs.api'
import { jobFormApi } from '../../api/job-form.api'
import { useOrgId } from '../../hooks/useOrg'
import Spinner from '../../components/ui/Spinner'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import FormBuilder, { FormDraft } from '../../components/form-builder/FormBuilder'
import { extractError } from '../../api/client'
import type { JobType, ReadJobDTO } from '../../types/api'

const TABS = [
  { id: 'general', l: 'General' }, { id: 'form', l: 'Application form' },
  { id: 'criteria', l: 'Rejection criteria' }, { id: 'scoring', l: 'Scoring rules' },
  { id: 'weights', l: 'Scoring weights' },
] as const
type TabId = (typeof TABS)[number]['id']

export default function JobSettingsPage() {
  const { jobId = '' } = useParams()
  const orgId = useOrgId()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const [tab, setTab] = useState<TabId>('general')
  const job = useQuery({ queryKey: ['jobs', orgId, jobId], queryFn: () => jobsApi.get(orgId, jobId) })
  const form = useQuery({ queryKey: ['job-form', jobId], queryFn: () => jobFormApi.get(orgId, jobId) })
  const [patch, setPatch] = useState<Partial<ReadJobDTO>>({})
  const [draft, setDraft] = useState<FormDraft>({ sections: [], fields: [] })

  useEffect(() => { if (form.data) setDraft({ sections: form.data.sections, fields: form.data.fields }) }, [form.data])

  const update = useMutation({
    mutationFn: () => jobsApi.update(orgId, jobId, patch),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['jobs', orgId, jobId] }); setPatch({}) },
  })
  const saveForm = useMutation({
    mutationFn: () => jobFormApi.save(orgId, jobId, draft),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['job-form', jobId] }),
  })

  if (job.isLoading) return <Spinner block />
  if (!job.data) return <div className="p-7 text-rose-ink">Job not found.</div>
  const j = job.data
  const set = <K extends keyof ReadJobDTO>(k: K, v: ReadJobDTO[K]) => setPatch({ ...patch, [k]: v })
  const val = <K extends keyof ReadJobDTO>(k: K): ReadJobDTO[K] => (patch[k] !== undefined ? (patch[k] as ReadJobDTO[K]) : j[k])

  return (
    <div className="p-7">
      <Link to={`/jobs/${jobId}`} className="btn btn-ghost btn-sm mb-4 pl-1"><ArrowLeft size={14} /> Back to job</Link>
      <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-6">
        <div className="flex flex-col gap-px sticky top-20 self-start">
          {TABS.map((t) => (
            <button key={t.id} className={clsx('settings-nav-item', tab === t.id && 'active')} onClick={() => setTab(t.id)}>{t.l}</button>
          ))}
        </div>
        <div className="max-w-[720px] w-full">
          {tab === 'general' && (
            <div className="card p-6">
              <div className="mono-label mb-1">General info</div>
              <div className="font-serif font-medium text-[22px] mb-4">Edit job <span className="ital">details</span></div>
              <Input label="Title" value={val('title') as string} onChange={(e) => set('title', e.target.value)} />
              <div className="mt-3.5">
                <Textarea label="Description" rows={8} value={val('description') as string} onChange={(e) => set('description', e.target.value)} />
              </div>
              <div className="grid grid-cols-2 gap-3.5 mt-3.5">
                <Input label="Location" value={val('location') as string} onChange={(e) => set('location', e.target.value)} />
                <Select label="Type" value={val('type') as JobType} onChange={(e) => set('type', e.target.value as JobType)}>
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="internship">Internship</option>
                </Select>
              </div>
              <div className="grid grid-cols-[1fr_1fr_100px] gap-2 mt-3.5">
                <Input label="Salary min" type="number" value={(val('salaryMin') as number | null) ?? ''} onChange={(e) => set('salaryMin', e.target.value ? Number(e.target.value) : null)} />
                <Input label="Salary max" type="number" value={(val('salaryMax') as number | null) ?? ''} onChange={(e) => set('salaryMax', e.target.value ? Number(e.target.value) : null)} />
                <Input label="Currency" value={(val('salaryCurrency') as string) ?? ''} maxLength={3} onChange={(e) => set('salaryCurrency', e.target.value.toUpperCase() || null)} />
              </div>
              {update.isError && <div className="field-error mt-2">{extractError(update.error)}</div>}
              <div className="flex gap-2 mt-5">
                <Button variant="primary" onClick={() => update.mutate()} loading={update.isPending} disabled={Object.keys(patch).length === 0}>Save changes</Button>
                <Button onClick={() => setPatch({})} disabled={Object.keys(patch).length === 0}>Discard</Button>
              </div>
            </div>
          )}

          {tab === 'form' && (
            <div className="card p-6">
              <div className="mono-label mb-1">Application form</div>
              <div className="font-serif font-medium text-[22px] mb-4">What candidates <span className="ital">fill in</span></div>
              <FormBuilder draft={draft} onChange={setDraft} jobTitle={j.title} />
              {saveForm.isError && <div className="field-error mt-3">{extractError(saveForm.error)}</div>}
              <div className="mt-5">
                <Button variant="primary" onClick={() => saveForm.mutate()} loading={saveForm.isPending}>Save form</Button>
              </div>
            </div>
          )}

          {tab === 'criteria' && (
            <CriteriaSection
              title={<>Auto-reject <span className="ital">criteria</span></>}
              label="Early rejection"
              value={(val('rejectionCriteria') as string[]) ?? []}
              onSave={(v) => { set('rejectionCriteria', v); update.mutate() }}
              loading={update.isPending}
              placeholder="e.g. Not authorized to work in EU"
              addLabel="Add criterion"
            />
          )}

          {tab === 'scoring' && (
            <CriteriaSection
              title={<>AI scoring <span className="ital">rules</span></>}
              label="Scoring instructions"
              value={(val('scoringInstructions') as string[]) ?? []}
              onSave={(v) => { set('scoringInstructions', v); update.mutate() }}
              loading={update.isPending}
              placeholder="e.g. Add 5 points for React 18 experience"
              addLabel="Add instruction"
            />
          )}

          {tab === 'weights' && (
            <div className="card p-6">
              <div className="mono-label mb-1">Scoring weights</div>
              <div className="font-serif font-medium text-[22px] mb-4">How Hira weighs this <span className="ital">role</span></div>
              <p className="text-ink-3 text-sm">Leave each weight at <code className="font-mono bg-surface-2 px-1.5 py-px rounded text-xs">null</code> to inherit from the org.</p>
              <div className="grid grid-cols-2 gap-3.5 mt-5">
                <Input label="Skills (0..1)" type="number" step="0.05" min="0" max="1" value={(val('scoringSkills') as number | null) ?? ''} onChange={(e) => set('scoringSkills', e.target.value ? Number(e.target.value) : null)} />
                <Input label="Experience (0..1)" type="number" step="0.05" min="0" max="1" value={(val('scoringExperience') as number | null) ?? ''} onChange={(e) => set('scoringExperience', e.target.value ? Number(e.target.value) : null)} />
                <Input label="Education (0..1)" type="number" step="0.05" min="0" max="1" value={(val('scoringEducation') as number | null) ?? ''} onChange={(e) => set('scoringEducation', e.target.value ? Number(e.target.value) : null)} />
                <Input label="Certifications (0..1)" type="number" step="0.05" min="0" max="1" value={(val('scoringCerts') as number | null) ?? ''} onChange={(e) => set('scoringCerts', e.target.value ? Number(e.target.value) : null)} />
              </div>
              {update.isError && <div className="field-error mt-2">{extractError(update.error)}</div>}
              <div className="flex gap-2 mt-5">
                <Button variant="primary" onClick={() => update.mutate()} loading={update.isPending} disabled={Object.keys(patch).length === 0}>Save weights</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

interface CriteriaSectionProps {
  title: React.ReactNode
  label: string
  value: string[]
  onSave: (v: string[]) => void
  loading: boolean
  placeholder: string
  addLabel: string
}

function CriteriaSection({ title, label, value, onSave, loading, placeholder, addLabel }: CriteriaSectionProps) {
  const [items, setItems] = useState(value)
  useEffect(() => setItems(value), [value])
  return (
    <div className="card p-6">
      <div className="mono-label mb-1">{label}</div>
      <div className="font-serif font-medium text-[22px] mb-4">{title}</div>
      <div className="flex flex-col gap-2">
        {items.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="font-mono text-ink-4 text-xs w-6">{String(i + 1).padStart(2, '0')}</span>
            <input className="input" value={v} onChange={(e) => setItems(items.map((x, ix) => (ix === i ? e.target.value : x)))} placeholder={placeholder} />
            <button className="icon-btn" onClick={() => setItems(items.filter((_, ix) => ix !== i))}>×</button>
          </div>
        ))}
      </div>
      <Button className="mt-3" onClick={() => setItems([...items, ''])}>+ {addLabel}</Button>
      <div className="mt-5">
        <Button variant="primary" onClick={() => onSave(items.filter(Boolean))} loading={loading}>Save changes</Button>
      </div>
    </div>
  )
}
