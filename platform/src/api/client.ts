import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../stores/auth.store'

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? 'http://localhost:3010/api/v1',
  withCredentials: true,
})

client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let refreshing = false
client.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean }
    if (error.response?.status === 401 && original && !original._retry && !original.url?.includes('/auth/refresh')) {
      original._retry = true
      if (refreshing) return Promise.reject(error)
      refreshing = true
      try {
        const res = await client.post<{ data: { accessToken: string } }>('/auth/refresh', {})
        const t = res.data.data.accessToken
        useAuthStore.getState().setAccessToken(t)
        original.headers.Authorization = `Bearer ${t}`
        return client(original)
      } catch {
        useAuthStore.getState().logout()
        if (typeof window !== 'undefined') window.location.href = '/login'
      } finally {
        refreshing = false
      }
    }
    return Promise.reject(error)
  },
)

export default client

export function extractError(err: unknown): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string } | undefined
    return data?.error ?? err.message
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong'
}
