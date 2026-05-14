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
