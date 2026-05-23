import client from './client'
import type { AuthData, ReadUserDTO } from '../types/api'

export const authApi = {
  register: async (body: { email: string; password: string; fullName: string }): Promise<AuthData> =>
    (await client.post('/auth/register', body)).data.data,
  login: async (body: { email: string; password: string }): Promise<AuthData> =>
    (await client.post('/auth/login', body)).data.data,
  refresh: async (): Promise<AuthData> => (await client.post('/auth/refresh', {})).data.data,
  logout: async (): Promise<void> => { await client.post('/auth/logout', {}) },
  me: async (): Promise<ReadUserDTO> => (await client.get('/auth/me')).data.data,
  uploadAvatar: async (file: File): Promise<ReadUserDTO> => {
    const form = new FormData()
    form.append('avatar', file)
    return (await client.post('/auth/me/avatar', form, { headers: { 'Content-Type': 'multipart/form-data' } })).data.data
  },
  removeAvatar: async (): Promise<ReadUserDTO> =>
    (await client.delete('/auth/me/avatar')).data.data,
}
