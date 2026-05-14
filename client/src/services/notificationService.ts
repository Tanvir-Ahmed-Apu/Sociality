import { apiRequest } from '../utils/http';

export const getNotifications = (page: number = 1, limit: number = 10) =>
  apiRequest(`/notifications?page=${page}&limit=${limit}`);
export const markNotificationAsRead = (notificationId: string) =>
  apiRequest(`/notifications/read/${notificationId}`, 'PUT');
export const deleteNotification = (notificationId: string) =>
  apiRequest(`/notifications/${notificationId}`, 'DELETE');
