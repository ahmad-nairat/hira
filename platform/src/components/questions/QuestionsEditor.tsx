import { useEffect, useState } from 'react'
import { Trash2 } from 'lucide-react'
import Button from '../ui/Button'
import type { QuestionItem } from '../../types/api'

interface Props {
  initial: QuestionItem[]
  onSave: (items: QuestionItem[]) => Promise<void>
}

/**
 * Shared editor for a generated interview-question set. Used by both the
 * recruiter-facing application page and the interviewer's interview page —
 * interviewers especially need this to capture the candidate's answers
 * during the call.
 *
 * Per-question deletion: clicking the trash icon next to a question removes
 * it from the local list and persists the filtered set via `onSave` in the
 * same step — no extra Save click required for delete to stick.
 */
export default function QuestionsEditor({ initial, onSave }: Props) {
  const [items, setItems] = useState<QuestionItem[]>(initial)
  const [saving, setSaving] = useState(false)
  const [deletingIndex, setDeletingIndex] = useState<number | null>(null)

  // If the parent re-fetches and passes a fresh array (e.g. after generate or
  // an external delete), reset local state so we mirror the source of truth.
  useEffect(() => { setItems(initial) }, [initial])

  return (
    <div className="flex flex-col gap-3 mt-2">
      {items.map((it, i) => (
        <div key={i}>
          <div className="flex items-start gap-2 mb-1.5">
            <span className="font-mono text-ink-4 text-xs mt-0.5">{String(i + 1).padStart(2, '0')}</span>
            <div className="text-sm flex-1">{it.question}</div>
            <button
              type="button"
              title="Remove this question"
              disabled={deletingIndex !== null || saving}
              onClick={async () => {
                setDeletingIndex(i)
                const next = items.filter((_, j) => j !== i)
                try {
                  await onSave(next)
                  setItems(next)
                } finally {
                  setDeletingIndex(null)
                }
              }}
              className="text-ink-4 hover:text-rose-ink transition-colors disabled:opacity-40"
            >
              <Trash2 size={13} />
            </button>
          </div>
          <textarea
            className="textarea ml-6"
            style={{ width: 'calc(100% - 22px)' }}
            rows={2}
            placeholder="Notes / answer…"
            value={it.answer ?? ''}
            onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, answer: e.target.value } : x)))}
          />
        </div>
      ))}
      <Button
        size="sm"
        variant="primary"
        loading={saving}
        disabled={items.length === 0}
        onClick={async () => {
          setSaving(true)
          try { await onSave(items) } finally { setSaving(false) }
        }}
      >Save answers</Button>
    </div>
  )
}
