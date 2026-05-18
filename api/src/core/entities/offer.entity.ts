import { Entity, Column, ManyToOne, OneToOne, JoinColumn, Index } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Application } from './application.entity'
import { Org } from './org.entity'

export enum OfferStatus {
  DRAFT = 'draft',
  SENT = 'sent',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
}

@Entity({ name: 'offers' })
@Index(['token'])
export class Offer extends BaseEntity {
  @Column({ type: 'uuid', unique: true })
  applicationId!: string

  @OneToOne(() => Application, (a) => a.offer)
  @JoinColumn({ name: 'applicationId' })
  application!: Application

  @Column({ type: 'uuid' })
  orgId!: string

  @ManyToOne(() => Org)
  @JoinColumn({ name: 'orgId' })
  org!: Org

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  salary!: string | null

  @Column({ type: 'varchar', length: 3, nullable: true })
  currency!: string | null

  @Column({ type: 'date', nullable: true })
  startDate!: string | null

  @Column({ type: 'varchar', length: 100, nullable: true })
  contractType!: string | null

  @Column({ type: 'text', default: '' })
  welcomeMessage!: string

  @Column({ type: 'varchar', length: 128, unique: true })
  token!: string

  @Column({ type: 'timestamptz' })
  tokenExpiresAt!: Date

  @Column({ type: 'enum', enum: OfferStatus, default: OfferStatus.DRAFT })
  status!: OfferStatus

  @Column({ type: 'timestamptz', nullable: true })
  sentAt!: Date | null

  @Column({ type: 'timestamptz', nullable: true })
  respondedAt!: Date | null
}
