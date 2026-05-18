import { injectable } from 'tsyringe'
import { Repository, MoreThan } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { Invite, InviteStatus } from '../../core/entities/invite.entity'
import { IInviteRepo, CreateInviteInput } from '../../core/repo-interfaces/IInviteRepo'

@injectable()
export class InviteRepo implements IInviteRepo {
  private get repo(): Repository<Invite> {
    return AppDataSource.getRepository(Invite)
  }

  async findById(id: string): Promise<Invite | null> {
    return this.repo.findOne({ where: { id }, relations: ['org'] })
  }

  async findByToken(token: string): Promise<Invite | null> {
    return this.repo.findOne({ where: { token }, relations: ['org'] })
  }

  async findByOrg(orgId: string): Promise<Invite[]> {
    return this.repo.find({ where: { orgId }, order: { createdAt: 'DESC' } })
  }

  async findActiveByEmailAndOrg(email: string, orgId: string): Promise<Invite | null> {
    return this.repo.findOne({
      where: { email: email.toLowerCase(), orgId, status: InviteStatus.PENDING, expiresAt: MoreThan(new Date()) },
    })
  }

  async findActiveByEmail(email: string): Promise<Invite[]> {
    return this.repo.find({
      where: { email: email.toLowerCase(), status: InviteStatus.PENDING, expiresAt: MoreThan(new Date()) },
      relations: ['org'],
    })
  }

  async create(data: CreateInviteInput): Promise<Invite> {
    return this.repo.save(this.repo.create({ ...data, email: data.email.toLowerCase() }))
  }

  async updateStatus(id: string, status: InviteStatus): Promise<Invite> {
    await this.repo.update({ id }, { status })
    const updated = await this.findById(id)
    if (!updated) throw new Error('Invite not found after update')
    return updated
  }

  async updateToken(id: string, token: string, expiresAt: Date): Promise<Invite> {
    await this.repo.update({ id }, { token, expiresAt, status: InviteStatus.PENDING })
    const updated = await this.findById(id)
    if (!updated) throw new Error('Invite not found after update')
    return updated
  }

  async delete(id: string): Promise<void> {
    await this.repo.delete({ id })
  }
}
