import React, { useRef } from 'react';
import { Box, VStack, Avatar, IconButton, Input, HStack, Heading, Text, Spinner, Icon, useColorModeValue } from '@chakra-ui/react';
import { FiCamera, FiEdit } from 'react-icons/fi';
import { BsCheck2All } from 'react-icons/bs';

const SidebarHeader = ({
  user, details, displayAvatar, displayName, isFederated, isAdmin,
  uploading, isEditing, groupName, participants,
  setIsEditing, setGroupName, handlePhotoUpload, handleUpdateName
}: any) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <Box bg={useColorModeValue("gray.50", "black")} p={5} borderRadius="24px" border="1px solid" borderColor={useColorModeValue("gray.200", "whiteAlpha.100")}>
      <VStack spacing={4}>
        <Box position="relative">
          <Avatar size="xl" src={displayAvatar} name={displayName} bg={useColorModeValue("brand.primary.50", "rgba(0, 179, 116, 0.1)")} color="brand.primary.500" borderRadius="full" boxShadow={useColorModeValue("0 4px 12px rgba(0, 0, 0, 0.05)", "0 0 30px rgba(0, 179, 116, 0.15)")} />
          {isFederated && (
            <IconButton
              icon={uploading ? <Spinner size="xs" /> : <FiCamera size={14} />}
              size="sm" borderRadius="full" position="absolute" bottom="2px" right="2px" bg="brand.primary.500" color={useColorModeValue("white", "black")} _hover={{ bg: "brand.primary.600" }}
              onClick={() => fileInputRef.current?.click()} isDisabled={uploading} aria-label="Change Photo"
            />
          )}
          <Input type="file" ref={fileInputRef} display="none" accept="image/*" onChange={(e) => handlePhotoUpload(e.target.files?.[0]!)} />
        </Box>
        <VStack spacing={1} w="full">
          {isEditing ? (
            <HStack w="full">
              <Input value={groupName} onChange={(e) => setGroupName(e.target.value)} size="sm" bg="whiteAlpha.50" autoFocus />
              <IconButton icon={<BsCheck2All />} size="sm" colorScheme="green" onClick={handleUpdateName} aria-label="Save" />
            </HStack>
          ) : (
            <HStack justify="center" w="full">
              <Heading size="md" color={useColorModeValue("black", "white")} textAlign="center" noOfLines={1}>{displayName}</Heading>
              {isFederated && isAdmin && <Icon as={FiEdit} size={14} color="gray.500" cursor="pointer" _hover={{ color: "white" }} onClick={() => setIsEditing(true)} />}
            </HStack>
          )}
          <Text fontSize="xs" color="gray.500">
            {isFederated ? `${participants.length} members across platforms` : (details?.username ? `@${details.username}` : "Direct Message")}
          </Text>
        </VStack>
      </VStack>
    </Box>
  );
};

export default SidebarHeader;
