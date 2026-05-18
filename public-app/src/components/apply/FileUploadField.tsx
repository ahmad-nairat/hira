'use client'

import { ChangeEvent, useRef, useState } from 'react'
import { File, Upload, X } from 'lucide-react'
import clsx from 'clsx'

interface Props { id: string; isResume: boolean; onChange: (file: File | null) => void }

export default function FileUploadField({ id, isResume, onChange }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const accept = isResume ? '.pdf,.doc,.docx' : undefined

  const setF = (f: File | null) => { setFile(f); onChange(f) }

  return (
    <label
      htmlFor={id}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => {
        e.preventDefault(); setDragging(false)
        const f = e.dataTransfer.files?.[0] ?? null
        if (f) { setF(f); if (ref.current) { const dt = new DataTransfer(); dt.items.add(f); ref.current.files = dt.files } }
      }}
      className={clsx(
        'block rounded-xl border-2 border-dashed transition-colors cursor-pointer p-8 text-center',
        dragging ? 'border-brand bg-brand-soft' : 'border-lt-border bg-surface-2 hover:border-ink-3',
      )}
    >
      <input
        id={id}
        ref={ref}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e: ChangeEvent<HTMLInputElement>) => setF(e.target.files?.[0] ?? null)}
      />
      {file ? (
        <div className="flex items-center justify-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-white border border-lt-border grid place-items-center">
            <File size={18} className="text-ink-2" />
          </div>
          <div className="text-left">
            <div className="text-[14px] font-medium text-ink">{file.name}</div>
            <div className="text-[12.5px] text-ink-3">{(file.size / 1024).toFixed(0)} KB</div>
          </div>
          <button
            type="button"
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setF(null); if (ref.current) ref.current.value = '' }}
            className="ml-3 w-8 h-8 rounded-full bg-white border border-lt-border grid place-items-center text-ink-2 hover:text-rose hover:border-rose/40"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <>
          <div className="w-12 h-12 rounded-full bg-white border border-lt-border grid place-items-center mx-auto mb-3" style={{ color: 'var(--brand)' }}>
            <Upload size={18} />
          </div>
          <div className="text-[14px] text-ink font-medium">
            Click to upload or drag and drop
          </div>
          <div className="text-[12.5px] text-ink-3 mt-1">PDF or Word, up to 10 MB.</div>
        </>
      )}
    </label>
  )
}
