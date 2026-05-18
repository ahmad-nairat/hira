'use client'

import { useMemo, useState } from 'react'
import clsx from 'clsx'
import { Search } from 'lucide-react'
import JobCard from './JobCard'
import type { JobType, ReadJobSummaryDTO } from '../../types/api'

interface Props { jobs: ReadJobSummaryDTO[]; orgSlug: string }

export default function JobsList({ jobs, orgSlug }: Props) {
  const [q, setQ] = useState('')
  const [type, setType] = useState<JobType | 'all'>('all')
  const [loc, setLoc] = useState<string>('all')

  const locations = useMemo(() => {
    return Array.from(new Set(jobs.map((j) => j.location))).slice(0, 6)
  }, [jobs])

  const filtered = jobs.filter((j) => {
    if (type !== 'all' && j.type !== type) return false
    if (loc !== 'all' && j.location !== loc) return false
    if (q.trim() && !`${j.title} ${j.location}`.toLowerCase().includes(q.toLowerCase())) return false
    return true
  })

  return (
    <section id="open-roles" className="bg-white py-20">
      <div className="max-w-[1180px] mx-auto px-6">
        <div className="flex items-end justify-between gap-4 mb-2">
          <h2 className="h-display-lt text-[clamp(28px,4vw,40px)]">Open roles</h2>
        </div>
        <p className="text-ink-2 text-[14.5px] mb-7">
          {filtered.length} of {jobs.length} positions match your filters.
        </p>

        <div className="lt-card p-2 flex flex-wrap items-center gap-2 mb-5">
          <div className="relative flex-1 min-w-[240px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-3" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search roles, teams, or locations…"
              className="w-full h-10 pl-9 pr-3 rounded-xl bg-transparent text-[14px] text-ink placeholder:text-ink-3 outline-none"
            />
          </div>
          <Segmented value={type} onChange={(v) => setType(v)} options={[
            { v: 'all' as const, l: 'All' },
            { v: 'full_time' as const, l: 'Full-time' },
            { v: 'part_time' as const, l: 'Part-time' },
            { v: 'contract' as const, l: 'Contract' },
            { v: 'internship' as const, l: 'Internship' },
          ]} />
          {locations.length > 0 && (
            <Segmented value={loc} onChange={(v) => setLoc(v)} options={[
              { v: 'all', l: 'All' },
              ...locations.map((l) => ({ v: l, l })),
            ]} />
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="lt-card p-10 text-center text-ink-3">
            No roles match your filters.
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((j, i) => <JobCard key={j.id} job={j} orgSlug={orgSlug} featured={i === 0} />)}
          </div>
        )}
      </div>
    </section>
  )
}

interface SegmentedProps<T extends string> {
  value: T
  onChange: (v: T) => void
  options: Array<{ v: T; l: string }>
}

function Segmented<T extends string>({ value, onChange, options }: SegmentedProps<T>) {
  return (
    <div className="inline-flex items-center bg-surface-2 rounded-xl p-1 gap-0.5">
      {options.map((opt) => (
        <button
          key={opt.v}
          onClick={() => onChange(opt.v)}
          className={clsx(
            'h-8 px-3 rounded-lg text-[13px] font-medium transition-colors',
            value === opt.v ? 'bg-white text-ink shadow-sm' : 'text-ink-2 hover:text-ink',
          )}
        >
          {opt.l}
        </button>
      ))}
    </div>
  )
}
