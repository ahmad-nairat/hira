import { ReactNode, useEffect } from 'react'
import { X } from 'lucide-react'
import clsx from 'clsx'

interface Props {
  open: boolean
  onClose: () => void
  title?: string
  subtitle?: string
  size?: 'md' | 'lg'
  footer?: ReactNode
  children: ReactNode
}
export default function Modal({ open, onClose, title, subtitle, size = 'md', footer, children }: Props) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className={clsx('modal', size === 'lg' && 'lg')} onClick={(e) => e.stopPropagation()}>
        {title || subtitle ? (
          <div className="modal-head flex items-start justify-between gap-3">
            <div>
              {title ? <h2 className="modal-title">{title}</h2> : null}
              {subtitle ? <div className="modal-sub">{subtitle}</div> : null}
            </div>
            <button className="icon-btn" onClick={onClose} aria-label="Close"><X size={14} /></button>
          </div>
        ) : null}
        <div className="modal-body">{children}</div>
        {footer ? <div className="modal-foot">{footer}</div> : null}
      </div>
    </div>
  )
}
