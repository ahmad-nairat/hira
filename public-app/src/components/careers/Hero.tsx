import OrgLogo from './OrgLogo'
import { heroBackground } from '../../lib/brand'
import { ArrowDown } from 'lucide-react'
import type { OrgBranding } from '../../types/api'

interface Props { org: OrgBranding; openRoles: number; teamSize?: number; locations?: number; remoteFriendly?: boolean }

export default function CareersHero({ org, openRoles, teamSize, locations, remoteFriendly }: Props) {
  const headline = org.careersHeroHeadline ?? `Join ${org.name}.`
  const sub = org.careersHeroSubheadline ?? `We're hiring across multiple roles. Find one that fits.`
  return (
    <section className="relative overflow-hidden text-white" style={heroBackground(org)}>
      <div
        className="absolute inset-0 pointer-events-none opacity-50"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.06) 1px, transparent 0)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="relative max-w-[1180px] mx-auto px-6 pt-20 pb-24 grid lg:grid-cols-[1fr_280px] gap-12 items-center">
        <div>
          <div className="flex items-center gap-3 mb-7">
            <OrgLogo name={org.name} src={org.careersLogoUrl ?? org.logoUrl ?? null} size={44} className="!bg-white/10 backdrop-blur" />
            <span className="text-[15px] font-medium tracking-tight">{org.name}</span>
          </div>
          <h1 className="font-sans font-medium tracking-[-0.04em] leading-[0.95] text-[clamp(44px,6vw,76px)] max-w-[820px]">
            {headline}
          </h1>
          <p className="text-white/85 text-[16px] leading-relaxed mt-6 max-w-[600px]">{sub}</p>
          <a
            href="#open-roles"
            className="inline-flex items-center gap-2 mt-9 px-6 h-12 rounded-full bg-white text-ink font-medium text-[14px] hover:bg-white/95 transition-colors"
          >
            {org.careersCtaLabel || 'See open roles'}
            <ArrowDown size={15} />
          </a>
        </div>
        <ul className="flex flex-col gap-1.5 text-[14px]">
          <Stat label="Open roles" value={String(openRoles)} />
          {teamSize ? <Stat label="Team size" value={`${teamSize}+`} /> : null}
          {locations ? <Stat label="Locations" value={String(locations)} /> : null}
          <Stat label="Remote-friendly" value={remoteFriendly ? 'Yes' : 'In office'} />
        </ul>
      </div>
    </section>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <li className="flex items-baseline justify-between gap-4 px-4 py-2 rounded-lg bg-white/[0.08] backdrop-blur">
      <span className="font-mono text-[11px] uppercase tracking-[0.14em] text-white/70">{label}</span>
      <span className="font-instr italic text-[22px] leading-none">{value}</span>
    </li>
  )
}
