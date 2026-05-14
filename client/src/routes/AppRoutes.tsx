/**
 * Application routes
 * Contains all route definitions for the application
 */
import { Route, Routes } from "react-router-dom";
import HomePage from "../pages/HomePage";
import AuthPage from "../pages/AuthPage";
import LogoutButton from "../features/auth/components/LogoutButton";
import UpdateProfilePage from "../pages/UpdateProfilePage";
import ProfileSetupPage from "../pages/ProfileSetupPage";
import UserPage from "../pages/UserPage";
import PostPage from "../pages/PostPage";
import ChatPage from "../pages/ChatPage";
import { SettingsPage } from "../pages/SettingsPage";
import SearchPage from "../pages/SearchPage";
import NotificationsPage from "../pages/NotificationsPage";
import OAuthPopupCallback from "../components/ui/OAuthPopupCallback";
import { MainLayout } from "../components/layout";

import ProtectedRoute from "./ProtectedRoute";
import PublicOnlyRoute from "./PublicOnlyRoute";
import OnboardingRoute from "./OnboardingRoute";
import { useRecoilValue } from "recoil";
import { userAtom } from "../atoms";

const AppRoutes = () => {
  const user = useRecoilValue(userAtom);

  return (
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
  );
};

export default AppRoutes;
