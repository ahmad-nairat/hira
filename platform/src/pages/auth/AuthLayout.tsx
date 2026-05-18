import { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Sparkles } from 'lucide-react'

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-bg">
      <Link to="/login" className="absolute top-7 left-14 flex items-center gap-2 text-sm font-semibold">
        <span className="w-8 h-8 rounded-lg bg-primary inline-flex items-center justify-center text-white font-serif italic font-bold text-[19px]">H</span>
        <span>Hira</span>
      </Link>
      <div className="flex flex-col px-14 py-8 justify-center relative">
        <div className="w-full max-w-[380px]">{children}</div>
      </div>
      <AuthRightSide />
    </div>
  )
}

function AuthRightSide() {
  const rows = [
    { label: 'Skills match', val: 94 },
    { label: 'Experience', val: 88 },
    { label: 'Education', val: 92 },
    { label: 'Certifications', val: 70 },
  ]
  return (
    <div className="hidden lg:flex flex-col px-14 py-8 justify-center border-l border-border-soft" style={{ background: 'radial-gradient(at 30% 20%, #1f1c3a 0%, #0a0a14 60%)' }}>
      <div className="max-w-[460px] w-full mx-auto">
        <div className="card p-[18px]">
          <div className="flex items-center gap-3 mb-[18px]">
            <div className="icon-tile" style={{ width: 32, height: 32, background: 'rgba(109,94,247,0.14)', borderColor: 'rgba(109,94,247,0.40)', color: '#b3a8fc' }}>
              <Sparkles size={14} />
            </div>
            <div className="flex-1">
              <div className="text-[13px] font-semibold">AI score · Yara Haddad</div>
              <div className="font-mono text-ink-4 text-xs mt-0.5">Senior React Engineer · ~8 min ago</div>
            </div>
            <div className="font-serif text-[40px] font-medium text-green-ink leading-none tracking-[-0.02em]">92</div>
          </div>
          {rows.map((r) => (
            <div key={r.label} className="grid items-center gap-3 py-1.5" style={{ gridTemplateColumns: '110px 1fr 30px' }}>
              <div className="text-sm">{r.label}</div>
              <div className="h-[5px] bg-surface-3 rounded-full overflow-hidden">
                <div className="h-full bg-green rounded-full" style={{ width: `${r.val}%` }} />
              </div>
              <div className="font-mono text-xs text-ink-3 text-right">{r.val}</div>
            </div>
          ))}
          <div className="mt-3.5 px-3 py-2.5 bg-surface-2 rounded-md text-[12.5px] leading-snug text-ink-2">
            <span className="ital">Reasoning:</span> 6 years React/TypeScript experience matches senior band. Strong match on required skills (GraphQL, Next.js, testing). Missing Kubernetes (nice-to-have).
          </div>
        </div>
        <blockquote className="mt-10 mb-6 font-serif text-[22px] font-normal leading-[1.4] tracking-[-0.01em] text-ink">
          "Hira cut our time-to-screen in half. The scoring breakdown is the <span className="ital">real</span> win — hiring managers finally trust the AI."
        </blockquote>
        <div className="flex items-center gap-3">
          <span className="avatar av-3">RN</span>
          <div>
            <div className="text-[13px] font-semibold">Rania Nour</div>
            <div className="text-ink-4 text-xs">Head of Talent, Northwind</div>
          </div>
        </div>
      </div>
    </div>
  )
}
