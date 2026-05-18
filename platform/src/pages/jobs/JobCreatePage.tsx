import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { ArrowLeft, ArrowRight, Check, Info, MapPin, Plus, Sparkles, Trash2, AlertTriangle, CheckCircle } from 'lucide-react'
import { jobsApi } from '../../api/jobs.api'
import { jobFormApi } from '../../api/job-form.api'
import { useOrgId } from '../../hooks/useOrg'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Textarea from '../../components/ui/Textarea'
import Segmented from '../../components/ui/Segmented'
import Banner from '../../components/ui/Banner'
import FormBuilder, { FormDraft } from '../../components/form-builder/FormBuilder'
import { extractError } from '../../api/client'
import type { JobType } from '../../types/api'
import clsx from 'clsx'

const STEPS = ['General', 'Form builder', 'Reject criteria', 'Scoring rules', 'Weights'] as const

export default function JobCreatePage() {
  const navigate = useNavigate()
  const orgId = useOrgId()
  const [step, setStep] = useState(1)
  const [general, setGeneral] = useState({
    title: '', description: '', location: '', type: 'full_time' as JobType,
    salaryMin: '', salaryMax: '', currency: 'USD',
  })
  const [formDraft, setFormDraft] = useState<FormDraft>({ sections: [], fields: [] })
  const [criteria, setCriteria] = useState<string[]>([])
  const [scoring, setScoring] = useState<string[]>([])
  const [useOrgWeights, setUseOrgWeights] = useState(true)
  const [weights, setWeights] = useState({ skills: 40, experience: 35, education: 25, certs: 0 })
  const total = weights.skills + weights.experience + weights.education + weights.certs
  const valid = total === 100

  const save = useMutation({
    mutationFn: async (publish: boolean) => {
      const created = await jobsApi.create(orgId, {
        title: general.title,
        description: general.description,
        location: general.location,
        type: general.type,
        salaryMin: general.salaryMin ? Number(general.salaryMin) : null,
        salaryMax: general.salaryMax ? Number(general.salaryMax) : null,
        salaryCurrency: general.currency,
        hiringManagerId: null,
        rejectionCriteria: criteria.filter(Boolean),
        scoringInstructions: scoring.filter(Boolean),
        scoringSkills: useOrgWeights ? null : weights.skills / 100,
        scoringExperience: useOrgWeights ? null : weights.experience / 100,
        scoringEducation: useOrgWeights ? null : weights.education / 100,
        scoringCerts: useOrgWeights ? null : weights.certs / 100,
      })
      await jobFormApi.save(orgId, created.id, formDraft)
      if (publish) await jobsApi.publish(orgId, created.id)
      return created
    },
    onSuccess: (job) => navigate(`/jobs/${job.id}`),
  })

  return (
    <div className="max-w-[980px] mx-auto px-7 py-7">
      <div className="flex items-center gap-3 py-5 mb-2">
        {STEPS.map((label, i) => {
          const n = i + 1
          const state = step === n ? 'active' : step > n ? 'done' : ''
          return (
            <span key={label} className="flex items-center gap-3">
              <div className={clsx('wstep', state)}>
                <span className="num">{step > n ? <Check size={12} /> : n}</span>
                <span>{label}</span>
              </div>
              {i < STEPS.length - 1 && <div className={clsx('wstep-line', step > n && 'done')} />}
            </span>
          )
        })}
      </div>

      <div className="mono-label mb-2">Step {step} of {STEPS.length} · {STEPS[step - 1]}</div>
      <h1 className="h-display text-[34px] mt-1">
        {step === 1 && <>Tell us about the <span className="ital">role</span>.</>}
        {step === 2 && <>Build the <span className="ital">application</span>.</>}
        {step === 3 && <>Filter early <span className="ital">rejections</span>.</>}
        {step === 4 && <>Tune the <span className="ital">scoring</span>.</>}
        {step === 5 && <>Set <span className="ital">weights</span>.</>}
      </h1>

      <div className="mt-6">
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <Input label="Job title" value={general.title} onChange={(e) => setGeneral({ ...general, title: e.target.value })} placeholder="e.g. Senior Frontend Engineer" />
            <Textarea label="Description" rows={8} value={general.description} onChange={(e) => setGeneral({ ...general, description: e.target.value })} placeholder="Markdown / rich text" />
            <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-3.5">
              <Input label="Location" value={general.location} onChange={(e) => setGeneral({ ...general, location: e.target.value })} leftIcon={<MapPin size={14} />} placeholder="Berlin · Remote" />
              <div className="field">
                <label className="label">Type</label>
                <Segmented
                  value={general.type}
                  onChange={(v) => setGeneral({ ...general, type: v })}
                  full
                  options={[
                    { value: 'full_time', label: 'Full' },
                    { value: 'part_time', label: 'Part' },
                    { value: 'contract', label: 'Contract' },
                    { value: 'internship', label: 'Intern' },
                  ]}
                />
              </div>
            </div>
            <div className="field">
              <label className="label">Salary range <span className="text-ink-4 font-medium text-xs">· Optional</span></label>
              <div className="grid grid-cols-[1fr_1fr_100px] gap-2">
                <input className="input" type="number" placeholder="Min" value={general.salaryMin} onChange={(e) => setGeneral({ ...general, salaryMin: e.target.value })} />
                <input className="input" type="number" placeholder="Max" value={general.salaryMax} onChange={(e) => setGeneral({ ...general, salaryMax: e.target.value })} />
                <select className="select" value={general.currency} onChange={(e) => setGeneral({ ...general, currency: e.target.value })}>
                  <option>USD</option><option>EUR</option><option>GBP</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 2 && <FormBuilder draft={formDraft} onChange={setFormDraft} jobTitle={general.title} />}

        {step === 3 && (
          <div>
            <Banner tone="blue" icon={<Info size={14} />} className="mb-4">
              <div>Candidates who match <strong>any</strong> of these criteria are auto-rejected before resume review. These do not affect scoring.</div>
            </Banner>
            <CriteriaList values={criteria} onChange={setCriteria} placeholder="e.g. Not authorized to work in EU" addLabel="Add criterion" />
          </div>
        )}

        {step === 4 && (
          <div>
            <Banner tone="amber" icon={<Sparkles size={14} />} className="mb-4">
              <div>These instructions adjust candidate scores but don't disqualify anyone. Write them as plain-English rules.</div>
            </Banner>
            <CriteriaList values={scoring} onChange={setScoring} placeholder="e.g. Add 5 points for fintech experience" addLabel="Add instruction" />
          </div>
        )}

        {step === 5 && (
          <div>
            <p className="text-ink-3 mb-4 max-w-[620px]">
              Override the org defaults for this specific job. Leave the toggle off to use the org's weights.
            </p>
            <div className="card p-[18px]">
              <label className="flex items-center gap-3 cursor-pointer mb-4">
                <span className="toggle">
                  <input type="checkbox" checked={!useOrgWeights} onChange={(e) => setUseOrgWeights(!e.target.checked)} />
                  <span className="slider" />
                </span>
                <span className="text-sm font-medium">Override org defaults for this job</span>
              </label>
              {!useOrgWeights && (
                <>
                  {[
                    { k: 'skills' as const, t: 'Skills match', h: 'Required + nice-to-have overlap' },
                    { k: 'experience' as const, t: 'Experience', h: 'Years, seniority, relevance' },
                    { k: 'education' as const, t: 'Education', h: 'Degree level, field relevance' },
                    { k: 'certs' as const, t: 'Certifications', h: 'Professional certifications (optional)' },
                  ].map((r) => (
                    <div key={r.k} className="grid items-center gap-3.5 py-3" style={{ gridTemplateColumns: '200px 1fr 60px' }}>
                      <div>
                        <div className="label">{r.t}</div>
                        <div className="text-[11.5px] text-ink-4 mt-0.5">{r.h}</div>
                      </div>
                      <input className="slider" type="range" min={0} max={100} value={weights[r.k]} onChange={(e) => setWeights({ ...weights, [r.k]: Number(e.target.value) })} />
                      <div className="font-mono text-xs px-2.5 py-1.5 bg-surface border border-border rounded-md text-center">{weights[r.k]}%</div>
                    </div>
                  ))}
                  <Banner tone={valid ? 'green' : 'rose'} icon={valid ? <CheckCircle size={14} /> : <AlertTriangle size={14} />} className="mt-3.5">
                    <div>Total weight: <strong>{total}%</strong>{!valid ? ' — must equal 100%' : ''}</div>
                  </Banner>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {save.isError && <div className="field-error mt-3">{extractError(save.error)}</div>}

      <div className="flex items-center justify-between mt-8 pt-5 border-t border-border-soft">
        <Button onClick={() => (step === 1 ? navigate('/jobs') : setStep((s) => s - 1))}>
          <ArrowLeft size={14} /> {step === 1 ? 'Cancel' : 'Back'}
        </Button>
        <div className="flex gap-2 items-center">
          {step < STEPS.length && (
            <Button variant="secondary" onClick={() => save.mutate(false)} loading={save.isPending}>Save as draft</Button>
          )}
          {step === STEPS.length ? (
            <Button variant="primary" onClick={() => save.mutate(true)} loading={save.isPending} disabled={!useOrgWeights && !valid}>
              Publish job <ArrowRight size={14} />
            </Button>
          ) : (
            <Button variant="primary" onClick={() => setStep((s) => s + 1)} disabled={step === 1 && (!general.title || !general.description)}>
              Continue <ArrowRight size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

interface CriteriaListProps {
  values: string[]
  onChange: (v: string[]) => void
  placeholder: string
  addLabel: string
}

function CriteriaList({ values, onChange, placeholder, addLabel }: CriteriaListProps) {
  return (
    <div className="card p-[18px]">
      <div className="flex flex-col gap-2">
        {values.length === 0 && (
          <div className="text-ink-4 text-sm italic text-center py-3">No criteria yet — add one below.</div>
        )}
        {values.map((v, i) => (
          <div key={i} className="flex items-center gap-2">
            <span className="font-mono text-ink-4 text-xs w-6">{String(i + 1).padStart(2, '0')}</span>
            <input className="input" value={v} onChange={(e) => onChange(values.map((x, ix) => (ix === i ? e.target.value : x)))} placeholder={placeholder} />
            <button className="icon-btn" onClick={() => onChange(values.filter((_, ix) => ix !== i))}><Trash2 size={13} /></button>
          </div>
        ))}
      </div>
      <Button className="mt-3" onClick={() => onChange([...values, ''])}>
        <Plus size={13} /> {addLabel}
      </Button>
    </div>
  )
}
