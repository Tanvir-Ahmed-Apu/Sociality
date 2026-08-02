import { useEffect } from 'react';
import { useSetRecoilState } from 'recoil';
import { userAtom, authInitializingAtom } from '../atoms';
import { getCurrentTabUser, setCurrentTabUser } from '../utils/api';
import { apiFetch } from '../utils/apiBase';
import { setToken } from '../utils/tokenStore';

/**
 * Hook to initialize user state from tab-specific storage or backend
 * This should be called once when the app loads
 */
const useInitializeUser = () => {
  const setUser = useSetRecoilState(userAtom);
  const setAuthInitializing = useSetRecoilState(authInitializingAtom);

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      setAuthInitializing(true);

      // 1) Try tab-local storage first (fast, synchronous)
      const localUser = getCurrentTabUser();
      if (localUser) {
        setUser(localUser);
        setAuthInitializing(false);
        return;
      }

      // 2) No local user — try backend (cookie-based) validation
      try {
        const res = await apiFetch('/api/auth/oauth/user');
        if (cancelled) return;

        if (res.ok) {
          const userData = await res.json();
          // If backend returns a token for cross-origin requests, store it
          if (userData?.token) {
            try { setToken(userData.token); } catch (e) { /* ignore */ }
          }

          // Persist in tab-local storage and set Recoil state
          try { setCurrentTabUser(userData); } catch (e) { /* ignore */ }
          setUser(userData);
        }
      } catch (error) {
        // ignore - user stays unauthenticated
        console.error('Session validation failed:', error);
      } finally {
        if (!cancelled) setAuthInitializing(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };

  }, [setUser, setAuthInitializing]);
};

export default useInitializeUser;
