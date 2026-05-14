import { apiRequest } from '../utils/http';

export const createPost = (postData: any) => apiRequest('/posts/create', 'POST', postData);
export const likePost = (postId: string) => apiRequest(`/posts/like/${postId}`, 'POST');
export const replyToPost = (postId: string, replyData: any) => apiRequest(`/posts/reply/${postId}`, 'POST', replyData);
export const repostPost = (postId: string) => apiRequest(`/posts/repost/${postId}`, 'POST');
export const updatePost = (postId: string, postData: any) => apiRequest(`/posts/${postId}`, 'PUT', postData);
export const deletePost = (postId: string) => apiRequest(`/posts/${postId}`, 'DELETE');
export const markPostNotInterested = (postId: string) => apiRequest(`/posts/not-interested/${postId}`, 'POST');
