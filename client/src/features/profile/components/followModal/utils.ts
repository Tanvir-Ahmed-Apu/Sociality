import type { User } from "../../../../types/models";
import { normalizeUserId } from "../../../../utils/follow";

export const buildFollowingMap = (
	following: (string | User)[] | undefined
): Record<string, boolean> => {
	const map: Record<string, boolean> = {};
	if (!Array.isArray(following)) return map;

	following.forEach((entry) => {
		const id = normalizeUserId(entry);
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
		next[user._id] = isFollowingEntry(following, user._id);
	});
	return next;
};

function isFollowingEntry(
	following: (string | User)[] | undefined,
	targetId: string
): boolean {
	return (following ?? []).some(
		(entry) => normalizeUserId(entry) === targetId
	);
}
