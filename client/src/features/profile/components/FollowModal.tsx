import { useState, useEffect } from "react";
import {
    Modal,
    ModalOverlay,
    ModalContent,
    ModalHeader,
    ModalCloseButton,
    ModalBody,
    Text,
    VStack,
    HStack,
    Avatar,
    Button,
    useToast,
    Box,
    Spinner,
    Center,
} from "@chakra-ui/react";
import { Link as RouterLink } from "react-router-dom";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userAtom } from "../../../atoms";
import { fetchWithSession, User } from "../../../utils/api";
import useUserEvents from "../../../hooks/useUserEvents";
import useShowToast from "../../../hooks/useShowToast";
import styles from "./FollowModal.module.css";


interface FollowModalProps {
    isOpen: boolean;
    onClose: () => void;
    username: string;
    onUserUpdate?: (user: User) => void;
    initialTab?: number;
}

const FollowModal = ({ isOpen, onClose, username, onUserUpdate, initialTab = 0 }: FollowModalProps) => {
    const [activeTab, setActiveTab] = useState(initialTab); // 0 for followers, 1 for following
    const [followers, setFollowers] = useState<User[]>([]);
    const [following, setFollowing] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [processingIds, setProcessingIds] = useState<Record<string, boolean>>({});
    const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
    const [isUnfollowing, setIsUnfollowing] = useState(false);
    const [isRemovingFollower, setIsRemovingFollower] = useState(false);
    const currentUser = useRecoilValue(userAtom);
    const setCurrentUser = useSetRecoilState(userAtom);
    const showToast = useShowToast();

    // User events for global state synchronization
    const { emitUserUpdate } = useUserEvents();

    // Set active tab when modal opens or initialTab changes
    useEffect(() => {
        if (isOpen) {
            setActiveTab(initialTab);
        }
    }, [isOpen, initialTab]);

    // Fetch user data when modal opens or tab changes
    useEffect(() => {
        const fetchUserData = async () => {
            if (!isOpen || !username) return;

            setIsLoading(true);

            try {
                // Fetch the specific list based on active tab
                const endpoint = activeTab === 0 
                    ? `/api/users/followers/${username}` 
                    : `/api/users/following/${username}`;

                const res = await fetchWithSession(endpoint);
                const data = await res.json();

                if (!res.ok) {
                    throw new Error(data.error || 'Failed to fetch data');
                }

                if (activeTab === 0) {
                    setFollowers(data);
                } else {
                    setFollowing(data);
                }

                // Also fetch basic profile to keep counts sync'd if needed
                const profileRes = await fetchWithSession(`/api/users/profile/${username}`);
                const profileData = await profileRes.json();

                if (profileRes.ok && onUserUpdate) {
                    onUserUpdate(profileData);
                }

                // Create a map of users the current user is following for easy lookup
                if (currentUser && Array.isArray(currentUser.following)) {
                    const followMap: Record<string, boolean> = {};
                    (currentUser.following as (string | User)[]).forEach(user => {
                        const id = typeof user === 'string' ? user : (user as any)._id;
                        if (id) followMap[id] = true;
                    });
                    setFollowingMap(followMap);
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
                if (activeTab === 0) setFollowers([]);
                else setFollowing([]);
            } finally {
                setIsLoading(false);
            }
        };

        fetchUserData();
    }, [isOpen, username, activeTab, currentUser?.following]);

    // Handle follow/unfollow action for followers list
    const handleFollowToggle = async (userId: string) => {
        if (processingIds[userId]) return; // Prevent multiple clicks

        // Set processing state
        setProcessingIds(prev => ({ ...prev, [userId]: true }));

        // Get current following state
        const isCurrentlyFollowing = followingMap[userId] || false;

        // Update UI immediately (optimistic update)
        setFollowingMap(prev => ({
            ...prev,
            [userId]: !isCurrentlyFollowing
        }));

        try {
            // Make the API call to follow/unfollow
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
                // Revert UI if there's an error
                setFollowingMap(prev => ({
                    ...prev,
                    [userId]: isCurrentlyFollowing
                }));

                showToast('Error', errorData.error || 'Failed to follow/unfollow user', 'error');
                return;
            }

            // The API doesn't return updated user data, so we need to fetch it
            // Fetch current user data to get updated following list
            const currentUserRes = await fetchWithSession(`/api/users/profile/${currentUser?.username}`);
            const currentUserData = await currentUserRes.json();

            if (!currentUserRes.ok) {
                console.error("Error fetching current user data:", currentUserData.error);
                showToast('Error', 'Failed to update following information', 'error');
                return;
            }

            // Update current user state with fresh data from the server
            setCurrentUser(currentUserData);
            localStorage.setItem('user-threads', JSON.stringify(currentUserData));

            // Update the following map with fresh data
            if (Array.isArray(currentUserData.following)) {
                const newFollowingMap: Record<string, boolean> = {...followingMap};
                followers.forEach((user: User) => {
                    if (user && user._id) {
                        // Check if this user is in currentUser's following list
                        const isFollowing = (currentUserData.following as (string | User)[]).some(followingId => {
                            const id = typeof followingId === 'string' ? followingId : (followingId as any)._id;
                            return id === user._id;
                        });
                        newFollowingMap[user._id] = isFollowing;
                    }
                });
                setFollowingMap(newFollowingMap);
            }

            // Fetch the profile being viewed to get updated follower/following lists
            const profileRes = await fetchWithSession(`/api/users/profile/${username}`);
            const profileData = await profileRes.json();

            if (!profileRes.ok) {
                console.error("Error fetching profile data:", profileData.error);
                return;
            }

            // Update the followers and following lists
            if (Array.isArray(profileData.followers)) {
                setFollowers(profileData.followers);
            }

            if (Array.isArray(profileData.following)) {
                setFollowing(profileData.following);
            }

            // Update parent component immediately with the updated user data
            if (onUserUpdate) {
                console.log('Updating parent with new profile data:', {
                    followers: profileData.followers?.length || 0,
                    following: profileData.following?.length || 0
                });
                onUserUpdate(profileData);
            }

            // Show success message
            showToast('Success', isCurrentlyFollowing ? 'User unfollowed' : 'User followed', 'success');
        } catch (error) {
            // Revert UI if there's an error
            setFollowingMap(prev => ({
                ...prev,
                [userId]: isCurrentlyFollowing
            }));

            showToast('Error', 'Failed to follow/unfollow user', 'error');
            console.error('Error in handleFollowToggle:', error);
        } finally {
            // Clear processing state
            setProcessingIds(prev => ({ ...prev, [userId]: false }));
        }
    };

    // Handle unfollow for following list
    const handleUnfollow = async (userId: string) => {
        if (processingIds[userId]) return; // Prevent multiple clicks

        // Set processing state and disable auto-refresh
        setProcessingIds(prev => ({ ...prev, [userId]: true }));
        setIsUnfollowing(true);

        try {
            // Remove the user from the list immediately for better UX
            setFollowing(prev => {
                const filteredUsers = prev.filter((user: User) => (user as any)._id !== userId);
                console.log(`Removed user ${userId} from following list. Remaining users:`, filteredUsers.length);



                // Close modal if no users left and we're on the following tab
                if (filteredUsers.length === 0 && activeTab === 1) {
                    setTimeout(() => {
                        console.log('No more users in following list, closing modal');
                        onClose();
                    }, 500);
                }

                return filteredUsers;
            });

            // Make API call to unfollow
            const res = await fetchWithSession(`/api/users/follow/${userId}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await res.json();

            if (data.error) {
                showToast('Error', data.error || 'Failed to follow user', 'error');

                // Reload the following list to restore the state
                const profileRes = await fetchWithSession(`/api/users/profile/${username}`);
                const profileData = await profileRes.json();
                if (!profileRes.ok) {
                    console.error("Error fetching profile data:", profileData.error);
                    return;
                }

                if (Array.isArray(profileData.following)) {
                    setFollowing(profileData.following);
                }

                return;
            }

            // The API doesn't return updated user data, so we need to fetch it
            // Fetch current user data to get updated following list
            const currentUserRes = await fetchWithSession(`/api/users/profile/${currentUser?.username}`);
            const currentUserData = await currentUserRes.json();

            if (!currentUserRes.ok) {
                console.error("Error fetching current user data:", currentUserData.error);
                return;
            }

            // Update current user state with fresh data from the server
            setCurrentUser(currentUserData);
            localStorage.setItem('user-threads', JSON.stringify(currentUserData));

            // Fetch the profile being viewed to get updated follower/following lists
            const profileRes = await fetchWithSession(`/api/users/profile/${username}`);
            const profileData = await profileRes.json();

            if (!profileRes.ok) {
                console.error("Error fetching profile data:", profileData.error);
                return;
            }

            // Update the followers and following lists (though we already updated following)
            if (Array.isArray(profileData.followers)) {
                setFollowers(profileData.followers);
            }

            // Update current user state if this is the current user's profile
            if (currentUser && currentUser.username === username) {
                const updatedCurrentUser = {
                    ...currentUser,
                    following: (profileData.following || []) as any
                };
                setCurrentUser(updatedCurrentUser);
                localStorage.setItem('user-threads', JSON.stringify(updatedCurrentUser));
            }

            // Emit global user update event
            emitUserUpdate(profileData);

            // Update parent component immediately with the updated user data
            if (onUserUpdate) {
                console.log('Updating parent with new profile data after unfollow:', {
                    followers: profileData.followers?.length || 0,
                    following: profileData.following?.length || 0
                });
                onUserUpdate(profileData);
            }

            // Show success message
            showToast('Success', 'User unfollowed', 'success');
        } catch (error) {
            console.error('Error unfollowing user:', error);
            showToast("Error", "Could not unfollow user", "error");

            // Reload the following list to restore the state
            const profileRes = await fetchWithSession(`/api/users/profile/${username}`);
            const profileData = await profileRes.json();
            if (!profileRes.ok) {
                console.error("Error fetching profile data:", profileData.error);
                return;
            }

            if (Array.isArray(profileData.following)) {
                setFollowing(profileData.following);
            }
        } finally {
            // Clear processing state and re-enable auto-refresh
            setProcessingIds(prev => ({ ...prev, [userId]: false }));
            setIsUnfollowing(false);
        }
    };

    // Handle remove follower
    const handleRemoveFollower = async (userId: string) => {
        if (processingIds[userId]) return;

        setProcessingIds(prev => ({ ...prev, [userId]: true }));
        setIsRemovingFollower(true);

        try {
            // Optimistic update
            setFollowers(prev => prev.filter(u => u._id !== userId));

            const res = await fetchWithSession(`/api/users/remove-follower/${userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Failed to remove follower');
            }

            // Fetch updated profile for counts
            const profileRes = await fetchWithSession(`/api/users/profile/${username}`);
            const profileData = await profileRes.json();
            if (profileRes.ok && onUserUpdate) {
                onUserUpdate(profileData);
            }

            showToast("Success", "Follower removed successfully", "success");
        } catch (error: any) {
            showToast("Error", error.message, "error");
            // Reload followers if failed
            const res = await fetchWithSession(`/api/users/followers/${username}`);
            const data = await res.json();
            if (res.ok) setFollowers(data);
        } finally {
            setProcessingIds(prev => ({ ...prev, [userId]: false }));
            setIsRemovingFollower(false);
        }
    };

    // Render followers list
    const renderFollowersList = () => {
        if (isLoading) {
            return (
                <Center py={8}>
                    <VStack>
                        <Spinner size="xl" color="blue.500" />
                        <Text mt={4}>Loading followers...</Text>
                    </VStack>
                </Center>
            );
        }

        if (!followers.length) {
            return (
                <Box className={styles.emptyState}>
                    <Text className={styles.emptyStateText}>No followers yet</Text>
                    <Text className={styles.emptyStateSubtext}>
                        When people follow you, they'll appear here.
                    </Text>
                </Box>
            );
        }

        return (
            <VStack align="stretch" spacing={4} pb={4}>
                {followers.map((user, index) => {
                    if (!user || !user.username) {
                        return null;
                    }
                    // Check if the current user is following this follower
                    const isFollowing = followingMap[user._id] || false;

                    return (
                        <div key={user._id || index}>
                            <div className={styles.userItem}>
                                <div className={styles.userInfo}>
                                    <Avatar
                                        size="md"
                                        name={user.username || 'User'}
                                        src={user.profilePic}
                                    />
                                    <div className={styles.userDetails}>
                                        <RouterLink
                                            to={`/${user.username}`}
                                            className={styles.username}
                                            onClick={onClose}
                                        >
                                            {user.username || 'Unknown User'}
                                        </RouterLink>
                                        {user.name && (
                                            <Text className={styles.name}>
                                                {user.name}
                                            </Text>
                                        )}
                                    </div>
                                </div>

                                {currentUser && currentUser._id !== user._id && (
                                    <HStack spacing={2}>
                                        {/* Show Remove button ONLY if viewing own profile */}
                                        {currentUser.username === username && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                borderColor="gray.600"
                                                _hover={{ bg: "whiteAlpha.100" }}
                                                borderRadius="md"
                                                onClick={() => handleRemoveFollower(user._id)}
                                                isLoading={processingIds[user._id]}
                                            >
                                                Remove
                                            </Button>
                                        )}
                                        
                                        <Button
                                            size="sm"
                                            bg={isFollowing ? "transparent" : "rgba(0, 179, 116, 0.2)"}
                                            color="white"
                                            borderWidth="1px"
                                            borderColor={isFollowing ? "gray.600" : "rgba(0, 179, 116, 0.5)"}
                                            _hover={{
                                                bg: isFollowing ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 179, 116, 0.3)",
                                                transform: "translateY(-2px)",
                                                borderColor: isFollowing ? "gray.400" : "rgba(0, 179, 116, 0.7)"
                                            }}
                                            transition="all 0.2s"
                                            borderRadius="md"
                                            fontWeight="medium"
                                            onClick={() => handleFollowToggle(user._id)}
                                            isLoading={processingIds[user._id]}
                                            px={4}
                                        >
                                            {isFollowing ? "Following" : "Follow"}
                                        </Button>
                                    </HStack>
                                )}
                            </div>
                            {index < followers.length - 1 && <Box h="12px" />}
                        </div>
                    );
                })}
            </VStack>
        );
    };

    // Render following list
    const renderFollowingList = () => {
        if (isLoading) {
            return (
                <Center py={8}>
                    <VStack>
                        <Spinner size="xl" color="blue.500" />
                        <Text mt={4}>Loading following...</Text>
                    </VStack>
                </Center>
            );
        }

        if (!following.length) {
            return (
                <Box className={styles.emptyState}>
                    <Text className={styles.emptyStateText}>Not following anyone</Text>
                    <Text className={styles.emptyStateSubtext}>
                        When you follow someone, they'll appear here.
                    </Text>
                </Box>
            );
        }

        return (
            <VStack align="stretch" spacing={4} pb={4}>
                {following.map((user, index) => {
                    if (!user || !user.username) {
                        return null;
                    }
                    return (
                        <div key={user._id || index}>
                            <div className={styles.userItem}>
                                <div className={styles.userInfo}>
                                    <Avatar
                                        size="md"
                                        name={user.username || 'User'}
                                        src={user.profilePic}
                                    />
                                    <div className={styles.userDetails}>
                                        <RouterLink
                                            to={`/${user.username}`}
                                            className={styles.username}
                                            onClick={onClose}
                                        >
                                            {user.username || 'Unknown User'}
                                        </RouterLink>
                                        {user.name && (
                                            <Text className={styles.name}>
                                                {user.name}
                                            </Text>
                                        )}
                                    </div>
                                </div>

                                {currentUser && currentUser._id !== user._id && (
                                    <Button
                                        size="sm"
                                        bg="transparent"
                                        color="white"
                                        borderWidth="1px"
                                        borderColor="gray.600"
                                        _hover={{
                                            bg: "rgba(255, 255, 255, 0.1)",
                                            transform: "translateY(-2px)",
                                            borderColor: "gray.400"
                                        }}
                                        transition="all 0.2s"
                                        borderRadius="md" // Changed from "full" to "md" for rounded rectangle
                                        fontWeight="medium"
                                        onClick={() => handleUnfollow(user._id)}
                                        isLoading={processingIds[user._id]}
                                        boxShadow="0 2px 6px rgba(0, 0, 0, 0.1)"
                                        px={4}
                                        py={3}
                                        _active={{
                                            transform: "scale(0.98)",
                                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                                        }}
                                    >
                                        Unfollow
                                    </Button>
                                )}
                            </div>
                            {index < following.length - 1 && <Box h="12px" />}
                        </div>
                    );
                })}
            </VStack>
        );
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
            <ModalOverlay />
            <ModalContent
                bg="#111111"
                color="white"
                border="none"
                boxShadow="0 10px 30px rgba(0,0,0,0.5)"
                borderRadius="32px"
            >
                <ModalHeader className={styles.modalHeader}>
                    <div className={styles.tabList}>
                        <div
                            className={`${styles.tab} ${activeTab === 0 ? styles.tabSelected : ''}`}
                            onClick={() => setActiveTab(0)}
                        >
                            Followers
                        </div>
                        <div
                            className={`${styles.tab} ${activeTab === 1 ? styles.tabSelected : ''}`}
                            onClick={() => setActiveTab(1)}
                        >
                            Following
                        </div>
                    </div>
                </ModalHeader>
                <ModalCloseButton
                    top={3}
                    color="gray.400"
                    _hover={{
                        bg: "rgba(0, 179, 116, 0.1)",
                        color: "white"
                    }}
                    borderRadius="full"
                />
                <ModalBody p={4}>
                    {activeTab === 0 ? renderFollowersList() : renderFollowingList()}
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};

export default FollowModal;
