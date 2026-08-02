/**
 * Token Store
 * Stores JWT token for cross-origin API requests where cookies may be blocked.
 * Writes to both a tab-specific key AND a global key so new browser tabs
 * can pick up the token without requiring a re-login.
 */
import { getTabId } from './session';

const TOKEN_KEY_PREFIX = 'jwt-token-';
const GLOBAL_TOKEN_KEY = 'jwt-token-global';

export const setToken = (token: string) => {
  const tabId = getTabId();
  localStorage.setItem(`${TOKEN_KEY_PREFIX}${tabId}`, token);
  // Write to global key so new tabs can pick it up
  localStorage.setItem(GLOBAL_TOKEN_KEY, token);
};

export const getToken = (): string | null => {
  const tabId = getTabId();
  // Try tab-specific first, then fall back to global (new tab scenario)
  return localStorage.getItem(`${TOKEN_KEY_PREFIX}${tabId}`) ?? localStorage.getItem(GLOBAL_TOKEN_KEY);
};

export const clearToken = () => {
  const tabId = getTabId();
  localStorage.removeItem(`${TOKEN_KEY_PREFIX}${tabId}`);
  // Also clear the global token on logout
  localStorage.removeItem(GLOBAL_TOKEN_KEY);
};