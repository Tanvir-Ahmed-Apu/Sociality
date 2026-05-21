import { VStack, Box, useColorModeValue } from "@chakra-ui/react";

export const WorkspaceRail = () => {
    const railBg = useColorModeValue('white', '#000000');
    const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');

    return (
        <VStack 
            w="2px" h="full" bg={railBg} py={1} spacing={2} align="center" 
            flexShrink={0}
            display={{ base: "none", md: "flex" }}
            borderRight="1px solid"
            borderColor={borderColor}
        >
            <Box flex={1} />
        </VStack>
    );
};

export const RightRail = () => {
    const railBg = useColorModeValue('white', '#000000');
    const borderColor = useColorModeValue('gray.100', 'whiteAlpha.100');

    return (
        <VStack 
            w="60px" h="full" bg={railBg} flexShrink={0}
            display={{ base: "none", md: "block" }}
            borderLeft="1px solid"
            borderColor={borderColor}
        />
    );
};
