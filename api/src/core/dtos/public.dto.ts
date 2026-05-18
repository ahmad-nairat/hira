import { z } from 'zod'

export const PublicApplySchema = z.object({
  answers: z.string(),
})

export type PublicApplyDTO = z.infer<typeof PublicApplySchema>

export interface PublicJobSummaryDTO {
  id: string
  title: string
  location: string
  type: string
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  publishedAt: string
}

export interface PublicJobDetailDTO extends PublicJobSummaryDTO {
  description: string
}

export interface PublicOrgBrandingDTO {
  name: string
  slug: string
  logoUrl: string | null
  primaryColor: string
  secondaryColor: string
  careersLogoUrl: string | null
  careersHeroHeadline: string | null
  careersHeroSubheadline: string | null
  careersHeroBgType: string
  careersHeroBgValue: string | null
  careersCtaLabel: string
}

export interface PublicCareersPageDTO {
  org: PublicOrgBrandingDTO
  jobs: PublicJobSummaryDTO[]
}

export interface PublicJobFullDetailDTO extends PublicJobDetailDTO {
  org: PublicOrgBrandingDTO
  form: {
    sections: Array<{ id: string; title: string; sortOrder: number }>
    fields: Array<{
      id: string
      sectionId: string | null
      type: string
      label: string
      placeholder: string | null
      isRequired: boolean
      isResume: boolean
      sortOrder: number
      options: Array<{ label: string; value: string }> | null
      validation: { min?: number; max?: number; minLength?: number; maxLength?: number } | null
    }>
  }
}
