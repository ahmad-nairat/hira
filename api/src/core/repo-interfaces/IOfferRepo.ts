import { Offer, OfferStatus } from '../entities/offer.entity'

export interface CreateOfferInput {
  applicationId: string
  orgId: string
  salary?: string | null
  currency?: string | null
  startDate?: string | null
  contractType?: string | null
  welcomeMessage: string
  token: string
  tokenExpiresAt: Date
}

export interface IOfferRepo {
  findById(id: string): Promise<Offer | null>
  findByApplication(applicationId: string): Promise<Offer | null>
  findByToken(token: string): Promise<Offer | null>
  findActiveByEmail(email: string): Promise<Offer | null>
  create(data: CreateOfferInput): Promise<Offer>
  update(id: string, patch: Partial<Offer>): Promise<Offer>
  updateStatus(id: string, status: OfferStatus, respondedAt?: Date): Promise<Offer>
}
