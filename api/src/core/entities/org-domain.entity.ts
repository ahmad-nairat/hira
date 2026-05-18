import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm'
import { Org } from './org.entity'

export enum DomainStatus {
  PENDING = 'pending',
  VERIFIED = 'verified',
  EXPIRED = 'expired',
}

@Entity({ name: 'org_domains' })
@Index(['status', 'submittedAt'])
export class OrgDomain {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Index({ unique: true })
  @Column({ type: 'uuid', unique: true })
  orgId!: string

  @ManyToOne(() => Org)
  @JoinColumn({ name: 'orgId' })
  org!: Org

  @Column({ type: 'varchar', length: 255 })
  domain!: string

  @Column({ type: 'varchar', length: 128, unique: true })
  verificationToken!: string

  @Column({ type: 'enum', enum: DomainStatus, default: DomainStatus.PENDING })
  status!: DomainStatus

  @Column({ type: 'timestamptz' })
  submittedAt!: Date

  @Column({ type: 'timestamptz', nullable: true })
  verifiedAt!: Date | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
