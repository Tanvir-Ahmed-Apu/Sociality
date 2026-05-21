import { useCallback, useEffect, useRef, useState } from "react";
import { useRecoilState } from "recoil";
import { notificationsAtom } from "../../../atoms";
import useShowToast from "../../../hooks/useShowToast";
import { fetchWithSession } from "../../../utils/api";
import { Notification } from "../types";

const dedupeNotifications = (items: Notification[]) => {
  const seen = new Set<string>();
  return items.filter((n) => {
    if (!n._id || seen.has(n._id)) return false;
    seen.add(n._id);
    return true;
  });
};

export const useNotifications = () => {
  const [notifications, setNotifications] = useRecoilState(notificationsAtom);
  const [loading, setLoading] = useState(notifications.length === 0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const showToast = useShowToast();

  const lastNotificationRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (loading) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new window.IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setPage((prevPage) => prevPage + 1);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loading, hasMore]
  );

  useEffect(() => {
    const fetchNotifications = async () => {
      if (notifications.length === 0) setLoading(true);
      try {
        const res = await fetchWithSession(
          `/api/notifications?page=${page}&limit=10`
        );
        if (res.ok) {
          const data = await res.json();
          const notificationsArray = Array.isArray(data.notifications)
            ? data.notifications
            : Array.isArray(data)
              ? data
              : [];

          if (data.hasMore !== undefined) {
            setHasMore(data.hasMore);
          } else {
            setHasMore(notificationsArray.length > 0);
          }

          setNotifications((prev) =>
            dedupeNotifications([...prev, ...notificationsArray])
          );
        } else {
          const errorData = await res
            .json()
            .catch(() => ({ error: "Failed to fetch notifications" }));
          showToast(
            "Error",
            errorData.error || "Failed to fetch notifications",
            "error"
          );
        }
      } catch (error: any) {
        showToast("Error", error.message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, showToast]);

  const handleDeleteNotification = async (notificationId: string) => {
    try {
      setNotifications((prev) =>
        prev.filter((n: Notification) => n._id !== notificationId)
      );

      const res = await fetchWithSession(
        `/api/notifications/${notificationId}`,
        { method: "DELETE" }
      );

      if (!res.ok) {
        const errorData = await res
          .json()
          .catch(() => ({ error: "Failed to delete notification" }));
        showToast(
          "Error",
          errorData.error || "Failed to delete notification",
          "error"
        );

        const refreshRes = await fetchWithSession(
          "/api/notifications?page=1&limit=10"
        );
        if (refreshRes.ok) {
          const refreshedData = await refreshRes.json();
          setPage(1);
          if (refreshedData.notifications) {
            setNotifications(refreshedData.notifications);
            if (refreshedData.hasMore !== undefined) {
              setHasMore(refreshedData.hasMore);
            }
          } else {
            setNotifications(
              Array.isArray(refreshedData) ? refreshedData : []
            );
          }
        }
      } else {
        const data = await res.json();
        if (data.error) {
          showToast("Error", data.error, "error");
        }
      }
    } catch (error: any) {
      showToast("Error", error.message, "error");
    }
  };

  return {
    notifications,
    loading,
    lastNotificationRef,
    handleDeleteNotification,
  };
};
