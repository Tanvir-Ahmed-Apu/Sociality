import React from 'react';
import {
    Box,
    Flex,
    Spinner,
    useColorModeValue,
    Text,
    Tabs,
    TabList,
    Tab,
    useDisclosure,
} from "@chakra-ui/react";
import ContentCard from "../components/ui/ContentCard";
import { useEffect, useState } from "react";
import useShowToast from "../hooks/useShowToast";
import Post from "../features/post/components/Post";
import { useRecoilState, useRecoilValue } from "recoil";
import { postsAtom, userAtom } from "../atoms";
import CreatePost from "../features/post/components/CreatePost";
import { fetchWithSession, Post as PostType } from "../utils/api";
import FloatingPostButton from "../components/ui/FloatingPostButton";

const HomePage = () => {
    const [posts, setPosts] = useRecoilState(postsAtom);
    const [loading, setLoading] = useState(posts.length === 0);
    const [activeTab, setActiveTab] = useState(0); // 0 = For You, 1 = Following
    const showToast = useShowToast();
    const user = useRecoilValue(userAtom);
    const { isOpen, onOpen, onClose } = useDisclosure();

    // Theme-aware colors
    const textColor = useColorModeValue("gray.800", "white");
    const spinnerColor = useColorModeValue("gray.600", "whiteAlpha.700");

    useEffect(() => {
        const getFeedPosts = async () => {
            // Only show full-page loading spinner if we have no posts at all (first load)
            if (posts.length === 0) {
                setLoading(true);
            }
            
            try {
                let res;
                if (activeTab === 0) {
                    // For You feed
                    res = await fetchWithSession('/api/posts/for-you');
                } else {
                    // Following feed
                    res = await fetchWithSession('/api/posts/following');
                }

                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setPosts(data);
                    } else {
                        showToast("Error", "Invalid data format", "error");
                    }
                } else {
                    const errorData = await res.json().catch(() => ({ error: 'Failed to fetch posts' }));
                    showToast("Error", errorData.error || 'Failed to fetch posts', "error");
                }
            } catch (error: any) {
                console.error('Homepage posts fetch error:', error);

                // Handle different error types
                if (error.message.includes('401')) {
                    console.log('Authentication error on homepage, user might need to re-login');
                    showToast("Info", "Please refresh the page or log in again to see posts", "info");
                } else {
                    showToast("Error", error.message || 'Failed to fetch posts', "error");
                }
            } finally {
                setLoading(false);
            }
        };

        // Small delay for new users who just completed profile setup
        const delay = user && user.isProfileComplete ? 500 : 0;
        const timer = setTimeout(getFeedPosts, delay);
        
        return () => clearTimeout(timer);
    }, [showToast, setPosts, user, activeTab]); // Added activeTab to dependencies

    // Handle tab change
    const handleTabChange = (index: number) => {
        setActiveTab(index);
    };

    const handlePostCreated = (newPost: PostType) => {
        setPosts((prevPosts: PostType[]) => [newPost, ...prevPosts]); // Add the new post to the top of the feed
    };

    return (
        <Box w="full">
            {/* Responsive Container */}
            <Flex
                direction="column"
                align="center"
                w="full"
                px={{ base: 2, xs: 3, sm: 4, md: 6 }}
                gap={{ base: 4, sm: 5, md: 6 }}
            >
                {/* Main Content */}
                <Box
                    w="full"
                    maxW={{
                        base: "100%",
                        xs: "100%",
                        sm: "100%",
                        md: "100%",
                        lg: "550px",
                        xl: "600px",
                        "2xl": "650px"
                    }}
                    position="relative"
                    zIndex={1}
                >
                    {/* Global Feed Card */}
                    <ContentCard p={0} mb={6}>
                        {/* Inline Create Post (Threads Style) */}
                        <CreatePost inline onPostCreated={handlePostCreated} />

                        {/* Feed Tabs - Responsive */}
                        <Box p={4} borderBottom="1px solid" borderColor={useColorModeValue("gray.100", "whiteAlpha.100")}>
                            <Tabs
                                index={activeTab}
                                onChange={handleTabChange}
                                variant='unstyled'
                                w="full"
                                border="none"
                            >
                                <TabList
                                    bg={useColorModeValue("gray.100", "#1a1a1a")}
                                    borderRadius="full"
                                    p={1}
                                    display="inline-flex"
                                    gap={0}
                                >
                                    <Tab
                                        borderRadius="full"
                                        px={8}
                                        py={2}
                                        fontSize="sm"
                                        fontWeight="600"
                                        color="gray.500"
                                        _selected={{
                                            bg: useColorModeValue("white", "#222"),
                                            color: useColorModeValue("black", "white"),
                                            boxShadow: "sm"
                                        }}
                                        _focus={{ outline: "none", boxShadow: "none" }}
                                    >
                                        For you
                                    </Tab>
                                    <Tab
                                        borderRadius="full"
                                        px={8}
                                        py={2}
                                        fontSize="sm"
                                        fontWeight="600"
                                        color="gray.500"
                                        _selected={{
                                            bg: useColorModeValue("white", "#222"),
                                            color: useColorModeValue("black", "white"),
                                            boxShadow: "sm"
                                        }}
                                        _focus={{ outline: "none", boxShadow: "none" }}
                                    >
                                        Following
                                    </Tab>
                                </TabList>
                            </Tabs>
                        </Box>

                        {/* Posts Section - Responsive */}
                        {loading && (
                            <Flex justify="center" py={10}>
                                <Spinner size="xl" color={spinnerColor} />
                            </Flex>
                        )}

                        {!loading && posts.length === 0 && (
                            <Box p={8} textAlign="center">
                                <Text color="gray.500">
                                    {activeTab === 0
                                        ? "No posts to display. Try following some users or check back later!"
                                        : "No posts from people you follow. Try following some users to see their posts here!"}
                                </Text>
                            </Box>
                        )}

                        {/* Posts Feed - Responsive */}
                        <Box w="full">
                            {Array.isArray(posts) &&
                                posts.map((post: PostType) => (
                                    <Post post={post} key={post._id} isPostPage={false} />
                                ))}
                        </Box>
                    </ContentCard>

                    {!loading && !Array.isArray(posts) && (
                        <Box textAlign="center" my={{ base: 4, sm: 5, md: 6 }} px={{ base: 2, sm: 4 }}>
                            <Text fontSize={{ base: "md", sm: "lg" }} color={textColor}>
                                Error loading posts. Please try again later.
                            </Text>
                        </Box>
                    )}
                </Box>
            </Flex>

            {/* Floating Action Button for Creating Posts (Threads Style) */}
            {user && (
                <>
                    <FloatingPostButton onClick={onOpen} />
                    <CreatePost 
                        hideTrigger 
                        externalOpen={isOpen} 
                        externalClose={onClose} 
                        onPostCreated={handlePostCreated} 
                    />
                </>
            )}
        </Box>
    );
};

export default HomePage;
