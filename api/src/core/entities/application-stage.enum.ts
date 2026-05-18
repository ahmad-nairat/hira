/**
 * PipelineStage lives in its own module so it can be imported by both
 * `application.entity` and `application-stage-history.entity` without
 * triggering the circular import that would otherwise leave the enum
 * undefined when decorators evaluate.
 */
export enum PipelineStage {
  EARLY_REJECTION = 'early_rejection',
  BLACKLISTED = 'blacklisted',
  AI_EVALUATION = 'ai_evaluation',
  SCREENING = 'screening',
  INTERVIEW = 'interview',
  SPECIALIST_INTERVIEW = 'specialist_interview',
  REVIEW = 'review',
  HM_APPROVED = 'hm_approved',
  OFFER_SENT = 'offer_sent',
  OFFER_ACCEPTED = 'offer_accepted',
  HIRED = 'hired',
  DECLINED = 'declined',
  REJECTED = 'rejected',
}
