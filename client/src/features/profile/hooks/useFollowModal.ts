import { useCallback, useEffect, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userAtom } from "../../../atoms";
import useShowToast from "../../../hooks/useShowToast";
import useUserEvents from "../../../hooks/useUserEvents";
import {
  fetchWithSession,
  setCurrentTabUser,
} from "../../../utils/api";
import type { User } from "../../../types/models";
import type { FollowTab } from "../components/follow-modal/types";
import {
  buildFollowingMap,
  syncFollowingMapForUsers,
} from "../components/follow-modal/utils";

interface UseFollowModalOptions {
  isOpen: boolean;
  onClose: () => void;
  username: string;
  onUserUpdate?: (user: User) => void;
  initialTab?: FollowTab;
}

export const useFollowModal = ({
  isOpen,
  onClose,
  username,
  onUserUpdate,
  initialTab = 0,
}: UseFollowModalOptions) => {
  const [activeTab, setActiveTab] = useState<FollowTab>(initialTab);
  const [followers, setFollowers] = useState<User[]>([]);
  const [following, setFollowing] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingIds, setProcessingIds] = useState<Record<string, boolean>>(
    {}
  );
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  const currentUser = useRecoilValue(userAtom);
  const setCurrentUser = useSetRecoilState(userAtom);
  const showToast = useShowToast();
  const { emitUserUpdate } = useUserEvents();

  const isOwnProfile = currentUser?.username === username;

  useEffect(() => {
    if (isOpen) setActiveTab(initialTab);
  }, [isOpen, initialTab]);

  const refreshProfile = useCallback(async () => {
    const res = await fetchWithSession(`/api/users/profile/${username}`);
    const data = await res.json();
    if (!res.ok) return null;

    if (Array.isArray(data.followers)) setFollowers(data.followers);
    if (Array.isArray(data.following)) setFollowing(data.following);
    onUserUpdate?.(data);
    return data as User;
  }, [username, onUserUpdate]);

  const refreshCurrentUser = useCallback(async () => {
    if (!currentUser?.username) return null;
    const res = await fetchWithSession(
      `/api/users/profile/${currentUser.username}`
    );
    const data = await res.json();
    if (!res.ok) return null;

    setCurrentUser(data);
    setCurrentTabUser(data);
    return data as User;
  }, [currentUser?.username, setCurrentUser]);

  useEffect(() => {
    const fetchList = async () => {
      if (!isOpen || !username) return;

      setIsLoading(true);
      try {
        const endpoint =
          activeTab === 0
            ? `/api/users/followers/${username}`
            : `/api/users/following/${username}`;

        const res = await fetchWithSession(endpoint);
        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error || "Failed to fetch data");
        }

        if (activeTab === 0) setFollowers(data);
        else setFollowing(data);

        const profileRes = await fetchWithSession(
          `/api/users/profile/${username}`
        );
        const profileData = await profileRes.json();
        if (profileRes.ok && onUserUpdate) onUserUpdate(profileData);

        if (currentUser && Array.isArray(currentUser.following)) {
          setFollowingMap(buildFollowingMap(currentUser.following));
        }
      } catch {
        if (activeTab === 0) setFollowers([]);
        else setFollowing([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchList();
  }, [isOpen, username, activeTab, currentUser?.following, onUserUpdate]);

  const setProcessing = (userId: string, value: boolean) => {
    setProcessingIds((prev) => ({ ...prev, [userId]: value }));
  };

  const handleFollowToggle = async (userId: string) => {
    if (processingIds[userId]) return;

    const wasFollowing = followingMap[userId] || false;
    setProcessing(userId, true);
    setFollowingMap((prev) => ({ ...prev, [userId]: !wasFollowing }));

    try {
      const res = await fetchWithSession(`/api/users/follow/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: "Failed to follow/unfollow user" }));
        setFollowingMap((prev) => ({ ...prev, [userId]: wasFollowing }));
        showToast(
          "Error",
          errorData.error || "Failed to follow/unfollow user",
          "error"
        );
        return;
      }

      const currentUserData = await refreshCurrentUser();
      if (!currentUserData) {
        showToast("Error", "Failed to update following information", "error");
        return;
      }

      if (Array.isArray(currentUserData.following)) {
        setFollowingMap((prev) =>
          syncFollowingMapForUsers(
            followers,
            currentUserData.following,
            prev
          )
        );
      }

      await refreshProfile();
      showToast(
        "Success",
        wasFollowing ? "User unfollowed" : "User followed",
        "success"
      );
    } catch {
      setFollowingMap((prev) => ({ ...prev, [userId]: wasFollowing }));
      showToast("Error", "Failed to follow/unfollow user", "error");
    } finally {
      setProcessing(userId, false);
    }
  };

  const handleUnfollow = async (userId: string) => {
    if (processingIds[userId]) return;

    setProcessing(userId, true);

    setFollowing((prev) => {
      const filtered = prev.filter((user) => user._id !== userId);
      if (filtered.length === 0 && activeTab === 1) {
        setTimeout(onClose, 500);
      }
      return filtered;
    });

    try {
      const res = await fetchWithSession(`/api/users/follow/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (data.error) {
        showToast("Error", data.error || "Failed to unfollow user", "error");
        await refreshProfile();
        return;
      }

      await refreshCurrentUser();
      const profileData = await refreshProfile();

      if (currentUser && profileData && currentUser.username === username) {
        const updated = {
          ...currentUser,
          following: profileData.following ?? [],
        };
        setCurrentUser(updated);
        setCurrentTabUser(updated);
      }

      if (profileData) emitUserUpdate(profileData);
      showToast("Success", "User unfollowed", "success");
    } catch {
      showToast("Error", "Could not unfollow user", "error");
      await refreshProfile();
    } finally {
      setProcessing(userId, false);
    }
  };

  const handleRemoveFollower = async (userId: string) => {
    if (processingIds[userId]) return;

    setProcessing(userId, true);
    setFollowers((prev) => prev.filter((u) => u._id !== userId));

    try {
      const res = await fetchWithSession(
        `/api/users/remove-follower/${userId}`,
        { method: "POST", headers: { "Content-Type": "application/json" } }
      );
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to remove follower");
      }

      await refreshProfile();
      showToast("Success", "Follower removed successfully", "success");
    } catch (error: any) {
      showToast("Error", error.message, "error");
      const res = await fetchWithSession(`/api/users/followers/${username}`);
      const data = await res.json();
      if (res.ok) setFollowers(data);
    } finally {
      setProcessing(userId, false);
    }
  };

  return {
    activeTab,
    setActiveTab,
    followers,
    following,
    isLoading,
    processingIds,
    followingMap,
    currentUser,
    isOwnProfile,
    handleFollowToggle,
    handleUnfollow,
    handleRemoveFollower,
  };
};
