import type { ReadNotificationDTO } from '../types/api'

/**
 * Short, user-facing summary of a notification — used by the notification
 * drawer list and by the live toast popped when one arrives via SSE.
 */
export function describeNotification(n: ReadNotificationDTO): string {
  switch (n.type) {
    case 'assignment': return 'You were assigned to an interview.'
    case 'hm_approval': return 'A candidate was approved by the hiring manager.'
    case 'new_feedback': return 'New interview feedback was submitted.'
    case 'offer_accepted': return 'A candidate accepted their offer.'
    case 'offer_declined': return 'A candidate declined their offer.'
    default: return 'New notification.'
  }
}

/**
 * Maps a notification to the in-app route the user should land on when they
 * click it. Returns null when the payload doesn't carry the IDs we'd need
 * (defensive — old rows or future types we haven't wired yet).
 *
 * Routing intent per type:
 * - assignment      → open the interview (the assignee's actionable view)
 * - hm_approval     → open the application (the recruiter's actionable view)
 * - new_feedback    → open the application (the recruiter/HM acts on the candidate)
 * - offer_accepted  → open the application (recruiter follows up)
 * - offer_declined  → open the application (recruiter follows up)
 */
export function notificationHref(n: ReadNotificationDTO): string | null {
  const p = n.payload ?? {}
  const interviewId = typeof p.interviewId === 'string' ? p.interviewId : null
  const applicationId = typeof p.applicationId === 'string' ? p.applicationId : null
  switch (n.type) {
    case 'assignment':
      return interviewId ? `/interviews/${interviewId}` : null
    case 'hm_approval':
    case 'new_feedback':
    case 'offer_accepted':
    case 'offer_declined':
      return applicationId ? `/applications/${applicationId}` : null
    default:
      return null
  }
}
