import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, PanelLeftClose, Search } from 'lucide-react'
import Breadcrumb from './Breadcrumb'
import Avatar from '../ui/Avatar'
import { useAuth } from '../../hooks/useAuth'
import { useNotificationStore } from '../../stores/notification.store'
import SearchModal from './SearchModal'

interface Props { onToggleSidebar: () => void; onOpenNotifs: () => void }

export default function TopBar({ onToggleSidebar, onOpenNotifs }: Props) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const unread = useNotificationStore((s) => s.unreadCount)
  const [searchOpen, setSearchOpen] = useState(false)

  return (
    <header className="h-14 bg-bg-app/80 backdrop-blur-md border-b border-border-soft flex items-center px-[18px] gap-3.5 sticky top-0 z-10">
      <button className="icon-btn" onClick={onToggleSidebar} title="Toggle sidebar">
        <PanelLeftClose size={16} />
      </button>
      <Breadcrumb />
      <button
        onClick={() => setSearchOpen(true)}
        className="ml-auto flex items-center bg-surface border border-border-soft hover:border-border rounded-lg h-8 px-2.5 gap-2 w-[280px] text-ink-4 text-[13px] cursor-text"
      >
        <Search size={14} />
        <span>Search jobs, candidates…</span>
        <span className="font-mono text-[10.5px] px-1.5 py-0.5 rounded bg-surface-2 text-ink-3 ml-auto">⌘K</span>
      </button>
      <div className="flex items-center gap-1.5">
        <button className="icon-btn relative" onClick={onOpenNotifs} title="Notifications">
          <Bell size={16} />
          {unread > 0 ? <span className="absolute top-[7px] right-2 w-[7px] h-[7px] rounded-full bg-primary border-[1.5px] border-bg-app" /> : null}
        </button>
        <button className="icon-btn" onClick={() => navigate('/profile')} title="Profile">
          <Avatar name={user?.fullName} size="sm" className="!w-6 !h-6 text-[9.5px]" />
        </button>
      </div>

      <SearchModal open={searchOpen} onClose={() => setSearchOpen(false)} />
    </header>
  )
}
