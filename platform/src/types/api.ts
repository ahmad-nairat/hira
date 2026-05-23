export type OrgRole = 'admin' | 'recruiter' | 'hiring_manager' | 'interviewer'
export type JobStatus = 'draft' | 'published' | 'closed' | 'archived'
export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship'
export type PipelineStage =
  | 'early_rejection' | 'blacklisted' | 'ai_evaluation'
  | 'screening' | 'interview' | 'specialist_interview'
  | 'review' | 'hm_approved' | 'offer_sent' | 'offer_accepted'
  | 'hired' | 'declined' | 'rejected'
export type FieldType = 'text' | 'textarea' | 'number' | 'dropdown' | 'checkbox' | 'date' | 'file'
export type DomainStatus = 'pending' | 'verified' | 'expired'
export type InviteStatus = 'pending' | 'accepted' | 'revoked' | 'expired'
export type CandidateSource = 'careers_page' | 'manual_upload' | 'invited'
export type InterviewStage = 'interview' | 'specialist_interview'
export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled'
export type MeetingType = 'online' | 'in_person'
export type Recommendation = 'strong_yes' | 'yes' | 'neutral' | 'no' | 'strong_no'
export type OfferStatus = 'draft' | 'sent' | 'accepted' | 'declined'
export type NotificationType = 'assignment' | 'hm_approval' | 'new_feedback' | 'offer_accepted' | 'offer_declined'

export interface PaginatedResponse<T> {
  data: T[]
  meta: { total: number; page: number; limit: number; unreadCount?: number }
}

export interface ReadUserDTO { id: string; email: string; fullName: string; avatarUrl: string | null; isEmailVerified: boolean; createdAt: string }
export interface AuthData { user: ReadUserDTO; accessToken: string }

export interface OnboardingStatus {
  hasOrg: boolean
  currentOrgId: string | null
  currentRole: OrgRole | null
  pendingInvites: Array<{ id: string; token: string; orgId: string; orgName?: string; role: OrgRole }>
  domainOrg: { id: string; name: string; autoJoinEnabled: boolean } | null
}

export interface ReadOrgDTO {
  id: string; name: string; slug: string; logoUrl: string | null
  primaryColor: string; secondaryColor: string
  autoJoinEnabled: boolean; autoJoinDefaultRole: OrgRole | null
  careersLogoUrl: string | null; careersHeroHeadline: string | null
  careersHeroSubheadline: string | null; careersHeroBgType: string
  careersHeroBgValue: string | null; careersCtaLabel: string
  scoringEducation: number; scoringSkills: number
  scoringExperience: number; scoringCerts: number
  createdAt: string; updatedAt: string
}

export interface ReadOrgDomainDTO { id: string; orgId: string; domain: string; verificationToken: string; status: DomainStatus; submittedAt: string; verifiedAt: string | null; expectedTxtRecord: string; expectedTxtHost: string }
export interface ReadMemberDTO { id: string; userId: string; orgId: string; role: OrgRole; joinedAt: string; user: { email: string; fullName: string; avatarUrl: string | null } | null }
export interface ReadInviteDTO { id: string; orgId: string; email: string; role: OrgRole; status: InviteStatus; expiresAt: string; createdAt: string; orgName?: string }
export interface ReadAccessRequestDTO { id: string; orgId: string; userId: string; status: 'pending' | 'approved' | 'rejected'; createdAt: string; user?: { email: string; fullName: string } }

export interface ReadJobDTO {
  id: string; orgId: string; recruiterId: string; hiringManagerId: string | null
  title: string; description: string; location: string; type: JobType
  salaryMin: number | null; salaryMax: number | null; salaryCurrency: string | null
  status: JobStatus; publishedAt: string | null
  rejectionCriteria: string[]; scoringInstructions: string[]
  scoringEducation: number | null; scoringSkills: number | null
  scoringExperience: number | null; scoringCerts: number | null
  hasOutdatedScores: boolean; hasOutdatedRejections: boolean
  createdAt: string; updatedAt: string
}

