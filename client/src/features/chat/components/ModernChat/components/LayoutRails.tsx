import { VStack, Box } from "@chakra-ui/react";
import { useChatTheme } from '../../../hooks/useChatTheme';

export const WorkspaceRail = () => {
    const { bgColor, borderColor } = useChatTheme();

    return (
        <VStack 
            w="2px" h="full" bg={bgColor} py={1} spacing={2} align="center" 
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
    const { bgColor, borderColor } = useChatTheme();

    return (
        <VStack 
            w="60px" h="full" bg={bgColor} flexShrink={0}
            display={{ base: "none", md: "block" }}
            borderLeft="1px solid"
            borderColor={borderColor}
        />
    );
};
