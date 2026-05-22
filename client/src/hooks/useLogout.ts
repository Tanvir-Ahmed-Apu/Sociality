import { clearCurrentTabAuth, getTabId } from "../utils/api";
import { useSetRecoilState } from "recoil";
import { userAtom } from "../atoms";
import { apiFetch } from "../utils/apiBase";
import useShowToast from "./useShowToast";
import { useNavigate } from "react-router-dom";

const useLogout = () => {
	const setUser = useSetRecoilState(userAtom);
	const showToast = useShowToast();
	const navigate = useNavigate();

	const logout = async () => {
		try {
			const res = await apiFetch(`/api/users/logout?session=${getTabId()}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});
			const data = await res.json();

			if (data.error) {
				showToast("Error", data.error, "error");
				return;
			}

			clearCurrentTabAuth();
			setUser(null);
			// Navigate to auth page after logout
			navigate("/auth");
			showToast("Success", "Logged out successfully", "success");
		} catch (error: any) {
			showToast("Error", error.message || error, "error");
		}
	};

	return logout;
};

export default useLogout;
