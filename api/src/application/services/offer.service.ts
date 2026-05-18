import { injectable, inject } from 'tsyringe'
import crypto from 'crypto'
import { TOKENS } from '../../infrastructure/di/tokens'
import { IOfferRepo } from '../../core/repo-interfaces/IOfferRepo'
import { IApplicationRepo } from '../../core/repo-interfaces/IApplicationRepo'
import { IApplicationStageHistoryRepo } from '../../core/repo-interfaces/IApplicationStageHistoryRepo'
import { INotificationRepo } from '../../core/repo-interfaces/INotificationRepo'
import { IMailService } from '../../infrastructure/services/mail.service'
import { ISseService } from '../../infrastructure/services/sse.service'
import {
  CreateOfferDTO,
  UpdateOfferDTO,
  ReadOfferDTO,
  PublicOfferDTO,
  toReadOfferDTO,
} from '../../core/dtos/offer.dto'
import { OfferStatus } from '../../core/entities/offer.entity'
import { PipelineStage } from '../../core/entities/application.entity'
import { OrgRole } from '../../core/entities/org-membership.entity'
import { NotificationType } from '../../core/entities/notification.entity'
import { NotFoundError, ForbiddenError, BusinessRuleError, GoneError, ConflictError } from '../errors'
import { Membership } from './types'

const OFFER_TOKEN_TTL_MS = 24 * 60 * 60 * 1000

@injectable()
export class OfferService {
  constructor(
    @inject(TOKENS.IOfferRepo) private readonly offerRepo: IOfferRepo,
    @inject(TOKENS.IApplicationRepo) private readonly appRepo: IApplicationRepo,
    @inject(TOKENS.IApplicationStageHistoryRepo) private readonly historyRepo: IApplicationStageHistoryRepo,
    @inject(TOKENS.INotificationRepo) private readonly notificationRepo: INotificationRepo,
    @inject(TOKENS.IMailService) private readonly mail: IMailService,
    @inject(TOKENS.ISseService) private readonly sse: ISseService,
  ) {}

  async create(applicationId: string, dto: CreateOfferDTO, membership: Membership): Promise<ReadOfferDTO> {
    this.assertCanIssueOffers(membership)
    const app = await this.appRepo.findById(applicationId)
    if (!app) throw new NotFoundError('Application')
    if (app.orgId !== membership.orgId) throw new ForbiddenError()
    if (app.currentStage !== PipelineStage.HM_APPROVED) {
      throw new BusinessRuleError('Offers can only be created from the HM Approved stage')
    }
    const existing = await this.offerRepo.findByApplication(applicationId)
    if (existing) throw new ConflictError('Application already has an offer')

    const token = crypto.randomBytes(48).toString('hex')
    const offer = await this.offerRepo.create({
      applicationId,
      orgId: membership.orgId,
      salary: dto.salary?.toString() ?? null,
      currency: dto.currency ?? null,
      startDate: dto.startDate ?? null,
      contractType: dto.contractType ?? null,
      welcomeMessage: dto.welcomeMessage ?? '',
      token,
      tokenExpiresAt: new Date(Date.now() + OFFER_TOKEN_TTL_MS),
    })
    return toReadOfferDTO(offer)
  }

  async update(applicationId: string, dto: UpdateOfferDTO, membership: Membership): Promise<ReadOfferDTO> {
    this.assertCanIssueOffers(membership)
    const offer = await this.offerRepo.findByApplication(applicationId)
    if (!offer) throw new NotFoundError('Offer')
    if (offer.orgId !== membership.orgId) throw new ForbiddenError()
    if (offer.status !== OfferStatus.DRAFT) throw new BusinessRuleError('Only draft offers can be updated')
    const updated = await this.offerRepo.update(offer.id, {
      salary: dto.salary?.toString() ?? offer.salary,
      currency: dto.currency ?? offer.currency,
      startDate: dto.startDate ?? offer.startDate,
      contractType: dto.contractType ?? offer.contractType,
      welcomeMessage: dto.welcomeMessage ?? offer.welcomeMessage,
    })
    return toReadOfferDTO(updated)
  }

