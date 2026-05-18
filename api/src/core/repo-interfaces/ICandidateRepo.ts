import { Candidate } from '../entities/candidate.entity'
import { CandidateQueryDTO } from '../dtos/candidate.dto'

export type CreateCandidateInput = Partial<Candidate> & Pick<Candidate, 'orgId' | 'email' | 'fullName' | 'source'>

export interface ICandidateRepo {
  findById(id: string): Promise<Candidate | null>
  findByOrgAndEmail(orgId: string, email: string): Promise<Candidate | null>
  findByOrgAndPhone(orgId: string, phone: string): Promise<Candidate | null>
  findAll(query: CandidateQueryDTO, orgId: string): Promise<[Candidate[], number]>
  create(data: CreateCandidateInput): Promise<Candidate>
  update(id: string, patch: Partial<Candidate>): Promise<Candidate>
  softDelete(id: string): Promise<void>
}
