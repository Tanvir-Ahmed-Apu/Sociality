/**
 * Protected route component
 * Redirects unauthenticated users to the auth page
 */
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userAtom } from "../atoms";
import { getCurrentTabUser } from "../utils/session";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useRecoilValue(userAtom);
  const location = useLocation();

  // Check if this is an OAuth callback
  const urlParams = new URLSearchParams(location.search);
  const isOAuthCallback = urlParams.get('oauth') === 'success' || urlParams.get('error');

  // Also check tab-local storage synchronously to avoid redirecting before
  // the app has a chance to initialize user state from storage
  const storedUser = getCurrentTabUser();

  // Allow OAuth callback to be processed even without user
  // If there is a stored user, treat the route as authenticated until state initializes
  if (!user && !storedUser && !isOAuthCallback) {
    return <Navigate to="/auth" />;
  }

  return children;
};

export default ProtectedRoute;
