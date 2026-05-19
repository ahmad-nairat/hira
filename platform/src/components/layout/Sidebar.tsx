import { NavLink } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import clsx from 'clsx'
import { Briefcase, Calendar, Home, Settings, Users, ChevronUp, MoreHorizontal } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth'
import { usePermission } from '../../hooks/usePermission'
import { orgsApi } from '../../api/orgs.api'
import { formatRole, avTint, initials } from '../../utils/format'

interface Props { collapsed: boolean }

export default function Sidebar({ collapsed }: Props) {
  const { user, membership } = useAuth()
  const { can, isInterviewerOnly } = usePermission()
  const org = useQuery({
    queryKey: ['orgs', membership?.orgId],
    queryFn: () => orgsApi.get(membership!.orgId),
    enabled: !!membership?.orgId,
  })
  const orgName = org.data?.name ?? 'Workspace'

  const items = [
    !isInterviewerOnly && { to: '/', label: 'Dashboard', icon: Home, end: true },
    !isInterviewerOnly && { to: '/jobs', label: 'Jobs', icon: Briefcase },
    !isInterviewerOnly && { to: '/candidates', label: 'Candidates', icon: Users },
    { to: '/interviews', label: 'Interviews', icon: Calendar },
    can.manageSettings && { to: '/settings', label: 'Settings', icon: Settings },
  ].filter(Boolean) as Array<{ to: string; label: string; icon: typeof Home; end?: boolean }>

  return (
    <aside className="bg-bg border-r border-border-soft flex flex-col h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-border-soft">
        <span className="w-7 h-7 rounded-[7px] bg-primary inline-flex items-center justify-center text-white font-bold font-serif italic text-[17px] shrink-0">H</span>
        {!collapsed && <span className="font-serif italic text-[18px] font-medium">Hira</span>}
      </div>

      <nav className="flex flex-col gap-px p-2 flex-1 overflow-y-auto">
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            end={it.end}
            className={({ isActive }) => clsx('nav-item', isActive && 'active', collapsed && 'justify-center px-[9px]')}
            title={collapsed ? it.label : undefined}
          >
            <it.icon size={16} className="nav-icon" />
            {!collapsed && <span>{it.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2.5 border-t border-border-soft flex flex-col gap-1.5">
        <NavLink to="/settings/general" className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface hover:border-border-soft border border-transparent transition-colors">
          <span className={clsx('avatar avatar-sm avatar-square', avTint(orgName))}>{initials(orgName)}</span>
          {!collapsed && (
            <>
              <span className="flex flex-col min-w-0 flex-1 text-left">
                <span className="text-[13px] font-medium truncate">{orgName}</span>
                <span className="text-[11px] text-ink-4 truncate">Workspace</span>
              </span>
              <ChevronUp size={14} className="text-ink-4" />
            </>
          )}
        </NavLink>
        <NavLink to="/profile" className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-surface hover:border-border-soft border border-transparent transition-colors">
          <span className={clsx('avatar avatar-sm', avTint(user?.fullName))}>{initials(user?.fullName)}</span>
          {!collapsed && (
            <>
              <span className="flex flex-col min-w-0 flex-1 text-left">
                <span className="text-[13px] font-medium truncate">{user?.fullName ?? 'You'}</span>
                <span className="text-[11px] text-ink-4 truncate">{membership ? formatRole(membership.role) : ''}</span>
              </span>
              <MoreHorizontal size={14} className="text-ink-4" />
            </>
          )}
        </NavLink>
      </div>
    </aside>
  )
}
