import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import { Mail, Send, UserPlus } from 'lucide-react'
import { invitesApi } from '../../api/invites.api'
import { accessRequestsApi } from '../../api/access-requests.api'
import { useOrgId } from '../../hooks/useOrg'
import Spinner from '../../components/ui/Spinner'
import Input from '../../components/ui/Input'
import Select from '../../components/ui/Select'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Chip from '../../components/ui/Chip'
import EmptyState from '../../components/ui/EmptyState'
import { SettingsHeader } from './SettingsLayout'
import { extractError } from '../../api/client'
import { formatDate } from '../../utils/format'
import type { OrgRole } from '../../types/api'

export default function InvitesPage() {
  const orgId = useOrgId()
  const qc = useQueryClient()
  const [tab, setTab] = useState<'invites' | 'requests'>('invites')
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<OrgRole>('recruiter')

  const invites = useQuery({ queryKey: ['invites', orgId], queryFn: () => invitesApi.list(orgId) })
  const reqs = useQuery({ queryKey: ['access-requests', orgId], queryFn: () => accessRequestsApi.list(orgId) })

  const create = useMutation({
    mutationFn: () => invitesApi.create(orgId, { email, role }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['invites', orgId] }); setOpen(false); setEmail('') },
  })
  const resend = useMutation({ mutationFn: (id: string) => invitesApi.resend(orgId, id), onSuccess: () => qc.invalidateQueries({ queryKey: ['invites', orgId] }) })
  const revoke = useMutation({ mutationFn: (id: string) => invitesApi.revoke(orgId, id), onSuccess: () => qc.invalidateQueries({ queryKey: ['invites', orgId] }) })
  const approve = useMutation({ mutationFn: (id: string) => accessRequestsApi.approve(orgId, id), onSuccess: () => qc.invalidateQueries({ queryKey: ['access-requests', orgId] }) })
  const reject = useMutation({ mutationFn: (id: string) => accessRequestsApi.reject(orgId, id), onSuccess: () => qc.invalidateQueries({ queryKey: ['access-requests', orgId] }) })

  return (
    <>
      <div className="flex items-end justify-between mb-6">
        <div>
          <SettingsHeader label="Invites & requests" title={<>Pending <span className="ital">access</span></>} sub="Manage pending invitations and access requests from users on your verified domain." />
        </div>
        <Button variant="primary" onClick={() => setOpen(true)}><UserPlus size={13} /> Invite member</Button>
      </div>

      <div className="tabs mb-5">
        <button className={clsx('tab', tab === 'invites' && 'active')} onClick={() => setTab('invites')}>
          Invites <span className="text-ink-4 text-xs ml-1">{invites.data?.length ?? 0}</span>
        </button>
        <button className={clsx('tab', tab === 'requests' && 'active')} onClick={() => setTab('requests')}>
          Access requests <span className="text-ink-4 text-xs ml-1">{reqs.data?.length ?? 0}</span>
        </button>
      </div>

      {tab === 'invites' && (
        <div className="card overflow-hidden">
          {invites.isLoading ? <Spinner block /> : invites.data?.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11.5px] text-ink-4 font-medium">
                  <th className="px-3.5 py-2.5 bg-surface border-b border-border-soft">Email</th>
                  <th className="px-3.5 py-2.5 bg-surface border-b border-border-soft w-[140px]">Role</th>
                  <th className="px-3.5 py-2.5 bg-surface border-b border-border-soft w-[120px]">Expires</th>
                  <th className="px-3.5 py-2.5 bg-surface border-b border-border-soft w-[120px]">Status</th>
                  <th className="px-3.5 py-2.5 bg-surface border-b border-border-soft w-[200px]" />
                </tr>
              </thead>
              <tbody>
                {invites.data.map((i) => (
                  <tr key={i.id} className="border-b border-border-soft last:border-b-0">
                    <td className="px-3.5 py-3.5 text-sm">{i.email}</td>
                    <td className="px-3.5 py-3.5"><Chip tone="neutral" size="sm">{i.role}</Chip></td>
                    <td className="px-3.5 py-3.5 text-ink-3 text-sm">{formatDate(i.expiresAt)}</td>
                    <td className="px-3.5 py-3.5">
                      {i.status === 'pending' && <Chip tone="amber" size="sm" withDot>Pending</Chip>}
                      {i.status === 'expired' && <Chip tone="rose" size="sm">Expired</Chip>}
                      {i.status === 'accepted' && <Chip tone="green" size="sm" withDot>Accepted</Chip>}
                      {i.status === 'revoked' && <Chip tone="neutral" size="sm">Revoked</Chip>}
                    </td>
                    <td className="px-3.5 py-3.5">
                      {i.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => resend.mutate(i.id)}>Resend</Button>
                          <Button size="sm" variant="danger" onClick={() => revoke.mutate(i.id)}>Revoke</Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No invites yet" hint="Invite teammates to start collaborating." icon={<Send size={28} />} />
          )}
        </div>
      )}

      {tab === 'requests' && (
        <div className="card overflow-hidden">
          {reqs.isLoading ? <Spinner block /> : reqs.data?.length ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11.5px] text-ink-4 font-medium">
                  <th className="px-3.5 py-2.5 bg-surface border-b border-border-soft">Name</th>
                  <th className="px-3.5 py-2.5 bg-surface border-b border-border-soft">Email</th>
                  <th className="px-3.5 py-2.5 bg-surface border-b border-border-soft w-[200px]" />
                </tr>
              </thead>
              <tbody>
                {reqs.data.map((r) => (
                  <tr key={r.id} className="border-b border-border-soft last:border-b-0">
                    <td className="px-3.5 py-3.5 text-sm font-medium">{r.user?.fullName ?? '—'}</td>
                    <td className="px-3.5 py-3.5 text-ink-3 text-sm">{r.user?.email ?? '—'}</td>
                    <td className="px-3.5 py-3.5">
                      <div className="flex gap-2">
                        <Button size="sm" variant="primary" onClick={() => approve.mutate(r.id)}>Approve</Button>
                        <Button size="sm" variant="danger" onClick={() => reject.mutate(r.id)}>Reject</Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <EmptyState title="No pending requests" hint="When a teammate registers with your verified domain, they'll show up here." icon={<UserPlus size={28} />} />
          )}
        </div>
      )}

      <Modal open={open} onClose={() => setOpen(false)} title="Invite member" subtitle="They'll get an email to join." footer={
        <>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="primary" onClick={() => create.mutate()} loading={create.isPending}><Send size={13} /> Send invite</Button>
        </>
      }>
        <Input label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} leftIcon={<Mail size={14} />} required />
        <div className="mt-3.5">
          <Select label="Role" value={role} onChange={(e) => setRole(e.target.value as OrgRole)}>
            <option value="recruiter">Recruiter</option>
            <option value="hiring_manager">Hiring Manager</option>
            <option value="interviewer">Interviewer</option>
            <option value="admin">Admin</option>
          </Select>
        </div>
        {create.isError && <div className="field-error mt-2">{extractError(create.error)}</div>}
      </Modal>
    </>
  )
}
