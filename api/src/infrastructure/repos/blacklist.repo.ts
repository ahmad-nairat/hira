import { injectable } from 'tsyringe'
import { Repository } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { BlacklistEntry } from '../../core/entities/blacklist-entry.entity'
import { IBlacklistRepo, CreateBlacklistEntryInput } from '../../core/repo-interfaces/IBlacklistRepo'

@injectable()
export class BlacklistRepo implements IBlacklistRepo {
  private get repo(): Repository<BlacklistEntry> {
    return AppDataSource.getRepository(BlacklistEntry)
  }

  async findActive(orgId: string, candidateId: string): Promise<BlacklistEntry | null> {
    return this.repo
      .createQueryBuilder('b')
      .where('b.orgId = :orgId', { orgId })
      .andWhere('b.candidateId = :candidateId', { candidateId })
      .andWhere('(b.expiresAt IS NULL OR b.expiresAt > NOW())')
      .getOne()
  }

  async findByCandidate(candidateId: string): Promise<BlacklistEntry[]> {
    return this.repo.find({ where: { candidateId } })
  }

  async create(data: CreateBlacklistEntryInput): Promise<BlacklistEntry> {
    return this.repo.save(this.repo.create(data))
  }

  async deleteByOrgAndCandidate(orgId: string, candidateId: string): Promise<void> {
    await this.repo.delete({ orgId, candidateId })
  }
}
