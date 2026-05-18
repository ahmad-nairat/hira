import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle, Copy, Globe } from 'lucide-react'
import { domainsApi } from '../../api/domains.api'
import { useOrgId } from '../../hooks/useOrg'
import Spinner from '../../components/ui/Spinner'
import Input from '../../components/ui/Input'
import Button from '../../components/ui/Button'
import Chip from '../../components/ui/Chip'
import { SettingsHeader } from './SettingsLayout'
import { extractError } from '../../api/client'

export default function DomainSettingsPage() {
  const orgId = useOrgId()
  const qc = useQueryClient()
  const domain = useQuery({ queryKey: ['domain', orgId], queryFn: () => domainsApi.get(orgId) })
  const [input, setInput] = useState('')

  const submit = useMutation({ mutationFn: () => domainsApi.submit(orgId, input), onSuccess: () => { setInput(''); qc.invalidateQueries({ queryKey: ['domain', orgId] }) } })
  const verify = useMutation({ mutationFn: () => domainsApi.verify(orgId), onSuccess: () => qc.invalidateQueries({ queryKey: ['domain', orgId] }) })
  const remove = useMutation({ mutationFn: () => domainsApi.remove(orgId), onSuccess: () => qc.invalidateQueries({ queryKey: ['domain', orgId] }) })

  if (domain.isLoading) return <Spinner block />

  return (
    <>
      <SettingsHeader label="Domain & access" title={<>Email <span className="ital">domain</span></>} sub="Verify your domain so teammates can find your workspace automatically." />
      <div className="card p-[22px]">
        <div className="flex items-center justify-between mb-3.5">
          <div>
            <div className="text-sm font-semibold">Domain verification</div>
            <div className="text-ink-3 text-xs mt-0.5">Add a DNS TXT record to prove ownership.</div>
          </div>
          {domain.data?.status === 'verified' && <Chip tone="green"><CheckCircle size={11} /> Verified</Chip>}
          {domain.data?.status === 'pending' && <Chip tone="amber" withDot>Pending</Chip>}
        </div>
        {domain.data ? (
          <>
            <Input label="Email domain" value={domain.data.domain} disabled leftIcon={<Globe size={14} />} />
            {domain.data.status === 'pending' && (
              <div className="mt-3.5 p-3 bg-surface-2 border border-border-soft rounded-md">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium">DNS TXT record</div>
                  <Button size="sm"><Copy size={12} /> Copy</Button>
                </div>
                <pre className="code-block">{`Type:  TXT
Host:  ${domain.data.expectedTxtHost}
Value: ${domain.data.expectedTxtRecord}`}</pre>
                <div className="flex gap-2 mt-3">
                  <Button variant="primary" onClick={() => verify.mutate()} loading={verify.isPending}>Check now</Button>
                  <Button variant="danger" onClick={() => remove.mutate()} loading={remove.isPending}>Remove</Button>
                </div>
              </div>
            )}
            {domain.data.status === 'verified' && (
              <div className="mt-3 flex justify-end">
                <Button variant="danger" onClick={() => remove.mutate()} loading={remove.isPending}>Remove domain</Button>
              </div>
            )}
          </>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); submit.mutate() }}>
            <Input label="Email domain" placeholder="example.com" value={input} onChange={(e) => setInput(e.target.value)} required leftIcon={<Globe size={14} />} />
            {submit.isError && <div className="field-error mt-2">{extractError(submit.error)}</div>}
            <div className="mt-3.5"><Button type="submit" variant="primary" loading={submit.isPending}>Submit</Button></div>
          </form>
        )}
      </div>
    </>
  )
}
