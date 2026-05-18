import { ReactNode } from 'react'
import { Info } from 'lucide-react'

interface Props { title: string; hint?: string; action?: ReactNode; icon?: ReactNode }
export default function EmptyState({ title, hint, action, icon }: Props) {
  return (
    <div className="empty">
      <div className="empty-art">{icon ?? <Info size={28} />}</div>
      <h3>{title}</h3>
      {hint ? <p>{hint}</p> : null}
      {action}
    </div>
  )
}
