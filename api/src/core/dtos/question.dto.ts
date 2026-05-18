import { z } from 'zod'
import { GeneratedQuestions, QuestionItem } from '../entities/generated-questions.entity'

export const GenerateQuestionsSchema = z.object({
  interviewId: z.string().uuid().nullable().optional(),
  instructions: z.string().max(2000).optional(),
})

export const UpdateAnswersSchema = z.object({
  questions: z.array(
    z.object({
      question: z.string().min(1),
      answer: z.string().nullable(),
    }),
  ),
})

export type GenerateQuestionsDTO = z.infer<typeof GenerateQuestionsSchema>
export type UpdateAnswersDTO = z.infer<typeof UpdateAnswersSchema>

export interface ReadGeneratedQuestionsDTO {
  id: string
  applicationId: string
  interviewId: string | null
  generatedBy: string
  instructions: string | null
  questions: QuestionItem[]
  createdAt: string
}

export function toReadGeneratedQuestionsDTO(g: GeneratedQuestions): ReadGeneratedQuestionsDTO {
  return {
    id: g.id,
    applicationId: g.applicationId,
    interviewId: g.interviewId,
    generatedBy: g.generatedBy,
    instructions: g.instructions,
    questions: g.questions,
    createdAt: g.createdAt.toISOString(),
  }
}
