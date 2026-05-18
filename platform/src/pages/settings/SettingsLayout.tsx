import { NavLink, Outlet } from 'react-router-dom'
import clsx from 'clsx'

const NAV = [
  { id: 'general', l: 'General info' },
  { id: 'domain', l: 'Domain & access' },
  { id: 'members', l: 'Members & roles' },
  { id: 'invites', l: 'Invites & requests' },
  { id: 'scoring', l: 'Scoring weights' },
  { id: 'branding', l: 'Branding' },
  { id: 'danger', l: 'Danger zone', danger: true },
]

export default function SettingsLayout() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-7 p-7">
      <div>
        <div className="mono-label px-2 pb-2">Workspace</div>
        <div className="flex flex-col gap-px">
          {NAV.map((it) => (
            <NavLink key={it.id} to={`/settings/${it.id}`} className={({ isActive }) => clsx('settings-nav-item', isActive && 'active', it.danger && 'danger')}>
              {it.l}
            </NavLink>
          ))}
        </div>
      </div>
      <div className="max-w-[760px] w-full">
        <Outlet />
      </div>
    </div>
  )
}

export function SettingsHeader({ label, title, sub }: { label: string; title: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-6">
      <div className="mono-label mb-2">{label}</div>
      <h1 className="h-display text-[32px] m-0">{title}</h1>
      {sub && <p className="text-ink-3 mt-2 text-sm max-w-[540px]">{sub}</p>}
    </div>
  )
}
