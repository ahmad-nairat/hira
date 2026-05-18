import { injectable } from 'tsyringe'
import { Repository } from 'typeorm'
import { AppDataSource } from '../database/data-source'
import { GeneratedQuestions, QuestionItem } from '../../core/entities/generated-questions.entity'
import { IGeneratedQuestionsRepo } from '../../core/repo-interfaces/IGeneratedQuestionsRepo'

@injectable()
export class GeneratedQuestionsRepo implements IGeneratedQuestionsRepo {
  private get repo(): Repository<GeneratedQuestions> {
    return AppDataSource.getRepository(GeneratedQuestions)
  }

  async findById(id: string): Promise<GeneratedQuestions | null> {
    return this.repo.findOne({ where: { id } })
  }

  async findByApplication(applicationId: string): Promise<GeneratedQuestions[]> {
    return this.repo.find({ where: { applicationId }, order: { createdAt: 'DESC' } })
  }

  async updateAnswers(id: string, questions: QuestionItem[]): Promise<GeneratedQuestions> {
    await this.repo.update({ id }, { questions })
    const updated = await this.findById(id)
    if (!updated) throw new Error('Questions not found after update')
    return updated
  }
}
