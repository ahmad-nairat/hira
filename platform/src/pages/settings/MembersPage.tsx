import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { MoreHorizontal } from 'lucide-react'
import { membersApi } from '../../api/members.api'
import { useOrgId } from '../../hooks/useOrg'
import { useAuth } from '../../hooks/useAuth'
import Spinner from '../../components/ui/Spinner'
import Avatar from '../../components/ui/Avatar'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import { SettingsHeader } from './SettingsLayout'
import { formatDate, formatRole } from '../../utils/format'
import type { OrgRole } from '../../types/api'

export default function MembersPage() {
  const orgId = useOrgId()
  const qc = useQueryClient()
  const { user } = useAuth()
  const members = useQuery({ queryKey: ['members', orgId], queryFn: () => membersApi.list(orgId) })

  const updateRole = useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: OrgRole }) => membersApi.updateRole(orgId, userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', orgId] }),
  })
  const remove = useMutation({
    mutationFn: (userId: string) => membersApi.remove(orgId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['members', orgId] }),
  })

  if (members.isLoading) return <Spinner block />

  return (
    <>
      <SettingsHeader label="Members & roles" title={<>Your <span className="ital">team</span></>} sub="Manage who can access this workspace and what they can do." />
      <div className="card overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-[11.5px] text-ink-4 font-medium">
              <th className="px-3.5 py-2.5 bg-surface border-b border-border-soft">Member</th>
              <th className="px-3.5 py-2.5 bg-surface border-b border-border-soft w-[220px]">Role</th>
              <th className="px-3.5 py-2.5 bg-surface border-b border-border-soft w-[100px]">Status</th>
              <th className="px-3.5 py-2.5 bg-surface border-b border-border-soft w-[130px]">Joined</th>
              <th className="px-3.5 py-2.5 bg-surface border-b border-border-soft w-[40px]" />
            </tr>
          </thead>
          <tbody>
            {members.data?.map((m) => (
              <tr key={m.id} className="border-b border-border-soft last:border-b-0">
                <td className="px-3.5 py-3.5">
                  <div className="flex items-center gap-2">
                    <Avatar size="sm" name={m.user?.fullName} />
                    <div>
                      <div className="text-sm font-medium">{m.user?.fullName ?? '—'}</div>
                      <div className="text-ink-4 text-xs">{m.user?.email ?? '—'}</div>
                    </div>
                  </div>
                </td>
                <td className="px-3.5 py-3.5">
                  <select
                    className="select h-[30px] bg-surface-2 text-[12.5px]"
                    value={m.role}
                    disabled={m.userId === user?.id}
                    onChange={(e) => updateRole.mutate({ userId: m.userId, role: e.target.value as OrgRole })}
                  >
                    <option value="admin">Admin</option>
                    <option value="recruiter">Recruiter</option>
                    <option value="hiring_manager">Hiring Manager</option>
                    <option value="interviewer">Interviewer</option>
                  </select>
                </td>
                <td className="px-3.5 py-3.5"><Chip tone="green" size="sm" withDot>Active</Chip></td>
                <td className="px-3.5 py-3.5 text-ink-3 text-sm">{formatDate(m.joinedAt)}</td>
                <td className="px-3.5 py-3.5">
                  {m.userId !== user?.id ? (
                    <Button size="sm" variant="danger" onClick={() => remove.mutate(m.userId)}>Remove</Button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  )
}
