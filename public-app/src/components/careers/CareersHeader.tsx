import Link from 'next/link'
import OrgLogo from './OrgLogo'
import type { OrgBranding } from '../../types/api'

export default function CareersHeader({ org }: { org: OrgBranding }) {
  return (
    <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-lt-border">
      <div className="max-w-[1180px] mx-auto px-6 h-16 flex items-center gap-4">
        <Link href={`/careers/${org.slug}`} className="flex items-center gap-2.5">
          <OrgLogo name={org.name} src={org.careersLogoUrl ?? org.logoUrl ?? null} size={32} />
          <span className="font-medium text-[15px] text-ink">{org.name} <span className="text-ink-3 font-normal">Careers</span></span>
        </Link>
        <Link href={`/careers/${org.slug}`} className="ml-auto inline-flex items-center gap-1.5 text-[13px] text-ink-2 hover:text-ink">
          <OrgLogo name={org.name} src={null} size={18} /> {org.name}
        </Link>
      </div>
    </header>
  )
}
