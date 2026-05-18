import type { JobType } from '../types/api'

export function formatJobType(type: JobType): string {
  return ({ full_time: 'Full-time', part_time: 'Part-time', contract: 'Contract', internship: 'Internship' })[type]
}

export function formatSalary(min: number | null, max: number | null, currency: string | null): string {
  if (!min && !max) return ''
  const c = currency ?? 'USD'
  const symbol = c === 'USD' ? '$' : c === 'EUR' ? '€' : c === 'GBP' ? '£' : `${c} `
  const k = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}k` : n.toString())
  if (min && max) return `${symbol}${k(min)} – ${symbol}${k(max)}`
  return `${symbol}${k(min ?? max ?? 0)}`
}

export function timeAgo(iso: string): string {
  const d = new Date(iso).getTime()
  const diff = Date.now() - d
  const days = Math.floor(diff / 86_400_000)
  if (days < 1) return 'today'
  if (days === 1) return '1 day ago'
  if (days < 7) return `${days} days ago`
  const weeks = Math.floor(days / 7)
  if (weeks === 1) return '1 week ago'
  if (weeks < 5) return `${weeks} weeks ago`
  const months = Math.floor(days / 30)
  if (months === 1) return '1 month ago'
  return `${months} months ago`
}

export function initials(name: string): string {
  return name.split(/\s+/).map((p) => p[0]?.toUpperCase() ?? '').slice(0, 2).join('')
}

export function formatDate(iso: string | null): string {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })
}
