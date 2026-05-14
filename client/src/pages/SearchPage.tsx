import { Box, Heading, Input, Flex, Spinner, Text, VStack, InputGroup, InputLeftElement, useColorModeValue } from "@chakra-ui/react";
import { useState, useEffect } from "react";
import SuggestedUserListItem from "../features/users/components/SuggestedUserListItem"; // Import the new list item component
import useShowToast from "../hooks/useShowToast";
import { MagnifyingGlass } from "phosphor-react";
import { fetchWithSession } from "../utils/api";
import ContentCard from "../components/ui/ContentCard";

// Custom scrollbar styling - will be made theme-aware in component
const getScrollbarStyles = (isDark: boolean) => ({
    "&::-webkit-scrollbar": {
        width: "6px",
    },
    "&::-webkit-scrollbar-track": {
        background: "transparent",
    },
    "&::-webkit-scrollbar-thumb": {
        background: isDark ? "rgba(255, 255, 255, 0.1)" : "rgba(0, 0, 0, 0.1)",
        borderRadius: "3px",
    },
    "&::-webkit-scrollbar-thumb:hover": {
        background: isDark ? "rgba(255, 255, 255, 0.2)" : "rgba(0, 0, 0, 0.2)",
    },
    scrollbarWidth: "thin",
    scrollbarColor: isDark ? "rgba(255, 255, 255, 0.1) transparent" : "rgba(0, 0, 0, 0.1) transparent"
});

