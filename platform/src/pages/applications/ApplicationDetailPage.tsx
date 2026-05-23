import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, Calendar, Check, ChevronDown, ChevronRight, ExternalLink, Minus, Plus, Send, Sparkles, Star, ThumbsDown, ThumbsUp, Trash2, Video, X } from 'lucide-react'
import { applicationsApi } from '../../api/applications.api'
import { candidatesApi } from '../../api/candidates.api'
import { jobsApi } from '../../api/jobs.api'
import { notesApi } from '../../api/notes.api'
import { questionsApi } from '../../api/questions.api'
import { offersApi } from '../../api/offers.api'
import { interviewsApi } from '../../api/interviews.api'
import { membersApi } from '../../api/members.api'
import { useOrgId } from '../../hooks/useOrg'
import { usePermission } from '../../hooks/usePermission'
import Spinner from '../../components/ui/Spinner'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import Score from '../../components/ui/Score'
import StageDot from '../../components/ui/StageDot'
import Chip from '../../components/ui/Chip'
import Modal from '../../components/ui/Modal'
import Textarea from '../../components/ui/Textarea'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import { extractError } from '../../api/client'
import { formatDate, formatDateTime, formatRole, formatStage } from '../../utils/format'
import QuestionsEditor from '../../components/questions/QuestionsEditor'
import type { FormAnswer, PipelineStage, ScoreComponentName } from '../../types/api'

