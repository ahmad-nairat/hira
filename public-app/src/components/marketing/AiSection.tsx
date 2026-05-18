import { FileText, ListChecks, MessageSquare, Search, Sparkles } from 'lucide-react'

const CAPABILITIES = [
  { Icon: ListChecks, title: 'Analyzes job descriptions', body: 'Hira turns your role brief into structured scoring criteria — so every applicant is rated on the same axes, with weights you can tune.' },
  { Icon: FileText, title: 'Parses resumes', body: 'Skills, experience, education, certifications — extracted into a structured profile you can search, filter, and sort.' },
  { Icon: Sparkles, title: 'Scores every candidate', body: 'Out of 100. Against your role requirements. With your custom instructions. And with a written reason for every score.' },
  { Icon: MessageSquare, title: 'Drafts interview questions', body: "Tailored to each candidate's background and the job — so your interviewers always show up with something to ask." },
]

const FACTS = [
  { label: 'Skills match', n: 95 },
  { label: 'Experience', n: 88 },
  { label: 'Seniority', n: 90 },
  { label: 'Location / timezone', n: 70 },
]

export default function AiSection() {
  return (
    <section className="relative py-32" style={{ background: 'radial-gradient(60% 50% at 50% 0%, rgba(139,111,255,0.10), transparent)' }}>
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center max-w-[760px] mx-auto mb-16">
          <div className="mono-eyebrow mb-4">AI, but transparent</div>
          <h2 className="h-display-mk text-[clamp(32px,5vw,56px)]">
            Your AI hiring assistant, <span className="ital">built in.</span>
          </h2>
          <p className="text-dark-text-2 text-[16px] leading-relaxed mt-5">
            Most ATS vendors are duct-taping AI to legacy products. We built Hira around it. Every recommendation comes with reasoning — you can audit, override, or fine-tune.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_440px] gap-10 items-start">
          <div className="grid sm:grid-cols-2 gap-3">
            {CAPABILITIES.map((c) => (
              <div key={c.title} className="p-6 rounded-2xl border border-dark-border bg-dark-surface/60">
                <div className="w-10 h-10 rounded-lg bg-mk-purple/15 grid place-items-center mb-4 text-mk-purple-2">
                  <c.Icon size={18} strokeWidth={1.5} />
                </div>
                <div className="text-[15px] font-medium mb-2">{c.title}</div>
                <p className="text-[13.5px] text-dark-text-2 leading-relaxed">{c.body}</p>
              </div>
            ))}
          </div>

          <div className="rounded-3xl border border-dark-border bg-gradient-to-br from-dark-surface to-dark-surface-2 p-6 shadow-lift">
            <div className="flex items-center justify-between mb-5">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-dark-text-3">Candidate · #00482</div>
              <Search size={14} className="text-dark-text-3" />
            </div>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-mk-purple/20 text-mk-purple-2 grid place-items-center font-medium text-[15px]">YH</div>
              <div>
                <div className="text-[16px] font-medium">Yara Haddad</div>
                <div className="text-[13px] text-dark-text-3">Senior React Engineer · Beirut</div>
              </div>
            </div>
            <div className="mt-6 p-5 rounded-2xl bg-dark-bg border border-dark-border-soft">
              <div className="flex items-baseline justify-between mb-4">
                <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-dark-text-3">Hira score</div>
                <div className="font-instr italic text-[44px] leading-none" style={{ background: 'linear-gradient(180deg, #A48FFF, #6E58E6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  92<span className="text-dark-text-3 text-[14px] font-sans not-italic"> /100</span>
                </div>
              </div>
              <div className="space-y-2.5">
                {FACTS.map((f) => (
                  <div key={f.label}>
                    <div className="flex items-center justify-between text-[12.5px] mb-1">
                      <span>{f.label}</span>
                      <span className="font-mono text-dark-text-2">{f.n}</span>
                    </div>
                    <div className="h-1 rounded-full bg-white/[0.06] overflow-hidden">
                      <div className={f.n >= 85 ? 'h-full bg-mk-green' : f.n >= 70 ? 'h-full bg-mk-purple-2' : 'h-full bg-mk-amber'} style={{ width: `${f.n}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-5 px-5 py-4 rounded-2xl bg-white/[0.02] border border-dark-border-soft">
              <div className="font-mono text-[11px] uppercase tracking-[0.18em] text-dark-text-3 mb-2">Reasoning</div>
              <p className="text-[13px] leading-relaxed text-dark-text-2">
                Strong React + TypeScript depth, leadership experience on a team of comparable scale, and a portfolio that demonstrates SSR plus edge work. The single gap is Kubernetes, which the role marks as a nice-to-have rather than a must.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
