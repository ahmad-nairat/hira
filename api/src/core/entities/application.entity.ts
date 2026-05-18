import { Entity, Column, ManyToOne, OneToMany, OneToOne, JoinColumn, Unique, Index } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Job } from './job.entity'
import { Candidate } from './candidate.entity'
import { Org } from './org.entity'
import { ApplicationStageHistory } from './application-stage-history.entity'
import { Note } from './note.entity'
import { Interview } from './interview.entity'
import { Offer } from './offer.entity'
import { PipelineStage } from './application-stage.enum'

export { PipelineStage }

@Entity({ name: 'applications' })
@Unique(['jobId', 'candidateId'])
@Index(['jobId', 'currentStage'])
@Index(['candidateId'])
export class Application extends BaseEntity {
  @Column({ type: 'uuid' })
  jobId!: string

  @ManyToOne(() => Job)
  @JoinColumn({ name: 'jobId' })
  job!: Job

  @Column({ type: 'uuid' })
  candidateId!: string

  @ManyToOne(() => Candidate)
  @JoinColumn({ name: 'candidateId' })
  candidate!: Candidate

  @Column({ type: 'uuid' })
  orgId!: string

  @ManyToOne(() => Org)
  @JoinColumn({ name: 'orgId' })
  org!: Org

  @Column({ type: 'enum', enum: PipelineStage, default: PipelineStage.AI_EVALUATION })
  currentStage!: PipelineStage

  @Column({ type: 'integer', nullable: true })
  score!: number | null

  @Column({ type: 'jsonb' })
  formAnswers!: Record<string, unknown>

  @Column({ type: 'varchar' })
  resumeUrl!: string

  @Column({ type: 'text', nullable: true })
  rejectionNote!: string | null

  @Column({ type: 'timestamptz', nullable: true })
  rejectionNotifiedAt!: Date | null

  @Column({ type: 'boolean', default: false })
  hasOutdatedScore!: boolean

  @OneToMany(() => ApplicationStageHistory, (h) => h.application)
  stageHistory!: ApplicationStageHistory[]

  @OneToMany(() => Note, (n) => n.application)
  notes!: Note[]

  @OneToMany(() => Interview, (i) => i.application)
  interviews!: Interview[]

  @OneToOne(() => Offer, (o) => o.application)
  offer!: Offer
}
