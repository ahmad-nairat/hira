import { BadgeCheck, Brain, FileSearch, Kanban, MailCheck, MonitorSmartphone, Users } from 'lucide-react'

const FEATURES = [
  { Icon: Brain, title: 'AI-powered screening', body: 'Score and rank every applicant before a human ever opens the inbox. Surface the top of the pile in seconds.' },
  { Icon: Kanban, title: 'Custom pipeline', body: 'A visual kanban with stages configured for your team. Drag candidates from application all the way to hire.' },
  { Icon: FileSearch, title: 'Smart form builder', body: 'Build tailored application forms with sections, validation, and the custom fields each role actually needs.' },
  { Icon: BadgeCheck, title: 'Interview management', body: 'Schedule, assign interviewers, and collect structured feedback. One source of truth, no email chains.' },
  { Icon: MonitorSmartphone, title: 'Careers page, ready', body: 'A branded public careers page you can publish in minutes. Your colors, your logo, your job listings.' },
  { Icon: Users, title: 'Multi-tenant & team-ready', body: 'Invite the team, assign roles, and collaborate with fine-grained permissions on every job and stage.' },
]

export default function FeaturesSection() {
  return (
    <section id="product" className="relative py-32">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center max-w-[760px] mx-auto mb-16">
          <div className="mono-eyebrow mb-4">Features</div>
          <h2 className="h-display-mk text-[clamp(32px,5vw,56px)]">
            Everything an ATS should do. <span className="ital">Plus the things only AI can.</span>
          </h2>
          <p className="text-dark-text-2 text-[16px] leading-relaxed mt-5">
            Hira covers the table-stakes of a modern applicant tracking system — and adds an AI layer that's deeply integrated, not bolted on after the fact.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="group p-7 rounded-2xl border border-dark-border bg-dark-surface/50 hover:bg-dark-surface transition-colors">
              <div className="w-11 h-11 rounded-xl bg-dark-surface-2 border border-dark-border-soft grid place-items-center mb-5 text-mk-purple-2 group-hover:border-mk-purple/40 transition-colors">
                <f.Icon size={20} strokeWidth={1.5} />
              </div>
              <div className="text-[17px] font-medium mb-2">{f.title}</div>
              <p className="text-[14px] text-dark-text-2 leading-relaxed">{f.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
