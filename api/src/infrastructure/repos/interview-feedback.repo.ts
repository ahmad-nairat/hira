import { injectable } from 'tsyringe'
import { Repository } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { InterviewFeedback } from '../../core/entities/interview-feedback.entity'
import { Interview } from '../../core/entities/interview.entity'
import {
  IInterviewFeedbackRepo,
  CreateInterviewFeedbackInput,
} from '../../core/repo-interfaces/IInterviewFeedbackRepo'

@injectable()
export class InterviewFeedbackRepo implements IInterviewFeedbackRepo {
  private get repo(): Repository<InterviewFeedback> {
    return AppDataSource.getRepository(InterviewFeedback)
  }

  async findByInterview(interviewId: string): Promise<InterviewFeedback | null> {
    return this.repo.findOne({ where: { interviewId } })
  }

  async findByApplication(applicationId: string): Promise<InterviewFeedback[]> {
    return this.repo
      .createQueryBuilder('f')
      .innerJoin(Interview, 'i', 'i.id = f.interviewId')
      .where('i.applicationId = :applicationId', { applicationId })
      .orderBy('f.createdAt', 'ASC')
      .getMany()
  }

  async create(data: CreateInterviewFeedbackInput): Promise<InterviewFeedback> {
    return this.repo.save(this.repo.create(data))
  }
}
