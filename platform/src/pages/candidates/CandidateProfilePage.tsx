import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { Check, Linkedin, Mail, Phone, Send, ShieldOff, Shield, Sparkles, ExternalLink } from 'lucide-react'
import { candidatesApi } from '../../api/candidates.api'
import { useOrgId } from '../../hooks/useOrg'
import { usePermission } from '../../hooks/usePermission'
import Spinner from '../../components/ui/Spinner'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import Modal from '../../components/ui/Modal'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Textarea from '../../components/ui/Textarea'
import { extractError } from '../../api/client'

export default function CandidateProfilePage() {
  const { candidateId = '' } = useParams()
  const orgId = useOrgId()
  const qc = useQueryClient()
  const { can } = usePermission()
  const [tab, setTab] = useState<'overview' | 'files'>('overview')
  const [blkOpen, setBlkOpen] = useState(false)
  const [blk, setBlk] = useState<{ reason: string; durationType: 'months_6' | 'months_12' | 'permanent' | 'custom'; expiresAt: string }>({
    reason: '', durationType: 'months_6', expiresAt: '',
  })

  const c = useQuery({ queryKey: ['candidate', candidateId], queryFn: () => candidatesApi.get(orgId, candidateId) })
  const submitBlk = useMutation({
    mutationFn: () => candidatesApi.blacklist(orgId, candidateId, {
      reason: blk.reason,
      durationType: blk.durationType,
      expiresAt: blk.durationType === 'custom' ? blk.expiresAt : null,
    }),
    onSuccess: () => { setBlkOpen(false); qc.invalidateQueries({ queryKey: ['candidate', candidateId] }) },
  })

  if (c.isLoading) return <Spinner block />
  if (!c.data) return <div className="p-7 text-rose-ink">Candidate not found.</div>
  const cd = c.data

  return (
    <div className="p-7">
      <div className="card p-6 mb-5">
        <div className="flex items-start gap-4">
          <Avatar size="xl" name={cd.fullName} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="h-display text-[28px] m-0">{cd.fullName}</h1>
              {cd.isHired && <Chip tone="green"><Check size={10} /> Hired</Chip>}
              <Chip tone="neutral">{cd.source.replace('_', ' ')}</Chip>
            </div>
            <div className="flex items-center gap-3 text-ink-3 text-sm mt-2 flex-wrap">
              <span className="flex items-center gap-1"><Mail size={12} /> {cd.email}</span>
              {cd.phone && <span className="flex items-center gap-1"><Phone size={12} /> {cd.phone}</span>}
              {cd.linkedinUrl && (
                <a href={cd.linkedinUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-ink">
                  <Linkedin size={12} /> LinkedIn
                </a>
              )}
              {cd.extraLinks?.map((l, i) => (
                <a key={i} href={l.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 hover:text-ink">
                  <ExternalLink size={12} /> {l.key}
                </a>
              ))}
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            <Button variant="secondary"><Sparkles size={13} /> Generate questions</Button>
            <Button variant="secondary"><Send size={13} /> Suggest to job</Button>
            {can.blacklist && (
              <Button variant="danger" onClick={() => setBlkOpen(true)}><ShieldOff size={13} /> Blacklist</Button>
            )}
          </div>
        </div>
      </div>

      <div className="tabs mb-5">
        <button className={clsx('tab', tab === 'overview' && 'active')} onClick={() => setTab('overview')}>Overview</button>
        <button className={clsx('tab', tab === 'files' && 'active')} onClick={() => setTab('files')}>Files</button>
      </div>

      {tab === 'overview' && (
        <div className="grid grid-cols-1 xl:grid-cols-[1fr_320px] gap-5">
          <div className="flex flex-col gap-4">
            <Section title="Skills" empty="No skills parsed yet.">
              {cd.parsedSkills.length > 0 ? (
                <div className="flex gap-1.5 flex-wrap">
                  {cd.parsedSkills.map((s, i) => <span key={i} className="tag">{s.name}{s.level ? ` · ${s.level}` : ''}</span>)}
                </div>
              ) : null}
            </Section>
            <Section title="Experience" empty="No experience parsed yet.">
              {cd.parsedExperience.length > 0 ? (
                <div className="flex flex-col gap-3.5">
                  {cd.parsedExperience.map((e, i) => (
                    <div key={i} className="grid gap-3.5" style={{ gridTemplateColumns: '32px 1fr' }}>
                      <span className="w-2 h-2 rounded-full bg-surface-3 border border-border mt-1.5 ml-3" />
                      <div>
                        <div className="text-sm font-semibold">{e.title} <span className="text-ink-3 font-medium">· {e.company}</span></div>
                        <div className="text-ink-4 text-xs mt-0.5">{e.start} — {e.end ?? 'present'}</div>
                        {e.description && <p className="text-ink-3 text-sm mt-1.5 leading-snug">{e.description}</p>}
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </Section>
            <Section title="Education" empty="No education parsed yet.">
              {cd.parsedEducation.length > 0 ? (
                <div className="flex flex-col gap-3">
                  {cd.parsedEducation.map((e, i) => (
                    <div key={i}>
                      <div className="text-sm font-semibold">{e.degree} <span className="text-ink-3 font-medium">· {e.institution}</span></div>
                      {e.year && <div className="text-ink-4 text-xs mt-0.5">{e.year}</div>}
                    </div>
                  ))}
                </div>
              ) : null}
            </Section>
            <Section title="Certifications" empty="No certifications parsed yet.">
              {cd.parsedCerts.length > 0 ? (
                <div className="flex items-center gap-2 flex-wrap">
                  {cd.parsedCerts.map((cr, i) => <span key={i} className="tag">{cr.name}{cr.issuer ? ` · ${cr.issuer}` : ''}{cr.year ? ` · ${cr.year}` : ''}</span>)}
                </div>
              ) : null}
            </Section>
          </div>
        </div>
      )}
      {tab === 'files' && (
        <div className="card p-5 text-ink-3 text-sm">No files yet. (Resume URL: <a className="underline" href="#" onClick={(e) => e.preventDefault()}>view</a>)</div>
      )}

      <Modal
        open={blkOpen}
        onClose={() => setBlkOpen(false)}
        title="Blacklist candidate"
        subtitle="Blacklisted candidates are auto-rejected on any new application to your org."
        footer={
          <>
            <Button onClick={() => setBlkOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={() => submitBlk.mutate()} loading={submitBlk.isPending}>Blacklist</Button>
          </>
        }
      >
        <Textarea label="Reason (required)" value={blk.reason} onChange={(e) => setBlk({ ...blk, reason: e.target.value })} required />
        <div className="mt-3">
          <Select label="Duration" value={blk.durationType} onChange={(e) => setBlk({ ...blk, durationType: e.target.value as typeof blk.durationType })}>
            <option value="months_6">6 months</option>
            <option value="months_12">12 months</option>
            <option value="permanent">Permanent</option>
            <option value="custom">Custom date</option>
          </Select>
        </div>
        {blk.durationType === 'custom' && (
          <div className="mt-3">
            <Input label="Expires at" type="datetime-local" value={blk.expiresAt} onChange={(e) => setBlk({ ...blk, expiresAt: e.target.value })} />
          </div>
        )}
        {submitBlk.isError && <div className="field-error mt-2">{extractError(submitBlk.error)}</div>}
      </Modal>
    </div>
  )
}

function Section({ title, empty, children }: { title: string; empty: string; children?: React.ReactNode }) {
  const hasContent = !!children && (Array.isArray(children) ? children.length > 0 : true)
  return (
    <div className="card p-[18px]">
      <div className="mono-label mb-3">{title}</div>
      {hasContent ? children : <div className="text-ink-4 text-sm italic">{empty}</div>}
    </div>
  )
}
