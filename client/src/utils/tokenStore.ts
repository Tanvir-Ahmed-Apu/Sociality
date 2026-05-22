/**
 * Token Store
 * Stores JWT token for cross-origin API requests where cookies may be blocked.
 * The token is stored alongside user data in localStorage.
 */
import { getTabId } from './session';

const TOKEN_KEY_PREFIX = 'jwt-token-';

export const setToken = (token: string) => {
  const tabId = getTabId();
  localStorage.setItem(`${TOKEN_KEY_PREFIX}${tabId}`, token);
};

export const getToken = (): string | null => {
  const tabId = getTabId();
  return localStorage.getItem(`${TOKEN_KEY_PREFIX}${tabId}`);
};

export const clearToken = () => {
  const tabId = getTabId();
  localStorage.removeItem(`${TOKEN_KEY_PREFIX}${tabId}`);
};