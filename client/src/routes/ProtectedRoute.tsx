/**
 * Protected route component
 * Redirects unauthenticated users to the auth page
 */
import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userAtom, authInitializingAtom } from "../atoms";
import { getCurrentTabUser } from "../utils/session";
import { Flex, Spinner, useColorModeValue } from "@chakra-ui/react";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useRecoilValue(userAtom);
  const initializing = useRecoilValue(authInitializingAtom);
  const location = useLocation();

  // Check if this is an OAuth callback
  const urlParams = new URLSearchParams(location.search);
  const isOAuthCallback = urlParams.get('oauth') === 'success' || urlParams.get('error');

  // Also check tab-local storage synchronously to avoid redirecting before
  // the app has a chance to initialize user state from storage
  const storedUser = getCurrentTabUser();

  // While initializing, render a neutral loading state so we don't redirect prematurely
  if (initializing) {
    return (
      <Flex 
        w="full" 
        h="100vh" 
        alignItems="center" 
        justifyContent="center" 
        bg={useColorModeValue("white", "var(--chakra-colors-brand-dark-600)")}
      >
        <Spinner size="xl" color="blue.500" thickness="4px" />
      </Flex>
    );
  }

  // Allow OAuth callback to be processed even without user
  // If there is a stored user, treat the route as authenticated until state initializes
  if (!user && !storedUser && !isOAuthCallback) {
    return <Navigate to="/auth" />;
  }

  return children;
};

export default ProtectedRoute;
