import { fetchWithSession } from "./session";
import type { User } from "../types/models";

export type UserRef = string | User | null | undefined;

export function normalizeUserId(ref: UserRef): string | undefined {
	if (!ref) return undefined;
	if (typeof ref === "string") return ref;
	return ref._id;
}

export function isFollowing(
	currentUser: User | null | undefined,
	targetId: string
): boolean {
	if (!currentUser?.following || !targetId) return false;
	return currentUser.following.some(
		(entry) => normalizeUserId(entry) === targetId
	);
}

export async function toggleFollowApi(
	targetUserId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
	const res = await fetchWithSession(`/api/users/follow/${targetUserId}`, {
		method: "POST",
		headers: { "Content-Type": "application/json" },
	});

	if (!res.ok) {
		const errorData = await res
			.json()
			.catch(() => ({ error: "Failed to follow/unfollow user" }));
		return {
			ok: false,
			error: errorData.error || "Failed to follow/unfollow user",
		};
	}

	return { ok: true };
}

export async function fetchUserProfile(username: string): Promise<User | null> {
	const res = await fetchWithSession(`/api/users/profile/${username}`);
	const data = await res.json();
	if (!res.ok) return null;
	return data as User;
}
