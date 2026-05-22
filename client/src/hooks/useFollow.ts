import { useCallback, useState } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userAtom } from "../atoms";
import { setCurrentTabUser } from "../utils/session";
import {
	fetchUserProfile,
	isFollowing,
	toggleFollowApi,
} from "../utils/follow";
import type { User } from "../types/models";
import useShowToast from "./useShowToast";

export interface UseFollowOptions {
	targetUserId: string;
	targetUsername?: string;
	targetName?: string;
	onProfileRefresh?: (user: User) => void;
}

export function useFollow({
	targetUserId,
	targetUsername,
	targetName,
	onProfileRefresh,
}: UseFollowOptions) {
	const currentUser = useRecoilValue(userAtom);
	const setCurrentUser = useSetRecoilState(userAtom);
	const showToast = useShowToast();
	const [loading, setLoading] = useState(false);
	const following = isFollowing(currentUser, targetUserId);

	const refreshCurrentUser = useCallback(async () => {
		if (!currentUser?.username) return null;
		const data = await fetchUserProfile(currentUser.username);
		if (data) {
			setCurrentUser(data);
			setCurrentTabUser(data);
		}
		return data;
	}, [currentUser?.username, setCurrentUser]);

	const toggle = useCallback(async () => {
		if (!currentUser) {
			showToast("Error", "Please login to follow", "error");
			return null;
		}
		if (loading) return null;

		const wasFollowing = following;
		setLoading(true);
		try {
			const result = await toggleFollowApi(targetUserId);
			if (!result.ok) {
				showToast("Error", result.error, "error");
				return null;
			}

			const updated = await refreshCurrentUser();
			if (!updated) {
				showToast("Error", "Failed to update following information", "error");
				return null;
			}

			showToast(
				"Success",
				wasFollowing
					? `Unfollowed ${targetName || "user"}`
					: `Followed ${targetName || "user"}`,
				"success"
			);

			if (onProfileRefresh && targetUsername) {
				const profile = await fetchUserProfile(targetUsername);
				if (profile) onProfileRefresh(profile);
			}

			return { wasFollowing, currentUser: updated };
		} catch (error: unknown) {
			const message =
				error instanceof Error ? error.message : "An error occurred";
			showToast("Error", message, "error");
			return null;
		} finally {
			setLoading(false);
		}
	}, [
		currentUser,
		loading,
		following,
		targetUserId,
		targetUsername,
		targetName,
		onProfileRefresh,
		refreshCurrentUser,
		showToast,
	]);

	return { following, toggle, loading };
}

/** @deprecated Prefer useFollow — kept for existing call sites */
export default function useFollowUnfollow(
	user: User,
	onFollowToggle: ((user: User) => void) | null = null
) {
	const { following, toggle, loading } = useFollow({
		targetUserId: user._id!,
		targetUsername: user.username,
		targetName: user.name,
		onProfileRefresh: onFollowToggle ?? undefined,
	});

	return {
		following,
		updating: loading,
		handleFollowUnfollow: toggle,
	};
}
