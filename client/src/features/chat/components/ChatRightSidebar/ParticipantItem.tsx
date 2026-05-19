import React from 'react';
import { HStack, Avatar, VStack, Text, Icon, Badge, Menu, MenuButton, IconButton, MenuList, MenuItem, useColorModeValue } from '@chakra-ui/react';
import { FiMoreVertical } from 'react-icons/fi';
import { FaUserMinus } from 'react-icons/fa';
import { PLATFORMS } from './constants';

const ParticipantItem = ({ participant, isAdminView, currentUser, setRemovingParticipant }: { participant: any, isAdminView: boolean, currentUser: any, setRemovingParticipant?: (p: any) => void }) => {
  const plat = PLATFORMS[participant.platform] || PLATFORMS.default;
  const isSelf = currentUser?._id === participant.id && participant.platform === 'sociality';
  const canRemove = isAdminView && !isSelf && participant.role !== 'admin';
  const borderColor = useColorModeValue("gray.100", "whiteAlpha.50");
  const itemBg = useColorModeValue("gray.50", "black");

  return (
    <HStack spacing={3} p={3} borderRadius="20px" bg={itemBg} border="1px solid" borderColor={borderColor} position="relative" role="group">
      <Avatar src={participant.profilePic} name={participant.name || participant.username} size="sm" borderRadius="full" />
      <VStack align="start" spacing={0} flex={1}>
        <HStack spacing={1}>
          <Text fontSize="sm" fontWeight="700" color={useColorModeValue("black", "white")} noOfLines={1}>
            {participant.name || participant.username}
          </Text>
          <Icon as={plat.icon} color={plat.color} size={12} />
          {participant.role === 'admin' && <Badge colorScheme="green" fontSize="8px">ADMIN</Badge>}
          {isSelf && <Badge colorScheme="blue" fontSize="8px">YOU</Badge>}
        </HStack>
        <Text fontSize="xs" color="gray.500">
          {participant.platform === 'sociality' ? `@${participant.username}` : `${participant.messageCount || 0} messages`}
        </Text>
      </VStack>
      
      {canRemove && setRemovingParticipant && (
        <Menu placement="bottom-end" isLazy>
          <MenuButton
            as={IconButton}
            icon={<FiMoreVertical />}
            size="xs"
            variant="ghost"
            borderRadius="full"
            opacity={0}
            _groupHover={{ opacity: 1 }}
            aria-label="User options"
          />
          <MenuList bg={useColorModeValue("white", "#1A1A1A")} borderColor={useColorModeValue("gray.200", "whiteAlpha.200")} p={1} borderRadius="xl" boxShadow="xl">
            <MenuItem 
              icon={<FaUserMinus />} 
              color="red.400" 
              fontSize="sm" 
              fontWeight="600"
              borderRadius="lg"
              onClick={() => setRemovingParticipant(participant)}
              _hover={{ bg: useColorModeValue("red.50", "whiteAlpha.100") }}
            >
              Remove from group
            </MenuItem>
          </MenuList>
        </Menu>
      )}
    </HStack>
  );
};

export default ParticipantItem;
