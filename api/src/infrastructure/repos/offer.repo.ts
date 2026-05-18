import { injectable } from 'tsyringe'
import { Repository, IsNull } from 'typeorm'
import { QueryDeepPartialEntity } from 'typeorm/query-builder/QueryPartialEntity'
import { AppDataSource } from '../database/data-source'
import { Offer, OfferStatus } from '../../core/entities/offer.entity'
import { Application } from '../../core/entities/application.entity'
import { Candidate } from '../../core/entities/candidate.entity'
import { IOfferRepo, CreateOfferInput } from '../../core/repo-interfaces/IOfferRepo'

@injectable()
export class OfferRepo implements IOfferRepo {
  private get repo(): Repository<Offer> {
    return AppDataSource.getRepository(Offer)
  }

  async findById(id: string): Promise<Offer | null> {
    return this.repo.findOne({ where: { id, deletedAt: IsNull() } })
  }

  async findByApplication(applicationId: string): Promise<Offer | null> {
    return this.repo.findOne({ where: { applicationId, deletedAt: IsNull() } })
  }

  async findByToken(token: string): Promise<Offer | null> {
    return this.repo.findOne({ where: { token, deletedAt: IsNull() } })
  }

  async findActiveByEmail(email: string): Promise<Offer | null> {
    return this.repo
      .createQueryBuilder('o')
      .innerJoin(Application, 'a', 'a.id = o.applicationId')
      .innerJoin(Candidate, 'c', 'c.id = a.candidateId')
      .where('c.email = :email', { email: email.toLowerCase() })
      .andWhere('o.status = :status', { status: OfferStatus.SENT })
      .andWhere('o.deletedAt IS NULL')
      .orderBy('o.createdAt', 'DESC')
      .getOne()
  }

  async create(data: CreateOfferInput): Promise<Offer> {
    return this.repo.save(this.repo.create(data))
  }

  async update(id: string, patch: Partial<Offer>): Promise<Offer> {
    await this.repo.update({ id }, patch as QueryDeepPartialEntity<Offer>)
    const updated = await this.findById(id)
    if (!updated) throw new Error('Offer not found after update')
    return updated
  }

  async updateStatus(id: string, status: OfferStatus, respondedAt?: Date): Promise<Offer> {
    await this.repo.update({ id }, { status, respondedAt: respondedAt ?? null })
    const updated = await this.findById(id)
    if (!updated) throw new Error('Offer not found after update')
    return updated
  }
}
