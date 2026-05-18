import { Org } from '../entities/org.entity'

export type CreateOrgInput = Pick<Org, 'name' | 'slug'> & Partial<Org>

export interface IOrgRepo {
  findById(id: string): Promise<Org | null>
  findBySlug(slug: string): Promise<Org | null>
  create(data: CreateOrgInput): Promise<Org>
  update(id: string, patch: Partial<Org>): Promise<Org>
  softDelete(id: string): Promise<void>
}
