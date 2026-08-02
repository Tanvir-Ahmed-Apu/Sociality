import { useRecoilValue } from 'recoil';
import { userAtom } from '../atoms';
import { User } from '../types/models';
import { apiFetch } from './apiBase';
import { clearToken } from './tokenStore';

// Global key shared across all browser tabs (not tied to sessionStorage tabId)
const GLOBAL_USER_KEY = 'user-threads-global';

export const getTabId = () => {
  let tabId = sessionStorage.getItem('tabId');
  if (!tabId) {
    tabId = `tab-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    sessionStorage.setItem('tabId', tabId);
  }
  return tabId;
};

export const clearCurrentTabAuth = () => {
  const tabId = getTabId();
  const userKey = `user-threads-${tabId}`;
  // Clear both the tab-specific key AND the global key on logout
  localStorage.removeItem(userKey);
  localStorage.removeItem(GLOBAL_USER_KEY);
  clearToken();
};

export const getCurrentTabUser = (): User | null => {
  const tabId = getTabId();
  const userKey = `user-threads-${tabId}`;
  // Try tab-specific first, then fall back to global (new tab scenario)
  const userData = localStorage.getItem(userKey) ?? localStorage.getItem(GLOBAL_USER_KEY);
  return userData ? JSON.parse(userData) : null;
};

export const setCurrentTabUser = (userData: User | null) => {
  const tabId = getTabId();
  const userKey = `user-threads-${tabId}`;
  if (userData) {
    const json = JSON.stringify(userData);
    localStorage.setItem(userKey, json);
    // Also write to global key so other tabs (and new tabs) can pick it up
    localStorage.setItem(GLOBAL_USER_KEY, json);
  } else {
    localStorage.removeItem(userKey);
    localStorage.removeItem(GLOBAL_USER_KEY);
  }
};

export const handleAuthenticationError = (
  navigate: (path: string, options?: any) => void,
  setUser: (user: User | null) => void,
  showToast?: (title: string, message: string, status: "info" | "warning" | "success" | "error" | "loading" | undefined) => void
) => {
  console.warn('Authentication failed, redirecting to login');
  clearCurrentTabAuth();
  if (setUser) setUser(null);
  if (showToast) {
    showToast('Error', 'Your session has expired. Please log in again.', 'error');
  }
  if (navigate) {
    navigate('/auth', { replace: true });
  }
};

export const useSessionPath = () => {
  const user = useRecoilValue(userAtom);
  return user?.sessionPath || '';
};

const safeParseJSON = async (response: Response): Promise<any> => {
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json') && !contentType.includes('text/plain') && contentType.includes('text/html')) {
    const text = await response.text();
    console.error('Expected JSON but received HTML. Response was:', text.substring(0, 200));
    throw new Error(response.ok ? 'Unexpected server response' : 'Server error (HTML response)');
  }
  return response.json();
};

export const validateAuthentication = async () => {
  const user = getCurrentTabUser();
  if (!user) return false;

  try {
    const response = await apiFetch('/api/auth/oauth/user' + (user.sessionPath ? `?session=${user.sessionPath}` : ''));
    return response.ok;
  } catch (error) {
    console.error('Authentication validation failed:', error);
    return false;
  }
};

export const fetchWithSession = async (url: string, options: RequestInit = {}) => {
  const user = getCurrentTabUser();
  const sessionPath = user?.sessionPath || '';

  const urlWithSession = sessionPath ?
    `${url}${url.includes('?') ? '&' : '?'}session=${sessionPath}` :
    url;

  try {
    const response = await apiFetch(urlWithSession, {
      ...options,
    });

    if (response.status === 401) {
      console.warn('Authentication failed, clearing local auth data');

      if (user && user.isProfileComplete && sessionPath) {
        try {
          const authValidation = await apiFetch('/api/auth/oauth/user' + (sessionPath ? `?session=${sessionPath}` : ''));

          if (authValidation.ok) {
            const validatedUser = await safeParseJSON(authValidation);
            setCurrentTabUser(validatedUser);

            return apiFetch(urlWithSession, {
              ...options,
            });
          }
        } catch (validationError) {
          console.error('Re-validation failed:', validationError);
        }
      }

      clearCurrentTabAuth();

      if (sessionPath) {
        return apiFetch(url, {
          ...options,
        });
      }
    }

    return response;
  } catch (error) {
    console.error('Fetch with session failed:', error);
    throw error;
  }
};
