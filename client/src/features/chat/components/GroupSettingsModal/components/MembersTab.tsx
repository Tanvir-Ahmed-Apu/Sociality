import React from 'react';
import {
  Box, Flex, Text, Avatar, Spinner, SimpleGrid, Icon, Badge, VStack, useColorModeValue
} from '@chakra-ui/react';

interface MembersTabProps {
  states: any;
  data: any;
  colors: any;
  PLATFORMS: any;
}

export const MembersTab = ({ states, data, colors, PLATFORMS }: MembersTabProps) => {
  const avatarBgSociality = useColorModeValue("brand.primary.50", "rgba(0, 179, 116, 0.1)");
  const avatarBgOther = useColorModeValue("gray.100", "whiteAlpha.100");
  
  if (states.loadingParticipants) {
    return (
      <Flex justify="center" py={8}>
        <Spinner size="lg" color="green.500" />
      </Flex>
    );
  }

  return (
    <VStack spacing={4} align="stretch">
      {data.summary && (
        <Box bg={colors.section} p={4} borderRadius="lg">
          <Text fontSize="sm" fontWeight="medium" mb={3} color={colors.muted}>PLATFORMS</Text>
          <SimpleGrid columns={2} spacing={3}>
            {['sociality', 'telegram', 'discord'].map(p => (
              <Flex key={p} align="center" gap={2}>
                <Icon as={PLATFORMS[p].icon} color={PLATFORMS[p].color} />
                <Text fontSize="sm">{PLATFORMS[p].label}: {data.summary[p]}</Text>
              </Flex>
            ))}
          </SimpleGrid>
        </Box>
      )}

      <Box bg={colors.section} p={4} borderRadius="lg">
        <Text fontSize="sm" fontWeight="medium" mb={3} color={colors.muted}>
          MEMBERS ({data.participants.length})
        </Text>
        <VStack spacing={3} align="stretch" maxH="300px" overflowY="auto">
          {data.participants.map((p: any) => {
            const plat = PLATFORMS[p.platform] || PLATFORMS.default;
            return (
              <Flex key={`${p.platform}-${p.id}`} align="center" gap={3}>
                <Avatar 
                  src={p.profilePic} 
                  name={p.name || p.username} 
                  size="sm" 
                  bg={p.platform === 'sociality' ? avatarBgSociality : avatarBgOther} 
                  color={p.platform === 'sociality' ? "brand.primary.500" : "gray.500"} 
                />
                <Box flex="1">
                  <Flex align="center" gap={2}>
                    <Text fontSize="sm" fontWeight="medium">{p.name || p.username}</Text>
                    <Icon as={plat.icon} color={plat.color} size="12px" />
                    {p.role === 'admin' && <Badge size="xs" colorScheme="green">Admin</Badge>}
                  </Flex>
                  <Text fontSize="xs" color={colors.muted}>
                    {p.platform === 'sociality' ? `@${p.username}` : `${p.messageCount || 0} messages`}
                  </Text>
                </Box>
              </Flex>
            );
          })}
        </VStack>
      </Box>
    </VStack>
  );
};
