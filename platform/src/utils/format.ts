import type { PipelineStage } from '../types/api'

export function formatStage(stage: PipelineStage | string): string {
  return stage.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
export function formatRole(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}
export function scoreClass(score: number | null | undefined): 'high' | 'mid' | 'low' | 'none' {
  if (score === null || score === undefined) return 'none'
  if (score >= 80) return 'high'
  if (score >= 50) return 'mid'
  return 'low'
}
export function initials(fullName?: string | null): string {
  if (!fullName) return '?'
  const parts = fullName.trim().split(/\s+/)
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}
export function avTint(seed?: string | null): string {
  if (!seed) return 'av-1'
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) | 0
  return `av-${(Math.abs(h) % 8) + 1}`
}
export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}
export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleString(undefined, { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
}
export function formatSalary(min: number | null, max: number | null, currency: string | null): string {
  if (!min && !max) return ''
  const c = currency ?? 'USD'
  if (min && max) return `${c} ${min.toLocaleString()}–${max.toLocaleString()}`
  return `${c} ${(min ?? max ?? 0).toLocaleString()}`
}
export const STAGE_ORDER: PipelineStage[] = [
  'early_rejection', 'blacklisted', 'ai_evaluation',
  'screening', 'interview', 'specialist_interview',
  'review', 'hm_approved', 'offer_sent', 'offer_accepted',
  'hired', 'declined', 'rejected',
]
export function stageDotClass(stage: PipelineStage): string {
  return stage.replace(/_/g, '-')
}
