import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Check, Download, MoreHorizontal, Plus, Search, ShieldOff, Upload } from 'lucide-react'
import { candidatesApi } from '../../api/candidates.api'
import { useOrgId } from '../../hooks/useOrg'
import { usePermission } from '../../hooks/usePermission'
import Spinner from '../../components/ui/Spinner'
import EmptyState from '../../components/ui/EmptyState'
import Button from '../../components/ui/Button'
import Input from '../../components/ui/Input'
import Modal from '../../components/ui/Modal'
import Chip from '../../components/ui/Chip'
import Avatar from '../../components/ui/Avatar'
import Toggle from '../../components/ui/Toggle'
import { extractError } from '../../api/client'
import { formatDate } from '../../utils/format'

export default function CandidatesPage() {
  const orgId = useOrgId()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const { can } = usePermission()
  const [search, setSearch] = useState('')
  const [showHired, setShowHired] = useState(true)
  const [openAdd, setOpenAdd] = useState(false)
  const [draft, setDraft] = useState({ email: '', fullName: '', phone: '' })

  const { data, isLoading } = useQuery({
    queryKey: ['candidates', orgId, { search }],
    queryFn: () => candidatesApi.list(orgId, { search: search || undefined, limit: 100 }),
  })

  const create = useMutation({
    mutationFn: () => candidatesApi.create(orgId, { email: draft.email, fullName: draft.fullName, phone: draft.phone || null }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['candidates', orgId] }); setOpenAdd(false); setDraft({ email: '', fullName: '', phone: '' }) },
  })

  const list = (data?.data ?? []).filter((c) => (showHired ? true : !c.isHired))

  return (
    <div className="p-7">
      <div className="flex items-end justify-between mb-5 gap-4">
        <div>
          <h1 className="text-[22px] font-semibold tracking-[-0.015em]">Candidates</h1>
          <div className="text-ink-3 text-sm mt-1">{data?.meta.total ?? 0} in your pool</div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary"><Download size={14} /> Export</Button>
          {can.manageJobs && <Button variant="primary" onClick={() => setOpenAdd(true)}><Plus size={14} /> Add candidate</Button>}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3.5 flex-wrap">
        <div className="input-icon-wrap w-[280px]">
          <span className="icon"><Search size={14} /></span>
          <input className="input" placeholder="Search by name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <label className="text-ink-3 text-sm flex items-center gap-2">
          <Toggle checked={showHired} onChange={(e) => setShowHired(e.target.checked)} /> Show hired
        </label>
        <div className="ml-auto text-ink-3 text-xs">{list.length} candidates</div>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? <Spinner block /> :
          !list.length ? (
            <EmptyState title="No candidates yet" hint="Candidates appear here once they apply via the careers page or are added manually." />
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-[11.5px] text-ink-4 font-medium">
                  <th className="px-3.5 py-2.5 border-b border-border-soft bg-surface">Name</th>
                  <th className="px-3.5 py-2.5 border-b border-border-soft bg-surface">Email</th>
                  <th className="px-3.5 py-2.5 border-b border-border-soft bg-surface w-[100px]">Source</th>
                  <th className="px-3.5 py-2.5 border-b border-border-soft bg-surface w-[130px]">Added</th>
                  <th className="px-3.5 py-2.5 border-b border-border-soft bg-surface w-[130px]">Status</th>
                  <th className="px-3.5 py-2.5 border-b border-border-soft bg-surface w-[40px]" />
                </tr>
              </thead>
              <tbody>
                {list.map((c) => (
                  <tr key={c.id} className="hover:bg-surface-2 cursor-pointer border-b border-border-soft last:border-b-0" onClick={() => navigate(`/candidates/${c.id}`)}>
                    <td className="px-3.5 py-3.5">
                      <div className="flex items-center gap-2">
                        <Avatar size="sm" name={c.fullName} />
                        <div className="text-sm font-medium">{c.fullName}</div>
                      </div>
                    </td>
                    <td className="px-3.5 py-3.5 text-ink-3 text-sm">{c.email}</td>
                    <td className="px-3.5 py-3.5"><Chip tone="neutral" size="sm">{c.source.replace('_', ' ')}</Chip></td>
                    <td className="px-3.5 py-3.5 text-ink-3 text-sm">{formatDate(c.createdAt)}</td>
                    <td className="px-3.5 py-3.5">
                      {c.isHired
                        ? <Chip tone="green"><Check size={10} /> Hired</Chip>
                        : <Chip tone="neutral">In pipeline</Chip>}
                    </td>
                    <td className="px-3.5 py-3.5"><button className="icon-btn" onClick={(e) => e.stopPropagation()}><MoreHorizontal size={14} /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
      </div>

      <Modal
        open={openAdd}
        onClose={() => setOpenAdd(false)}
        title="Add candidate"
        subtitle="Add a candidate to the pool. You can apply them to a job from their profile."
        footer={
          <>
            <Button onClick={() => setOpenAdd(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => create.mutate()} loading={create.isPending}>Add to pool</Button>
          </>
        }
      >
        <Input label="Full name" value={draft.fullName} onChange={(e) => setDraft({ ...draft, fullName: e.target.value })} required />
        <div className="mt-3.5"><Input label="Email" type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} required /></div>
        <div className="mt-3.5"><Input label="Phone (optional)" value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} /></div>
        {create.isError && <div className="field-error mt-2">{extractError(create.error)}</div>}
      </Modal>
    </div>
  )
}
