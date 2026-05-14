import { Avatar, Box, Button, Text, VStack, useColorModeValue } from "@chakra-ui/react";
import ContentCard from "../../../components/ui/ContentCard";
import { Link as RouterLink } from "react-router-dom";
import { useFollowUnfollow } from "../../../hooks";
import { type User } from "../../../utils/api";

interface SuggestedUserProps {
	user: User;
}

const SuggestedUser = ({ user }: SuggestedUserProps) => {
	const { handleFollowUnfollow, following, updating } = useFollowUnfollow(user);

	// Theme-aware colors
	const bgColor = useColorModeValue("white", "#111111");
	const textColor = useColorModeValue("gray.800", "white");
	return (
		// Card Container with Threads-like design
		<ContentCard
			p={4}
			mx={2} // Add horizontal margin for spacing in the slider
			minH="180px" // Slightly reduced height for more compact look
			display="flex"
			flexDirection="column"
			justifyContent="space-between" // Pushes button to the bottom
			className="suggested-user-card" // Apply our custom class for styling
		>
			<VStack spacing={2} alignItems="center" flexGrow={1}>
				{/* User Info Link */}
				<RouterLink to={`/${user.username}`}>
					<Avatar
						size="lg"
						src={user.profilePic}
						name={user.name}
						mb={2}
					/>
					<Text fontSize="15px" fontWeight="700" textAlign="center" color={textColor}>
						{user.name}
					</Text>
					<Text color="gray.500" fontSize="14px" textAlign="center">
						@{user.username}
					</Text>
				</RouterLink>
			</VStack>

			{/* Follow/Unfollow Button with Threads-like styling */}
			<Button
				mt={4}
				w="full"
				size="sm"
				bg={following ? "transparent" : useColorModeValue("black", "white")}
				color={following ? useColorModeValue("black", "white") : useColorModeValue("white", "black")}
				borderWidth={following ? "1px" : "0"}
				borderColor={following ? useColorModeValue("gray.300", "whiteAlpha.300") : "transparent"}
				borderRadius="10px"
				fontWeight="600"
				onClick={handleFollowUnfollow}
				isLoading={updating}
				h="36px"
				_hover={{ opacity: 0.8 }}
			>
				{following ? "Following" : "Follow"}
			</Button>
		</ContentCard>
	);
};

export default SuggestedUser;

