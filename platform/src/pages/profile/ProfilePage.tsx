import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { LogOut, Upload } from 'lucide-react'
import { authApi } from '../../api/auth.api'
import { useAuthStore } from '../../stores/auth.store'
import { useAuth } from '../../hooks/useAuth'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import { formatRole } from '../../utils/format'

export default function ProfilePage() {
  const { user, membership } = useAuth()
  const logout = useAuthStore((s) => s.logout)
  const navigate = useNavigate()

  const signOut = useMutation({
    mutationFn: () => authApi.logout(),
    onSettled: () => { logout(); navigate('/login') },
  })

  return (
    <div className="max-w-[880px] mx-auto p-8">
      <div className="mono-label mb-2">Personal</div>
      <h1 className="h-display text-[32px] m-0">Your <span className="ital">profile</span></h1>
      <p className="text-ink-3 mt-2 text-sm">Information about you that's visible to your teammates.</p>

      <div className="card p-[22px] mt-6">
        <div className="flex items-center gap-3 mb-[18px]">
          <Avatar size="xl" name={user?.fullName} src={user?.avatarUrl} />
          <div>
            <Button variant="secondary"><Upload size={13} /> Upload avatar</Button>
            <Button className="ml-1.5 text-ink-3">Remove</Button>
            <div className="text-ink-4 text-xs mt-1.5">PNG or JPG · 1 MB max</div>
          </div>
        </div>
        <Input label="Full name" defaultValue={user?.fullName ?? ''} />
        <div className="mt-4">
          <Input label="Email" defaultValue={user?.email ?? ''} disabled hint="Email is managed by your SSO provider." />
        </div>
        {membership ? (
          <div className="mt-4 text-ink-3 text-sm">
            Role: <strong className="text-ink">{formatRole(membership.role)}</strong>
          </div>
        ) : null}
      </div>

      <div className="card p-[22px] mt-4 border-rose-br bg-rose/[0.04]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-sm font-semibold">Sign out</div>
            <div className="text-ink-3 text-sm mt-1">You'll need your password to sign back in.</div>
          </div>
          <Button variant="danger" onClick={() => signOut.mutate()} loading={signOut.isPending}><LogOut size={13} /> Sign out</Button>
        </div>
      </div>
    </div>
  )
}
