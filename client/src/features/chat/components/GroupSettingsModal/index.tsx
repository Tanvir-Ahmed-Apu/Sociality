import React, { useRef, useMemo } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Button,
  VStack, Text, useColorModeValue, AlertDialog, AlertDialogBody, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, Box, Flex, Badge, Tabs, 
  TabList, TabPanels, Tab, TabPanel
} from '@chakra-ui/react';
import { FaShare, FaTrash, FaEdit, FaCamera, FaCopy, FaGlobe, FaTelegram, FaDiscord, FaUsers } from 'react-icons/fa';
import { useGroupSettings } from './hooks/useGroupSettings';
import { SettingsTab } from './components/SettingsTab';
import { MembersTab } from './components/MembersTab';
import { GroupSettingsModalProps } from './types';

const PLATFORMS: any = {
  sociality: { icon: FaGlobe, color: "#00B374", label: "Sociality" },
  telegram: { icon: FaTelegram, color: "#0088cc", label: "Telegram" },
  discord: { icon: FaDiscord, color: "#5865F2", label: "Discord" },
  default: { icon: FaUsers, color: "gray.500", label: "Other" }
};

export const GroupSettingsModal = ({
  isOpen,
  onClose,
  selectedConversation,
  onUpdateGroup,
  onDeleteGroup
}: GroupSettingsModalProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  const colors = {
    bg: useColorModeValue("white", "#111111"),
    text: useColorModeValue("gray.800", "white"),
    border: useColorModeValue("gray.200", "gray.700"),
    section: useColorModeValue("gray.50", "#0a0a0a"),
    hover: useColorModeValue("gray.100", "#2d2d2d"),
    muted: useColorModeValue("gray.600", "gray.400")
  };

  const headerIconBg = useColorModeValue("brand.primary.50", "rgba(0, 179, 116, 0.1)");

  const {
    isEditing,
    setIsEditing,
    groupName,
    setGroupName,
    groupPhoto,
    states,
    updateState,
    data,
    handlePhoto,
    handleUpdateName,
    handleDelete,
    copyId,
    shareGroup
  } = useGroupSettings(selectedConversation, isOpen, onClose, onUpdateGroup, onDeleteGroup);

  if (!selectedConversation) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg={colors.bg} color={colors.text} border="none" borderRadius="24px" maxW="400px">
          <ModalHeader>
            <Flex align="center" gap={3}>
              <Box bg={headerIconBg} p={2} borderRadius="lg">
                <FaUsers size={16} color="brand.primary.500" />
              </Box>
              <Text>Group Settings</Text>
            </Flex>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Tabs variant="soft-rounded" colorScheme="green">
              <TabList mb={4}>
                <Tab>Settings</Tab>
                <Tab>
                  <Flex align="center" gap={2}>
                    <FaUsers size={14} />
                    <Text>Members</Text>
                    {data.summary && (
                      <Badge colorScheme="green" fontSize="xs">
                        {data.summary.total}
                      </Badge>
                    )}
                  </Flex>
                </Tab>
              </TabList>
              <TabPanels>
                <TabPanel p={0}>
                  <SettingsTab 
                    selectedConversation={selectedConversation}
                    groupName={groupName}
                    setGroupName={setGroupName}
                    groupPhoto={groupPhoto}
                    isEditing={isEditing}
                    setIsEditing={setIsEditing}
                    states={states}
                    updateState={updateState}
                    data={data}
                    colors={colors}
                    fileInputRef={fileInputRef}
                    handlePhoto={handlePhoto}
                    handleUpdateName={handleUpdateName}
                    copyId={copyId}
                    shareGroup={shareGroup}
                    PLATFORMS={PLATFORMS}
                  />
                </TabPanel>
                <TabPanel p={0}>
                  <MembersTab 
                    states={states}
                    data={data}
                    colors={colors}
                    PLATFORMS={PLATFORMS}
                  />
                </TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>

      <AlertDialog 
        isOpen={states.showAlert} 
        leastDestructiveRef={cancelRef} 
        onClose={() => updateState('showAlert', false)} 
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg={colors.bg} color={colors.text} borderRadius="24px">
            <AlertDialogHeader fontWeight="bold">Delete Group</AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete "{selectedConversation.name}"? This cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={() => updateState('showAlert', false)}>
                Cancel
              </Button>
              <Button 
                colorScheme="red" 
                onClick={handleDelete} 
                ml={3} 
                isLoading={states.deleting}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};

export default GroupSettingsModal;
