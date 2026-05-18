import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { useNavigate, Link } from 'react-router-dom'
import { ArrowLeft, ArrowRight, Globe, Info, LogOut, Monitor, Plus, Sparkles, UserPlus, Users } from 'lucide-react'
import { onboardingApi } from '../../api/onboarding.api'
import { membersApi } from '../../api/members.api'
import { useAuthStore } from '../../stores/auth.store'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Spinner from '../../components/ui/Spinner'
import { extractError } from '../../api/client'

export default function OnboardingPage() {
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const logout = useAuthStore((s) => s.logout)
  const setMembership = useAuthStore((s) => s.setMembership)
  const [phase, setPhase] = useState<'welcome' | 'create-org'>('welcome')
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [domain, setDomain] = useState(user?.email?.split('@')[1] ?? '')

  const { data, isLoading } = useQuery({ queryKey: ['onboarding'], queryFn: onboardingApi.check })

  const finalise = async (orgId: string) => {
    const list = await membersApi.list(orgId).catch(() => [])
    const me = list.find((m) => m.userId === user?.id)
    setMembership({ orgId, role: me?.role ?? 'admin' })
    navigate('/')
  }

  const createOrg = useMutation({
    mutationFn: async () => onboardingApi.createOrg({ name, slug }),
    onSuccess: (org) => finalise(org.id),
  })
  const requestJoin = useMutation({
    mutationFn: async () => onboardingApi.requestJoin(),
    onSuccess: async (res) => { if (res.autoJoined) await finalise(res.orgId) },
  })
  const acceptInvite = useMutation({
    mutationFn: (token: string) => onboardingApi.acceptInvite(token),
    onSuccess: (res) => finalise(res.orgId),
  })

  if (isLoading) return <div className="min-h-screen grid place-items-center bg-bg-app"><Spinner block /></div>
  if (data?.hasOrg && data.currentOrgId) {
    void finalise(data.currentOrgId)
    return <div className="min-h-screen grid place-items-center bg-bg-app"><Spinner block /></div>
  }

  if (phase === 'create-org') {
    return (
      <div className="min-h-screen bg-bg-app">
        <div className="max-w-[780px] mx-auto px-6 py-8">
          <Button onClick={() => setPhase('welcome')} className="mb-4 pl-1">
            <ArrowLeft size={14} /> Back
          </Button>
          <div className="mono-label mb-3 flex items-center gap-2.5">
            <span className="w-4 h-px bg-ink-4" /> Step 1 of 1 · Identity
          </div>
          <h1 className="h-display text-[38px]">Name your <span className="ital">organization</span>.</h1>
          <p className="text-ink-3 mt-3.5 text-sm leading-relaxed max-w-[480px]">
            This is how your team and candidates see you. You can change all of this later in settings.
          </p>
          <form onSubmit={(e) => { e.preventDefault(); createOrg.mutate() }}>
            <div className="card p-[22px] mt-7">
              <Input
                label="Organization name"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  if (!slug) setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60))
                }}
                required
                leftIcon={<Monitor size={14} />}
                placeholder="Northwind"
              />
              <div className="grid grid-cols-2 gap-3.5 mt-4">
                <Input label="URL slug" value={slug} onChange={(e) => setSlug(e.target.value)} required hint={`careers at /careers/${slug || 'your-slug'}`} />
                <Input label="Email domain" value={domain} onChange={(e) => setDomain(e.target.value)} leftIcon={<Globe size={14} />} hint="Used for auto-join (optional)" />
              </div>
            </div>
            {createOrg.isError && <div className="field-error mt-3">{extractError(createOrg.error)}</div>}
            <div className="flex items-center justify-between mt-7">
              <Button type="button" onClick={() => setPhase('welcome')}>Cancel</Button>
              <Button type="submit" variant="primary" size="lg" loading={createOrg.isPending}>
                Create workspace <ArrowRight size={14} />
              </Button>
            </div>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-app">
      <div className="flex justify-between items-center px-8 py-5 border-b border-border-soft">
        <Link to="/login" className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-[7px] bg-primary inline-flex items-center justify-center text-white font-serif italic font-bold text-[17px]">H</span>
          <span className="font-serif italic font-semibold">Hira</span>
        </Link>
        <div className="flex items-center gap-3 text-ink-3 text-sm">
          <span>Signed in as <span className="text-ink font-medium">{user?.email}</span></span>
          <Button size="sm" onClick={() => { logout(); navigate('/login') }}>
            <LogOut size={13} /> Sign out
          </Button>
        </div>
      </div>
      <div className="max-w-[780px] mx-auto px-6 pt-[60px] pb-20">
        <div className="mono-label mb-3 flex items-center gap-2.5">
          <span className="w-4 h-px bg-ink-4" /> Step 1 of 1 · Setup
        </div>
        <h1 className="h-display text-[56px]">Welcome, <span className="ital">{user?.fullName?.split(' ')[0] ?? 'there'}</span>.</h1>
        <p className="text-ink-3 mt-3.5 text-sm max-w-[540px]">
          You can create a new organization, or join an existing one if your teammate invited you.
        </p>

        {data?.pendingInvites?.length ? (
          <div className="card mt-9 p-5">
            {data.pendingInvites.map((inv) => (
              <div key={inv.id} className="flex items-center gap-3">
                <div className="icon-tile bg-primary-soft border-primary-br text-primary-ink">
                  <UserPlus size={16} />
                </div>
                <div className="flex-1">
                  <div className="text-base font-semibold">Join {inv.orgName ?? 'an organization'}</div>
                  <div className="text-ink-3 text-sm mt-0.5">You were invited as <strong className="text-ink">{inv.role}</strong>.</div>
                </div>
                <div className="flex items-center gap-2">
                  <Button onClick={() => acceptInvite.mutate(inv.token)} loading={acceptInvite.isPending} variant="primary">Accept</Button>
                  <Button onClick={() => onboardingApi.declineInvite(inv.token).then(() => window.location.reload())}>Decline</Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="card mt-9 p-5">
            <div className="flex items-center gap-3 mb-1">
              <div className="icon-tile bg-transparent"><Users size={15} /></div>
              <div className="text-[15px] font-semibold text-ink-3">Join an existing organization</div>
              <div className="ml-auto text-sm text-ink-4">No invites or matching organizations</div>
            </div>
            <div className="text-ink-3 text-sm pl-[50px]">
              We didn't find any pending invites for{' '}
              <code className="font-mono text-ink-2 bg-surface-2 px-1.5 py-px rounded text-xs">{user?.email}</code>.
            </div>
          </div>
        )}

        {data?.domainOrg && (
          <div className="card mt-4 p-6">
            <div className="flex items-center gap-3 mb-3.5">
              <div className="icon-tile bg-primary-soft border-primary-br text-primary-ink"><Users size={16} /></div>
              <div className="text-base font-semibold">Join {data.domainOrg.name}</div>
            </div>
            <p className="text-ink-2 pl-[50px] mb-4 text-[13.5px] leading-snug">
              Your email domain belongs to <strong>{data.domainOrg.name}</strong>.{' '}
              {data.domainOrg.autoJoinEnabled ? 'You will be added automatically.' : 'An admin needs to approve your request.'}
            </p>
            <div className="pl-[50px]">
              <Button onClick={() => requestJoin.mutate()} loading={requestJoin.isPending} variant="secondary">
                {data.domainOrg.autoJoinEnabled ? 'Join now' : 'Request access'} <ArrowRight size={13} />
              </Button>
              {requestJoin.isSuccess && !requestJoin.data?.autoJoined && (
                <div className="banner banner-green mt-3 flex"><span>Request sent. Admins will review it shortly.</span></div>
              )}
            </div>
          </div>
        )}

        <div className="card mt-4 p-6">
          <div className="flex items-center gap-3 mb-3.5">
            <div className="icon-tile bg-primary-soft border-primary-br text-primary-ink"><Plus size={16} /></div>
            <div className="text-base font-semibold">Create a new organization</div>
            <span className="chip chip-neutral ml-auto">Takes ~2 minutes</span>
          </div>
          <p className="text-ink-2 pl-[50px] mb-[18px] text-[13.5px] leading-snug">
            Set up a fresh Hira workspace. You'll be the Org Admin. Invite your team, publish jobs, and start scoring candidates.
          </p>
          <div className="flex flex-wrap gap-2 pl-[50px] mb-[18px]">
            {[
              { i: <Monitor size={12} />, t: 'Org name & slug' },
              { i: <Globe size={12} />, t: 'Branded careers page' },
              { i: <UserPlus size={12} />, t: 'Invite teammates' },
              { i: <Sparkles size={12} />, t: 'AI scoring out of the box' },
            ].map((t) => <span key={t.t} className="chip">{t.i} {t.t}</span>)}
          </div>
          <div className="pl-[50px]">
            <Button variant="secondary" onClick={() => setPhase('create-org')}>
              Create organization <ArrowRight size={14} />
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between mt-[18px] text-xs text-ink-4">
          <div className="flex items-center gap-2"><Info size={12} /> Not sure what to pick? Read our <a href="#" className="text-ink-2 underline">onboarding guide</a>.</div>
          <a href="#" className="text-ink-2 underline">Chat with support →</a>
        </div>
      </div>
    </div>
  )
}
