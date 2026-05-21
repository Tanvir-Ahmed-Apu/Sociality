import React from 'react';
import {
  Box, Flex, Text, Avatar, IconButton, Spinner, Input, HStack, Badge, Icon, Button, VStack, useColorModeValue
} from '@chakra-ui/react';
import { FaCamera, FaEdit, FaCopy, FaShare, FaTrash } from 'react-icons/fa';
import { BsCheck2All } from 'react-icons/bs';

interface SettingsTabProps {
  selectedConversation: any;
  groupName: string;
  setGroupName: (name: string) => void;
  groupPhoto: string;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  states: any;
  updateState: (k: string, v: any) => void;
  data: any;
  colors: any;
  fileInputRef: React.RefObject<HTMLInputElement>;
  handlePhoto: (file: File) => void;
  handleUpdateName: () => void;
  copyId: () => void;
  shareGroup: () => void;
  PLATFORMS: any;
}

export const SettingsTab = ({
  selectedConversation,
  groupName,
  setGroupName,
  groupPhoto,
  isEditing,
  setIsEditing,
  states,
  updateState,
  data,
  colors,
  fileInputRef,
  handlePhoto,
  handleUpdateName,
  copyId,
  shareGroup,
  PLATFORMS
}: SettingsTabProps) => {
  const avatarBg = useColorModeValue("brand.primary.50", "rgba(0, 179, 116, 0.1)");
  
  return (
    <VStack spacing={4} align="stretch">
      <Box bg={colors.section} p={4} borderRadius="lg">
        <Text fontSize="sm" fontWeight="medium" mb={3} color={colors.muted}>GROUP PHOTO</Text>
        <Flex align="center" gap={4}>
          <Box position="relative">
            <Avatar 
              src={groupPhoto || selectedConversation.groupPhoto} 
              size="lg" 
              name={selectedConversation.name} 
              bg={avatarBg} 
              color="brand.primary.500" 
            />
            <IconButton 
              icon={states.uploading ? <Spinner size="sm" /> : <FaCamera />} 
              size="sm" 
              borderRadius="full" 
              position="absolute" 
              bottom="-2px" 
              right="-2px" 
              bg="brand.primary.500" 
              color="white" 
              onClick={() => fileInputRef.current?.click()} 
              isDisabled={states.uploading} 
              aria-label="Photo" 
            />
          </Box>
          <Text fontSize="sm" color={colors.muted} flex="1">Click camera to change photo</Text>
        </Flex>
        <Input 
          type="file" 
          ref={fileInputRef} 
          onChange={e => handlePhoto(e.target.files?.[0]!)} 
          accept="image/*" 
          display="none" 
        />
      </Box>

      <Box bg={colors.section} p={4} borderRadius="lg">
        <Flex justify="space-between" align="center" mb={3}>
          <Text fontSize="sm" fontWeight="medium" color={colors.muted}>GROUP NAME</Text>
          {!isEditing && (
            <IconButton 
              icon={<FaEdit />} 
              size="xs" 
              variant="ghost" 
              onClick={() => setIsEditing(true)} 
              aria-label="Edit" 
            />
          )}
        </Flex>
        {isEditing ? (
          <HStack>
            <Input 
              value={groupName} 
              onChange={e => setGroupName(e.target.value)} 
              size="sm" 
              maxLength={50} 
            />
            <IconButton 
              icon={<BsCheck2All />} 
              size="sm" 
              colorScheme="green" 
              onClick={handleUpdateName} 
              aria-label="Save" 
            />
          </HStack>
        ) : (
          <Text fontSize="md" fontWeight="medium">
            {selectedConversation.name || 'Unnamed'}
          </Text>
        )}
      </Box>

      <Box bg={colors.section} p={4} borderRadius="lg">
        <Text fontSize="sm" fontWeight="medium" mb={3} color={colors.muted}>ROOM INFORMATION</Text>
        <VStack spacing={3} align="stretch">
          <Flex justify="space-between" align="center">
            <Text fontSize="sm">Room ID</Text>
            <HStack>
              <Text fontSize="xs" fontFamily="mono" color={colors.muted}>
                {selectedConversation._id?.slice(0, 8)}...
              </Text>
              <IconButton 
                icon={states.copied ? <BsCheck2All /> : <FaCopy />} 
                size="xs" 
                variant="ghost" 
                onClick={copyId} 
                color={states.copied ? "green.400" : colors.muted} 
                aria-label="Copy" 
              />
            </HStack>
          </Flex>

          <Flex justify="space-between" align="center">
            <Text fontSize="sm">Platforms</Text>
            <HStack spacing={1}>
              {['sociality', 'telegram', 'discord'].map(p => (
                <Badge key={p} colorScheme={p === 'sociality' ? 'green' : p === 'telegram' ? 'blue' : 'purple'} variant="subtle">
                  <Icon as={PLATFORMS[p].icon} size="10px" mr={1} />
                  {PLATFORMS[p].label}
                </Badge>
              ))}
            </HStack>
          </Flex>

          <Flex justify="space-between" align="center">
            <Text fontSize="sm">Members</Text>
            <HStack>
              <Icon as={PLATFORMS.default.icon} size="12px" color={colors.muted} />
              {states.loadingRoom ? (
                <Spinner size="xs" />
              ) : (
                <Text fontSize="sm" color={colors.muted}>
                  {data.roomDetails?.participantCount || selectedConversation?.participants?.length || 0}
                </Text>
              )}
            </HStack>
          </Flex>
        </VStack>
      </Box>

      <Box h="24px" />

      <VStack spacing={2} align="stretch">
        <Button 
          leftIcon={<FaShare />} 
          variant="ghost" 
          justifyContent="flex-start" 
          onClick={shareGroup} 
          _hover={{ bg: colors.hover }}
        >
          Share Room
        </Button>
        <Button 
          leftIcon={<FaTrash />} 
          variant="ghost" 
          justifyContent="flex-start" 
          color="red.400" 
          _hover={{ bg: "rgba(255, 0, 0, 0.1)" }} 
          onClick={() => updateState('showAlert', true)}
        >
          Delete Group
        </Button>
      </VStack>
    </VStack>
  );
};
