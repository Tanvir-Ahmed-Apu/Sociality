import { apiRequest } from '../utils/http';

export const getMessages = (userId: string) => apiRequest(`/messages/${userId}`);
export const getConversations = () => apiRequest('/messages/conversations');
export const sendMessage = (messageData: any) => apiRequest('/messages', 'POST', messageData);
