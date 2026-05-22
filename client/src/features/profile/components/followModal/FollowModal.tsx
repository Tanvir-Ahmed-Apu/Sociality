import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
} from "@chakra-ui/react";
import { useFollowModal } from "../../hooks/useFollowModal";
import { FollowModalTabs } from "./FollowModalTabs";
import { FollowersList } from "./FollowersList";
import { FollowingList } from "./FollowingList";
import type { FollowModalProps, FollowTab } from "./types";

const FollowModal = ({
  isOpen,
  onClose,
  username,
  onUserUpdate,
  initialTab = 0 as FollowTab,
}: FollowModalProps) => {
  const modal = useFollowModal({
    isOpen,
    onClose,
    username,
    onUserUpdate,
    initialTab,
  });

  return (
    <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
      <ModalOverlay />
      <ModalContent
        bg="#111111"
        color="white"
        border="none"
        boxShadow="0 10px 30px rgba(0,0,0,0.5)"
        borderRadius="32px"
      >
        <ModalHeader p={0} borderBottom="1px solid" borderColor="rgba(0, 179, 116, 0.2)">
          <FollowModalTabs
            activeTab={modal.activeTab}
            onTabChange={modal.setActiveTab}
          />
        </ModalHeader>
        <ModalCloseButton
          top={3}
          color="gray.400"
          _hover={{ bg: "rgba(0, 179, 116, 0.1)", color: "white" }}
          borderRadius="full"
        />
        <ModalBody p={4}>
          {modal.activeTab === 0 ? (
            <FollowersList
              followers={modal.followers}
              isLoading={modal.isLoading}
              followingMap={modal.followingMap}
              processingIds={modal.processingIds}
              currentUser={modal.currentUser}
              isOwnProfile={modal.isOwnProfile}
              onClose={onClose}
              onFollowToggle={modal.handleFollowToggle}
              onRemoveFollower={modal.handleRemoveFollower}
            />
          ) : (
            <FollowingList
              following={modal.following}
              isLoading={modal.isLoading}
              processingIds={modal.processingIds}
              currentUser={modal.currentUser}
              onClose={onClose}
              onUnfollow={modal.handleUnfollow}
            />
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default FollowModal;
