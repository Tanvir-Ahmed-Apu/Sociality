import { Button, useColorModeValue } from "@chakra-ui/react";
import { useSetRecoilState } from "recoil";
import { userAtom } from "../../../atoms";
import useShowToast from "../../../hooks/useShowToast";
import { FiLogOut } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const LogoutButton = () => {
	const setUser = useSetRecoilState(userAtom);
	const showToast = useShowToast();
	const navigate = useNavigate();

	const handleLogout = async () => {
		try {
			const res = await fetch("/api/users/logout", {
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

			localStorage.removeItem("user-threads");
			setUser(null);
			// Navigate to auth page after logout
			navigate("/auth");
			showToast("Success", "Logged out successfully", "success");
		} catch (error: any) {
			showToast("Error", error.message || "An error occurred", "error");
		}
	};
	return (
		<Button
			position={"fixed"}
			top={"30px"}
			right={"30px"}
			size={"sm"}
			onClick={handleLogout}
			bg={useColorModeValue("white", "gray.800")}
			color={useColorModeValue("gray.700", "white")}
			borderWidth="1px"
			borderColor={useColorModeValue("gray.200", "gray.600")}
			boxShadow={useColorModeValue("0 2px 8px rgba(0, 0, 0, 0.1)", "0 2px 8px rgba(0, 0, 0, 0.3)")}
			_hover={{
				bg: useColorModeValue("gray.50", "gray.700"),
				borderColor: useColorModeValue("gray.300", "gray.500"),
				transform: "translateY(-2px)",
				boxShadow: useColorModeValue("0 4px 12px rgba(0, 0, 0, 0.15)", "0 4px 12px rgba(0, 0, 0, 0.4)")
			}}
			transition="all 0.2s"
		>
			<FiLogOut size={20} color={useColorModeValue("gray.700", "white")} />
		</Button>
	);
};

export default LogoutButton;
