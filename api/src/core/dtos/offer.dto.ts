import { z } from 'zod'
import { Offer, OfferStatus } from '../entities/offer.entity'

export const CreateOfferSchema = z.object({
  salary: z.number().positive().nullable().optional(),
  currency: z.string().length(3).nullable().optional(),
  startDate: z.string().date().nullable().optional(),
  contractType: z.string().max(100).nullable().optional(),
  welcomeMessage: z.string().max(10_000).default(''),
})

export const UpdateOfferSchema = CreateOfferSchema.partial()

export const RespondToOfferSchema = z.object({
  decision: z.enum(['accept', 'decline']),
})

export const ResendOfferSchema = z.object({
  email: z.string().email(),
})

export type CreateOfferDTO = z.infer<typeof CreateOfferSchema>
export type UpdateOfferDTO = z.infer<typeof UpdateOfferSchema>
export type RespondToOfferDTO = z.infer<typeof RespondToOfferSchema>
export type ResendOfferDTO = z.infer<typeof ResendOfferSchema>

export interface ReadOfferDTO {
  id: string
  applicationId: string
  orgId: string
  salary: string | null
  currency: string | null
  startDate: string | null
  contractType: string | null
  welcomeMessage: string
  status: OfferStatus
  sentAt: string | null
  respondedAt: string | null
  createdAt: string
}

export function toReadOfferDTO(o: Offer): ReadOfferDTO {
  return {
    id: o.id,
    applicationId: o.applicationId,
    orgId: o.orgId,
    salary: o.salary,
    currency: o.currency,
    startDate: o.startDate,
    contractType: o.contractType,
    welcomeMessage: o.welcomeMessage,
    status: o.status,
    sentAt: o.sentAt?.toISOString() ?? null,
    respondedAt: o.respondedAt?.toISOString() ?? null,
    createdAt: o.createdAt.toISOString(),
  }
}

/**
 * Public view for the candidate offer page — strips internal IDs.
 */
export interface PublicOfferDTO {
  jobTitle: string
  orgName: string
  salary: string | null
  currency: string | null
  startDate: string | null
  contractType: string | null
  welcomeMessage: string
  status: OfferStatus
  expiresAt: string
}
