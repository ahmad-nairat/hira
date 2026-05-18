import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm'
import { Org } from './org.entity'
import { User } from './user.entity'

export enum NotificationType {
  ASSIGNMENT = 'assignment',
  HM_APPROVAL = 'hm_approval',
  NEW_FEEDBACK = 'new_feedback',
  OFFER_ACCEPTED = 'offer_accepted',
  OFFER_DECLINED = 'offer_declined',
}

@Entity({ name: 'notifications' })
@Index(['userId', 'isRead'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  orgId!: string

  @ManyToOne(() => Org)
  @JoinColumn({ name: 'orgId' })
  org!: Org

  @Column({ type: 'uuid' })
  userId!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User

  @Column({ type: 'enum', enum: NotificationType })
  type!: NotificationType

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>

  @Column({ type: 'boolean', default: false })
  isRead!: boolean

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
