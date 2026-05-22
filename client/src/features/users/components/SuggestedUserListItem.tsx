import { Avatar, Box, Button, Flex, Text, useColorModeValue } from "@chakra-ui/react";
import { Link } from "react-router-dom";
import { useFollow } from "../../../hooks/useFollow";
import { User } from "../../../utils/api";

// Component specifically for list view (e.g., on Search Page)
const SuggestedUserListItem = ({ user }: { user: User }) => {
    const { toggle: handleFollowUnfollow, following, loading: updating } = useFollow({
        targetUserId: user._id!,
        targetUsername: user.username,
        targetName: user.name,
    });

    // Theme-aware colors
    const bgColor = useColorModeValue("white", "#1A1A1A");
    const hoverBgColor = useColorModeValue("gray.50", "#222222");
    const textColor = useColorModeValue("gray.800", "white");
    const usernameColor = useColorModeValue("gray.600", "gray.400");
    const borderColor = useColorModeValue("gray.200", "rgba(255, 255, 255, 0.08)");

    return (
        <Flex
            gap={4}
            justifyContent={"space-between"}
            alignItems={"center"}
            w="full"
            py={3}
            px={4}
            mx={0}
            mb={3}
            bg={bgColor}
            borderRadius="xl"
            borderWidth="1px"
            borderColor={borderColor}
            boxShadow={useColorModeValue("sm", "none")}
            _hover={{ bg: hoverBgColor, transform: "translateY(-1px)", boxShadow: "md" }}
            transition="all 0.2s"
        >
            {/* Left side: Avatar and User Info */}
            <Flex gap={4} as={Link} to={`/${user.username}`} alignItems="center">
                <Avatar size="md" src={user.profilePic} name={user.name} /> {/* Adjusted avatar */}
                <Box>
                    <Text fontSize={"sm"} fontWeight={"bold"} color={textColor}> {/* Adjusted text */}
                        {user.username}
                    </Text>
                    <Text color={usernameColor} fontSize={"xs"}>
                        {user.name}
                    </Text>
                </Box>
            </Flex>

            {/* Right side: Follow/Unfollow Button with improved styling */}
            <Button
                size={"sm"} // Adjusted button
                bg={following ? "transparent" : "#00B374"}
                color={following ? useColorModeValue("gray.700", "white") : "white"}
                borderWidth="1px"
                borderColor={following ? useColorModeValue("gray.300", "gray.600") : "#00B374"}
                _hover={{
                    bg: following
                        ? useColorModeValue("gray.100", "rgba(255, 255, 255, 0.1)")
                        : "brand.primary.500",
                }}
                borderRadius="full"
                fontWeight="medium"
                onClick={handleFollowUnfollow}
                isLoading={updating}
                ml={2}
                px={4} // Adjusted horizontal padding
                fontSize="sm" // Adjusted text
            >
                {following ? "Unfollow" : "Follow"}
            </Button>
        </Flex>
    );
};

export default SuggestedUserListItem;
