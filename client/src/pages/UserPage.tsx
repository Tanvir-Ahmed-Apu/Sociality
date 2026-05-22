import { useEffect, useState } from "react";
import { UserHeader } from "../features/profile/components/UserHeader";
import ContentCard from "../components/ui/ContentCard";
import { useParams } from "react-router-dom";
import useShowToast from "../hooks/useShowToast";
import { apiFetch } from "../utils/apiBase";
import { Flex, Spinner, useColorModeValue, Text, Box } from "@chakra-ui/react";
import Post from "../features/post/components/Post";
import useGetUserProfile from "../hooks/useGetUserProfile";
import { postsAtom, userAtom } from "../atoms";
import CreatePost from "../features/post/components/CreatePost";
import useUserEvents from "../hooks/useUserEvents";
import { useRecoilValue, useRecoilState } from "recoil";

import { Post as PostType, User } from "../utils/api";

const UserPage = () => {
    const { user: initialUser, loading, refreshUser } = useGetUserProfile();
    const [user, setUser] = useState<User | null>(null);
    const { username } = useParams();
    const showToast = useShowToast();
    const [posts, setPosts] = useRecoilState(postsAtom);
    const currentUser = useRecoilValue(userAtom);
    const [fetchingPosts, setFetchingPosts] = useState(posts.length === 0);
    const [filterType, setFilterType] = useState("posts"); // State for selected tab

    // Theme-aware colors
    const textColor = useColorModeValue("gray.800", "white");
    const spinnerColor = useColorModeValue("gray.600", "whiteAlpha.700");

    // User events for global state synchronization
    const { subscribeToUserUpdates } = useUserEvents();

    // Subscribe to global user update events
    useEffect(() => {
        const unsubscribe = subscribeToUserUpdates((updatedUser) => {
            if (updatedUser && user && updatedUser._id === user._id) {
                console.log('UserPage received global user update:', {
                    followers: updatedUser.followers?.length || 0,
                    following: updatedUser.following?.length || 0
                });
                setUser(updatedUser);
            }
        });

        return unsubscribe;
    }, [subscribeToUserUpdates, user]);

    // Update local user state when initialUser changes
    useEffect(() => {
        if (initialUser) {
            console.log('User profile data loaded:', initialUser);
            console.log('Followers:', initialUser.followers);
            console.log('Following:', initialUser.following);
            setUser(initialUser);
        }
    }, [initialUser]);

    useEffect(() => {
        const getFilteredContent = async () => { // Renamed function
            if (!user) return;
            if (posts.length === 0) setFetchingPosts(true);
            let apiUrl = `/api/posts/user/${username}`; // Default to posts
            if (filterType === "replies") {
                apiUrl = `/api/posts/user/${username}/replies`; // Assuming this endpoint
            } else if (filterType === "reposts") {
                apiUrl = `/api/posts/user/${username}/reposts`; // Assuming this endpoint
            }

            try {
                const res = await apiFetch(apiUrl);

                if (res.ok) {
                    const data = await res.json(); // Only parse JSON if response is OK
                    setPosts(data);
                } else {
                    // Handle non-OK responses (like 404)
                    const errorMessage = await res.text(); // Try to get error text from body
                    console.error("Fetch error:", res.status, errorMessage); // Log for debugging
                    showToast("Error", `Failed to fetch ${filterType}. Endpoint might not exist (Status: ${res.status}): ${errorMessage}`, "error");
                    setPosts([]);
                }
            } catch (error: any) { // Catch network errors or other unexpected issues
                showToast("Error", error.message, "error");
                setPosts([]);
            } finally {
                setFetchingPosts(false);
            }
        };

        getFilteredContent(); // Call the renamed function
    }, [username, showToast, setPosts, user, filterType]); // Added filterType dependency

    const handlePostCreated = (newPost: PostType) => {
        setPosts((prevPosts: PostType[]) => [newPost, ...prevPosts]); // Add the new post to the top of the feed
    };

    // Handler for user profile updates
    const handleUserUpdate = (updatedUser: User) => {
        if (updatedUser) {
            console.log('UserPage received updated user data:', {
                followers: updatedUser.followers?.length || 0,
                following: updatedUser.following?.length || 0
            });

            // Update the user state with the new data
            setUser(updatedUser);

            // Also refresh the user profile data to ensure consistency
            if (refreshUser) {
                refreshUser();
            }
        }
    };

    if ((!user && !initialUser) && loading) {
        return (
            <Flex justifyContent={"center"}>
                <Spinner size={"xl"} />
            </Flex>
        );
    }

    if ((!user && !initialUser) && !loading) return <Text fontSize="xl" color={textColor} textAlign="center">User not found</Text>;

    // Don't render until we have user data
    if (!user) return null;

    return (
        <ContentCard p={0} mb={10} withBorder={true}>
            {/* Pass tab state and handler to UserHeader */}
            <UserHeader
                user={user}
                selectedTab={filterType}
                onTabChange={setFilterType}
                onUserUpdate={handleUserUpdate}
            />
            {/* Inline Create Post (Threads Style) */}
            {currentUser?._id === user._id && <CreatePost inline onPostCreated={handlePostCreated} />}

            {/* Posts Section */}
            {fetchingPosts && (
                <Flex justifyContent={"center"} my={12}>
                    <Spinner size={"xl"} color={spinnerColor} />
                </Flex>
            )}

            {/* Updated empty state message */}
            {!fetchingPosts && posts.length === 0 && (
                <Box p={8}>
                    <Text fontSize="xl" color={textColor} textAlign="center">No {filterType} found.</Text>
                </Box>
            )}

            <Box w="full">
                {posts.map((post) => (
                    <Post post={post} key={post._id} isPostPage={false}/>
                ))}
            </Box>
        </ContentCard>
    );
};

export default UserPage;
