import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique, CreateDateColumn } from 'typeorm'
import { Org } from './org.entity'
import { User } from './user.entity'

export enum AccessRequestStatus {
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

@Entity({ name: 'access_requests' })
@Unique(['orgId', 'userId'])
export class AccessRequest {
  @PrimaryGeneratedColumn('uuid')//
  id!: string

  @Column({ type: 'uuid' })//
  orgId!: string

  @ManyToOne(() => Org)
  @JoinColumn({ name: 'orgId' })
  org!: Org

  @Column({ type: 'uuid' })//
  userId!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User

  @Column({ type: 'enum', enum: AccessRequestStatus, default: AccessRequestStatus.PENDING })
  status!: AccessRequestStatus

  @Column({ type: 'uuid', nullable: true })
  reviewedBy!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
