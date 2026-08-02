/**
 * Public only route component
 * Redirects authenticated users to the home page.
 * Reads from localStorage synchronously to avoid flash.
 */
import React from "react";
import { Navigate } from "react-router-dom";
import { useRecoilValue } from "recoil";
import { userAtom } from "../atoms";
import { getCurrentTabUser } from "../utils/session";

const PublicOnlyRoute = ({ children }: { children: React.ReactNode }) => {
  const user = useRecoilValue(userAtom);
  // Also check localStorage directly so we catch the case where the Recoil
  // atom hasn't been updated yet (e.g. fresh page load on /auth)
  const localUser = user ?? getCurrentTabUser();

  if (localUser) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default PublicOnlyRoute;
