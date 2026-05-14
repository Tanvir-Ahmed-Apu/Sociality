import React, { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, Button,
  VStack, HStack, Text, Input, Avatar, IconButton, Divider, useColorModeValue, useToast,
  AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent,
  AlertDialogOverlay, Box, Flex, Badge, Spinner, Tabs, TabList, TabPanels, Tab, TabPanel, Icon, SimpleGrid
} from '@chakra-ui/react';
import { FaShare, FaTrash, FaEdit, FaCamera, FaCopy, FaGlobe, FaTelegram, FaDiscord, FaUsers } from 'react-icons/fa';
import { BsCheck2All } from 'react-icons/bs';
import { useRecoilValue } from 'recoil';
import { userAtom } from '../../../atoms';
import { fetchWithSession } from '../../../utils/api';
import { useShowToast } from '../../../hooks';


const PLATFORMS: any = {
  sociality: { icon: FaGlobe, color: "#00B374", label: "Sociality" },
  telegram: { icon: FaTelegram, color: "#0088cc", label: "Telegram" },
  discord: { icon: FaDiscord, color: "#5865F2", label: "Discord" },
  default: { icon: FaUsers, color: "gray.500", label: "Other" }
};

const GroupSettingsModal = ({ isOpen, onClose, selectedConversation, onUpdateGroup, onDeleteGroup }: any) => {
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState(selectedConversation?.name || '');
  const [groupPhoto, setGroupPhoto] = useState(selectedConversation?.groupPhoto || '');
  const [states, setStates] = useState({ uploading: false, deleting: false, loadingRoom: false, loadingParticipants: false, copied: false, showAlert: false });
  const [data, setData] = useState<any>({ roomDetails: null, participants: [], summary: null });
  
  const fileInputRef = useRef<HTMLInputElement>(null), cancelRef = useRef<HTMLButtonElement>(null);
  const currentUser = useRecoilValue(userAtom), showToast = useShowToast(), toast = useToast();

  const colors = {
    bg: useColorModeValue("white", "#111111"),
    text: useColorModeValue("gray.800", "white"),
    border: useColorModeValue("gray.200", "gray.700"),
    section: useColorModeValue("gray.50", "#0a0a0a"),
    hover: useColorModeValue("gray.100", "#2d2d2d"),
    muted: useColorModeValue("gray.600", "gray.400")
  };

  const updateState = (k: string, v: any) => setStates(p => ({ ...p, [k]: v }));
  
  const apiCall = async (url: string, method = 'GET', body?: any) => {
    const resp = await fetchWithSession(url, { method, headers: { 'Content-Type': 'application/json' }, body: body ? JSON.stringify(body) : undefined });
    const json = await resp.json();
    if (!resp.ok || !json.success) throw new Error(json.error || 'Failed');
    return json;
  };

  const handlePhoto = (file: File) => {
    if (!file || file.size > 5 * 1024 * 1024) return showToast("Error", "Invalid file or size > 5MB", "error");
    updateState('uploading', true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const res = await apiCall(`/api/cross-platform/rooms/${selectedConversation._id}/photo`, 'PUT', { photo: e.target?.result });
        setGroupPhoto(res.groupPhoto);
        onUpdateGroup?.({ ...selectedConversation, groupPhoto: res.groupPhoto });
        showToast("Success", "Photo updated", "success");
      } catch (err: any) { showToast("Error", err.message, "error"); }
      finally { updateState('uploading', false); }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateName = async () => {
    if (!groupName.trim() || groupName === selectedConversation?.name) return setIsEditing(false);
    try {
      const res = await apiCall(`/api/cross-platform/rooms/${selectedConversation._id}/name`, 'PUT', { name: groupName.trim() });
      onUpdateGroup?.({ ...selectedConversation, name: res.name });
      setIsEditing(false);
      showToast("Success", "Name updated", "success");
    } catch (err: any) { showToast("Error", err.message, "error"); }
  };

  const handleDelete = async () => {
    updateState('deleting', true);
    try {
      await fetchWithSession(`/api/cross-platform/rooms/${selectedConversation._id}`, { method: 'DELETE' });
      onDeleteGroup?.(selectedConversation);
      onClose();
      showToast("Success", "Group deleted", "success");
    } catch (err) { showToast("Error", "Failed to delete", "error"); }
    finally { updateState('deleting', false); updateState('showAlert', false); }
  };

  const fetchData = useCallback(async () => {
    if (!selectedConversation?._id) return;
    updateState('loadingRoom', true); updateState('loadingParticipants', true);
    try {
      const [room, part] = await Promise.all([
        apiCall(`/api/cross-platform/rooms/${selectedConversation._id}/details`),
        apiCall(`/api/cross-platform/rooms/${selectedConversation._id}/participants`)
      ]);
      setData({ roomDetails: room.room, participants: part.participants, summary: part.summary });
    } catch (err) { console.error(err); }
    finally { updateState('loadingRoom', false); updateState('loadingParticipants', false); }
  }, [selectedConversation?._id]);

  useEffect(() => { if (isOpen) fetchData(); }, [isOpen, fetchData]);

  const copyId = () => {
    navigator.clipboard.writeText(selectedConversation._id);
    updateState('copied', true);
    toast({ title: "Copied!", status: "success", duration: 2000, position: "top" });
    setTimeout(() => updateState('copied', false), 2000);
  };

  const shareGroup = () => {
    const text = `Join group "${selectedConversation?.name}"!\nRoom ID: ${selectedConversation._id}`;
    if (navigator.share) navigator.share({ title: `Join Group`, text }).catch(console.error);
    else navigator.clipboard.writeText(text).then(() => toast({ title: "Copied share text!", status: "success" }));
  };

  if (!selectedConversation) return null;

  return (
    <>
      <Modal isOpen={isOpen} onClose={onClose} isCentered size="md">
        <ModalOverlay bg="blackAlpha.800" />
        <ModalContent bg={colors.bg} color={colors.text} border="none" borderRadius="24px" maxW="400px">
          <ModalHeader><Flex align="center" gap={3}><Box bg={useColorModeValue("brand.primary.50", "rgba(0, 179, 116, 0.1)")} p={2} borderRadius="lg"><FaUsers size={16} color="brand.primary.500" /></Box><Text>Group Settings</Text></Flex></ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Tabs variant="soft-rounded" colorScheme="green">
              <TabList mb={4}>
                <Tab>Settings</Tab>
                <Tab><Flex align="center" gap={2}><FaUsers size={14} /><Text>Members</Text>{data.summary && <Badge colorScheme="green" fontSize="xs">{data.summary.total}</Badge>}</Flex></Tab>
              </TabList>
              <TabPanels>
                <TabPanel p={0}><VStack spacing={4} align="stretch">
                  <Box bg={colors.section} p={4} borderRadius="lg">
                    <Text fontSize="sm" fontWeight="medium" mb={3} color={colors.muted}>GROUP PHOTO</Text>
                    <Flex align="center" gap={4}><Box position="relative">
                      <Avatar src={groupPhoto || selectedConversation.groupPhoto} size="lg" name={selectedConversation.name} bg={useColorModeValue("brand.primary.50", "rgba(0, 179, 116, 0.1)")} color="brand.primary.500" />
                      <IconButton icon={states.uploading ? <Spinner size="sm" /> : <FaCamera />} size="sm" borderRadius="full" position="absolute" bottom="-2px" right="-2px" bg="brand.primary.500" color="white" onClick={() => fileInputRef.current?.click()} isDisabled={states.uploading} aria-label="Photo" />
                    </Box><Text fontSize="sm" color={colors.muted} flex="1">Click camera to change photo</Text></Flex>
                    <Input type="file" ref={fileInputRef} onChange={e => handlePhoto(e.target.files?.[0]!)} accept="image/*" display="none" />
                  </Box>
                  <Box bg={colors.section} p={4} borderRadius="lg">
                    <Flex justify="space-between" align="center" mb={3}><Text fontSize="sm" fontWeight="medium" color={colors.muted}>GROUP NAME</Text>{!isEditing && <IconButton icon={<FaEdit />} size="xs" variant="ghost" onClick={() => setIsEditing(true)} aria-label="Edit" />}</Flex>
                    {isEditing ? <HStack><Input value={groupName} onChange={e => setGroupName(e.target.value)} size="sm" maxLength={50} /><IconButton icon={<BsCheck2All />} size="sm" colorScheme="green" onClick={handleUpdateName} aria-label="Save" /></HStack> : <Text fontSize="md" fontWeight="medium">{selectedConversation.name || 'Unnamed'}</Text>}
                  </Box>
                  <Box bg={colors.section} p={4} borderRadius="lg">
                    <Text fontSize="sm" fontWeight="medium" mb={3} color={colors.muted}>ROOM INFORMATION</Text>
                    <VStack spacing={3} align="stretch">
                      <Flex justify="space-between" align="center"><Text fontSize="sm">Room ID</Text><HStack><Text fontSize="xs" fontFamily="mono" color={colors.muted}>{selectedConversation._id?.slice(0, 8)}...</Text><IconButton icon={states.copied ? <BsCheck2All /> : <FaCopy />} size="xs" variant="ghost" onClick={copyId} color={states.copied ? "green.400" : colors.muted} aria-label="Copy" /></HStack></Flex>
                      <Flex justify="space-between" align="center"><Text fontSize="sm">Platforms</Text><HStack spacing={1}>{['sociality', 'telegram', 'discord'].map(p => <Badge key={p} colorScheme={p === 'sociality' ? 'green' : p === 'telegram' ? 'blue' : 'purple'} variant="subtle"><Icon as={PLATFORMS[p].icon} size={10} mr={1} />{PLATFORMS[p].label}</Badge>)}</HStack></Flex>
                      <Flex justify="space-between" align="center"><Text fontSize="sm">Members</Text><HStack><FaUsers size={12} color={colors.muted} />{states.loadingRoom ? <Spinner size="xs" /> : <Text fontSize="sm" color={colors.muted}>{data.roomDetails?.participantCount || selectedConversation?.participants?.length || 0}</Text>}</HStack></Flex>
                    </VStack>
                  </Box>
                  <Box h="24px" />
                  <VStack spacing={2} align="stretch">
                    <Button leftIcon={<FaShare />} variant="ghost" justifyContent="flex-start" onClick={shareGroup} _hover={{ bg: colors.hover }}>Share Room</Button>
                    <Button leftIcon={<FaTrash />} variant="ghost" justifyContent="flex-start" color="red.400" _hover={{ bg: "rgba(255, 0, 0, 0.1)" }} onClick={() => updateState('showAlert', true)}>Delete Group</Button>
                  </VStack>
                </VStack></TabPanel>
                <TabPanel p={0}><VStack spacing={4} align="stretch">
                  {states.loadingParticipants ? <Flex justify="center" py={8}><Spinner size="lg" color="green.500" /></Flex> : <>
                    {data.summary && <Box bg={colors.section} p={4} borderRadius="lg"><Text fontSize="sm" fontWeight="medium" mb={3} color={colors.muted}>PLATFORMS</Text>
                      <SimpleGrid columns={2} spacing={3}>{['sociality', 'telegram', 'discord'].map(p => <Flex key={p} align="center" gap={2}><Icon as={PLATFORMS[p].icon} color={PLATFORMS[p].color} /><Text fontSize="sm">{PLATFORMS[p].label}: {data.summary[p]}</Text></Flex>)}</SimpleGrid>
                    </Box>}
                    <Box bg={colors.section} p={4} borderRadius="lg"><Text fontSize="sm" fontWeight="medium" mb={3} color={colors.muted}>MEMBERS ({data.participants.length})</Text>
                      <VStack spacing={3} align="stretch" maxH="300px" overflowY="auto">
                        {data.participants.map((p: any) => {
                          const plat = PLATFORMS[p.platform] || PLATFORMS.default;
                          return <Flex key={`${p.platform}-${p.id}`} align="center" gap={3}><Avatar src={p.profilePic} name={p.name || p.username} size="sm" bg={p.platform === 'sociality' ? useColorModeValue("brand.primary.50", "rgba(0, 179, 116, 0.1)") : useColorModeValue("gray.100", "whiteAlpha.100")} color={p.platform === 'sociality' ? "brand.primary.500" : "gray.500"} /><Box flex="1"><Flex align="center" gap={2}><Text fontSize="sm" fontWeight="medium">{p.name || p.username}</Text><Icon as={plat.icon} color={plat.color} size="12px" />{p.role === 'admin' && <Badge size="xs" colorScheme="green">Admin</Badge>}</Flex><Text fontSize="xs" color={colors.muted}>{p.platform === 'sociality' ? `@${p.username}` : `${p.messageCount || 0} messages`}</Text></Box></Flex>
                        })}
                      </VStack>
                    </Box>
                  </>}
                </VStack></TabPanel>
              </TabPanels>
            </Tabs>
          </ModalBody>
        </ModalContent>
      </Modal>
      <AlertDialog isOpen={states.showAlert} leastDestructiveRef={cancelRef} onClose={() => updateState('showAlert', false)} isCentered>
        <AlertDialogOverlay><AlertDialogContent bg={colors.bg} color={colors.text}><AlertDialogHeader fontWeight="bold">Delete Group</AlertDialogHeader>
          <AlertDialogBody>Are you sure you want to delete "{selectedConversation.name}"? This cannot be undone.</AlertDialogBody>
          <AlertDialogFooter><Button ref={cancelRef} onClick={() => updateState('showAlert', false)}>Cancel</Button><Button colorScheme="red" onClick={handleDelete} ml={3} isLoading={states.deleting}>Delete</Button></AlertDialogFooter>
        </AlertDialogContent></AlertDialogOverlay>
      </AlertDialog>
    </>
  );
};
export default GroupSettingsModal;
