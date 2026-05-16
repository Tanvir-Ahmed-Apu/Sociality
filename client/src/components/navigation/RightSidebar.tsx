import { Box, VStack, Text, useColorModeValue, Heading } from "@chakra-ui/react";
import SuggestedUsers from "../../features/users/components/SuggestedUsers";

const RightSidebar = () => {
  const bgColor = useColorModeValue("white", "var(--chakra-colors-semantic-bg-secondary)");
  const borderColor = useColorModeValue("black", "white");

  return (
    <Box
      w="full"
      h="100vh"
      position="sticky"
      top="0"
      py={6}
      px={4}
      overflowY="auto"
    >
      <VStack align="flex-start" spacing={8}>
        {/* Suggested Users Section */}
        <Box w="full">
            <SuggestedUsers />
        </Box>

        {/* Trending / Comic Trends Section */}
        <Box 
            w="full" 
            p={5} 
            bg={useColorModeValue("white", "#111111")} 
            borderRadius="24px" 
            border="none"
            boxShadow={useColorModeValue("0 2px 10px rgba(0,0,0,0.02)", "0 2px 10px rgba(0,0,0,0.1)")}
        >
          <Heading size="md" mb={4} fontFamily="'Bangers', cursive">COMIC TRENDS</Heading>
          <VStack align="flex-start" spacing={3}>
            <Box>
                <Text fontWeight="bold" fontSize="sm" color="brand.primary.500">#SocialityLaunch</Text>
                <Text fontSize="xs" color="gray.500">1.2k posts</Text>
            </Box>
            <Box>
                <Text fontWeight="bold" fontSize="sm" color="brand.primary.500">#ComicVibes</Text>
                <Text fontSize="xs" color="gray.500">856 posts</Text>
            </Box>
            <Box>
                <Text fontWeight="bold" fontSize="sm" color="brand.primary.500">#WebtoonEra</Text>
                <Text fontSize="xs" color="gray.500">543 posts</Text>
            </Box>
          </VStack>
        </Box>

        {/* Mini Footer */}
        <Box px={2}>
            <Text fontSize="xs" color="gray.500">
                Privacy · Terms · Advertising · Ad Choices · Cookies · Sociality © 2024
            </Text>
        </Box>
      </VStack>
    </Box>
  );
};

export default RightSidebar;
