export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship'

export type ReadJobSummaryDTO = {
  id: string
  title: string
  location: string
  type: JobType
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  publishedAt: string
}

export type OrgBranding = {
  name: string
  slug: string
  logoUrl?: string | null
  primaryColor: string
  secondaryColor: string
  careersLogoUrl: string | null
  careersHeroHeadline: string | null
  careersHeroSubheadline: string | null
  careersHeroBgType: 'solid' | 'image' | 'pattern'
  careersHeroBgValue: string | null
  careersCtaLabel: string
}

export type OrgCareersDTO = {
  org: OrgBranding
  jobs: ReadJobSummaryDTO[]
}

export type FormFieldOption = { label: string; value: string }
export type FormFieldValidation = { min?: number; max?: number; minLength?: number; maxLength?: number }

export type JobFormFieldDTO = {
  id: string
  type: 'text' | 'textarea' | 'number' | 'dropdown' | 'checkbox' | 'date' | 'file'
  label: string
  placeholder: string | null
  isRequired: boolean
  isResume: boolean
  sortOrder: number
  sectionId: string | null
  options: FormFieldOption[] | null
  validation: FormFieldValidation | null
}

export type JobFormSectionDTO = {
  id: string
  title: string
  sortOrder: number
}

export type JobDetailDTO = {
  id: string
  title: string
  description: string
  location: string
  type: JobType
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  publishedAt: string
  org: OrgBranding
  form: { sections: JobFormSectionDTO[]; fields: JobFormFieldDTO[] }
}

export type OfferPublicDTO = {
  jobTitle: string
  orgName: string
  salary: string | null
  currency: string | null
  startDate: string | null
  contractType: string | null
  welcomeMessage: string
  status: 'draft' | 'sent' | 'accepted' | 'declined'
  expiresAt: string
}
