import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { orgsApi } from '../../api/orgs.api'
import { useOrgId } from '../../hooks/useOrg'
import Spinner from '../../components/ui/Spinner'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import { SettingsHeader } from './SettingsLayout'
import { extractError } from '../../api/client'

export default function GeneralSettingsPage() {
  const orgId = useOrgId()
  const qc = useQueryClient()
  const org = useQuery({ queryKey: ['org', orgId], queryFn: () => orgsApi.get(orgId) })
  const [name, setName] = useState('')
  const [primaryColor, setPrimaryColor] = useState('#6D5EF7')

  useEffect(() => {
    if (org.data) { setName(org.data.name); setPrimaryColor(org.data.primaryColor) }
  }, [org.data])

  const save = useMutation({
    mutationFn: () => orgsApi.update(orgId, { name, primaryColor }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org', orgId] }),
  })
  if (org.isLoading) return <Spinner block />

  return (
    <>
      <SettingsHeader label="General info" title={<>Workspace <span className="ital">identity</span></>} sub="Basic information about your organization, used in emails and on your careers page." />
      <div className="card p-6">
        <Input label="Organization name" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="mt-4">
          <label className="label block">Primary brand color</label>
          <div className="flex items-center gap-3 mt-1.5">
            <input className="w-10 h-10 rounded-md border border-border bg-surface" type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
            <input className="input w-32 font-mono" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)} />
          </div>
        </div>
        {save.isError && <div className="field-error mt-2">{extractError(save.error)}</div>}
      </div>
      <div className="flex gap-2 mt-4">
        <Button variant="primary" onClick={() => save.mutate()} loading={save.isPending}>Save changes</Button>
        <Button onClick={() => org.data && (setName(org.data.name), setPrimaryColor(org.data.primaryColor))}>Discard</Button>
      </div>
    </>
  )
}
