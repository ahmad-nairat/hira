import { BlacklistEntry } from '../entities/blacklist-entry.entity'

export interface CreateBlacklistEntryInput {
  orgId: string
  candidateId: string
  reason: string
  blacklistedBy: string
  durationType: string
  expiresAt: Date | null
}

export interface IBlacklistRepo {
  findActive(orgId: string, candidateId: string): Promise<BlacklistEntry | null>
  findByCandidate(candidateId: string): Promise<BlacklistEntry[]>
  create(data: CreateBlacklistEntryInput): Promise<BlacklistEntry>
  deleteByOrgAndCandidate(orgId: string, candidateId: string): Promise<void>
}
