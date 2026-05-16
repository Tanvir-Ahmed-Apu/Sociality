/**
 * Application routes
 * Contains all route definitions for the application
 */
import React, { Suspense, lazy, useState, useEffect } from "react";
import { Route, Routes } from "react-router-dom";
import { Flex, Spinner, useColorModeValue } from "@chakra-ui/react";
import { useRecoilValue } from "recoil";

// Import Layouts and Core Components
import { MainLayout } from "../components/layout";
import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";
import OnboardingRoute from "./OnboardingRoute";
import OAuthPopupCallback from "../components/ui/OAuthPopupCallback";
import { userAtom } from "../atoms";

// Lazy load pages for performance optimization (Code Splitting)
const HomePage = lazy(() => import("../pages/HomePage"));
const AuthPage = lazy(() => import("../pages/AuthPage"));
const UpdateProfilePage = lazy(() => import("../pages/UpdateProfilePage"));
const ProfileSetupPage = lazy(() => import("../pages/ProfileSetupPage"));
const UserPage = lazy(() => import("../pages/UserPage"));
const PostPage = lazy(() => import("../pages/PostPage"));
const ChatPage = lazy(() => import("../pages/ChatPage"));
const SearchPage = lazy(() => import("../pages/SearchPage"));
const NotificationsPage = lazy(() => import("../pages/NotificationsPage"));

// SettingsPage uses a named export, so we need to map it to a default export for React.lazy
const SettingsPage = lazy(() => 
  import("../pages/SettingsPage").then(module => ({ default: module.SettingsPage }))
);

// Loading fallback component
const PageLoadingSpinner = () => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Delay showing the spinner by 250ms to prevent flashing on fast page transitions
    const timer = setTimeout(() => setShow(true), 250);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Flex 
      w="full" 
      h="100vh" 
      alignItems="center" 
      justifyContent="center" 
      bg={useColorModeValue("white", "var(--chakra-colors-brand-dark-600)")}
      opacity={show ? 1 : 0}
      transition="opacity 0.3s ease-in-out"
    >
      <Spinner size="xl" color="blue.500" thickness="4px" />
    </Flex>
  );
};

const AppRoutes = () => {
  const user = useRecoilValue(userAtom);

  return (
    <Suspense fallback={<PageLoadingSpinner />}>
      <Routes>
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <OnboardingRoute>
                <MainLayout>
                  <HomePage />
                </MainLayout>
              </OnboardingRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/auth"
          element={
            <PublicOnlyRoute>
              <AuthPage />
            </PublicOnlyRoute>
          }
        />

        <Route
          path="/oauth-popup-callback"
          element={<OAuthPopupCallback />}
        />

        <Route
          path="/profile-setup"
          element={
            <ProtectedRoute>
              <ProfileSetupPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/update"
          element={
            <ProtectedRoute>
              <OnboardingRoute>
                <MainLayout>
                  <UpdateProfilePage />
                </MainLayout>
              </OnboardingRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/:username"
          element={
            <ProtectedRoute>
              <OnboardingRoute>
                <MainLayout>
                  <UserPage />
                </MainLayout>
              </OnboardingRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/:username/post/:pid"
          element={
            <ProtectedRoute>
              <OnboardingRoute>
                <MainLayout>
                  <PostPage />
                </MainLayout>
              </OnboardingRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <OnboardingRoute>
                <MainLayout fullWidth>
                  <ChatPage />
                </MainLayout>
              </OnboardingRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <OnboardingRoute>
                <MainLayout>
                  <SettingsPage />
                </MainLayout>
              </OnboardingRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/search"
          element={
            <ProtectedRoute>
              <OnboardingRoute>
                <MainLayout>
                  <SearchPage />
                </MainLayout>
              </OnboardingRoute>
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <OnboardingRoute>
                <MainLayout>
                  <NotificationsPage />
                </MainLayout>
              </OnboardingRoute>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
