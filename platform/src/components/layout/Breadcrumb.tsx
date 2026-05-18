import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

const SECTION_LABELS: Record<string, string> = {
  general: 'General info', domain: 'Domain & access', members: 'Members & roles',
  invites: 'Invites & requests', 'access-requests': 'Invites & requests',
  scoring: 'Scoring weights', branding: 'Branding', danger: 'Danger zone',
}

export default function Breadcrumb() {
  const { pathname } = useLocation()
  const parts = pathname.split('/').filter(Boolean)
  if (parts.length === 0) return <div className="text-[13px] text-ink"><span className="font-medium">Dashboard</span></div>

  const crumbs: Array<{ label: string; path: string | null }> = []
  const root = parts[0]

  if (root === 'jobs') {
    crumbs.push({ label: 'Jobs', path: '/jobs' })
    if (parts[1] === 'new') crumbs.push({ label: 'Post a job', path: null })
    else if (parts[1]) {
      crumbs.push({ label: 'Job', path: `/jobs/${parts[1]}` })
      if (parts[2] === 'settings') crumbs.push({ label: 'Settings', path: null })
    }
  } else if (root === 'candidates') {
    crumbs.push({ label: 'Candidates', path: '/candidates' })
    if (parts[1]) crumbs.push({ label: 'Profile', path: null })
  } else if (root === 'applications') {
    crumbs.push({ label: 'Application', path: null })
  } else if (root === 'interviews') {
    crumbs.push({ label: 'Interviews', path: '/interviews' })
    if (parts[1]) crumbs.push({ label: 'Detail', path: null })
  } else if (root === 'settings') {
    crumbs.push({ label: 'Settings', path: '/settings/general' })
    const sec = parts[1] || 'general'
    crumbs.push({ label: SECTION_LABELS[sec] ?? sec, path: null })
  } else if (root === 'profile') {
    crumbs.push({ label: 'Profile', path: null })
  }

  return (
    <div className="flex items-center gap-2 text-[13px] text-ink-3 min-w-0 shrink">
      {crumbs.map((c, i) => (
        <span key={i} className="flex items-center gap-2">
          {i > 0 ? <ChevronRight size={13} className="text-ink-5" /> : null}
          {!c.path || i === crumbs.length - 1 ? (
            <span className="text-ink font-medium">{c.label}</span>
          ) : (
            <Link to={c.path} className="text-ink-3 hover:text-ink">{c.label}</Link>
          )}
        </span>
      ))}
    </div>
  )
}
