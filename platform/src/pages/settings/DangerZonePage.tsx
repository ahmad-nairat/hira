import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { AlertOctagon } from 'lucide-react'
import { orgsApi } from '../../api/orgs.api'
import { useOrgId } from '../../hooks/useOrg'
import { useAuthStore } from '../../stores/auth.store'
import Button from '../../components/ui/Button'
import Modal from '../../components/ui/Modal'
import Banner from '../../components/ui/Banner'
import { SettingsHeader } from './SettingsLayout'
import { extractError } from '../../api/client'

export default function DangerZonePage() {
  const orgId = useOrgId()
  const navigate = useNavigate()
  const logout = useAuthStore((s) => s.logout)
  const [open, setOpen] = useState(false)

  const remove = useMutation({
    mutationFn: () => orgsApi.delete(orgId),
    onSuccess: () => { logout(); navigate('/login') },
  })

  return (
    <>
      <SettingsHeader label="Danger zone" title={<>Irreversible <span className="ital">actions</span></>} sub="These actions can't be undone. Take a deep breath before clicking." />
      <div className="card p-[22px] border-rose-br bg-rose/[0.04]">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="text-sm font-semibold text-rose-ink">Delete organization</div>
            <div className="text-ink-3 text-sm mt-1 leading-snug max-w-[480px]">
              Permanently delete this organization and all its data — jobs, candidates, interviews, offers. This cannot be undone.
            </div>
          </div>
          <Button variant="danger" onClick={() => setOpen(true)}>Delete organization</Button>
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="Delete organization" subtitle="This will permanently delete the workspace, including all jobs, candidates, and offers."
        footer={<>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button variant="danger" onClick={() => remove.mutate()} loading={remove.isPending}>Delete forever</Button>
        </>}>
        <Banner tone="rose" icon={<AlertOctagon size={14} />}>
          <strong>This action is permanent.</strong> All members will be detached and all data wiped.
        </Banner>
        {remove.isError && <div className="field-error mt-3">{extractError(remove.error)}</div>}
      </Modal>
    </>
  )
}
