import Link from 'next/link'
import OrgLogo from './OrgLogo'
import HiraLogo from '../marketing/HiraLogo'
import type { OrgBranding } from '../../types/api'

export default function CareersFooter({ org }: { org: OrgBranding }) {
  return (
    <footer className="border-t border-lt-border mt-20">
      <div className="max-w-[1180px] mx-auto px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5 text-[13px] text-ink-2">
          <OrgLogo name={org.name} src={null} size={22} />
          <span>© {new Date().getFullYear()} {org.name}</span>
        </div>
        <Link href="/" className="inline-flex items-center gap-2 text-[12.5px] text-ink-3 hover:text-ink">
          Powered by <span className="inline-flex items-center gap-1.5"><HiraLogo size={14} /> Hira</span>
        </Link>
      </div>
    </footer>
  )
}
