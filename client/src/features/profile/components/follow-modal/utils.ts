import type { User } from "../../../../types/models";

export const buildFollowingMap = (
  following: (string | User)[] | undefined
): Record<string, boolean> => {
  const map: Record<string, boolean> = {};
  if (!Array.isArray(following)) return map;

  following.forEach((entry) => {
    const id = typeof entry === "string" ? entry : entry._id;
    if (id) map[id] = true;
  });

  return map;
};

export const syncFollowingMapForUsers = (
  users: User[],
  following: (string | User)[] | undefined,
  existing: Record<string, boolean>
): Record<string, boolean> => {
  const next = { ...existing };
  users.forEach((user) => {
    if (!user?._id) return;
    next[user._id] = (following ?? []).some((entry) => {
      const id = typeof entry === "string" ? entry : entry._id;
      return id === user._id;
    });
  });
  return next;
};
