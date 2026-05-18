import { Plus, Send } from 'lucide-react'

const SCORE_ROWS = [
  { label: 'React + TypeScript', n: 95, note: '6y, modern hooks-first stack' },
  { label: 'Senior leadership', n: 88, note: 'Led 4-person frontend team @ Carbide' },
  { label: 'Distributed systems', n: 72, note: 'Some exposure via SSR / edge work' },
  { label: 'Kubernetes', n: 35, note: 'Nice-to-have, not listed' },
]

function ScoreBar({ n }: { n: number }) {
  const color = n >= 85 ? 'bg-mk-green' : n >= 65 ? 'bg-mk-purple-2' : 'bg-mk-amber'
  return (
    <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
      <div className={`h-full ${color}`} style={{ width: `${n}%` }} />
    </div>
  )
}

export default function HowItWorksSection() {
  return (
    <section id="how" className="py-32 relative">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center max-w-[760px] mx-auto mb-20">
          <div className="mono-eyebrow mb-4">How it works</div>
          <h2 className="h-display-mk text-[clamp(32px,5vw,56px)]">
            From job post to hire, <span className="ital">in one continuous flow.</span>
          </h2>
        </div>

        <div className="flex flex-col gap-32">
          {/* Step 1 */}
          <Step number="01" title="Post a job" body="Spin up a job, build the application form, and define the scoring criteria the AI should weight when ranking applicants.">
            <div className="rounded-2xl border border-dark-border bg-dark-surface overflow-hidden shadow-lift">
              <div className="px-5 py-3 border-b border-dark-border-soft bg-dark-surface-2 flex items-center justify-between">
                <div className="text-[11.5px] uppercase tracking-[0.18em] text-dark-text-3 font-mono">New job · Step 2 of 3</div>
              </div>
              <div className="p-6">
                <div className="text-[15px] font-medium mb-4">Application form</div>
                <div className="space-y-2.5">
                  {[
                    { label: 'Full name', type: 'text', req: true },
                    { label: 'Email', type: 'email', req: true },
                    { label: 'Resume', type: 'file', req: true },
                    { label: 'Years of experience', type: 'number', req: true },
                    { label: 'Why this role?', type: 'long text', req: false },
                  ].map((f) => (
                    <div key={f.label} className="flex items-center justify-between p-3 rounded-lg bg-dark-bg border border-dark-border-soft">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[13.5px]">{f.label}</span>
                        {f.req && <span className="text-mk-purple-2 text-[12px]">*</span>}
                      </div>
                      <span className="text-[11.5px] text-dark-text-3 font-mono">{f.type}</span>
                    </div>
                  ))}
                </div>
                <button className="mt-4 flex items-center gap-2 px-3 h-9 rounded-lg border border-dashed border-dark-border text-dark-text-2 text-[13px] hover:bg-dark-surface-2">
                  <Plus size={13} /> Add field
                </button>
              </div>
            </div>
          </Step>

          {/* Step 2 */}
          <Step number="02" title="AI evaluates applicants" body="Every submission gets parsed, structured, and scored against the criteria. The reasoning shows up alongside the score — never a black box." reverse>
            <div className="rounded-2xl border border-dark-border bg-dark-surface p-6 shadow-lift">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <div className="text-[11.5px] uppercase tracking-[0.18em] text-dark-text-3 font-mono mb-1">Score breakdown</div>
                  <div className="text-[15px] font-medium">Yara Haddad</div>
                </div>
                <div className="text-right">
                  <div className="text-[28px] font-medium font-instr italic" style={{ background: 'linear-gradient(180deg, #A48FFF, #6E58E6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                    92<span className="text-dark-text-3 text-[14px] font-sans not-italic"> /100</span>
                  </div>
                </div>
              </div>
              <div className="space-y-3.5">
                {SCORE_ROWS.map((r) => (
                  <div key={r.label}>
                    <div className="flex items-center justify-between text-[13px] mb-1.5">
                      <div className="font-medium">{r.label}</div>
                      <div className="font-mono text-dark-text-2">{r.n}</div>
                    </div>
                    <ScoreBar n={r.n} />
                    <div className="text-[12px] text-dark-text-3 mt-1.5">{r.note}</div>
                  </div>
                ))}
              </div>
            </div>
          </Step>

          {/* Step 3 */}
          <Step number="03" title="Move candidates through the pipeline" body="Screen, interview, review, and extend offers from a single visual kanban. Stages and statuses are yours to configure.">
            <div className="rounded-2xl border border-dark-border bg-dark-surface overflow-hidden shadow-lift">
              <div className="px-5 py-3 border-b border-dark-border-soft bg-dark-surface-2 text-[12px] text-dark-text-3 font-mono">
                hira.app / jobs / senior-react-engineer
              </div>
              <div className="grid grid-cols-4 gap-2 p-4">
                {[
                  { t: 'Applied', n: 48 }, { t: 'Screening', n: 12 }, { t: 'Interview', n: 6 }, { t: 'Offer', n: 2 },
                ].map((c) => (
                  <div key={c.t} className="rounded-lg border border-dark-border-soft bg-dark-surface-2 p-3">
                    <div className="flex justify-between text-[12px]">
                      <span className="font-medium">{c.t}</span>
                      <span className="text-dark-text-3 font-mono">{c.n}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Step>

          {/* Step 4 */}
          <Step number="04" title="Hire with confidence" body="Structured data, interview feedback, and AI scores give your team the full context every step of the way — and an audit trail when you need it." reverse>
            <div className="rounded-2xl border border-dark-border bg-dark-surface overflow-hidden shadow-lift">
              <div className="px-5 py-3 border-b border-dark-border-soft bg-dark-surface-2 text-[11.5px] uppercase tracking-[0.18em] text-dark-text-3 font-mono">
                Offer · Draft
              </div>
              <div className="p-6">
                <div className="flex items-baseline justify-between mb-1">
                  <div className="text-[18px] font-medium">Senior React Engineer</div>
                  <span className="text-[12px] text-mk-green inline-flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-mk-green" /> Ready to send
                  </span>
                </div>
                <div className="text-[13px] text-dark-text-3 mb-5">Yara Haddad · Remote</div>
                <div className="grid grid-cols-2 gap-4 text-[13px] mb-6">
                  <Field k="Salary" v="$210,000 / year" />
                  <Field k="Equity" v="0.08% · 4yr / 1yr cliff" />
                  <Field k="Start date" v="14 July 2026" />
                  <Field k="Contract" v="Full-time · Remote" />
                </div>
                <div className="flex gap-2">
                  <button className="flex items-center gap-2 h-10 px-4 rounded-full bg-mk-purple text-white text-[13.5px] font-medium hover:bg-mk-purple-2 transition-colors">
                    <Send size={14} /> Send offer
                  </button>
                  <button className="flex items-center gap-2 h-10 px-4 rounded-full border border-dark-border text-dark-text-2 text-[13.5px] hover:bg-dark-surface-2 transition-colors">
                    Preview email
                  </button>
                </div>
              </div>
            </div>
          </Step>
        </div>
      </div>
    </section>
  )
}

function Step({ number, title, body, children, reverse }: { number: string; title: string; body: string; children: React.ReactNode; reverse?: boolean }) {
  return (
    <div className={'grid lg:grid-cols-2 gap-12 items-center ' + (reverse ? 'lg:[&>*:first-child]:order-2' : '')}>
      <div>
        <div className="font-mono text-[12px] uppercase tracking-[0.18em] text-dark-text-3 mb-4">Step {number}</div>
        <h3 className="h-display-mk text-[clamp(28px,4vw,44px)] mb-5">{title}</h3>
        <p className="text-dark-text-2 text-[16px] leading-relaxed max-w-[480px]">{body}</p>
      </div>
      <div>{children}</div>
    </div>
  )
}

function Field({ k, v }: { k: string; v: string }) {
  return (
    <div>
      <div className="text-[11.5px] uppercase tracking-[0.14em] text-dark-text-3 font-mono mb-1">{k}</div>
      <div className="text-[13.5px] text-dark-text">{v}</div>
    </div>
  )
}
