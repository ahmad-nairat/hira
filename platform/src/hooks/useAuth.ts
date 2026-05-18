import { useAuthStore } from '../stores/auth.store'
export function useAuth() {
  return useAuthStore((s) => ({ user: s.user, membership: s.membership, accessToken: s.accessToken, logout: s.logout }))
}
