import client from './client'
import type { NotificationQueryParams, PaginatedResponse, ReadNotificationDTO } from '../types/api'

export const notificationsApi = {
  list: async (orgId: string, params: NotificationQueryParams = {}): Promise<PaginatedResponse<ReadNotificationDTO>> =>
    (await client.get(`/orgs/${orgId}/notifications`, { params })).data,
  markRead: async (orgId: string, id: string): Promise<ReadNotificationDTO> =>
    (await client.post(`/orgs/${orgId}/notifications/${id}/read`, {})).data.data,
  markAllRead: async (orgId: string): Promise<void> => { await client.post(`/orgs/${orgId}/notifications/read-all`, {}) },
}
