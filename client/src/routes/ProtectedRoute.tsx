/**
 * Protected route component
 * Redirects unauthenticated users to the auth page.
 * 
 * Priority order:
 * 1. User found in localStorage/Recoil → render immediately (no flash)
 * 2. OAuth callback in progress → allow rendering so the callback can process
 * 3. No local user → do one silent server check (in case cookie-based session exists)
 * 4. Server check confirms no session → redirect to /auth
 */
import React, { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useRecoilState } from "recoil";
import { userAtom } from "../atoms";
import { setCurrentTabUser } from "../utils/api";
import { apiFetch } from "../utils/apiBase";
import { setToken } from "../utils/tokenStore";
import { Flex, Spinner } from "@chakra-ui/react";
import { getCurrentTabUser } from "../utils/session";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useRecoilState(userAtom);
  const location = useLocation();

  // Synchronously read from localStorage as the ground truth
  const localUser = user ?? getCurrentTabUser();

  // Check if this is an OAuth callback — never block these
  const urlParams = new URLSearchParams(location.search);
  const isOAuthCallback = urlParams.get("oauth") === "success" || !!urlParams.get("error");

  // Only run the server check when there's no local session and it's not an oauth callback
  const [checkingAuth, setCheckingAuth] = useState(() => !localUser && !isOAuthCallback);

  useEffect(() => {
    if (localUser && !user) {
      // Sync to Recoil if found in localStorage but not yet in state
      setUser(localUser);
    }

    if (!localUser && !isOAuthCallback) {
      // Try a silent server-side session check (cookie-based)
      apiFetch("/api/auth/oauth/user")
        .then((res) => (res.ok ? res.json() : null))
        .then((userData) => {
          if (userData && userData._id) {
            if (userData.token) setToken(userData.token);
            setCurrentTabUser(userData);
            setUser(userData);
          }
        })
        .catch(() => {})
        .finally(() => setCheckingAuth(false));
    } else {
      setCheckingAuth(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Has a local user — render right away without any flash
  if (localUser) {
    return <>{children}</>;
  }

  // OAuth callback — let it process (useOAuthCallback hook will handle the rest)
  if (isOAuthCallback) {
    return <>{children}</>;
  }

  // Still checking server session — show spinner
  if (checkingAuth) {
    return (
      <Flex w="full" h="100vh" alignItems="center" justifyContent="center">
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  // Confirmed unauthenticated — go to /auth
  return <Navigate to="/auth" replace />;
};

export default ProtectedRoute;