const SearchPage = () => {
    const [suggestedUsers, setSuggestedUsers] = useState<any[]>([]);
    const [suggestedLoading, setSuggestedLoading] = useState(true);
    const showToast = useShowToast();
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);

    // Theme-aware colors - ALL hooks must be called at the top level
    const bgColor = useColorModeValue("#f7fafc", "#101010");
    const cardBgColor = useColorModeValue("white", "#151515");
    const borderColor = useColorModeValue("rgba(0, 0, 0, 0.08)", "rgba(255, 255, 255, 0.06)");
    const textColor = useColorModeValue("gray.800", "white");
    const placeholderColor = useColorModeValue("gray.500", "gray.500");
    const spinnerColor = useColorModeValue("gray.600", "whiteAlpha.700");

    // Additional theme-aware colors for scrollbar styling
    const scrollbarTrackColor = useColorModeValue('#f0f0f0', '#1a1a1a');
    const scrollbarThumbColor = useColorModeValue('rgba(0, 0, 0, 0.3)', 'rgba(255, 255, 255, 0.3)');
    const scrollbarThumbHoverColor = useColorModeValue('rgba(0, 0, 0, 0.5)', 'rgba(255, 255, 255, 0.5)');
    const scrollbarColor = useColorModeValue('rgba(0, 0, 0, 0.3) #f0f0f0', 'rgba(255, 255, 255, 0.3) #1a1a1a');

    // Fetch Suggested Users
    useEffect(() => {
        const getSuggestedUsers = async () => {
            setSuggestedLoading(true);
            try {
                const res = await fetchWithSession("/api/users/suggested");
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) {
                        setSuggestedUsers(data);
                    } else {
                        showToast("Error", "Received invalid data for suggested users", "error");
                        setSuggestedUsers([]);
                    }
                } else {
                    const errorData = await res.json().catch(() => ({ error: 'Failed to fetch suggested users' }));
                    showToast("Error", errorData.error || 'Failed to fetch suggested users', "error");
                    setSuggestedUsers([]);
                }
            } catch (error: any) {
                showToast("Error", error.message, "error");
                setSuggestedUsers([]);
            } finally {
                setSuggestedLoading(false);
            }
        };

        getSuggestedUsers();
    }, [showToast]);

    const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (!query) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const res = await fetchWithSession(`/api/users/search?query=${query}`);
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data);
            } else {
                const errorData = await res.json().catch(() => ({ error: 'Failed to search users' }));
                showToast("Error", errorData.error || 'Failed to search users', "error");
                setSearchResults([]);
            }
        } catch (error: any) {
            showToast("Error", error.message, "error");
            setSearchResults([]);
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <Box
            className="page-content-scroll"
            bg="transparent"
            pt={{ base: "60px", md: "20px" }} // Increased top padding on mobile for logo
        >
            <Heading as="h1" size="lg" mb={8} textAlign={"center"} color={textColor}>
                Search & Discover Users
            </Heading>

            <ContentCard
                w={["100%", "500px", "550px"]} // Increased width
                maxW="100%"
                mx="auto"
                p={0} // No padding for global card to handle internals
                mb={6}
                overflow="hidden"
            >
                {/* Search Input Section */}
                <Box p={5} borderBottom="1px solid" borderColor={borderColor}>
                    <InputGroup>
                        <InputLeftElement pointerEvents="none">
                            <MagnifyingGlass color={placeholderColor} />
                        </InputLeftElement>
                        <Input
                            placeholder="Search users by username or name..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                            bg="transparent"
                            border="none"
                            color={textColor}
                            _placeholder={{ color: placeholderColor }}
                            _focus={{ boxShadow: "none", border: "none" }}
                            _hover={{ border: "none" }}
                        />
                    </InputGroup>
                </Box>

                {/* Search Results / Suggested Section */}
                <Box minH={{ base: "300px", md: "400px" }} h={{ base: "calc(100vh - 300px)", md: "550px" }} display="flex" flexDirection="column">
                    {searchQuery ? (
                        <>
                            <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
                                <Heading as="h2" size="sm" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                                    {isSearching ? "Searching..." : "Search Results"}
                                </Heading>
                            </Box>
                            {isSearching ? (
                                <Flex justify="center" align="center" flexGrow={1}>
                                    <Spinner size="lg" color={spinnerColor} />
                                </Flex>
                            ) : searchResults.length > 0 ? (
                                <Box
                                    overflowY="scroll"
                                    flexGrow={1}
                                    h="calc(100% - 60px)"
                                    px={4}
                                    className="always-show-scrollbar"
                                    css={{
                                        '&::-webkit-scrollbar': { width: '8px', display: 'block' },
                                        '&::-webkit-scrollbar-track': { background: scrollbarTrackColor, display: 'block' },
                                        '&::-webkit-scrollbar-thumb': { background: scrollbarThumbColor, borderRadius: '4px', minHeight: '30px' },
                                        '&::-webkit-scrollbar-thumb:hover': { background: scrollbarThumbHoverColor },
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: scrollbarColor,
                                        scrollbarGutter: 'stable',
                                    }}
                                >
                                    <VStack spacing={0} align="stretch" pb={6}>
                                        {searchResults.map((user) => (
                                            <SuggestedUserListItem key={user._id} user={user} />
                                        ))}
                                        <Box h="20px"></Box>
                                    </VStack>
                                </Box>
                            ) : (
                                <Flex align="center" justify="center" flexGrow={1}>
                                    <Text textAlign={"center"} color={textColor}>No users found matching "{searchQuery}"</Text>
                                </Flex>
                            )}
                        </>
                    ) : (
                        <>
                            <Box p={4} borderBottom="1px solid" borderColor={borderColor}>
                                <Heading as="h2" size="sm" color="gray.500" textTransform="uppercase" letterSpacing="wider">
                                    Suggested Users
                                </Heading>
                            </Box>
                            {suggestedLoading ? (
                                <Flex justify="center" p={4} flexGrow={1}>
                                    <Spinner size="lg" color={spinnerColor} />
                                </Flex>
                            ) : suggestedUsers.length === 0 ? (
                                <Text textAlign={"center"} p={4} flexGrow={1} color={textColor}>No suggested users available.</Text>
                            ) : (
                                <Box
                                    overflowY="scroll"
                                    flexGrow={1}
                                    h="calc(100% - 60px)"
                                    px={4}
                                    className="always-show-scrollbar"
                                    css={{
                                        '&::-webkit-scrollbar': { width: '8px', display: 'block' },
                                        '&::-webkit-scrollbar-track': { background: scrollbarTrackColor, display: 'block' },
                                        '&::-webkit-scrollbar-thumb': { background: scrollbarThumbColor, borderRadius: '4px', minHeight: '30px' },
                                        '&::-webkit-scrollbar-thumb:hover': { background: scrollbarThumbHoverColor },
                                        scrollbarWidth: 'thin',
                                        scrollbarColor: scrollbarColor,
                                        scrollbarGutter: 'stable',
                                    }}
                                >
                                    <VStack spacing={0} align="stretch" pb={6}>
                                        {suggestedUsers.map((user) => (
                                            <SuggestedUserListItem key={user._id} user={user} />
                                        ))}
                                        <Box h="20px"></Box>
                                    </VStack>
                                </Box>
                            )}
                        </>
                    )}
                </Box>
            </ContentCard>
        </Box>
    );
};

export default SearchPage;
