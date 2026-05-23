import { GeneratedQuestions, QuestionItem } from '../entities/generated-questions.entity'

export interface IGeneratedQuestionsRepo {
  findById(id: string): Promise<GeneratedQuestions | null>
  findByApplication(applicationId: string): Promise<GeneratedQuestions[]>
  updateAnswers(id: string, questions: QuestionItem[]): Promise<GeneratedQuestions>
  delete(id: string): Promise<void>
}
