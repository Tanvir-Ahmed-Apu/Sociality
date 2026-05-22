import { Avatar } from "@chakra-ui/avatar";
import { Box, Flex, Link, Text, VStack, HStack, Heading, useColorModeValue, Button, IconButton, useToast, Menu, MenuButton, MenuList, MenuItem, Portal } from "@chakra-ui/react";
import ContentCard from "../../../components/ui/ContentCard";
import { CgMoreO } from "react-icons/cg";
import { useRecoilValue } from "recoil";
import { ChatCircle, Copy, PencilSimple, Briefcase, MapPin, CalendarBlank, Link as LinkIcon } from "phosphor-react";
import { userAtom } from "../../../atoms";
import { Link as RouterLink } from "react-router-dom";
import FollowButton from "./FollowButton";
import FollowModal from "./FollowModal";
import { useState, useEffect, useMemo } from "react";
import { fetchWithSession } from "../../../utils/api";
import useUserEvents from "../../../hooks/useUserEvents";
import useShowToast from "../../../hooks/useShowToast";
import { User } from "../../../utils/api";

import { ProfilePicModal } from "./ProfilePicModal";
import { ProfileMessageModal } from "./ProfileMessageModal";
import { ProfileTabs } from "./ProfileTabs";
import { EditProfileModal } from "./EditProfileModal";

interface UserHeaderProps {
    user: User;
    selectedTab: string;
    onTabChange: (tab: string) => void;
    onUserUpdate?: (user: User) => void;
}

