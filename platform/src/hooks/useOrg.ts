import { useAuthStore } from '../stores/auth.store'
export function useOrgId(): string {
  const orgId = useAuthStore((s) => s.membership?.orgId)
  if (!orgId) throw new Error('useOrgId() called without org')
  return orgId
}
