const QUOTES = [
  {
    quote: "We replaced a tangle of spreadsheets and a Lever plan we'd long outgrown. Hira's AI scoring saved us a person-month of screening in our last hiring sprint.",
    initials: 'M', name: 'Maya Okonkwo', role: 'Head of Talent · Numen Labs',
  },
  {
    quote: 'The reasoning shown alongside each score is the difference. Our hiring managers actually trust it because they can see what the model considered — and override it when it\'s wrong.',
    initials: 'H', name: 'Henrik Lindgren', role: 'VP People · Carbide',
  },
  {
    quote: 'We launched our careers page in 40 minutes and got a strong application the same afternoon. Setup-to-value was unreasonably fast.',
    initials: 'S', name: 'Sofia Marín', role: 'Founder · Aperture',
  },
]

export default function TestimonialsSection() {
  return (
    <section className="py-32 border-t border-dark-border-soft">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="text-center max-w-[760px] mx-auto mb-16">
          <div className="mono-eyebrow mb-4">What teams say</div>
          <h2 className="h-display-mk text-[clamp(32px,5vw,56px)]">
            From the people <span className="ital">doing the hiring.</span>
          </h2>
        </div>
        <div className="grid md:grid-cols-3 gap-4">
          {QUOTES.map((q) => (
            <figure key={q.name} className="rounded-3xl border border-dark-border bg-dark-surface p-7 flex flex-col">
              <blockquote className="text-[15px] leading-relaxed text-dark-text-2 mb-7 flex-1">
                <span className="font-instr italic text-mk-purple-2 text-[28px] leading-none align-text-top mr-1">"</span>
                {q.quote}
                <span className="font-instr italic text-mk-purple-2 text-[28px] leading-none align-text-top ml-1">"</span>
              </blockquote>
              <figcaption className="flex items-center gap-3">
                <span className="w-10 h-10 rounded-full bg-dark-surface-2 border border-dark-border-soft grid place-items-center font-medium text-[13px]">{q.initials}</span>
                <span>
                  <span className="block text-[14px] font-medium">{q.name}</span>
                  <span className="block text-[12.5px] text-dark-text-3">{q.role}</span>
                </span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
