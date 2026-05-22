/**
 * API Base URL Utility
 * Provides the backend API base URL for all fetch calls.
 * Supports both development (Vite proxy) and production (cross-origin) environments.
 */
import { getToken } from './tokenStore';

// In production, this should be set in environment variables on Render:
// VITE_API_BASE_URL = https://sociality-server-rdvb.onrender.com
// In development, Vite proxy handles the /api prefix automatically.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

/**
 * Wrapper around fetch that automatically prepends the backend API base URL
 * to all API requests in production. In development, the Vite proxy handles it.
 * Also attaches the JWT token as Authorization header for cross-origin support.
 */
export const apiFetch = (url: string, options?: RequestInit): Promise<Response> => {
  const fullUrl = API_BASE_URL ? `${API_BASE_URL}${url}` : url;
  
  // Get JWT token from storage and attach as Authorization header
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {}),
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return fetch(fullUrl, {
    ...options,
    headers,
    credentials: 'include',
  });
};

export default API_BASE_URL;
