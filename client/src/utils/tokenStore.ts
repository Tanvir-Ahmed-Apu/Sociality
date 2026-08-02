/**
 * Token Store
 * Stores JWT token for cross-origin API requests where cookies may be blocked.
 * The token is stored alongside user data in localStorage.
 */
import { getTabId } from './session';

const TOKEN_KEY_PREFIX = 'jwt-token-';
const SHARED_TOKEN_KEY = 'jwt-token';

export const setToken = (token: string) => {
  const tabId = getTabId();
  try {
    // per-tab token (existing behavior)
    localStorage.setItem(`${TOKEN_KEY_PREFIX}${tabId}`, token);
    // shared token for cross-tab persistence
    localStorage.setItem(SHARED_TOKEN_KEY, token);
  } catch (e) {
    // ignore storage errors
  }
};

export const getToken = (): string | null => {
  // prefer shared token so other tabs can use it
  const shared = localStorage.getItem(SHARED_TOKEN_KEY);
  if (shared) return shared;

  const tabId = getTabId();
  return localStorage.getItem(`${TOKEN_KEY_PREFIX}${tabId}`);
};

export const clearToken = () => {
  const tabId = getTabId();
  localStorage.removeItem(`${TOKEN_KEY_PREFIX}${tabId}`);
  localStorage.removeItem(SHARED_TOKEN_KEY);
};
