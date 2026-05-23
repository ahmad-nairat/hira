import { ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import { useAuthStore } from './stores/auth.store'
import Layout from './components/layout/Layout'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import OnboardingPage from './pages/onboarding/OnboardingPage'
import DashboardPage from './pages/dashboard/DashboardPage'
import JobsPage from './pages/jobs/JobsPage'
import JobCreatePage from './pages/jobs/JobCreatePage'
import JobDetailPage from './pages/jobs/JobDetailPage'
import JobSettingsPage from './pages/jobs/JobSettingsPage'
import CandidatesPage from './pages/candidates/CandidatesPage'
import CandidateProfilePage from './pages/candidates/CandidateProfilePage'
import ApplicationDetailPage from './pages/applications/ApplicationDetailPage'
import InterviewsPage from './pages/interviews/InterviewsPage'
import InterviewDetailPage from './pages/interviews/InterviewDetailPage'
import SettingsLayout from './pages/settings/SettingsLayout'
import GeneralSettingsPage from './pages/settings/GeneralSettingsPage'
import DomainSettingsPage from './pages/settings/DomainSettingsPage'
import MembersPage from './pages/settings/MembersPage'
import InvitesPage from './pages/settings/InvitesPage'
import ScoringSettingsPage from './pages/settings/ScoringSettingsPage'
import BrandingSettingsPage from './pages/settings/BrandingSettingsPage'
import DangerZonePage from './pages/settings/DangerZonePage'
import ProfilePage from './pages/profile/ProfilePage'
import { usePermission } from './hooks/usePermission'
import type { OrgRole } from './types/api'

function RequireAuth({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  return user ? <>{children}</> : <Navigate to="/login" replace />
}
function RequireOrg({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  const membership = useAuthStore((s) => s.membership)
  if (!user) return <Navigate to="/login" replace />
  if (!membership) return <Navigate to="/onboarding" replace />
  return <>{children}</>
}
function RequireNoAuth({ children }: { children: ReactNode }) {
  const user = useAuthStore((s) => s.user)
  return !user ? <>{children}</> : <Navigate to="/" replace />
}

// The dashboard is a recruiter / HM / admin view — it queries org-wide
// aggregates and surfaces actions interviewers can't perform (create job,
// browse all candidates, etc.). For interviewers, "home" is their interview
// list. Other roles get the real dashboard.
function HomeRoute() {
  const { isInterviewerOnly } = usePermission()
  return isInterviewerOnly ? <Navigate to="/interviews" replace /> : <DashboardPage />
}

// Per-route role guard. Redirect to "/" (HomeRoute) when the current role
// isn't allowed; HomeRoute then routes interviewers to /interviews and
// everyone else to the dashboard. Mirrors the API's authorizeOrgRole gate.
function RequireRoles({ roles, children }: { roles: OrgRole[]; children: ReactNode }) {
  const { role } = usePermission()
  if (!role) return <Navigate to="/login" replace />
  if (!roles.includes(role)) return <Navigate to="/" replace />
  return <>{children}</>
}

// Role groups, mirroring the API's shorthand groups so the gate is easy to
// audit against `api/src/API/routes/*.ts`.
const ARH:  OrgRole[] = ['admin', 'recruiter', 'hiring_manager']
const ARHI: OrgRole[] = ['admin', 'recruiter', 'hiring_manager', 'interviewer']
const AR:   OrgRole[] = ['admin', 'recruiter']
const A:    OrgRole[] = ['admin']

export default function App() {
  return (
    <>
    {/* Single Toaster mount — useSse pops toasts here when a notification
        arrives via SSE. Dark theme + bottom-right matches the rest of the UI. */}
    <Toaster position="bottom-right" theme="dark" closeButton richColors />
    <Routes>
      <Route path="/login" element={<RequireNoAuth><LoginPage /></RequireNoAuth>} />
      <Route path="/register" element={<RequireNoAuth><RegisterPage /></RequireNoAuth>} />
      <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />

      <Route element={<RequireOrg><Layout /></RequireOrg>}>
        <Route index element={<HomeRoute />} />
        <Route path="jobs">
          {/* Job views require ARH — interviewers don't have job-level visibility. */}
          <Route index element={<RequireRoles roles={ARH}><JobsPage /></RequireRoles>} />
          <Route path="new" element={<RequireRoles roles={AR}><JobCreatePage /></RequireRoles>} />
          <Route path=":jobId" element={<RequireRoles roles={ARH}><JobDetailPage /></RequireRoles>} />
          {/* Editing a job (settings) is recruiter/admin only. */}
          <Route path=":jobId/settings" element={<RequireRoles roles={AR}><JobSettingsPage /></RequireRoles>} />
        </Route>
        <Route path="candidates">
          {/* Candidate endpoints are ARH; interviewers would 403 silently. */}
          <Route index element={<RequireRoles roles={ARH}><CandidatesPage /></RequireRoles>} />
          <Route path=":candidateId" element={<RequireRoles roles={ARH}><CandidateProfilePage /></RequireRoles>} />
        </Route>
        {/* Applications: ARHI — interviewers get the limited view enforced server-side. */}
        <Route path="applications/:applicationId" element={<RequireRoles roles={ARHI}><ApplicationDetailPage /></RequireRoles>} />
        {/* Interviews: ARHI — interviewers see only their own (enforced server-side). */}
        <Route path="interviews" element={<RequireRoles roles={ARHI}><InterviewsPage /></RequireRoles>} />
        <Route path="interviews/:interviewId" element={<RequireRoles roles={ARHI}><InterviewDetailPage /></RequireRoles>} />
        {/* Org settings are admin-only across the board. */}
        <Route path="settings" element={<RequireRoles roles={A}><SettingsLayout /></RequireRoles>}>
          <Route index element={<Navigate to="general" replace />} />
          <Route path="general" element={<GeneralSettingsPage />} />
          <Route path="domain" element={<DomainSettingsPage />} />
          <Route path="members" element={<MembersPage />} />
          <Route path="invites" element={<InvitesPage />} />
          <Route path="scoring" element={<ScoringSettingsPage />} />
          <Route path="branding" element={<BrandingSettingsPage />} />
          <Route path="danger" element={<DangerZonePage />} />
        </Route>
        <Route path="profile" element={<ProfilePage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
    </>
  )
}
