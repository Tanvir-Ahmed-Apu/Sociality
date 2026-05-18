import { useRecoilValue } from 'recoil';
import { userAtom } from '../atoms';
import { User } from '../types/models';

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
  localStorage.removeItem(userKey);
};

export const getCurrentTabUser = (): User | null => {
  const tabId = getTabId();
  const userKey = `user-threads-${tabId}`;
  const userData = localStorage.getItem(userKey);
  return userData ? JSON.parse(userData) : null;
};

export const setCurrentTabUser = (userData: User | null) => {
  const tabId = getTabId();
  const userKey = `user-threads-${tabId}`;
  if (userData) {
    localStorage.setItem(userKey, JSON.stringify(userData));
  } else {
    localStorage.removeItem(userKey);
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

export const validateAuthentication = async () => {
  const user = getCurrentTabUser();
  if (!user) return false;

  try {
    const response = await fetch('/api/auth/oauth/user' + (user.sessionPath ? `?session=${user.sessionPath}` : ''), {
      credentials: 'include'
    });
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
    const response = await fetch(urlWithSession, {
      ...options,
      credentials: 'include'
    });

    if (response.status === 401) {
      console.warn('Authentication failed, clearing local auth data');

      if (user && user.isProfileComplete && sessionPath) {
        try {
          const authValidation = await fetch('/api/auth/oauth/user' + (sessionPath ? `?session=${sessionPath}` : ''), {
            credentials: 'include'
          });

          if (authValidation.ok) {
            const validatedUser = await authValidation.json();
            setCurrentTabUser(validatedUser);

            return fetch(urlWithSession, {
              ...options,
              credentials: 'include'
            });
          }
        } catch (validationError) {
          console.error('Re-validation failed:', validationError);
        }
      }

      clearCurrentTabAuth();

      if (sessionPath) {
        return fetch(url, {
          ...options,
          credentials: 'include'
        });
      }
    }

    return response;
  } catch (error) {
    console.error('Fetch with session failed:', error);
    throw error;
  }
};
