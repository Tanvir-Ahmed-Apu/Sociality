import { Flex, Box, VStack, Heading, Text, Badge, Icon, useColorModeValue } from "@chakra-ui/react";
import { FiMessageSquare } from "react-icons/fi";
import { useChatTheme } from '../../../hooks/useChatTheme';

export const EmptyChatState = () => {
    const { cardBorder, shadowColor, textColor, glassBg, badgeBg } = useChatTheme();

    return (
        <Flex 
            direction="column" align="center" justify="center" h="full"
            bgGradient={useColorModeValue(
                "radial(circle at 50% 50%, rgba(0, 179, 116, 0.03) 0%, transparent 100%)",
                "radial(circle at 50% 50%, rgba(255, 255, 255, 0.03) 0%, transparent 100%)"
            )}
            position="relative"
            overflow="hidden"
        >
            <Box position="absolute" top="-10%" left="-10%" w="40%" h="40%" bg="brand.primary.500" filter="blur(150px)" opacity="0.05" borderRadius="full" />
            <Box position="absolute" bottom="-10%" right="-10%" w="40%" h="40%" bg="blue.500" filter="blur(150px)" opacity="0.05" borderRadius="full" />
            
            <VStack spacing={8} zIndex={1}>
                <Box 
                    p={12} 
                    borderRadius="50px" 
                    bg={glassBg} 
                    border="1px solid" 
                    borderColor={cardBorder}
                    backdropFilter="blur(30px)"
                    boxShadow={`0 30px 60px ${shadowColor}`}
                    position="relative"
                >
                    <Icon as={FiMessageSquare} boxSize={20} color="brand.primary.500" filter="drop-shadow(0 0 20px rgba(0, 179, 116, 0.3))" />
                    <Box position="absolute" top="-5px" right="-5px" w="15px" h="15px" bg="brand.primary.500" borderRadius="full" boxShadow="0 0 10px #00B374" />
                </Box>
                <VStack spacing={4}>
                    <Heading size="xl" color={textColor} fontWeight="900" letterSpacing="-1px">Sociality Messaging</Heading>
                    <Text color="gray.500" fontWeight="500" fontSize="lg" textAlign="center" maxW="400px" lineHeight="tall">
                        Your hub for direct and cross-platform conversations. Select a contact to begin.
                    </Text>
                </VStack>
                <Box pt={4}>
                    <Badge variant="subtle" colorScheme="brand" px={4} py={1} borderRadius="full" textTransform="none" fontSize="xs" bg={badgeBg} color="brand.primary.500" border="1px solid" borderColor="brand.primary.500">
                        Ready to connect
                    </Badge>
                </Box>
            </VStack>
        </Flex>
    );
};
