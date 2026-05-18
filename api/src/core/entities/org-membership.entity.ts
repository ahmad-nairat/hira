import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Unique, CreateDateColumn } from 'typeorm'
import { User } from './user.entity'
import { Org } from './org.entity'

export enum OrgRole {
  ADMIN = 'admin',
  RECRUITER = 'recruiter',
  HIRING_MANAGER = 'hiring_manager',
  INTERVIEWER = 'interviewer',
}

@Entity({ name: 'org_memberships' })
@Unique(['userId'])
export class OrgMembership {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  userId!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'userId' })
  user!: User

  @Column({ type: 'uuid' })
  orgId!: string

  @ManyToOne(() => Org)
  @JoinColumn({ name: 'orgId' })
  org!: Org

  @Column({ type: 'enum', enum: OrgRole })
  role!: OrgRole

  @CreateDateColumn({ type: 'timestamptz' })
  joinedAt!: Date
}