export interface FieldOption { label: string; value: string }
export interface FieldValidation { min?: number; max?: number; minLength?: number; maxLength?: number }
export interface ReadJobFormFieldDTO {
  id: string; sectionId: string | null; type: FieldType; label: string
  placeholder: string | null; isRequired: boolean; isResume: boolean
  sortOrder: number; options: FieldOption[] | null; validation: FieldValidation | null
}
export interface ReadJobFormSectionDTO { id: string; title: string; sortOrder: number }
export interface ReadJobFormDTO { id: string; jobId: string; sections: ReadJobFormSectionDTO[]; fields: ReadJobFormFieldDTO[] }

export interface ReadCandidateDTO {
  id: string; orgId: string; email: string; fullName: string
  phone: string | null; linkedinUrl: string | null
  extraLinks: Array<{ key: string; url: string }>
  source: CandidateSource; isHired: boolean
  parsedSkills: Array<{ name: string; level?: string }>
  parsedExperience: Array<{ title: string; company: string; start: string; end?: string; description?: string }>
  parsedEducation: Array<{ degree: string; institution: string; year?: string }>
  parsedCerts: Array<{ name: string; issuer?: string; year?: string }>
  latestResumeUrl: string | null
  createdAt: string; updatedAt: string
}

export interface FormAnswer { id: string; question: string; type: FieldType; answer: unknown }

export type ScoreComponentName = 'education' | 'skills' | 'experience' | 'certifications'
export interface ScoreComponent { name: ScoreComponentName; weight: number; raw: number; reasoning: string; gaps: string[] }
export type ScoreBonusConfidence = 'high' | 'partial'
export interface ScoreBonus { rule: string; points: number; reasoning: string; confidence: ScoreBonusConfidence }
export interface ScoreBreakdown { components: ScoreComponent[]; bonuses: ScoreBonus[]; summary: string }

export interface ReadApplicationDTO {
  id: string; jobId: string; candidateId: string; orgId?: string
  currentStage: PipelineStage; score?: number | null; scoreBreakdown?: ScoreBreakdown | null
  formAnswers: FormAnswer[]; resumeUrl: string
  rejectionNote?: string | null; hasOutdatedScore?: boolean
  // Only populated for the interviewer view (the API denormalises these
  // because interviewers can't call the candidate or job endpoints).
  jobTitle?: string; candidateName?: string
  createdAt: string; updatedAt?: string
}

export interface ReadStageHistoryDTO { id: string; applicationId: string; fromStage: PipelineStage | null; toStage: PipelineStage; movedBy: string | null; note: string | null; createdAt: string }
export interface ReadNoteDTO { id: string; applicationId: string; authorId: string; content: string; createdAt: string; updatedAt: string }
export interface QuestionItem { question: string; answer: string | null }
export interface ReadGeneratedQuestionsDTO { id: string; applicationId: string; interviewId: string | null; generatedBy: string; instructions: string | null; questions: QuestionItem[]; createdAt: string }

export interface ReadInterviewDTO {
  id: string; applicationId: string; orgId: string; stage: InterviewStage
  interviewerId: string; interviewerName?: string
  scheduledAt: string | null; meetingType: MeetingType
  meetingLink: string | null; meetingAddress: string | null
  candidateNotified: boolean; status: InterviewStatus
  feedback?: ReadInterviewFeedbackDTO | null
  createdAt: string; updatedAt: string
}

export interface ReadInterviewFeedbackDTO { id: string; interviewId: string; submittedBy: string; rating: number; notes: string; recommendation: Recommendation; createdAt: string }
export interface ReadOfferDTO { id: string; applicationId: string; orgId: string; salary: string | null; currency: string | null; startDate: string | null; contractType: string | null; welcomeMessage: string; status: OfferStatus; sentAt: string | null; respondedAt: string | null; createdAt: string }
export interface ReadNotificationDTO { id: string; orgId: string; userId: string; type: NotificationType; payload: Record<string, unknown>; isRead: boolean; createdAt: string }

export interface JobQueryParams { page?: number; limit?: number; status?: JobStatus; type?: JobType; search?: string }
export interface CandidateQueryParams { page?: number; limit?: number; search?: string; isHired?: boolean }
export interface ApplicationQueryParams { page?: number; limit?: number; stage?: PipelineStage; search?: string }
export interface NotificationQueryParams { page?: number; limit?: number; unreadOnly?: boolean }
