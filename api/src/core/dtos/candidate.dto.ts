import { z } from 'zod'
import { Candidate, CandidateSource } from '../entities/candidate.entity'

export const CreateCandidateSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(1).max(255),
  phone: z.string().max(50).nullable().optional(),
  linkedinUrl: z.string().url().nullable().optional(),
  source: z.nativeEnum(CandidateSource).optional(),
})

export const UpdateCandidateSchema = z.object({
  fullName: z.string().min(1).max(255).optional(),
  phone: z.string().max(50).nullable().optional(),
  linkedinUrl: z.string().url().nullable().optional(),
  extraLinks: z.array(z.object({ key: z.string(), url: z.string().url() })).optional(),
})

export const BlacklistSchema = z.object({
  reason: z.string().min(1).max(2000),
  durationType: z.enum(['months_6', 'months_12', 'permanent', 'custom']),
  expiresAt: z.string().datetime().nullable().optional(),
})

export const SuggestSchema = z.object({
  jobId: z.string().uuid(),
})

export const CandidateQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  isHired: z.coerce.boolean().optional(),
})

export type CreateCandidateDTO = z.infer<typeof CreateCandidateSchema>
export type UpdateCandidateDTO = z.infer<typeof UpdateCandidateSchema>
export type BlacklistDTO = z.infer<typeof BlacklistSchema>
export type SuggestDTO = z.infer<typeof SuggestSchema>
export type CandidateQueryDTO = z.infer<typeof CandidateQuerySchema>

export interface ReadCandidateDTO {
  id: string
  orgId: string
  email: string
  fullName: string
  phone: string | null
  linkedinUrl: string | null
  extraLinks: Array<{ key: string; url: string }>
  source: CandidateSource
  isHired: boolean
  parsedSkills: Array<{ name: string; level?: string }>
  parsedExperience: Array<{ title: string; company: string; start: string; end?: string; description?: string }>
  parsedEducation: Array<{ degree: string; institution: string; year?: string }>
  parsedCerts: Array<{ name: string; issuer?: string; year?: string }>
  // URL of the most recently submitted application's resume, or null if the
  // candidate has no application yet. The candidate page exposes a "View resume"
  // button driven off this field.
  latestResumeUrl: string | null
  createdAt: string
  updatedAt: string
}

export function toReadCandidateDTO(c: Candidate, latestResumeUrl: string | null = null): ReadCandidateDTO {
  return {
    id: c.id,
    orgId: c.orgId,
    email: c.email,
    fullName: c.fullName,
    phone: c.phone,
    linkedinUrl: c.linkedinUrl,
    extraLinks: c.extraLinks ?? [],
    source: c.source,
    isHired: c.isHired,
    parsedSkills: c.parsedSkills ?? [],
    parsedExperience: c.parsedExperience ?? [],
    parsedEducation: c.parsedEducation ?? [],
    parsedCerts: c.parsedCerts ?? [],
    latestResumeUrl,
    createdAt: c.createdAt.toISOString(),
    updatedAt: c.updatedAt.toISOString(),
  }
}