export const UserHeader = ({ user, selectedTab, onTabChange, onUserUpdate }: UserHeaderProps) => {
    const [isFollowOpen, setIsFollowOpen] = useState(false);
    const [isMessageOpen, setIsMessageOpen] = useState(false);
    const [isProfilePicModalOpen, setIsProfilePicModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [message, setMessage] = useState("");
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);
    const [activeFollowTab, setActiveFollowTab] = useState(0); // 0 for followers, 1 for following

    const { subscribeToUserUpdates, emitUserUpdate } = useUserEvents();
    const showToast = useShowToast();
    const currentUser = useRecoilValue(userAtom);
    
    const bgColor = useColorModeValue("white", "var(--chakra-colors-semantic-bg-secondary)");
    const borderColor = useColorModeValue("black", "white");
    const scrimColor = useColorModeValue("#ffffff", "#111111");
    const menuBorderColor = useColorModeValue("gray.100", "whiteAlpha.200");
    
    useEffect(() => {
        const handleBackButton = () => {
            if (isProfilePicModalOpen) setIsProfilePicModalOpen(false);
        };
        window.addEventListener('popstate', handleBackButton);
        return () => window.removeEventListener('popstate', handleBackButton);
    }, [isProfilePicModalOpen]);

    useEffect(() => {
        const unsubscribe = subscribeToUserUpdates((updatedUser) => {
            if (updatedUser && user && updatedUser._id === user._id) {
                setFollowersCount(updatedUser.followers?.length || 0);
                setFollowingCount(updatedUser.following?.length || 0);
                if (onUserUpdate) onUserUpdate(updatedUser);
            }
        });
        return unsubscribe;
    }, [subscribeToUserUpdates, user, onUserUpdate]);

    useEffect(() => {
        if (user) {
            setFollowersCount(user.followers?.length || 0);
            setFollowingCount(user.following?.length || 0);
        }
    }, [user]);

    const copyURL = () => {
        navigator.clipboard.writeText(window.location.href).then(() => {
            showToast("Success", "Profile link copied.", "success");
        });
    };

    const joinedDate = useMemo(() => {
        if (!user.createdAt) return "Joined recently";
        const date = new Date(user.createdAt);
        return `Joined ${date.toLocaleString('default', { month: 'long' })} ${date.getFullYear()}`;
    }, [user.createdAt]);

    const formattedWebsite = useMemo(() => {
        if (!user.website) return null;
        let url = user.website.trim();
        if (!url.startsWith('http')) {
            url = `https://${url}`;
        }
        return url;
    }, [user.website]);

    return (
        <VStack w="full" spacing={0} align="stretch">
            {/* Cover Image Section */}
            <Box 
                w="full" 
                h={{ base: "150px", md: "200px" }} 
                bg={user.coverPic ? `url(${user.coverPic})` : "brand.primary.500"}
                bgSize="cover"
                bgPosition="center"
                position="relative"
                overflow="hidden"
                backgroundColor={scrimColor}
            >
                {/* Left Scrim */}
                <Box 
                    position="absolute" 
                    top={0} 
                    left={0} 
                    w="25%"
                    bottom={0} 
                    bgGradient={`linear(to-r, ${scrimColor} 0%, ${scrimColor} 10%, transparent 100%)`}
                    zIndex={1}
                />
                {/* Right Scrim */}
                <Box 
                    position="absolute" 
                    top={0} 
                    right={0} 
                    w="25%"
                    bottom={0} 
                    bgGradient={`linear(to-l, ${scrimColor} 0%, ${scrimColor} 15%, transparent 100%)`}
                    zIndex={1}
                />
                {/* Bottom Scrim */}
                <Box 
                    position="absolute" 
                    top={0} 
                    left={0} 
                    right={0} 
                    bottom={0} 
                    bgGradient={`linear(to-t, ${scrimColor} 0%, ${scrimColor} 10%, transparent 40%)`}
                    zIndex={1}
                />
            </Box>

            {/* Profile Info Section */}
            <Box px={{ base: 4, md: 6 }} position="relative">
                {/* Avatar and Buttons Row */}
                <Flex justify="space-between" align="flex-end" mt="-45px">
                    <Avatar
                        name={user.name}
                        src={user.profilePic || 'https://bit.ly/broken-link'}
                        size="2xl"
                        border="none"
                        boxShadow="lg"
                        cursor="pointer"
                        onClick={() => {
                            window.history.pushState({ modal: 'profilePic' }, '');
                            setIsProfilePicModalOpen(true);
                        }}
                        zIndex={2}
                    />

                    <HStack spacing={2} pb={2}>
                        {currentUser?._id === user._id ? (
                            <Button
                                onClick={() => setIsEditModalOpen(true)}
                                size="sm"
                                borderRadius="full"
                                variant="outline"
                                fontWeight="bold"
                                px={4}
                                _hover={{ bg: "whiteAlpha.200" }}
                            >
                                Edit profile
                            </Button>
                        ) : (
                            <HStack spacing={2}>
                                <FollowButton
                                    userId={user._id!}
                                    targetUsername={user.username}
                                    targetName={user.name}
                                    size="sm"
                                    onProfileRefresh={onUserUpdate}
                                />
                                <Button
                                    onClick={() => setIsMessageOpen(true)}
                                    bg="brand.secondary.500"
                                    color="white"
                                    _hover={{ bg: "brand.secondary.600" }}
                                    size="sm"
                                    borderRadius="full"
                                    fontWeight="bold"
                                >
                                    Message
                                </Button>
                            </HStack>
                        )}
                        <Menu>
                            <MenuButton
                                as={IconButton}
                                icon={<CgMoreO size={20} />}
                                size="sm"
                                borderRadius="full"
                                variant="outline"
                                aria-label="More options"
                            />
                            <Portal>
                                <MenuList bg={useColorModeValue("white", "#1A1A1A")} borderColor={menuBorderColor} borderWidth="1px" boxShadow="xl" p={2} borderRadius="xl">
                                    <MenuItem 
                                        icon={<Copy size={18} />} 
                                        onClick={copyURL}
                                        borderRadius="lg"
                                        fontSize="sm"
                                        fontWeight="500"
                                        _hover={{ bg: useColorModeValue("gray.100", "whiteAlpha.100") }}
                                    >
                                        Copy Profile Link
                                    </MenuItem>
                                </MenuList>
                            </Portal>
                        </Menu>
                    </HStack>
                </Flex>

                {/* Name and Handle Block */}
                <VStack align="flex-start" spacing={0} mt={3}>
                    <Heading size="md" fontWeight="800">
                        {user.name}
                    </Heading>
                    <Text color="gray.500" fontSize="sm">@{user.username}</Text>
                </VStack>

                {/* Bio */}
                <Box mt={3}>
                    <Text fontSize="md" whiteSpace="pre-wrap">{user.bio || "No bio yet."}</Text>
                </Box>

                {/* Info Rows (Location, Website, Joined) */}
                <Flex mt={4} wrap="wrap" gap={4} color="gray.500" fontSize="sm">
                    {user.location && (
                        <HStack spacing={1}>
                            <MapPin size={18} />
                            <Text>{user.location}</Text>
                        </HStack>
                    )}
                    {user.website && (
                        <HStack spacing={1}>
                            <LinkIcon size={18} />
                            <Link 
                                href={formattedWebsite!} 
                                isExternal 
                                color="brand.primary.500" 
                                fontWeight="500"
                                _hover={{ textDecoration: "underline" }}
                            >
                                {user.website.replace(/^https?:\/\//, '')}
                            </Link>
                        </HStack>
                    )}
                    <HStack spacing={1}>
                        <CalendarBlank size={18} />
                        <Text>{joinedDate}</Text>
                    </HStack>
                </Flex>

                {/* Stats Row */}
                <HStack spacing={4} mt={4} pb={4}>
                    <Text cursor="pointer" onClick={() => {
                        setActiveFollowTab(1);
                        setIsFollowOpen(true);
                    }} fontWeight="bold" fontSize="sm">
                        {followingCount} <Text as="span" fontWeight="normal" color="gray.500">Following</Text>
                    </Text>
                    <Text cursor="pointer" onClick={() => {
                        setActiveFollowTab(0);
                        setIsFollowOpen(true);
                    }} fontWeight="bold" fontSize="sm">
                        {followersCount} <Text as="span" fontWeight="normal" color="gray.500">Followers</Text>
                    </Text>
                </HStack>

                {/* Tabs Section */}
                <Box mt={2}>
                    <ProfileTabs
                        selectedTab={selectedTab}
                        onTabChange={onTabChange}
                        isOwnProfile={currentUser?._id === user._id}
                    />
                </Box>
            </Box>

            {/* Modals */}
            <FollowModal isOpen={isFollowOpen} onClose={() => setIsFollowOpen(false)} username={user.username} onUserUpdate={onUserUpdate} initialTab={activeFollowTab} />
            <ProfilePicModal isOpen={isProfilePicModalOpen} onClose={() => setIsProfilePicModalOpen(false)} user={user} />
            <EditProfileModal isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)} />
            {currentUser?._id !== user._id && (
                <ProfileMessageModal isOpen={isMessageOpen} onClose={() => setIsMessageOpen(false)} user={user} message={message} setMessage={setMessage} />
            )}
        </VStack>
    );
};
