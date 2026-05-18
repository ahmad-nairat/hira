import { useAuthStore } from '../stores/auth.store'
import type { OrgRole } from '../types/api'

export function usePermission() {
  const role = useAuthStore((s) => s.membership?.role)
  const is = (...roles: OrgRole[]) => !!role && roles.includes(role)
  return {
    role,
    isAdmin: is('admin'),
    isRecruiter: is('admin', 'recruiter'),
    isHiringManager: is('admin', 'hiring_manager'),
    isInterviewerOnly: role === 'interviewer',
    can: {
      manageJobs: is('admin', 'recruiter'),
      viewCandidates: is('admin', 'recruiter', 'hiring_manager'),
      moveStage: is('admin', 'recruiter', 'hiring_manager'),
      approveCandidate: is('admin', 'hiring_manager'),
      hire: is('admin', 'recruiter'),
      sendOffer: is('admin', 'recruiter'),
      blacklist: is('admin', 'recruiter'),
      manageSettings: is('admin'),
      addNotes: is('admin', 'recruiter', 'hiring_manager'),
      scheduleInterview: is('admin', 'recruiter', 'hiring_manager'),
    },
  }
}
