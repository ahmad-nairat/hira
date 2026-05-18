import Link from 'next/link'
import { ArrowUpRight, Brain, ChevronRight, MessagesSquare, Sparkles, Star } from 'lucide-react'

const APP = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:5173'

interface MockCard { name: string; role: string; score: number; highlight?: boolean }
interface MockCol { title: string; count: number; cards: MockCard[] }

const PIPELINE_COLS: MockCol[] = [
  {
    title: 'Applied', count: 48,
    cards: [
      { name: 'Lina Zein', role: 'Fullstack Engineer', score: 64 },
      { name: 'Omar Tayseer', role: 'Frontend Engineer', score: 78 },
    ],
  },
  {
    title: 'Screening', count: 12,
    cards: [
      { name: 'Yara Haddad', role: 'Senior React Engineer', score: 92, highlight: true },
    ],
  },
  {
    title: 'Interview', count: 6,
    cards: [
      { name: 'Karim Nasser', role: 'Platform Engineer', score: 88 },
    ],
  },
  {
    title: 'Offer', count: 2,
    cards: [],
  },
]

function scoreColor(n: number) {
  if (n >= 85) return 'text-mk-green'
  if (n >= 70) return 'text-mk-amber'
  return 'text-dark-text-3'
}

export default function HeroSection() {
  return (
    <section className="relative pt-20 pb-32 overflow-hidden mk-grid">
      {/* purple glow */}
      <div
        className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[600px] pointer-events-none opacity-60"
        style={{ background: 'radial-gradient(closest-side, rgba(139, 111, 255, 0.25), transparent)' }}
      />
      <div className="relative max-w-[1200px] mx-auto px-6">
        <div className="flex items-center justify-center mb-8">
          <a href="#" className="inline-flex items-center gap-2 pl-1 pr-4 h-8 rounded-full border border-dark-border bg-dark-surface text-[12.5px] text-dark-text-2 hover:bg-dark-surface-2 transition-colors">
            <span className="inline-flex items-center justify-center h-6 px-2 rounded-full bg-mk-purple/15 text-mk-purple-2 font-medium">
              <Sparkles size={11} className="mr-1" /> New
            </span>
            AI Scoring v2 is live <ChevronRight size={13} className="text-dark-text-3" /> Read
          </a>
        </div>

        <h1 className="h-display-mk text-center text-[clamp(48px,8vw,104px)] max-w-[920px] mx-auto">
          Hiring that thinks <span className="ital">alongside</span> your team.
        </h1>

        <p className="text-center text-dark-text-2 text-[17px] leading-relaxed max-w-[680px] mx-auto mt-7">
          Hira is the applicant tracking system with AI built in from day one. Parse resumes, score candidates, and move them through your pipeline — all with the transparency your hiring managers actually need.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-9">
          <Link href={`${APP}/register`} className="btn-mk-primary">
            Start free <ArrowUpRight size={16} />
          </Link>
          <a href="#how" className="btn-mk-ghost">See live demo</a>
        </div>
        <div className="text-center mt-5 text-[13px] text-dark-text-3">
          Free for up to 3 users · No credit card
        </div>

        <PipelineMock />

        <TrustedRow />
      </div>
    </section>
  )
}

function PipelineMock() {
  return (
    <div className="mt-20 mx-auto max-w-[1100px] relative">
      <div
        className="rounded-2xl border border-dark-border bg-dark-surface overflow-hidden shadow-[0_30px_80px_-20px_rgba(139,111,255,0.4)]"
      >
        <div className="flex items-center gap-2 px-4 h-10 border-b border-dark-border-soft bg-dark-surface-2">
          <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <span className="w-2.5 h-2.5 rounded-full bg-white/10" />
          <div className="ml-4 px-3 py-1 rounded-md bg-dark-bg text-dark-text-3 text-[12px] font-mono">hira.app / jobs / senior-react-engineer</div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-dark-bg">
          {PIPELINE_COLS.map((col) => (
            <div key={col.title} className="rounded-xl bg-dark-surface border border-dark-border-soft p-3">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[12.5px] font-medium">{col.title}</span>
                <span className="text-[12px] text-dark-text-3 font-mono">{col.count}</span>
              </div>
              <div className="flex flex-col gap-2">
                {col.cards.map((c, i) => (
                  <div
                    key={c.name}
                    className={
                      'rounded-lg border p-2.5 transition-colors ' +
                      (c.highlight
                        ? 'bg-mk-purple/10 border-mk-purple/30'
                        : 'bg-dark-surface-2 border-dark-border-soft')
                    }
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-[12.5px] font-medium">{c.name}</span>
                      <span className={'text-[12px] font-mono ' + scoreColor(c.score)}>{c.score}</span>
                    </div>
                    <div className="text-[11.5px] text-dark-text-3 mt-0.5 truncate">{c.role}</div>
                  </div>
                ))}
                {col.cards.length === 0 && (
                  <div className="text-[11.5px] text-dark-text-4 italic px-1 py-2">No candidates yet.</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AI reasoning pill */}
      <div className="hidden md:flex items-center gap-3 px-4 py-3 rounded-2xl border border-dark-border bg-dark-surface absolute -bottom-12 right-6 max-w-[420px] shadow-lift">
        <div className="w-10 h-10 rounded-full bg-mk-purple/15 grid place-items-center text-mk-purple-2 shrink-0">
          <Brain size={18} />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[12.5px] font-medium">
            <span>AI reasoning</span>
            <span className="text-mk-green font-mono">92/100</span>
          </div>
          <div className="text-[12px] text-dark-text-3 truncate">
            Strong React + TypeScript, 6y experience matches senior band. Missing: Kubernetes (nice-to-have).
          </div>
        </div>
      </div>
    </div>
  )
}

const LOGOS = ['Numen Labs', 'Carbide', 'Aperture', 'Eon Dental', 'Lumen', 'Bytecraft', 'Stratus']

function TrustedRow() {
  return (
    <div className="mt-32">
      <p className="text-center text-[12.5px] uppercase tracking-[0.18em] text-dark-text-3 mb-6 font-mono">
        Trusted by hiring teams at
      </p>
      <div className="flex flex-wrap items-center justify-center gap-x-10 gap-y-4 opacity-70">
        {LOGOS.map((l) => (
          <span key={l} className="text-[15px] font-medium text-dark-text-2 tracking-tight">{l}</span>
        ))}
      </div>
    </div>
  )
}
