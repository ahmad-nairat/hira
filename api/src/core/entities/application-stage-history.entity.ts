import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index, CreateDateColumn } from 'typeorm'
import { Application } from './application.entity'
import { PipelineStage } from './application-stage.enum'
import { User } from './user.entity'

@Entity({ name: 'application_stage_history' })
@Index(['applicationId'])
export class ApplicationStageHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ type: 'uuid' })
  applicationId!: string

  @ManyToOne(() => Application, (a) => a.stageHistory)
  @JoinColumn({ name: 'applicationId' })
  application!: Application

  @Column({ type: 'enum', enum: PipelineStage, nullable: true })
  fromStage!: PipelineStage | null

  @Column({ type: 'enum', enum: PipelineStage })
  toStage!: PipelineStage

  @Column({ type: 'uuid', nullable: true })
  movedBy!: string | null

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'movedBy' })
  movedByUser!: User | null

  @Column({ type: 'text', nullable: true })
  note!: string | null

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date
}
