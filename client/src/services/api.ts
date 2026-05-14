/**
 * API service
 * Centralized service for making API calls
 */

// Base API configuration
const API_BASE_URL = '/api';

/**
 * Generic API request function
 * @param {string} endpoint - API endpoint
 * @param {string} method - HTTP method
 * @param {object} data - Request body data
 * @returns {Promise} - API response
 */
const apiRequest = async (endpoint: string, method = 'GET', data: any = null) => {
  const config: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies for authentication
  };

  if (data && (method === 'POST' || method === 'PUT')) {
    config.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
  const result = await response.json();

  if (!response.ok) {
    throw new Error(result.error || 'Something went wrong');
  }

  return result;
};

// User API services
export const userService = {
  login: (credentials: any) => apiRequest('/users/login', 'POST', credentials),
  signup: (userData: any) => apiRequest('/users/signup', 'POST', userData),
  logout: () => apiRequest('/users/logout', 'POST'),
  getProfile: (username: string) => apiRequest(`/users/profile/${username}`),
  updateProfile: (userData: any) => apiRequest('/users/update', 'PUT', userData),
  followUser: (userId: string) => apiRequest(`/users/follow/${userId}`, 'POST'),
  unfollowUser: (userId: string) => apiRequest(`/users/follow/${userId}`, 'DELETE'),
  getSuggestedUsers: () => apiRequest('/users/suggested'),
  getFollowers: (userId: string) => apiRequest(`/users/${userId}/followers`),
  getFollowing: (userId: string) => apiRequest(`/users/${userId}/following`),
};

// Post API services
export const postService = {
  getPosts: () => apiRequest('/posts'),
  getPost: (postId: string) => apiRequest(`/posts/${postId}`),
  createPost: (postData: any) => apiRequest('/posts/create', 'POST', postData),
  deletePost: (postId: string) => apiRequest(`/posts/${postId}`, 'DELETE'),
  likePost: (postId: string) => apiRequest(`/posts/like/${postId}`, 'POST'),
  unlikePost: (postId: string) => apiRequest(`/posts/unlike/${postId}`, 'POST'),
  replyToPost: (postId: string, replyData: any) => apiRequest(`/posts/reply/${postId}`, 'POST', replyData),
  repostPost: (postId: string) => apiRequest(`/posts/repost/${postId}`, 'POST'),
  updatePost: (postId: string, postData: any) => apiRequest(`/posts/${postId}`, 'PUT', postData),
  getUserPosts: (username: string) => apiRequest(`/posts/user/${username}`),
  // New feed endpoints
  getFeedPosts: () => apiRequest('/posts/feed'), // Legacy endpoint (redirects to for-you)
  getForYouPosts: () => apiRequest('/posts/for-you'), // For You feed - all posts with algorithm
  getFollowingPosts: () => apiRequest('/posts/following'), // Following feed - only followed users
  likeComment: (postId: string, commentId: string) => apiRequest(`/posts/comment/like/${postId}/${commentId}`, 'PUT'),
  replyToComment: (postId: string, commentId: string, replyData: any) =>
    apiRequest(`/posts/reply/${postId}/comment/${commentId}`, 'PUT', replyData),
  deleteComment: (postId: string, commentId: string) => apiRequest(`/posts/comment/${postId}/${commentId}`, 'DELETE'),
};

// Message API services
export const messageService = {
  getConversations: () => apiRequest('/messages'),
  getMessages: (userId: string) => apiRequest(`/messages/${userId}`),
  sendMessage: (messageData: any) => apiRequest('/messages', 'POST', messageData),
  deleteMessage: (messageId: string) => apiRequest(`/messages/${messageId}`, 'DELETE'),
};

// Notification API services
export const notificationService = {
  getNotifications: () => apiRequest('/notifications'),
  markAsRead: (notificationId: string) => apiRequest(`/notifications/${notificationId}/read`, 'PUT'),
  markAllAsRead: () => apiRequest('/notifications/read-all', 'PUT'),
};
