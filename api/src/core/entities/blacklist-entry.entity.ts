import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm'
import { Org } from './org.entity'
import { Candidate } from './candidate.entity'
import { User } from './user.entity'

@Entity({ name: 'blacklist_entries' })
@Index(['orgId', 'candidateId'])
export class BlacklistEntry {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  orgId!: string

  @ManyToOne(() => Org)
  @JoinColumn({ name: 'orgId' })
  org!: Org

  @Column({ type: 'uuid' })
  candidateId!: string

  @ManyToOne(() => Candidate)
  @JoinColumn({ name: 'candidateId' })
  candidate!: Candidate

  @Column({ type: 'text' })
  reason!: string

  @Column({ type: 'uuid' })
  blacklistedBy!: string

  @ManyToOne(() => User)
  @JoinColumn({ name: 'blacklistedBy' })
  blacklistedByUser!: User

  @Column({ type: 'varchar', length: 50 })
  durationType!: string

  @Column({ type: 'timestamptz', nullable: true })
  expiresAt!: Date | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
