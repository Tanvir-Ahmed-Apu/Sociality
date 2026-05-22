import React, { useMemo, useRef } from 'react';
import { VStack, HStack, Button, useColorModeValue } from '@chakra-ui/react';
import { FiSettings, FiUsers as FiUsersIcon } from 'react-icons/fi';
import { useChatRightSidebar } from '../../hooks/useChatRightSidebar';

import SidebarHeader from './SidebarHeader';
import InfoSettingsTab from './InfoSettingsTab';
import MembersTab from './MembersTab';
import { AllMembersModal, DeleteGroupAlert, RemoveParticipantAlert } from './Modals';

interface ChatRightSidebarProps {
  user: any;
  messages?: any[];
  onDeleteGroup?: (group: any) => void;
  onUpdateGroup?: (group: any) => void;
}

const ChatRightSidebar = ({
  user,
  messages = [],
  onDeleteGroup,
  onUpdateGroup,
}: ChatRightSidebarProps) => {
  const cancelRef = useRef<HTMLButtonElement>(null);
  const removeCancelRef = useRef<HTMLButtonElement>(null);

  const sidebar = useChatRightSidebar({ user, onUpdateGroup, onDeleteGroup });

  const media = useMemo(() => messages.filter((m: any) => m.img).reverse(), [messages]);
  const files = useMemo(() => messages.filter((m: any) => m.file).reverse(), [messages]);
  const starredMessages = useMemo(() => messages.filter((m: any) => m.isStarred).reverse(), [messages]);

  const tabBg = useColorModeValue("gray.50", "black");
  const tabBorder = useColorModeValue("gray.200", "whiteAlpha.100");
  const tabActiveBg = useColorModeValue("white", "whiteAlpha.100");
  const tabActiveColor = useColorModeValue("black", "white");

  return (
    <VStack
      w="full" h="full" bg={useColorModeValue("white", "#0A0A0A")} p={6} align="stretch" spacing={6}
      overflowY="auto"
      flexShrink={0}
      className="custom-scrollbar"
    >
      <SidebarHeader
        user={user}
        details={sidebar.details}
        displayAvatar={sidebar.displayAvatar}
        displayName={sidebar.displayName}
        isFederated={sidebar.isFederated}
        isAdmin={sidebar.isAdmin}
        uploading={sidebar.uploading}
        isEditing={sidebar.isEditing}
        groupName={sidebar.groupName}
        participants={sidebar.participants}
        setIsEditing={sidebar.setIsEditing}
        setGroupName={sidebar.setGroupName}
        handlePhotoUpload={sidebar.handlePhotoUpload}
        handleUpdateName={sidebar.handleUpdateName}
      />

      {sidebar.isFederated && (
        <HStack bg={tabBg} p={1.5} borderRadius="18px" spacing={1} border="1px solid" borderColor={tabBorder}>
          <Button flex={1} size="sm" variant="ghost" leftIcon={<FiSettings size={14} />} borderRadius="14px" bg={sidebar.activeTab === 0 ? tabActiveBg : "transparent"} color={sidebar.activeTab === 0 ? tabActiveColor : "gray.500"} _hover={{ bg: tabActiveBg, color: tabActiveColor }} onClick={() => sidebar.setActiveTab(0)}>
            Settings
          </Button>
          <Button flex={1} size="sm" variant="ghost" leftIcon={<FiUsersIcon size={14} />} borderRadius="14px" bg={sidebar.activeTab === 1 ? tabActiveBg : "transparent"} color={sidebar.activeTab === 1 ? tabActiveColor : "gray.500"} _hover={{ bg: tabActiveBg, color: tabActiveColor }} onClick={() => sidebar.setActiveTab(1)}>
            Members
          </Button>
        </HStack>
      )}

      <VStack align="stretch" spacing={6}>
        {sidebar.activeTab === 0 ? (
          <InfoSettingsTab
            user={user}
            details={sidebar.details}
            isFederated={sidebar.isFederated}
            isAdmin={sidebar.isAdmin}
            summary={sidebar.summary}
            media={media}
            files={files}
            starredMessages={starredMessages}
            copyToClipboard={sidebar.copyToClipboard}
            setShowDeleteAlert={sidebar.setShowDeleteAlert}
          />
        ) : (
          <MembersTab
            participants={sidebar.participants}
            setShowAllMembers={sidebar.setShowAllMembers}
            isAdmin={sidebar.isAdmin}
            currentUser={sidebar.currentUser}
            setRemovingParticipant={sidebar.setRemovingParticipant}
          />
        )}
      </VStack>

      <AllMembersModal
        showAllMembers={sidebar.showAllMembers}
        setShowAllMembers={sidebar.setShowAllMembers}
        participants={sidebar.participants}
        isAdmin={sidebar.isAdmin}
        currentUser={sidebar.currentUser}
        setRemovingParticipant={sidebar.setRemovingParticipant}
      />

      <DeleteGroupAlert
        showDeleteAlert={sidebar.showDeleteAlert}
        setShowDeleteAlert={sidebar.setShowDeleteAlert}
        cancelRef={cancelRef}
        handleDeleteGroup={sidebar.handleDeleteGroup}
        deleting={sidebar.deleting}
      />

      <RemoveParticipantAlert
        removingParticipant={sidebar.removingParticipant}
        setRemovingParticipant={sidebar.setRemovingParticipant}
        removeCancelRef={removeCancelRef}
        handleRemoveParticipant={sidebar.handleRemoveParticipant}
        isRemoving={sidebar.isRemoving}
      />
    </VStack>
  );
};

export default ChatRightSidebar;
