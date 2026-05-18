import { Entity, Column, Index } from 'typeorm'
import { BaseEntity } from './base.entity'
import { OrgRole } from './org-membership.entity'

@Entity({ name: 'orgs' })
export class Org extends BaseEntity {
  @Column({ type: 'varchar', length: 255 })
  name!: string

  @Index({ unique: true })
  @Column({ type: 'varchar', length: 100, unique: true })
  slug!: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  logoUrl!: string | null

  @Column({ type: 'varchar', length: 7, default: '#000000' })
  primaryColor!: string

  @Column({ type: 'varchar', length: 7, default: '#ffffff' })
  secondaryColor!: string

  @Column({ type: 'boolean', default: false })
  autoJoinEnabled!: boolean

  @Column({ type: 'enum', enum: OrgRole, nullable: true })
  autoJoinDefaultRole!: OrgRole | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  careersLogoUrl!: string | null

  @Column({ type: 'varchar', length: 255, nullable: true })
  careersHeroHeadline!: string | null

  @Column({ type: 'varchar', length: 500, nullable: true })
  careersHeroSubheadline!: string | null

  @Column({ type: 'varchar', length: 50, default: 'solid' })
  careersHeroBgType!: string

  @Column({ type: 'varchar', length: 500, nullable: true })
  careersHeroBgValue!: string | null

  @Column({ type: 'varchar', length: 100, default: 'View open positions' })
  careersCtaLabel!: string

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.30 })
  scoringEducation!: number

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.30 })
  scoringSkills!: number

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.25 })
  scoringExperience!: number

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.15 })
  scoringCerts!: number
}
