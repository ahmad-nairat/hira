import { z } from 'zod'
import { Org } from '../entities/org.entity'
import { OrgRole } from '../entities/org-membership.entity'

export const CreateOrgSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
})

export const UpdateOrgSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  logoUrl: z.string().url().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export const UpdateBrandingSchema = z.object({
  careersLogoUrl: z.string().url().nullable().optional(),
  careersHeroHeadline: z.string().max(255).nullable().optional(),
  careersHeroSubheadline: z.string().max(500).nullable().optional(),
  careersHeroBgType: z.enum(['solid', 'image', 'pattern1', 'pattern2']).optional(),
  careersHeroBgValue: z.string().max(500).nullable().optional(),
  careersCtaLabel: z.string().max(100).optional(),
  primaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  secondaryColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
})

export const UpdateScoringSchema = z
  .object({
    scoringEducation: z.number().min(0).max(1),
    scoringSkills: z.number().min(0).max(1),
    scoringExperience: z.number().min(0).max(1),
    scoringCerts: z.number().min(0).max(1),
  })
  .refine(
    (v) => Math.abs(v.scoringEducation + v.scoringSkills + v.scoringExperience + v.scoringCerts - 1) < 0.001,
    { message: 'Scoring weights must sum to 1.0' },
  )

export const UpdateAutoJoinSchema = z.object({
  autoJoinEnabled: z.boolean(),
  autoJoinDefaultRole: z.nativeEnum(OrgRole).nullable().optional(),
})

export type CreateOrgDTO = z.infer<typeof CreateOrgSchema>
export type UpdateOrgDTO = z.infer<typeof UpdateOrgSchema>
export type UpdateBrandingDTO = z.infer<typeof UpdateBrandingSchema>
export type UpdateScoringDTO = z.infer<typeof UpdateScoringSchema>
export type UpdateAutoJoinDTO = z.infer<typeof UpdateAutoJoinSchema>

export interface ReadOrgDTO {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  autoJoinEnabled: boolean
  autoJoinDefaultRole: OrgRole | null
  careersLogoUrl: string | null
  careersHeroHeadline: string | null
  careersHeroSubheadline: string | null
  careersHeroBgType: string
  careersHeroBgValue: string | null
  careersCtaLabel: string
  scoringEducation: number
  scoringSkills: number
  scoringExperience: number
  scoringCerts: number
  createdAt: string
  updatedAt: string
}

export function toReadOrgDTO(org: Org): ReadOrgDTO {
  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    logoUrl: org.logoUrl,
    primaryColor: org.primaryColor,
    secondaryColor: org.secondaryColor,
    autoJoinEnabled: org.autoJoinEnabled,
    autoJoinDefaultRole: org.autoJoinDefaultRole,
    careersLogoUrl: org.careersLogoUrl,
    careersHeroHeadline: org.careersHeroHeadline,
    careersHeroSubheadline: org.careersHeroSubheadline,
    careersHeroBgType: org.careersHeroBgType,
    careersHeroBgValue: org.careersHeroBgValue,
    careersCtaLabel: org.careersCtaLabel,
    scoringEducation: Number(org.scoringEducation),
    scoringSkills: Number(org.scoringSkills),
    scoringExperience: Number(org.scoringExperience),
    scoringCerts: Number(org.scoringCerts),
    createdAt: org.createdAt.toISOString(),
    updatedAt: org.updatedAt.toISOString(),
  }
}
