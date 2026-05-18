import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm'
import { Org } from './org.entity'
import { User } from './user.entity'
import { OrgRole } from './org-membership.entity'

export enum InviteStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REVOKED = 'revoked',
  EXPIRED = 'expired',
}

@Entity({ name: 'invites' })
@Index(['orgId', 'status'])
export class Invite {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  orgId!: string

  @ManyToOne(() => Org)
  @JoinColumn({ name: 'orgId' })
  org!: Org

  @Column({ type: 'varchar', length: 255 })
  email!: string

  @Column({ type: 'enum', enum: OrgRole })
  role!: OrgRole

  @Column({ type: 'varchar', length: 128, unique: true })
  token!: string

  @Column({ type: 'uuid' })
  invitedBy!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'invitedBy' })
  invitedByUser!: User

  @Column({ type: 'enum', enum: InviteStatus, default: InviteStatus.PENDING })
  status!: InviteStatus

  @Column({ type: 'timestamptz' })
  expiresAt!: Date

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
