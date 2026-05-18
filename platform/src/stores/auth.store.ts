import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { OrgRole, ReadUserDTO } from '../types/api'

export type Membership = { orgId: string; role: OrgRole } | null

interface AuthState {
  user: ReadUserDTO | null
  membership: Membership
  accessToken: string | null
  setAuth: (user: ReadUserDTO, membership: Membership, accessToken: string) => void
  setUser: (user: ReadUserDTO) => void
  setMembership: (m: Membership) => void
  setAccessToken: (token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null, membership: null, accessToken: null,
      setAuth: (user, membership, accessToken) => set({ user, membership, accessToken }),
      setUser: (user) => set({ user }),
      setMembership: (membership) => set({ membership }),
      setAccessToken: (accessToken) => set({ accessToken }),
      logout: () => set({ user: null, membership: null, accessToken: null }),
    }),
    { name: 'hira-auth-v2', partialize: (s) => ({ user: s.user, membership: s.membership, accessToken: s.accessToken }) },
  ),
)