  async send(applicationId: string, membership: Membership): Promise<ReadOfferDTO> {
    this.assertCanIssueOffers(membership)
    const offer = await this.offerRepo.findByApplication(applicationId)
    if (!offer) throw new NotFoundError('Offer')
    if (offer.orgId !== membership.orgId) throw new ForbiddenError()
    if (offer.status === OfferStatus.ACCEPTED || offer.status === OfferStatus.DECLINED) {
      throw new BusinessRuleError('Offer already finalised')
    }

    const token = crypto.randomBytes(48).toString('hex')
    const tokenExpiresAt = new Date(Date.now() + OFFER_TOKEN_TTL_MS)
    const updated = await this.offerRepo.update(offer.id, {
      token,
      tokenExpiresAt,
      status: OfferStatus.SENT,
      sentAt: new Date(),
    })

    const app = await this.appRepo.findById(applicationId)
    if (app) {
      await this.appRepo.updateStage(applicationId, PipelineStage.OFFER_SENT)
      await this.historyRepo.create({
        applicationId,
        fromStage: app.currentStage,
        toStage: PipelineStage.OFFER_SENT,
        movedBy: membership.userId,
        note: 'Offer sent to candidate',
      })
      const candidateEmail = app.candidate?.email
      if (candidateEmail) {
        await this.mail.sendOfferEmail(candidateEmail, token, app.job?.title ?? 'role', app.org?.name ?? 'Hira')
      }
    }
    return toReadOfferDTO(updated)
  }

  async getPublicByToken(token: string): Promise<PublicOfferDTO> {
    const offer = await this.offerRepo.findByToken(token)
    if (!offer) throw new NotFoundError('Offer')
    if (offer.tokenExpiresAt < new Date()) throw new GoneError('This offer link has expired')
    const app = await this.appRepo.findById(offer.applicationId)
    if (!app) throw new NotFoundError('Application')
    return {
      jobTitle: app.job?.title ?? '',
      orgName: app.org?.name ?? '',
      salary: offer.salary,
      currency: offer.currency,
      startDate: offer.startDate,
      contractType: offer.contractType,
      welcomeMessage: offer.welcomeMessage,
      status: offer.status,
      expiresAt: offer.tokenExpiresAt.toISOString(),
    }
  }

  async respond(token: string, decision: 'accept' | 'decline'): Promise<void> {
    const offer = await this.offerRepo.findByToken(token)
    if (!offer) throw new NotFoundError('Offer')
    if (offer.tokenExpiresAt < new Date()) throw new GoneError('This offer link has expired')
    if (offer.status !== OfferStatus.SENT) throw new BusinessRuleError('Offer already finalised')

    const newOfferStatus = decision === 'accept' ? OfferStatus.ACCEPTED : OfferStatus.DECLINED
    const newStage = decision === 'accept' ? PipelineStage.OFFER_ACCEPTED : PipelineStage.DECLINED

    await this.offerRepo.updateStatus(offer.id, newOfferStatus, new Date())
    const app = await this.appRepo.findById(offer.applicationId)
    if (app) {
      await this.appRepo.updateStage(app.id, newStage)
      await this.historyRepo.create({
        applicationId: app.id,
        fromStage: app.currentStage,
        toStage: newStage,
        movedBy: null,
        note: `Candidate ${decision === 'accept' ? 'accepted' : 'declined'} the offer`,
      })

      const type = decision === 'accept' ? NotificationType.OFFER_ACCEPTED : NotificationType.OFFER_DECLINED
      const recruiterId = app.job?.recruiterId
      if (recruiterId) {
        const n = await this.notificationRepo.create({
          orgId: offer.orgId,
          userId: recruiterId,
          type,
          payload: { applicationId: app.id, offerId: offer.id },
        })
        this.sse.push(recruiterId, { id: n.id, type, payload: n.payload, createdAt: n.createdAt.toISOString() })
      }
    }
  }

  async resend(email: string): Promise<void> {
    try {
      const offer = await this.offerRepo.findActiveByEmail(email.toLowerCase())
      if (!offer) return
      const token = crypto.randomBytes(48).toString('hex')
      const tokenExpiresAt = new Date(Date.now() + OFFER_TOKEN_TTL_MS)
      await this.offerRepo.update(offer.id, { token, tokenExpiresAt })
      await this.mail.sendOfferResendEmail(email, token)
    } catch (err) {
      console.error('[offer:resend] swallowed', err)
    }
  }

  private assertCanIssueOffers(membership: Membership): void {
    if (membership.role !== OrgRole.ADMIN && membership.role !== OrgRole.RECRUITER) {
      throw new ForbiddenError('Only admins or recruiters can issue offers')
    }
  }
}
