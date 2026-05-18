import { ReactNode } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<RequireNoAuth><LoginPage /></RequireNoAuth>} />
      <Route path="/register" element={<RequireNoAuth><RegisterPage /></RequireNoAuth>} />
      <Route path="/onboarding" element={<RequireAuth><OnboardingPage /></RequireAuth>} />

      <Route element={<RequireOrg><Layout /></RequireOrg>}>
        <Route index element={<DashboardPage />} />
        <Route path="jobs">
          <Route index element={<JobsPage />} />
          <Route path="new" element={<JobCreatePage />} />
          <Route path=":jobId" element={<JobDetailPage />} />
          <Route path=":jobId/settings" element={<JobSettingsPage />} />
        </Route>
        <Route path="candidates">
          <Route index element={<CandidatesPage />} />
          <Route path=":candidateId" element={<CandidateProfilePage />} />
        </Route>
        <Route path="applications/:applicationId" element={<ApplicationDetailPage />} />
        <Route path="interviews" element={<InterviewsPage />} />
        <Route path="interviews/:interviewId" element={<InterviewDetailPage />} />
        <Route path="settings" element={<SettingsLayout />}>
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
  )
}
