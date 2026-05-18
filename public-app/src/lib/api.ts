import type { JobDetailDTO, OfferPublicDTO, OrgCareersDTO } from '../types/api'

const PUBLIC_API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3010/api/v1'
const INTERNAL_API = process.env.INTERNAL_API_URL ?? PUBLIC_API

function pickApi(): string {
  // SSR-side: prefer in-network URL so we reach the API container directly.
  return typeof window === 'undefined' ? INTERNAL_API : PUBLIC_API
}

export class ApiError extends Error {
  status: number
  issues?: unknown
  constructor(msg: string, status: number, issues?: unknown) {
    super(msg)
    this.status = status
    this.issues = issues
  }
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${pickApi()}${path}`, {
    cache: 'no-store',
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
    ...init,
  })
  if (!res.ok) {
    const body: { error?: string; issues?: unknown } = await res.json().catch(() => ({}))
    throw new ApiError(body.error ?? `Request failed: ${res.status}`, res.status, body.issues)
  }
  return res.json() as Promise<T>
}

export async function getOrgCareers(orgSlug: string): Promise<{ data: OrgCareersDTO }> {
  return apiFetch(`/public/careers/${encodeURIComponent(orgSlug)}`)
}
export async function getJobDetail(orgSlug: string, jobId: string): Promise<{ data: JobDetailDTO }> {
  return apiFetch(`/public/careers/${encodeURIComponent(orgSlug)}/jobs/${encodeURIComponent(jobId)}`)
}
export async function submitApplication(orgSlug: string, jobId: string, formData: FormData): Promise<void> {
  const res = await fetch(`${pickApi()}/public/careers/${encodeURIComponent(orgSlug)}/jobs/${encodeURIComponent(jobId)}/apply`, {
    method: 'POST', body: formData,
  })
  if (!res.ok) {
    const body: { error?: string; issues?: unknown } = await res.json().catch(() => ({}))
    throw new ApiError(body.error ?? 'Submission failed', res.status, body.issues)
  }
}
export async function getOfferByToken(token: string): Promise<{ data: OfferPublicDTO }> {
  return apiFetch(`/offers/${encodeURIComponent(token)}`)
}
export async function respondToOffer(token: string, decision: 'accept' | 'decline'): Promise<void> {
  await apiFetch(`/offers/${encodeURIComponent(token)}/respond`, {
    method: 'POST', body: JSON.stringify({ decision }),
  })
}
export async function resendOffer(email: string): Promise<void> {
  await apiFetch('/offers/resend', { method: 'POST', body: JSON.stringify({ email }) }).catch(() => undefined)
}
