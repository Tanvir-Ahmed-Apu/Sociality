import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import useShowToast from "./useShowToast";
import { fetchWithSession, User } from "../utils/api";

const useGetUserProfile = () => {
	const [user, setUser] = useState<User | null>(null);
	const [loading, setLoading] = useState(true);
	const { username } = useParams();
	const showToast = useShowToast();

	const getUser = useCallback(async () => {
		try {
			setLoading(true);
			const timestamp = new Date().getTime();
			const res = await fetchWithSession(`/api/users/profile/${username}?t=${timestamp}`);
			if (res.ok) {
				const data = await res.json();
				if (data.isFrozen) {
					setUser(null);
					return;
				}
				setUser(data);
			} else {
				const errorData = await res.json().catch(() => ({ error: 'Failed to fetch user profile' }));
				showToast("Error", errorData.error || 'Failed to fetch user profile', "error");
			}
		} catch (error: any) {
			showToast("Error", error.message, "error");
		} finally {
			setLoading(false);
		}
	}, [username, showToast]);

	useEffect(() => {
		getUser();
	}, [getUser]);

	// Function to refresh user data - can be called externally
	const refreshUser = useCallback(() => {
		getUser();
	}, [getUser]);

	return { user, loading, refreshUser };
};

export default useGetUserProfile;
