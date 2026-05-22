import { Button, useColorModeValue } from "@chakra-ui/react";
import { useFollow } from "../../../hooks/useFollow";
import type { User } from "../../../types/models";

interface FollowButtonProps {
	userId: string;
	targetUsername?: string;
	targetName?: string;
	size?: string;
	onProfileRefresh?: (user: User) => void;
	onFollowToggle?: (isFollowing: boolean, userId: string, userData: User) => void;
	onUnfollowComplete?: (userId: string) => void;
}

const FollowButton = ({
	userId,
	targetUsername,
	targetName,
	size = "sm",
	onProfileRefresh,
	onFollowToggle,
	onUnfollowComplete,
}: FollowButtonProps) => {
	const { following, toggle, loading } = useFollow({
		targetUserId: userId,
		targetUsername,
		targetName,
		onProfileRefresh,
	});

	const followBg = useColorModeValue("black", "white");
	const followColor = useColorModeValue("white", "black");
	const followHoverBg = useColorModeValue("gray.800", "gray.200");
	const unfollowColor = useColorModeValue("gray.700", "whiteAlpha.800");
	const unfollowBorderColor = useColorModeValue("gray.300", "whiteAlpha.300");
	const unfollowHoverBg = useColorModeValue("gray.50", "whiteAlpha.100");

	const handleClick = async () => {
		const wasFollowing = following;
		const result = await toggle();
		if (!result) return;

		if (result.wasFollowing && onUnfollowComplete) {
			onUnfollowComplete(userId);
		}
		if (onFollowToggle) {
			onFollowToggle(!wasFollowing, userId, result.currentUser);
		}
	};

	return (
		<Button
			size={size}
			bg={following ? "transparent" : followBg}
			color={following ? unfollowColor : followColor}
			borderWidth={following ? "1px" : "none"}
			borderColor={following ? unfollowBorderColor : "transparent"}
			_hover={{ bg: following ? unfollowHoverBg : followHoverBg }}
			transition="all 0.2s"
			borderRadius="full"
			fontWeight="600"
			onClick={handleClick}
			isLoading={loading}
			px={6}
			_active={{ transform: "scale(0.98)" }}
		>
			{following ? "Following" : "Follow"}
		</Button>
	);
};

export default FollowButton;
