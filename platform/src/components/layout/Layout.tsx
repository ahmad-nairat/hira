import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import clsx from 'clsx'
import Sidebar from './Sidebar'
import TopBar from './TopBar'
import NotificationDrawer from './NotificationDrawer'
import { useSse } from '../../hooks/useSse'

export default function Layout() {
  useSse()
  const [collapsed, setCollapsed] = useState(false)
  const [notifsOpen, setNotifsOpen] = useState(false)

  return (
    <div
      className={clsx('grid min-h-screen')}
      style={{ gridTemplateColumns: `${collapsed ? 60 : 240}px 1fr` }}
    >
      <Sidebar collapsed={collapsed} />
      <main className="min-w-0 flex flex-col">
        <TopBar onToggleSidebar={() => setCollapsed((c) => !c)} onOpenNotifs={() => setNotifsOpen(true)} />
        <div className="animate-fade-in flex-1">
          <Outlet />
        </div>
      </main>
      <NotificationDrawer open={notifsOpen} onClose={() => setNotifsOpen(false)} />
    </div>
  )
}