export default function ApplicationDetailPage() {
  const { applicationId = '' } = useParams()
  const orgId = useOrgId()
  const qc = useQueryClient()
  const { can, isInterviewerOnly } = usePermission()
  const [moveOpen, setMoveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [interviewOpen, setInterviewOpen] = useState(false)
  const [offerOpen, setOfferOpen] = useState(false)
  const [questionsOpen, setQuestionsOpen] = useState(false)
  const [noteContent, setNoteContent] = useState('')
  const [rejectNote, setRejectNote] = useState('')
  const [toStage, setToStage] = useState<PipelineStage>('interview')
  const [offerForm, setOfferForm] = useState({ salary: '', currency: 'USD', startDate: '', contractType: 'Full-time', welcomeMessage: '' })
  const [interview, setInterview] = useState<{ stage: 'interview' | 'specialist_interview'; interviewerId: string; scheduledAt: string; meetingType: 'online' | 'in_person'; meetingLink: string }>({
    stage: 'interview', interviewerId: '', scheduledAt: '', meetingType: 'online', meetingLink: '',
  })
  const [qInstructions, setQInstructions] = useState('')
  const [openComponent, setOpenComponent] = useState<ScoreComponentName | null>(null)
  // AI interview questions card defaults to collapsed — large content,
  // recruiters rarely need it expanded by default.
  const [questionsCardOpen, setQuestionsCardOpen] = useState(false)

  const app = useQuery({ queryKey: ['application', applicationId], queryFn: () => applicationsApi.get(orgId, applicationId) })
  const job = useQuery({ queryKey: ['jobs', orgId, app.data?.jobId], queryFn: () => jobsApi.get(orgId, app.data!.jobId), enabled: !!app.data?.jobId })
  // Candidate endpoint is admin/recruiter/HM only — interviewers would 403 on
  // it. Skip the query for them; the candidate sections render only when
  // `cand.data` exists, so they're naturally hidden.
  const cand = useQuery({ queryKey: ['candidate', app.data?.candidateId], queryFn: () => candidatesApi.get(orgId, app.data!.candidateId), enabled: !!app.data?.candidateId && !isInterviewerOnly })
  const notes = useQuery({ queryKey: ['notes', applicationId], queryFn: () => notesApi.list(orgId, applicationId), enabled: !!applicationId })
  const questions = useQuery({ queryKey: ['questions', applicationId], queryFn: () => questionsApi.list(orgId, applicationId), enabled: !!applicationId })
  const history = useQuery({ queryKey: ['stage-history', applicationId], queryFn: () => applicationsApi.stageHistory(orgId, applicationId), enabled: !!applicationId && !isInterviewerOnly })
  const interviews = useQuery({
    queryKey: ['application-interviews', applicationId],
    queryFn: () => interviewsApi.listByApplication(orgId, applicationId),
    enabled: !!applicationId && !isInterviewerOnly,
  })
  const members = useQuery({ queryKey: ['members', orgId], queryFn: () => membersApi.list(orgId), enabled: !isInterviewerOnly })

  const invalidate = () => qc.invalidateQueries({ queryKey: ['application', applicationId] })
  const move = useMutation({ mutationFn: () => applicationsApi.move(orgId, applicationId, toStage), onSuccess: () => { invalidate(); setMoveOpen(false) } })
  const reject = useMutation({ mutationFn: () => applicationsApi.reject(orgId, applicationId, rejectNote), onSuccess: () => { invalidate(); setRejectOpen(false) } })
  const approve = useMutation({ mutationFn: () => applicationsApi.approve(orgId, applicationId), onSuccess: invalidate })
  const hire = useMutation({ mutationFn: () => applicationsApi.hire(orgId, applicationId), onSuccess: invalidate })
  const addNote = useMutation({
    mutationFn: () => notesApi.create(orgId, applicationId, noteContent),
    onSuccess: () => { setNoteContent(''); qc.invalidateQueries({ queryKey: ['notes', applicationId] }) },
  })
  const genQ = useMutation({
    mutationFn: () => questionsApi.generate(orgId, applicationId, { instructions: qInstructions }),
    onSuccess: () => { setQuestionsOpen(false); setQInstructions('') },
  })
  const createOffer = useMutation({
    mutationFn: async () => {
      await offersApi.create(orgId, applicationId, {
        salary: offerForm.salary ? Number(offerForm.salary) : null,
        currency: offerForm.currency || null,
        startDate: offerForm.startDate || null,
        contractType: offerForm.contractType || null,
        welcomeMessage: offerForm.welcomeMessage,
      })
      await offersApi.send(orgId, applicationId)
    },
    onSuccess: () => { setOfferOpen(false); invalidate() },
  })
  const scheduleInterview = useMutation({
    mutationFn: () => interviewsApi.create(orgId, applicationId, {
      stage: interview.stage,
      interviewerId: interview.interviewerId,
      scheduledAt: interview.scheduledAt ? new Date(interview.scheduledAt).toISOString() : null,
      meetingType: interview.meetingType,
      meetingLink: interview.meetingType === 'online' ? interview.meetingLink || null : null,
    }),
    onSuccess: () => setInterviewOpen(false),
  })

  if (app.isLoading) return <Spinner block />
  if (!app.data) return <div className="p-7 text-rose-ink">Application not found.</div>
  const a = app.data
  // Tolerate applications stored before formAnswers was denormalised (legacy { fieldId: answer } map).
  const formAnswers: FormAnswer[] = Array.isArray(a.formAnswers)
    ? a.formAnswers
    : Object.entries((a.formAnswers ?? {}) as Record<string, unknown>).map(
      ([id, answer]): FormAnswer => ({ id, question: id, type: 'text', answer }),
    )

  return (
    <div className="p-7">
      <div className="card p-6 mb-5">
        <div className="flex items-start gap-4">
          <Avatar size="xl" name={cand.data?.fullName} />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="h-display text-[28px] m-0">{cand.data?.fullName ?? '—'}</h1>
              {!isInterviewerOnly && <Score value={a.score} />}
            </div>
            <div className="text-ink-3 text-sm mt-2">
              Applied {formatDate(a.createdAt)} for <strong className="text-ink">{job.data?.title ?? '…'}</strong>
            </div>
          </div>
          <div className="flex gap-2 shrink-0 flex-wrap justify-end">
            {can.scheduleInterview && <Button variant="secondary" onClick={() => setInterviewOpen(true)}><Calendar size={13} /> Schedule</Button>}
            <Button variant="secondary" onClick={() => setQuestionsOpen(true)}><Sparkles size={13} /> Generate questions</Button>
            <a className="btn btn-ghost" href={a.resumeUrl} target="_blank" rel="noreferrer"><ExternalLink size={13} /> Resume</a>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5 pt-3 border-t border-border-soft flex-wrap">
          <span className="mono-label">Current stage</span>
          <span className="flex items-center gap-2 text-sm">
            <StageDot stage={a.currentStage} size={8} /> <span className="font-medium">{formatStage(a.currentStage)}</span>
          </span>
          <div className="ml-auto flex gap-2 flex-wrap">
            {can.moveStage && a.currentStage !== 'rejected' && a.currentStage !== 'hired' && (
              <>
                <Button size="sm" variant="secondary" onClick={() => setMoveOpen(true)}>Move stage <ChevronDown size={12} /></Button>
                <Button size="sm" variant="danger" onClick={() => setRejectOpen(true)}>Reject</Button>
              </>
            )}
            {can.approveCandidate && a.currentStage === 'review' && (
              <Button size="sm" variant="primary" onClick={() => approve.mutate()} loading={approve.isPending}>Approve</Button>
            )}
            {can.sendOffer && a.currentStage === 'hm_approved' && (
              <Button size="sm" variant="primary" onClick={() => setOfferOpen(true)}><Send size={12} /> Create & send offer</Button>
            )}
            {can.hire && a.currentStage === 'offer_accepted' && (
              <Button size="sm" variant="primary" onClick={() => hire.mutate()} loading={hire.isPending}>Mark as hired</Button>
            )}
          </div>
        </div>
      </div>

      {a.currentStage === 'early_rejection' && a.rejectionNote && (
        <div className="card p-4 mb-5 border-l-4 border-rose-ink bg-rose-soft">
          <div className="mono-label text-rose-ink mb-1.5">AI early rejection</div>
          <div className="text-sm text-ink whitespace-pre-wrap">{a.rejectionNote}</div>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-5">
        <div className="flex flex-col gap-4">
          <div className="card p-[18px]">
            <div className="mono-label mb-3">Form answers</div>
            {formAnswers.length === 0 ? <div className="text-ink-4 italic">No answers.</div> : (
              <div className="flex flex-col gap-3">
                {formAnswers.map((fa) => (
                  <div key={fa.id}>
                    <div className="text-ink-4 text-xs mb-1">{fa.question}</div>
                    <div className="text-sm">{String(fa.answer ?? '')}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!isInterviewerOnly && (interviews.data?.length ?? 0) > 0 && (
            <div className="card p-[18px]">
              <div className="mono-label mb-3">Interviews &amp; feedback</div>
              <div className="flex flex-col gap-3">
                {interviews.data!.map((iv) => (
                  <div key={iv.id} className={"note-card " + (iv.feedback?.recommendation === 'strong_yes' ? 'border-green-br bg-green-soft' :
                    iv.feedback?.recommendation === 'yes' ? 'border-teal-br bg-teal-soft' :
                      iv.feedback?.recommendation === 'no' ? 'border-amber-br bg-amber-soft' :
                        iv.feedback?.recommendation === 'strong_no' ? 'border-rose-br bg-rose-soft' :
                          'border-border-soft bg-surface-2')
                  }>

                    <div className="flex items-center justify-between gap-3 flex-wrap mb-1.5">
                      <div className="text-sm font-medium">
                        {formatStage(iv.stage)}
                        {iv.interviewerName && <span className="text-ink-3 font-normal"> · with {iv.interviewerName}</span>}
                      </div>
                      <Chip
                        size="sm"
                        tone={iv.status === 'completed' ? 'green' : iv.status === 'cancelled' ? 'rose' : 'neutral'}
                      >{iv.status}</Chip>
                    </div>
                    <div className="text-ink-4 text-xs flex items-center gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1"><Calendar size={11} /> {formatDateTime(iv.scheduledAt)}</span>
                      <span className="inline-flex items-center gap-1">
                        {iv.meetingType === 'online' ? <Video size={11} /> : null}
                        {iv.meetingType.replace('_', ' ')}
                      </span>
                    </div>
                    {iv.feedback ? (
                      <div className="mt-3 -mx-3.5 -mb-3 px-3.5 py-3 rounded-r-lg flex flex-col gap-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-0.5 text-amber-ink">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <Star key={n} size={12} className={n <= iv.feedback!.rating ? 'fill-current' : ''} />
                            ))}
                          </div>
                          <span className="text-ink-3 text-xs">{iv.feedback.rating}/5</span>
                          <Chip
                            size="sm"
                            tone={
                              iv.feedback.recommendation === 'strong_yes' ? 'green' :
                                iv.feedback.recommendation === 'yes' ? 'teal' :
                                  iv.feedback.recommendation === 'no' ? 'amber' :
                                    iv.feedback.recommendation === 'strong_no' ? 'rose' : 'neutral'
                            }
                          >{iv.feedback.recommendation.replace('_', ' ')}</Chip>
                        </div>
                        <div className="text-sm text-ink-2 whitespace-pre-wrap">{iv.feedback.notes}</div>
                      </div>
                    ) : (
                      <div className="mt-3 pt-3 border-t border-border-soft text-ink-4 italic text-sm">
                        Awaiting feedback from {iv.interviewerName ?? 'the interviewer'}.
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isInterviewerOnly && (a.score !== null || a.scoreBreakdown) && (
            <div className="card p-[18px]">
              <div className="flex items-center justify-between mb-3">
                <div className="mono-label">AI score</div>
                <Score value={a.score} />
              </div>
              {a.scoreBreakdown?.summary && (
                <div className="text-sm text-ink-2 mb-4">{a.scoreBreakdown.summary}</div>
              )}
              {a.scoreBreakdown?.components?.length ? (
                <div className="flex flex-col gap-1.5">
                  {a.scoreBreakdown.components.map((c) => {
                    const isOpen = openComponent === c.name
                    const pct = Math.max(0, Math.min(100, c.raw))
                    return (
                      <div key={c.name}>
                        <button
                          type="button"
                          onClick={() => setOpenComponent(isOpen ? null : c.name)}
                          className="w-full flex items-center gap-3 py-2 hover:bg-bg-2 rounded text-left"
                        >
                          {isOpen ? <ChevronDown size={14} className="text-ink-4 shrink-0" /> : <ChevronRight size={14} className="text-ink-4 shrink-0" />}
                          <div className="capitalize text-sm font-medium w-32 shrink-0">{c.name}</div>
                          <div className="text-ink-4 text-xs w-10 shrink-0">{Math.round(c.weight * 100)}%</div>
                          <div className="flex-1 h-2 bg-bg-2 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <div className="text-sm font-mono w-14 text-right shrink-0">{pct}/100</div>
                        </button>
                        {isOpen && (
                          <div className="ml-7 mr-2 mb-2 mt-1 flex flex-col gap-2">
                            <div className="text-sm text-ink-2 whitespace-pre-wrap">
                              {c.reasoning || <span className="text-ink-4 italic">No reasoning recorded.</span>}
                            </div>
                            {c.gaps?.length > 0 && (
                              <div>
                                <div className="mono-label text-rose-ink mb-1">Why points were lost</div>
                                <ul className="text-sm text-rose-ink space-y-1 list-disc pl-5">
                                  {c.gaps.map((g, i) => <li key={i}>{g}</li>)}
                                </ul>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="text-ink-4 italic text-sm">No breakdown recorded.</div>
              )}
              {a.scoreBreakdown?.bonuses?.length ? (
                <div className="mt-4 pt-4 border-t border-border-soft">
                  <div className="mono-label mb-2">Bonus adjustments</div>
                  <div className="flex flex-col gap-2">
                    {a.scoreBreakdown.bonuses.map((b, i) => {
                      const isPenalty = b.points < 0
                      const isPartial = !isPenalty && b.confidence === 'partial'
                      const tone =
                        isPenalty ? 'border-rose-br bg-rose-soft' :
                          isPartial ? 'border-amber-br bg-amber-soft' :
                            'border-green-br bg-green-soft'
                      const pillTone =
                        isPenalty ? 'bg-rose-soft text-rose-ink' :
                          isPartial ? 'bg-amber-soft text-amber-ink' :
                            'bg-green-soft text-green-ink'
                      return (
                        <div key={i} className={`flex items-start gap-2 border-l-2 ${tone} rounded px-2 py-1.5`}>
                          <span className={`inline-flex items-center gap-0.5 text-xs font-mono px-1.5 py-0.5 rounded shrink-0 ${pillTone}`}>
                            {b.points >= 0 ? <Plus size={10} /> : <Minus size={10} />}{Math.abs(b.points)}
                          </span>
                          <div className="text-sm min-w-0 flex-1">
                            <div className="flex items-center gap-1.5">
                              <span className="text-ink-2 italic">"{b.rule}"</span>
                              {isPartial && (
                                <span className="inline-flex items-center gap-0.5 text-[10px] uppercase tracking-wide font-medium text-amber-ink shrink-0">
                                  <AlertTriangle size={10} /> partial
                                </span>
                              )}
                            </div>
                            {b.reasoning && <div className="text-ink-4 text-xs mt-0.5">{b.reasoning}</div>}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {cand.data && (
            <div className="card p-[18px]">
              <div className="mono-label mb-3">Skills</div>
              {cand.data.parsedSkills?.length ? (
                <div className="flex flex-wrap gap-2">
                  {cand.data.parsedSkills.map((s, i) => (
                    <Chip key={`${s.name}-${i}`}>{s.name}</Chip>
                  ))}
                </div>
              ) : <div className="text-ink-4 italic text-sm">No skills parsed yet.</div>}
            </div>
          )}

          {cand.data && (
            <div className="card p-[18px]">
              <div className="mono-label mb-3">Experience</div>
              {cand.data.parsedExperience?.length ? (
                <div className="flex flex-col gap-3">
                  {cand.data.parsedExperience.map((e, i) => (
                    <div key={i}>
                      <div className="text-sm font-medium">{e.title} · {e.company}</div>
                      <div className="text-ink-4 text-xs mt-0.5">{e.start}{e.end ? ` — ${e.end}` : ' — Present'}</div>
                      {e.description && <div className="text-sm text-ink-2 mt-1 whitespace-pre-wrap">{e.description}</div>}
                    </div>
                  ))}
                </div>
              ) : <div className="text-ink-4 italic text-sm">No experience parsed yet.</div>}
            </div>
          )}

          {cand.data && (
            <div className="card p-[18px]">
              <div className="mono-label mb-3">Education</div>
              {cand.data.parsedEducation?.length ? (
                <div className="flex flex-col gap-2">
                  {cand.data.parsedEducation.map((e, i) => (
                    <div key={i}>
                      <div className="text-sm font-medium">{e.degree}</div>
                      <div className="text-ink-4 text-xs mt-0.5">{e.institution}{e.year ? ` · ${e.year}` : ''}</div>
                    </div>
                  ))}
                </div>
              ) : <div className="text-ink-4 italic text-sm">No education parsed yet.</div>}
            </div>
          )}

          {cand.data && cand.data.parsedCerts?.length > 0 && (
            <div className="card p-[18px]">
              <div className="mono-label mb-3">Certifications</div>
              <div className="flex flex-col gap-2">
                {cand.data.parsedCerts.map((c, i) => (
                  <div key={i}>
                    <div className="text-sm font-medium">{c.name}</div>
                    <div className="text-ink-4 text-xs mt-0.5">{c.issuer ?? ''}{c.year ? ` · ${c.year}` : ''}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isInterviewerOnly && (
            <div className="card p-[18px]">
              <div className="mono-label mb-3">Notes</div>
              {notes.data?.length ? notes.data.map((n) => (
                <div key={n.id} className="note-card mb-2">
                  <div className="text-ink-4 text-xs mb-1.5">{formatDate(n.createdAt)}</div>
                  <div className="text-sm text-ink-2 whitespace-pre-wrap">{n.content}</div>
                </div>
              )) : <p className="text-ink-4 italic mb-2">No notes yet.</p>}
              {can.addNotes && (
                <div className="mt-3">
                  <Textarea placeholder="Add a note. Anyone on the team can see this." rows={3} value={noteContent} onChange={(e) => setNoteContent(e.target.value)} />
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-ink-4 text-xs">⌘+Enter to save</span>
                    <Button size="sm" variant="primary" onClick={() => noteContent.trim() && addNote.mutate()} loading={addNote.isPending}>Add note</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card p-[18px]">
            <button
              type="button"
              onClick={() => setQuestionsCardOpen(!questionsCardOpen)}
              className="w-full flex items-center gap-2 text-left"
            >
              {questionsCardOpen ? <ChevronDown size={14} className="text-ink-4" /> : <ChevronRight size={14} className="text-ink-4" />}
              <div className="mono-label">AI interview questions{questions.data?.length ? ` (${questions.data.length})` : ''}</div>
              <div className="ml-auto flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                <Button size="sm" onClick={() => setQuestionsOpen(true)}><Sparkles size={12} /> Generate</Button>
              </div>
            </button>
            {questionsCardOpen && (
              <div className="mt-3">
                {questions.data?.length ? questions.data.map((g) => (
                  <div key={g.id} className="note-card mb-2">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="text-ink-4 text-xs">Generated {formatDate(g.createdAt)}{g.instructions ? ` · ${g.instructions}` : ''}</div>
                      <button
                        type="button"
                        title="Delete this question set"
                        onClick={async () => {
                          if (!confirm('Delete this entire question set? This cannot be undone.')) return
                          await questionsApi.delete(orgId, applicationId, g.id)
                          qc.invalidateQueries({ queryKey: ['questions', applicationId] })
                        }}
                        className="text-ink-4 hover:text-rose-ink transition-colors"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                    <QuestionsEditor
                      initial={g.questions}
                      onSave={async (items) => {
                        await questionsApi.updateAnswers(orgId, applicationId, g.id, items)
                        qc.invalidateQueries({ queryKey: ['questions', applicationId] })
                      }}
                    />
                  </div>
                )) : <p className="text-ink-4 italic">No questions generated yet.</p>}
              </div>
            )}
          </div>
        </div>

        {!isInterviewerOnly && (
          <div className="card p-[18px] self-start">
            <div className="mono-label mb-3">Stage history</div>
            {history.data?.length ? history.data.map((h) => (
              <div key={h.id} className="activity-item">
                <span className="activity-dot bg-primary" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm">
                    {h.fromStage ? <>Moved to <strong>{formatStage(h.toStage)}</strong> from {formatStage(h.fromStage)}</> : <>Started in <strong>{formatStage(h.toStage)}</strong></>}
                  </div>
                  <div className="text-ink-4 text-xs mt-1">{formatDate(h.createdAt)}{h.note ? ` · ${h.note}` : ''}</div>
                </div>
              </div>
            )) : <p className="text-ink-4 italic">No history.</p>}
          </div>
        )}
      </div>

      <Modal open={moveOpen} onClose={() => setMoveOpen(false)} title="Move stage" footer={
        <><Button onClick={() => setMoveOpen(false)}>Cancel</Button><Button variant="primary" onClick={() => move.mutate()} loading={move.isPending}>Move</Button></>
      }>
        <Select label="To stage" value={toStage} onChange={(e) => setToStage(e.target.value as PipelineStage)}>
          {(['screening', 'interview', 'specialist_interview', 'review', 'hm_approved', 'offer_sent', 'offer_accepted', 'hired', 'rejected'] as PipelineStage[]).map((s) => (
            <option key={s} value={s}>{formatStage(s)}</option>
          ))}
        </Select>
        {move.isError && <div className="field-error mt-2">{extractError(move.error)}</div>}
      </Modal>

      <Modal open={rejectOpen} onClose={() => setRejectOpen(false)} title="Reject candidate" footer={
        <><Button onClick={() => setRejectOpen(false)}>Cancel</Button><Button variant="danger" onClick={() => reject.mutate()} loading={reject.isPending}>Reject</Button></>
      }>
        <Textarea label="Reason (required)" value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} required />
        {reject.isError && <div className="field-error mt-2">{extractError(reject.error)}</div>}
      </Modal>

      <Modal open={offerOpen} onClose={() => setOfferOpen(false)} title="Create & send offer" size="lg" footer={
        <><Button onClick={() => setOfferOpen(false)}>Cancel</Button><Button variant="primary" onClick={() => createOffer.mutate()} loading={createOffer.isPending}>Send</Button></>
      }>
        <div className="grid grid-cols-2 gap-3.5">
          <Input label="Salary" type="number" value={offerForm.salary} onChange={(e) => setOfferForm({ ...offerForm, salary: e.target.value })} />
          <Input label="Currency" value={offerForm.currency} onChange={(e) => setOfferForm({ ...offerForm, currency: e.target.value.toUpperCase() })} maxLength={3} />
          <Input label="Start date" type="date" value={offerForm.startDate} onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })} />
          <Input label="Contract type" value={offerForm.contractType} onChange={(e) => setOfferForm({ ...offerForm, contractType: e.target.value })} />
        </div>
        <div className="mt-3.5">
          <Textarea label="Welcome message" rows={4} value={offerForm.welcomeMessage} onChange={(e) => setOfferForm({ ...offerForm, welcomeMessage: e.target.value })} />
        </div>
        {createOffer.isError && <div className="field-error mt-2">{extractError(createOffer.error)}</div>}
      </Modal>

      <Modal open={interviewOpen} onClose={() => setInterviewOpen(false)} title="Schedule interview" size="lg" footer={
        <><Button onClick={() => setInterviewOpen(false)}>Cancel</Button><Button variant="primary" onClick={() => scheduleInterview.mutate()} loading={scheduleInterview.isPending}>Schedule</Button></>
      }>
        <div className="grid grid-cols-2 gap-3.5">
          <Select label="Stage" value={interview.stage} onChange={(e) => setInterview({ ...interview, stage: e.target.value as 'interview' | 'specialist_interview' })}>
            <option value="interview">Interview</option>
            <option value="specialist_interview">Specialist interview</option>
          </Select>
          <Select label="Interviewer" value={interview.interviewerId} onChange={(e) => setInterview({ ...interview, interviewerId: e.target.value })} required>
            <option value="">— pick one —</option>
            {members.data?.map((m) => <option key={m.userId} value={m.userId}>{m.user?.fullName} ({formatRole(m.role)})</option>)}
          </Select>
          <Input label="Scheduled at" type="datetime-local" value={interview.scheduledAt} onChange={(e) => setInterview({ ...interview, scheduledAt: e.target.value })} />
          <Select label="Meeting type" value={interview.meetingType} onChange={(e) => setInterview({ ...interview, meetingType: e.target.value as 'online' | 'in_person' })}>
            <option value="online">Online</option>
            <option value="in_person">In person</option>
          </Select>
        </div>
        {interview.meetingType === 'online' && (
          <div className="mt-3.5"><Input label="Meeting link" value={interview.meetingLink} onChange={(e) => setInterview({ ...interview, meetingLink: e.target.value })} /></div>
        )}
        {scheduleInterview.isError && <div className="field-error mt-2">{extractError(scheduleInterview.error)}</div>}
      </Modal>

      <Modal open={questionsOpen} onClose={() => setQuestionsOpen(false)} title="Generate AI questions" footer={
        <><Button onClick={() => setQuestionsOpen(false)}>Cancel</Button><Button variant="primary" onClick={() => genQ.mutate()} loading={genQ.isPending}><Sparkles size={13} /> Generate</Button></>
      }>
        <Textarea label="Custom instructions (optional)" placeholder="e.g. Focus on system design" rows={4} value={qInstructions} onChange={(e) => setQInstructions(e.target.value)} />
        {genQ.isError && <div className="field-error mt-2">{extractError(genQ.error)}</div>}
      </Modal>
    </div>
  )
}

