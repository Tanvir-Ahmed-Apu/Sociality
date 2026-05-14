import { useState, useEffect } from "react";
import { Button, useToast, useColorModeValue } from "@chakra-ui/react";
import { useRecoilState } from "recoil";
import { userAtom } from "../../../atoms";
import { fetchWithSession, User } from "../../../utils/api";

interface FollowButtonProps {
    userId: string;
    initialIsFollowing: boolean;
    size?: string;
    onFollowToggle?: (isFollowing: boolean, userId: string, userData: User) => void;
    onUnfollowComplete?: (userId: string) => void;
}

const FollowButton = ({ userId, initialIsFollowing, size = "sm", onFollowToggle, onUnfollowComplete }: FollowButtonProps) => {
    // Use initialIsFollowing as the initial state, but also update when the prop changes
    const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useRecoilState(userAtom);
    const toast = useToast();

    // Threads-style minimalist colors
    const followBg = useColorModeValue("black", "white");
    const followColor = useColorModeValue("white", "black");
    const followHoverBg = useColorModeValue("gray.800", "gray.200");

    const unfollowBg = "transparent";
    const unfollowColor = useColorModeValue("gray.700", "whiteAlpha.800");
    const unfollowBorderColor = useColorModeValue("gray.300", "whiteAlpha.300");
    const unfollowHoverBg = useColorModeValue("gray.50", "whiteAlpha.100");

    // Update the state when initialIsFollowing changes
    useEffect(() => {
        console.log('FollowButton - initialIsFollowing:', initialIsFollowing, 'userId:', userId);
        setIsFollowing(initialIsFollowing);
    }, [initialIsFollowing]);

    // Double-check against user's following list for correct state
    useEffect(() => {
        if (user && userId) {
            const isActuallyFollowing = (user.following as (string | User)[] || []).some(following => {
                const followingId = typeof following === 'string' ? following : (following as any)?._id;
                return followingId === userId;
            }) || false;

            if (isActuallyFollowing !== isFollowing) {
                console.log('Correcting follow state:', { was: isFollowing, now: isActuallyFollowing, userId });
                setIsFollowing(isActuallyFollowing);
            }
        }
    }, [user, userId, isFollowing]);

    const handleFollowUnfollow = async () => {
        if (!user) return;

        setIsLoading(true);
        // Store the current state before changing it
        const wasFollowing = isFollowing;

        try {

            // Optimistic update - update UI immediately
            setIsFollowing(!isFollowing);

            // Update following list in user state
            let updatedFollowing = [...(user.following || [])];

            if (!isFollowing) {
                // Follow: Add to following list
                updatedFollowing.push(userId);
                console.log('Added user to following list:', userId);
            } else {
                // Unfollow: Remove from following list
                updatedFollowing = updatedFollowing.filter(id => {
                    const followingId = typeof id === 'string' ? id : (id as any)?._id;
                    return followingId !== userId;
                });
                console.log('Removed user from following list:', userId);
            }

            // Update user state with the new following list
            const updatedUser = {
                ...user,
                following: updatedFollowing as any
            };

            // Log the updated following count
            console.log('Updated following count:', updatedFollowing.length);
            console.log('Updated following list:', updatedFollowing);

            // Update the user state in Recoil
            setUser(updatedUser);

            // Update localStorage to persist changes
            localStorage.setItem('user-threads', JSON.stringify(updatedUser));

            // Log the updated user state for debugging
            console.log('Updated user state:', updatedUser);

            // Call API
            const res = await fetchWithSession(`/api/users/follow/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            if (res.ok) {
                const data = await res.json();
            } else {
                const errorData = await res.json().catch(() => ({ error: 'Failed to follow/unfollow user' }));
                // Revert optimistic update if there's an error
                setIsFollowing(wasFollowing);

                toast({
                    title: 'Error',
                    description: errorData.error || 'Failed to follow/unfollow user',
                    status: 'error',
                    duration: 3000,
                    isClosable: true
                });

                // Revert user state
                setUser(user);
                localStorage.setItem('user-threads', JSON.stringify(user));
                return;
            }

            // Fetch updated user data to get accurate counts
            try {
                const userRes = await fetchWithSession(`/api/users/profile/${user.username}`);
                if (userRes.ok) {
                    const userData = await userRes.json();

                    // Update the current user state with the latest data
                    setUser(userData);

                    // Update localStorage
                    localStorage.setItem('user-threads', JSON.stringify(userData));

                    console.log('Updated user data after follow/unfollow:', {
                        followers: userData.followers?.length || 0,
                        following: userData.following?.length || 0
                    });

                    // Notify parent component with updated user data
                    if (onFollowToggle) {
                        onFollowToggle(!isFollowing, userId, userData);
                    }

                    // If we're unfollowing and there's an onUnfollowComplete callback, call it
                    if (isFollowing && onUnfollowComplete) {
                        onUnfollowComplete(userId);
                    }
                } else {
                    console.error('Error fetching updated user data');
                }
            } catch (error) {
                console.error('Error fetching updated user data:', error);
            }

        } catch (error) {
            // Revert optimistic update if there's an error
            setIsFollowing(wasFollowing);

            toast({
                title: 'Error',
                description: 'Failed to follow/unfollow user',
                status: 'error',
                duration: 3000,
                isClosable: true
            });

            // Revert user state
            setUser(user);
            localStorage.setItem('user-threads', JSON.stringify(user));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Button
            size={size}
            bg={isFollowing ? unfollowBg : followBg}
            color={isFollowing ? unfollowColor : followColor}
            borderWidth={isFollowing ? "1px" : "none"}
            borderColor={isFollowing ? unfollowBorderColor : "transparent"}
            _hover={{
                bg: isFollowing ? unfollowHoverBg : followHoverBg,
            }}
            transition="all 0.2s"
            borderRadius="full"
            fontWeight="600"
            onClick={handleFollowUnfollow}
            isLoading={isLoading}
            px={6}
            _active={{
                transform: "scale(0.98)",
            }}
        >
            {isFollowing ? "Following" : "Follow"}
        </Button>
    );
};

export default FollowButton;
