import React from 'react';
import { 
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  Button, HStack, Box, Text, VStack, useColorModeValue
} from '@chakra-ui/react';
import { FaUsers } from 'react-icons/fa';
import ParticipantItem from './ParticipantItem';

export const AllMembersModal = ({ showAllMembers, setShowAllMembers, participants, isAdmin, currentUser, setRemovingParticipant }: any) => (
  <Modal isOpen={showAllMembers} onClose={() => setShowAllMembers(false)} isCentered size="md">
    <ModalOverlay backdropFilter="blur(10px)" bg="blackAlpha.700" />
    <ModalContent bg={useColorModeValue("white", "#111111")} color={useColorModeValue("black", "white")} borderRadius="30px" border="1px solid" borderColor={useColorModeValue("gray.200", "whiteAlpha.100")} maxH="80vh">
      <ModalHeader borderBottom="1px solid" borderColor={useColorModeValue("gray.100", "whiteAlpha.100")} py={4}>
        <HStack spacing={3}>
          <Box bg={useColorModeValue("brand.primary.50", "rgba(0, 179, 116, 0.1)")} p={2} borderRadius="lg">
            <FaUsers size={16} color="brand.primary.500" />
          </Box>
          <Text fontSize="md" fontWeight="800">All Members ({participants.length})</Text>
        </HStack>
      </ModalHeader>
      <ModalCloseButton borderRadius="full" top="15px" />
      <ModalBody py={6} overflowY="auto" maxH="380px" className="custom-scrollbar">
        <VStack align="stretch" spacing={4}>
          {participants.map((p: any) => (
            <ParticipantItem 
              key={`${p.platform}-${p.id}`} 
              participant={p} 
              isAdminView={isAdmin} 
              currentUser={currentUser}
              setRemovingParticipant={setRemovingParticipant} 
            />
          ))}
        </VStack>
      </ModalBody>
      <ModalFooter borderTop="1px solid" borderColor="whiteAlpha.100" py={3}>
        <Button variant="ghost" colorScheme="gray" onClick={() => setShowAllMembers(false)} borderRadius="15px" size="sm">Close</Button>
      </ModalFooter>
    </ModalContent>
  </Modal>
);

export const DeleteGroupAlert = ({ showDeleteAlert, setShowDeleteAlert, cancelRef, handleDeleteGroup, deleting }: any) => (
  <AlertDialog isOpen={showDeleteAlert} leastDestructiveRef={cancelRef} onClose={() => setShowDeleteAlert(false)} isCentered>
    <AlertDialogOverlay>
      <AlertDialogContent bg={useColorModeValue("white", "#111111")} color={useColorModeValue("black", "white")} borderRadius="20px">
        <AlertDialogHeader fontSize="md" fontWeight="bold">Delete Group</AlertDialogHeader>
        <AlertDialogBody fontSize="sm">Are you sure? This removes the group from all platforms.</AlertDialogBody>
        <AlertDialogFooter>
          <Button ref={cancelRef} onClick={() => setShowDeleteAlert(false)} variant="ghost" size="sm">Cancel</Button>
          <Button colorScheme="red" onClick={handleDeleteGroup} ml={3} isLoading={deleting} size="sm">Delete</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogOverlay>
  </AlertDialog>
);

export const RemoveParticipantAlert = ({ removingParticipant, setRemovingParticipant, removeCancelRef, handleRemoveParticipant, isRemoving }: any) => (
  <AlertDialog isOpen={!!removingParticipant} leastDestructiveRef={removeCancelRef} onClose={() => setRemovingParticipant(null)} isCentered>
    <AlertDialogOverlay>
      <AlertDialogContent bg={useColorModeValue("white", "#111111")} color={useColorModeValue("black", "white")} borderRadius="20px">
        <AlertDialogHeader fontSize="md" fontWeight="bold">Remove Member</AlertDialogHeader>
        <AlertDialogBody fontSize="sm">
          Are you sure you want to remove <b>{removingParticipant?.name || removingParticipant?.username}</b>?
          {removingParticipant?.platform !== 'sociality' && " This user will be blocked from sending messages to this room."}
        </AlertDialogBody>
        <AlertDialogFooter>
          <Button ref={removeCancelRef} onClick={() => setRemovingParticipant(null)} variant="ghost" size="sm">Cancel</Button>
          <Button colorScheme="red" onClick={handleRemoveParticipant} ml={3} isLoading={isRemoving} size="sm">Remove</Button>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialogOverlay>
  </AlertDialog>
);
