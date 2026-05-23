import { Entity, Column, ManyToOne, OneToMany, OneToOne, JoinColumn, Unique, Index } from 'typeorm'
import { BaseEntity } from './base.entity'
import { Job } from './job.entity'
import { Candidate } from './candidate.entity'
import { Org } from './org.entity'
import { ApplicationStageHistory } from './application-stage-history.entity'
import { Note } from './note.entity'
import { Interview } from './interview.entity'
import { Offer } from './offer.entity'
import { FieldType } from './job-form-field.entity'
import { PipelineStage } from './application-stage.enum'

export { PipelineStage }

/**
 * A single denormalised form answer. The question text and field type are stored
 * alongside the answer so reading an application never needs to re-fetch the job form.
 */
export interface FormAnswer {
  id: string // JobFormField.id
  question: string // JobFormField.label
  type: FieldType // JobFormField.type
  answer: unknown
}

export type ScoreComponentName = 'education' | 'skills' | 'experience' | 'certifications'

export interface ScoreComponent {
  name: ScoreComponentName
  weight: number        // 0..1, the proportion applied to this component
  raw: number           // 0..100, the LLM's raw score for this dimension
  reasoning: string     // neutral overview of why this raw score was assigned
  gaps: string[]        // concrete reasons points were lost; required when raw < 100
}

export type ScoreBonusConfidence = 'high' | 'partial'

export interface ScoreBonus {
  rule: string                       // the recruiter's scoring instruction this came from
  points: number                     // signed adjustment (e.g. +10 or -5)
  reasoning: string                  // why the bonus/penalty applies
  confidence: ScoreBonusConfidence   // 'high' = direct evidence; 'partial' = indirect/inferred
}

export interface ScoreBreakdown {
  components: ScoreComponent[]
  bonuses: ScoreBonus[]
  summary: string       // 1-2 sentence overview
}

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

  @Column({ type: 'jsonb', nullable: true })
  scoreBreakdown!: ScoreBreakdown | null

  @Column({ type: 'jsonb' })
  formAnswers!: FormAnswer[]

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
