import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  VStack,
  Text,
  Input,
  Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import { Conversation } from "../../../atoms";

interface CrossPlatformRoomModalsProps {
  showCreateRoomModal: boolean;
  setShowCreateRoomModal: (open: boolean) => void;
  newRoomName: string;
  setNewRoomName: (name: string) => void;
  creatingRoom: boolean;
  onCreateRoom: () => void;
  showShareRoomModal: boolean;
  setShowShareRoomModal: (open: boolean) => void;
  selectedRoom: Conversation | null;
  hasCopied: boolean;
  onCopyRoomId: () => void;
  showJoinRoomModal: boolean;
  setShowJoinRoomModal: (open: boolean) => void;
  joinRoomId: string;
  setJoinRoomId: (id: string) => void;
  joiningRoom: boolean;
  onJoinRoom: () => void;
  showDeleteRoomModal: boolean;
  setShowDeleteRoomModal: (open: boolean) => void;
  deletingRoom: boolean;
  onConfirmDeleteRoom: () => void;
}

export const CrossPlatformRoomModals = ({
  showCreateRoomModal,
  setShowCreateRoomModal,
  newRoomName,
  setNewRoomName,
  creatingRoom,
  onCreateRoom,
  showShareRoomModal,
  setShowShareRoomModal,
  selectedRoom,
  hasCopied,
  onCopyRoomId,
  showJoinRoomModal,
  setShowJoinRoomModal,
  joinRoomId,
  setJoinRoomId,
  joiningRoom,
  onJoinRoom,
  showDeleteRoomModal,
  setShowDeleteRoomModal,
  deletingRoom,
  onConfirmDeleteRoom,
}: CrossPlatformRoomModalsProps) => {
  const modalBgColor = useColorModeValue("white", "#1E1E1E");

  return (
    <>
      <Modal
        isOpen={showCreateRoomModal}
        onClose={() => setShowCreateRoomModal(false)}
        isCentered
      >
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <ModalContent bg={modalBgColor} borderRadius="2xl">
          <ModalHeader>Create Cross-Platform Room</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Text fontSize="sm" color="gray.500">
                Connect with Telegram and Discord users in a single panel!
              </Text>
              <Input
                placeholder="Enter room name..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                borderRadius="xl"
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => setShowCreateRoomModal(false)}
            >
              Cancel
            </Button>
            <Button
              colorScheme="yellow"
              onClick={onCreateRoom}
              isLoading={creatingRoom}
              isDisabled={!newRoomName.trim()}
              borderRadius="xl"
            >
              Create
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={showShareRoomModal}
        onClose={() => setShowShareRoomModal(false)}
        isCentered
      >
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <ModalContent bg={modalBgColor} borderRadius="2xl">
          <ModalHeader>Share Room Code</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.500">
                Share this code with others so they can join this room from any
                platform!
              </Text>
              <Flex gap={2}>
                <Input
                  value={selectedRoom?.roomCode || selectedRoom?._id || ""}
                  isReadOnly
                  borderRadius="xl"
                  fontWeight="bold"
                  textAlign="center"
                  fontSize="xl"
                  letterSpacing="2px"
                />
                <Button
                  onClick={onCopyRoomId}
                  colorScheme={hasCopied ? "green" : "yellow"}
                  borderRadius="xl"
                  px={8}
                >
                  {hasCopied ? "Copied!" : "Copy"}
                </Button>
              </Flex>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={showJoinRoomModal}
        onClose={() => setShowJoinRoomModal(false)}
        isCentered
      >
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <ModalContent bg={modalBgColor} borderRadius="2xl">
          <ModalHeader>Join Cross-Platform Room</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Text fontSize="sm" color="gray.500">
                Enter a room code or ID to join an existing conversation.
              </Text>
              <Input
                placeholder="Enter room code (e.g. AB12CD34)"
                value={joinRoomId}
                onChange={(e) => setJoinRoomId(e.target.value)}
                borderRadius="xl"
                autoFocus
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => setShowJoinRoomModal(false)}
            >
              Cancel
            </Button>
            <Button
              colorScheme="yellow"
              onClick={onJoinRoom}
              isLoading={joiningRoom}
              isDisabled={!joinRoomId.trim()}
              borderRadius="xl"
            >
              Join Room
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      <Modal
        isOpen={showDeleteRoomModal}
        onClose={() => setShowDeleteRoomModal(false)}
        isCentered
      >
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <ModalContent bg={modalBgColor} borderRadius="2xl">
          <ModalHeader>Delete Room?</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text fontWeight="bold" color="red.500">
              Warning: This will destroy the room forever!
            </Text>
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={() => setShowDeleteRoomModal(false)}
            >
              Cancel
            </Button>
            <Button
              colorScheme="red"
              onClick={onConfirmDeleteRoom}
              isLoading={deletingRoom}
              borderRadius="xl"
            >
              Delete
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};
