import { apiRequest } from '../utils/http';

export const followUser = (userId: string) => apiRequest(`/users/follow/${userId}`, 'POST');
export const unfollowUser = (userId: string) => apiRequest(`/users/follow/${userId}`, 'DELETE');
export const updateUser = (userId: string, userData: any) => apiRequest(`/users/update/${userId}`, 'PUT', userData);
export const getUserProfile = (username: string) => apiRequest(`/users/profile/${username}`);
