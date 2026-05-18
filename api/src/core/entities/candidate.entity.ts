import { Entity, Column, ManyToOne, JoinColumn, Unique } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Org } from './org.entity'

export enum CandidateSource {
  CAREERS_PAGE = 'careers_page',
  MANUAL_UPLOAD = 'manual_upload',
  INVITED = 'invited',
}

export interface ParsedSkill {
  name: string
  level?: string
}

export interface ParsedExperience {
  title: string
  company: string
  start: string
  end?: string
  description?: string
}

export interface ParsedEducation {
  degree: string
  institution: string
  year?: string
}

export interface ParsedCert {
  name: string
  issuer?: string
  year?: string
}

export interface ExtraLink {
  key: string
  url: string
}

@Entity({ name: 'candidates' })
@Unique(['orgId', 'email'])
export class Candidate extends BaseEntity {
  @Column({ type: 'uuid' })
  orgId!: string

  @ManyToOne(() => Org)
  @JoinColumn({ name: 'orgId' })
  org!: Org

  @Column({ type: 'varchar', length: 255 })
  email!: string

  @Column({ type: 'varchar', length: 255 })
  fullName!: string

  @Column({ type: 'varchar', length: 50, nullable: true })
  phone!: string | null

  @Column({ type: 'varchar', nullable: true })
  linkedinUrl!: string | null

  @Column({ type: 'jsonb', default: '[]' })
  extraLinks!: ExtraLink[]

  @Column({ type: 'enum', enum: CandidateSource })
  source!: CandidateSource

  @Column({ type: 'boolean', default: false })
  isHired!: boolean

  @Column({ type: 'jsonb', default: '[]' })
  parsedSkills!: ParsedSkill[]

  @Column({ type: 'jsonb', default: '[]' })
  parsedExperience!: ParsedExperience[]

  @Column({ type: 'jsonb', default: '[]' })
  parsedEducation!: ParsedEducation[]

  @Column({ type: 'jsonb', default: '[]' })
  parsedCerts!: ParsedCert[]
}
