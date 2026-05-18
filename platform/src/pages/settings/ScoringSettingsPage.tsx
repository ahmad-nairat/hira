import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle } from 'lucide-react'
import { orgsApi } from '../../api/orgs.api'
import { useOrgId } from '../../hooks/useOrg'
import Spinner from '../../components/ui/Spinner'
import Button from '../../components/ui/Button'
import Banner from '../../components/ui/Banner'
import { SettingsHeader } from './SettingsLayout'
import { extractError } from '../../api/client'

const ROWS = [
  { k: 'skills' as const, t: 'Skills match', h: 'Required + nice-to-have overlap' },
  { k: 'experience' as const, t: 'Experience', h: 'Years, seniority, relevance' },
  { k: 'education' as const, t: 'Education', h: 'Degree level, field relevance' },
  { k: 'certs' as const, t: 'Certifications', h: 'Professional certifications (optional)' },
]

export default function ScoringSettingsPage() {
  const orgId = useOrgId()
  const qc = useQueryClient()
  const org = useQuery({ queryKey: ['org', orgId], queryFn: () => orgsApi.get(orgId) })
  const [w, setW] = useState({ skills: 30, experience: 25, education: 30, certs: 15 })

  useEffect(() => {
    if (org.data) setW({
      skills: Math.round(Number(org.data.scoringSkills) * 100),
      experience: Math.round(Number(org.data.scoringExperience) * 100),
      education: Math.round(Number(org.data.scoringEducation) * 100),
      certs: Math.round(Number(org.data.scoringCerts) * 100),
    })
  }, [org.data])

  const save = useMutation({
    mutationFn: () => orgsApi.updateScoring(orgId, {
      scoringSkills: w.skills / 100, scoringExperience: w.experience / 100,
      scoringEducation: w.education / 100, scoringCerts: w.certs / 100,
    }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org', orgId] }),
  })

  if (org.isLoading) return <Spinner block />

  const total = w.skills + w.experience + w.education + w.certs
  const valid = total === 100

  return (
    <>
      <SettingsHeader label="Scoring weights" title={<>Default <span className="ital">weights</span></>} sub="How Hira weighs each dimension by default. Per-job overrides take precedence." />
      <div className="card p-[22px]">
        {ROWS.map((r) => (
          <div key={r.k} className="grid items-center gap-3.5 py-3" style={{ gridTemplateColumns: '200px 1fr 60px' }}>
            <div>
              <div className="label">{r.t}</div>
              <div className="text-[11.5px] text-ink-4 mt-0.5">{r.h}</div>
            </div>
            <input className="slider" type="range" min={0} max={100} value={w[r.k]} onChange={(e) => setW({ ...w, [r.k]: Number(e.target.value) })} />
            <div className="font-mono text-xs px-2.5 py-1.5 bg-surface border border-border rounded-md text-center">{w[r.k]}%</div>
          </div>
        ))}
        <Banner tone={valid ? 'green' : 'rose'} icon={valid ? <CheckCircle size={14} /> : <AlertTriangle size={14} />} className="mt-3.5">
          <div>Total weight: <strong>{total}%</strong>{!valid ? ' — must equal 100%' : ''}</div>
        </Banner>
      </div>
      {save.isError && <div className="field-error mt-2">{extractError(save.error)}</div>}
      <div className="flex gap-2 mt-4">
        <Button variant="primary" onClick={() => save.mutate()} loading={save.isPending} disabled={!valid}>Save weights</Button>
        <Button onClick={() => setW({ skills: 30, experience: 25, education: 30, certs: 15 })}>Reset to Hira defaults</Button>
      </div>
    </>
  )
}
