import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Briefcase, Search } from 'lucide-react'
import { jobsApi } from '../../api/jobs.api'
import { candidatesApi } from '../../api/candidates.api'
import { useOrgId } from '../../hooks/useOrg'
import Avatar from '../ui/Avatar'

interface Props { open: boolean; onClose: () => void }

export default function SearchModal({ open, onClose }: Props) {
  const orgId = useOrgId()
  const navigate = useNavigate()
  const [q, setQ] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { if (open) inputRef.current?.focus() }, [open])
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  const jobs = useQuery({
    queryKey: ['jobs', orgId, { page: 1, limit: 6, search: q || undefined }],
    queryFn: () => jobsApi.list(orgId, { page: 1, limit: 6, search: q || undefined }),
    enabled: open,
  })
  const cands = useQuery({
    queryKey: ['candidates', orgId, { page: 1, limit: 6, search: q || undefined }],
    queryFn: () => candidatesApi.list(orgId, { page: 1, limit: 6, search: q || undefined }),
    enabled: open,
  })

  if (!open) return null
  return (
    <div className="modal-overlay items-start pt-20" onClick={onClose}>
      <div className="modal max-w-[580px]" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 px-[18px] py-3.5 border-b border-border-soft">
          <Search size={16} className="text-ink-3" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search jobs, candidates, by name or email…"
            className="flex-1 bg-transparent border-0 outline-none text-ink text-base"
          />
          <span className="text-ink-4 text-xs">ESC</span>
        </div>
        <div className="p-2 max-h-[460px] overflow-y-auto">
          {(jobs.data?.data?.length ?? 0) > 0 && (
            <>
              <div className="mono-label px-3 pt-2.5 pb-1.5">Jobs</div>
              {jobs.data?.data.map((j) => (
                <button
                  key={j.id}
                  className="nav-item"
                  onClick={() => { navigate(`/jobs/${j.id}`); onClose() }}
                >
                  <Briefcase size={14} className="nav-icon" />
                  <div className="flex-1 text-left">
                    <div>{j.title}</div>
                    <div className="text-ink-4 text-xs">{j.location} · {j.type.replace('_', ' ')}</div>
                  </div>
                  <span className="text-ink-4">↵</span>
                </button>
              ))}
            </>
          )}
          {(cands.data?.data?.length ?? 0) > 0 && (
            <>
              <div className="mono-label px-3 pt-3 pb-1.5">Candidates</div>
              {cands.data?.data.map((c) => (
                <button
                  key={c.id}
                  className="nav-item"
                  onClick={() => { navigate(`/candidates/${c.id}`); onClose() }}
                >
                  <Avatar size="sm" name={c.fullName} />
                  <div className="flex-1 text-left">
                    <div>{c.fullName}</div>
                    <div className="text-ink-4 text-xs">{c.email}</div>
                  </div>
                </button>
              ))}
            </>
          )}
          {!jobs.data?.data?.length && !cands.data?.data?.length && (
            <div className="p-8 text-center text-ink-3 text-sm">No results.</div>
          )}
        </div>
      </div>
    </div>
  )
}
