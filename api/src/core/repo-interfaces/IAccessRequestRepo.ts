import { AccessRequest, AccessRequestStatus } from '../entities/access-request.entity'

export interface CreateAccessRequestInput {
  orgId: string
  userId: string
}

export interface IAccessRequestRepo {
  findById(id: string): Promise<AccessRequest | null>
  findByOrg(orgId: string, status?: AccessRequestStatus): Promise<AccessRequest[]>
  findByUserAndOrg(userId: string, orgId: string): Promise<AccessRequest | null>
  create(data: CreateAccessRequestInput): Promise<AccessRequest>
  updateStatus(id: string, status: AccessRequestStatus, reviewedBy: string): Promise<AccessRequest>
}
