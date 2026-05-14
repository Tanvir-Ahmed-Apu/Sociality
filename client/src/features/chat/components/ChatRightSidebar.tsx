import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import { 
  VStack, Box, Avatar, Text, Heading, HStack, Icon, 
  SimpleGrid, Image, Divider, Flex, useColorModeValue,
  Skeleton, SkeletonCircle, Badge, Tooltip, IconButton,
  Input, Spinner, Button, useToast,
  AlertDialog, AlertDialogBody, AlertDialogFooter, 
  AlertDialogHeader, AlertDialogContent, AlertDialogOverlay,
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter, ModalBody, ModalCloseButton,
  Tabs, TabList, TabPanels, Tab, TabPanel, Menu, MenuButton, MenuList, MenuItem, Portal
} from '@chakra-ui/react';
import { 
  FiSettings, FiFileText, FiImage, FiStar, FiChevronRight, 
  FiCopy, FiEdit, FiCamera, FiTrash2, FiExternalLink, FiSearch, FiChevronDown, FiInfo, FiUsers as FiUsersIcon, FiMoreVertical, FiUserX
} from 'react-icons/fi';
import { 
  FaGlobe, FaTelegram, FaDiscord, FaUsers, FaEdit, FaCamera, FaTrash, FaUserMinus 
} from 'react-icons/fa';
import { BsCheck2All } from 'react-icons/bs';
import { useRecoilValue } from "recoil";
import { userAtom } from "../../../atoms";
import { fetchWithSession } from '../../../utils/api';
import { useShowToast } from '../../../hooks';

const PLATFORMS: any = {
  sociality: { icon: FaGlobe, color: "#00B374", label: "Sociality" },
  telegram: { icon: FaTelegram, color: "#0088cc", label: "Telegram" },
  discord: { icon: FaDiscord, color: "#5865F2", label: "Discord" },
  default: { icon: FaUsers, color: "gray.500", label: "Other" }
};

const ChatRightSidebar = ({ user, messages = [], onOpenSettings, onDeleteGroup, onUpdateGroup }: any) => {
  const [details, setDetails] = useState<any>(null);
  const [participants, setParticipants] = useState<any[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [showAllMembers, setShowAllMembers] = useState(false);
  const [activeTab, setActiveTab] = useState(0); // 0: Settings/Info, 1: Members
  
  const [removingParticipant, setRemovingParticipant] = useState<any>(null);
  const [isRemoving, setIsRemoving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const removeCancelRef = useRef<HTMLButtonElement>(null);
  const showToast = useShowToast();
  const toast = useToast();
  const currentUser = useRecoilValue(userAtom);

  const isFederated = user?.isFederated;

  // Find current user's role in the participants list
  const currentUserRole = useMemo(() => {
    if (!currentUser || !participants.length) return 'member';
    const p = participants.find(part => part.platform === 'sociality' && part.id === currentUser._id);
    return p?.role || 'member';
  }, [currentUser, participants]);

  const isAdmin = currentUserRole === 'admin';


  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      if (isFederated) {
        const [roomRes, partRes] = await Promise.all([
          fetchWithSession(`/api/cross-platform/rooms/${user._id}/details`),
          fetchWithSession(`/api/cross-platform/rooms/${user._id}/participants`)
        ]);

        if (roomRes.ok) {
          const roomData = await roomRes.json();
          if (roomData.success) {
            setDetails(roomData.room);
            setGroupName(roomData.room.name || '');
          }
        }

        if (partRes.ok) {
          const partData = await partRes.json();
          if (partData.success) {
            const sorted = partData.participants.sort((a: any, b: any) => (b.messageCount || 0) - (a.messageCount || 0));
            setParticipants(sorted);
            setSummary(partData.summary);
          }
        }
      } else {
        const res = await fetchWithSession(`/api/users/profile/${user.userId || user.username}`);
        if (res.ok) {
          const data = await res.json();
          setDetails(data);
          setGroupName(data.username || '');
        }
      }
    } catch (error) {
      console.error("Error fetching sidebar details:", error);
    } finally {
      setLoading(false);
    }
  }, [user, isFederated]);

  useEffect(() => {
    if (!isFederated) setActiveTab(0);
    fetchData();
  }, [fetchData, isFederated]);

  const media = useMemo(() => messages.filter((m: any) => m.img).reverse(), [messages]);
  const files = useMemo(() => messages.filter((m: any) => m.file).reverse(), [messages]);
  const starredMessages = useMemo(() => messages.filter((m: any) => m.isStarred).reverse(), [messages]);

  const displayAvatar = isFederated ? (details?.groupPhoto || user.groupPhoto) : (details?.profilePic || user.userProfilePic);
  const displayName = isFederated ? (details?.name || user.name) : (details?.username || user.username);

  const handlePhotoUpload = (file: File) => {
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) return showToast("Error", "File size must be less than 5MB", "error");
    setUploading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const res = await fetchWithSession(`/api/cross-platform/rooms/${user._id}/photo`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ photo: e.target?.result })
        });
        const data = await res.json();
        if (data.success) {
          setDetails((prev: any) => ({ ...prev, groupPhoto: data.groupPhoto }));
          onUpdateGroup?.({ ...user, groupPhoto: data.groupPhoto });
          showToast("Success", "Group photo updated", "success");
        }
      } catch (err) { showToast("Error", "Failed to update photo", "error"); } finally { setUploading(false); }
    };
    reader.readAsDataURL(file);
  };

  const handleUpdateName = async () => {
    if (!groupName.trim() || groupName === displayName) { setIsEditing(false); return; }
    try {
      const res = await fetchWithSession(`/api/cross-platform/rooms/${user._id}/name`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: groupName.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setDetails((prev: any) => ({ ...prev, name: data.name }));
        onUpdateGroup?.({ ...user, name: data.name });
        setIsEditing(false);
        showToast("Success", "Group name updated", "success");
      }
    } catch (err) { showToast("Error", "Failed to update name", "error"); }
  };

  const handleDeleteGroup = async () => {
    setDeleting(true);
    try {
      const res = await fetchWithSession(`/api/cross-platform/rooms/${user._id}`, { method: 'DELETE' });
      if (res.ok) {
        showToast("Success", "Group deleted successfully", "success");
        onDeleteGroup?.(user);
        setShowDeleteAlert(false);
      }
    } catch (err) { showToast("Error", "Failed to delete group", "error"); } finally { setDeleting(false); }
  };

  const handleRemoveParticipant = async () => {
    if (!removingParticipant) return;
    setIsRemoving(true);
    try {
      const res = await fetchWithSession(`/api/cross-platform/rooms/${user._id}/participants/${removingParticipant.id}?platform=${removingParticipant.platform}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (data.success) {
        showToast("Success", "Participant removed", "success");
        fetchData(); // Refresh list
        setRemovingParticipant(null);
      } else {
        showToast("Error", data.error || "Failed to remove participant", "error");
      }
    } catch (err) {
      showToast("Error", "Failed to remove participant", "error");
    } finally {
      setIsRemoving(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} copied!`, status: "success", duration: 2000, position: "top" });
  };

  const SectionTitle = ({ children, count, onSeeAll }: any) => (
    <Flex justify="space-between" align="center" mb={3}>
      <Heading size="xs" color="gray.500" textTransform="uppercase" letterSpacing="1px" fontSize="11px">
        {children} {count !== undefined && <Text as="span" ml={1}>({count})</Text>}
      </Heading>
      {onSeeAll && (
        <HStack spacing={1} color="gray.500" cursor="pointer" _hover={{ color: "white" }} onClick={onSeeAll}>
          <Text fontSize="11px" fontWeight="700">See All</Text>
          <Icon as={FiChevronRight} size={12} />
        </HStack>
      )}
    </Flex>
  );

  const ParticipantItem = ({ participant, isAdminView }: { participant: any, isAdminView: boolean }) => {
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
        
        {canRemove && (
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

  return (
    <VStack 
      w="full" h="full" bg={useColorModeValue("white", "#0A0A0A")} p={6} align="stretch" spacing={6}
      overflowY="auto"
      flexShrink={0}
      className="custom-scrollbar"
    >
      {/* Header Card */}
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

      {/* Tabs - Only show for groups */}
      {isFederated && (
        <HStack bg={useColorModeValue("gray.50", "black")} p={1.5} borderRadius="18px" spacing={1} border="1px solid" borderColor={useColorModeValue("gray.200", "whiteAlpha.100")}>
          <Button flex={1} size="sm" variant="ghost" leftIcon={<FiSettings size={14} />} borderRadius="14px" bg={activeTab === 0 ? useColorModeValue("white", "whiteAlpha.100") : "transparent"} color={activeTab === 0 ? useColorModeValue("black", "white") : "gray.500"} _hover={{ bg: useColorModeValue("white", "whiteAlpha.100"), color: useColorModeValue("black", "white") }} onClick={() => setActiveTab(0)}>
            Settings
          </Button>
          <Button flex={1} size="sm" variant="ghost" leftIcon={<FiUsersIcon size={14} />} borderRadius="14px" bg={activeTab === 1 ? useColorModeValue("white", "whiteAlpha.100") : "transparent"} color={activeTab === 1 ? useColorModeValue("black", "white") : "gray.500"} _hover={{ bg: useColorModeValue("white", "whiteAlpha.100"), color: useColorModeValue("black", "white") }} onClick={() => setActiveTab(1)}>
            Members
          </Button>
        </HStack>
      )}

      {/* Content */}
      <VStack align="stretch" spacing={6}>
        {activeTab === 0 ? (
          <>
            {/* Info / Settings Tab (Visible for both DMs and Groups) */}
            {isFederated && (
              <VStack align="stretch" spacing={4}>
                <Box bg={useColorModeValue("brand.primary.50", "rgba(0, 179, 116, 0.08)")} p={5} borderRadius="24px" border="1px solid" borderColor={useColorModeValue("brand.primary.100", "rgba(0, 179, 116, 0.2)")}>
                  <SectionTitle>Room Code</SectionTitle>
                  <HStack justify="space-between">
                    <Text fontWeight="800" fontSize="xl" color={useColorModeValue("black", "white")} letterSpacing="3px" fontFamily="monospace">
                      {details?.roomCode || user.roomCode || "••••••••"}
                    </Text>
                    <Button size="sm" variant="solid" bg="brand.primary.500" color="white" onClick={() => copyToClipboard(details?.roomCode || user.roomCode, "Room Code")} borderRadius="12px" fontSize="xs" fontWeight="800" px={4} _hover={{ bg: "brand.primary.600" }}>
                      COPY
                    </Button>
                  </HStack>
                </Box>
                <Box bg={useColorModeValue("gray.50", "black")} p={5} borderRadius="24px" border="1px solid" borderColor={useColorModeValue("gray.100", "whiteAlpha.50")}>
                  <SectionTitle>Connected Platforms</SectionTitle>
                  <SimpleGrid columns={1} spacing={3}>
                    {['sociality', 'telegram', 'discord'].map(p => {
                      if (!summary?.[p]) return null;
                      const plat = PLATFORMS[p];
                      return (
                        <HStack key={p} spacing={4} p={3} borderRadius="18px" bg={useColorModeValue("white", "whiteAlpha.50")} border="1px solid" borderColor={useColorModeValue("gray.100", "transparent")}>
                          <Box bg={`${plat.color}15`} p={2} borderRadius="12px"><Icon as={plat.icon} color={plat.color} size="20px" /></Box>
                          <VStack align="start" spacing={0}><Text fontSize="sm" fontWeight="800" color={useColorModeValue("black", "white")}>{plat.label}</Text><Text fontSize="xs" color="gray.500">{summary[p]} participants</Text></VStack>
                        </HStack>
                      );
                    })}
                  </SimpleGrid>
                </Box>
              </VStack>
            )}

            {/* Assets (Media, Files, Starred) - Always visible */}
            <VStack align="stretch" spacing={4}>
              <Box bg={useColorModeValue("gray.50", "black")} p={4} borderRadius="22px" border="1px solid" borderColor={useColorModeValue("gray.100", "whiteAlpha.50")}>
                <SectionTitle count={media.length}>Media</SectionTitle>
                {media.length > 0 ? (
                  <SimpleGrid columns={3} spacing={3}>
                    {media.slice(0, 3).map((m: any, i: number) => (
                      <Image key={m._id || i} src={m.img} borderRadius="14px" h="70px" w="full" objectFit="cover" cursor="pointer" />
                    ))}
                  </SimpleGrid>
                ) : <Text fontSize="xs" color="gray.600">No media shared yet</Text>}
              </Box>

              <Box bg={useColorModeValue("gray.50", "black")} p={4} borderRadius="22px" border="1px solid" borderColor={useColorModeValue("gray.100", "whiteAlpha.50")}>
                <SectionTitle count={files.length}>Files</SectionTitle>
                <VStack align="stretch" spacing={3}>
                  {files.slice(0, 2).map((f: any) => (
                    <HStack key={f._id} spacing={3} p={2} borderRadius="12px" bg={useColorModeValue("white", "whiteAlpha.100")}>
                      <Icon as={FiFileText} color="brand.primary.500" size={14} /><Text fontSize="xs" fontWeight="700" color={useColorModeValue("black", "white")} noOfLines={1}>{f.fileName}</Text>
                    </HStack>
                  ))}
                  {files.length === 0 && <Text fontSize="xs" color="gray.600">No files shared yet</Text>}
                </VStack>
              </Box>

              {starredMessages.length > 0 && (
                <Box bg={useColorModeValue("gray.50", "black")} p={4} borderRadius="22px" border="1px solid" borderColor={useColorModeValue("gray.100", "whiteAlpha.50")}>
                  <SectionTitle count={starredMessages.length}>Starred Messages</SectionTitle>
                  <VStack align="stretch" spacing={3}>
                    {starredMessages.slice(0, 2).map((m: any) => (
                      <Box key={m._id} p={3} borderRadius="12px" bg={useColorModeValue("white", "whiteAlpha.50")} border="1px solid" borderColor={useColorModeValue("gray.100", "whiteAlpha.100")}>
                        <Text fontSize="xs" color={useColorModeValue("gray.800", "whiteAlpha.800")} noOfLines={2}>"{m.text}"</Text>
                        <Text fontSize="10px" color="gray.500" mt={1}>{m.sender?.username}</Text>
                      </Box>
                    ))}
                  </VStack>
                </Box>
              )}
            </VStack>

            {isFederated && isAdmin && (
              <Button
                leftIcon={<FiTrash2 size={16} />} variant="ghost" colorScheme="red" color="red.400" size="md" justifyContent="flex-start" _hover={{ bgGradient: useColorModeValue("linear(to-b, gray.50 0%, white 100%)", "linear(to-b, #0A0A0A 0%, #000000 100%)") }}
                onClick={() => setShowDeleteAlert(true)} fontWeight="800" fontSize="sm" textTransform="uppercase" borderRadius="18px" py={6}
              >
                Delete Group permanently
              </Button>
            )}
          </>
        ) : (
          <Box>
            {/* Members Tab (Only accessible for Groups) */}
            <SectionTitle count={participants.length} onSeeAll={() => setShowAllMembers(true)}>Top Active</SectionTitle>
            <VStack align="stretch" spacing={3}>
              {participants.slice(0, 5).map((p: any) => (
                <ParticipantItem key={`${p.platform}-${p.id}`} participant={p} isAdminView={isAdmin} />
              ))}
            </VStack>
          </Box>
        )}
      </VStack>

      {/* Modals */}
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
                <ParticipantItem key={`${p.platform}-${p.id}`} participant={p} isAdminView={isAdmin} />
              ))}
            </VStack>
          </ModalBody>
          <ModalFooter borderTop="1px solid" borderColor="whiteAlpha.100" py={3}><Button variant="ghost" colorScheme="gray" onClick={() => setShowAllMembers(false)} borderRadius="15px" size="sm">Close</Button></ModalFooter>
        </ModalContent>
      </Modal>

      <AlertDialog isOpen={showDeleteAlert} leastDestructiveRef={cancelRef} onClose={() => setShowDeleteAlert(false)} isCentered>
        <AlertDialogOverlay>
          <AlertDialogContent bg={useColorModeValue("white", "#111111")} color={useColorModeValue("black", "white")} borderRadius="20px">
            <AlertDialogHeader fontSize="md" fontWeight="bold">Delete Group</AlertDialogHeader>
            <AlertDialogBody fontSize="sm">Are you sure? This removes the group from all platforms.</AlertDialogBody>
            <AlertDialogFooter><Button ref={cancelRef} onClick={() => setShowDeleteAlert(false)} variant="ghost" size="sm">Cancel</Button><Button colorScheme="red" onClick={handleDeleteGroup} ml={3} isLoading={deleting} size="sm">Delete</Button></AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>

      {/* Remove Participant Alert */}
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
    </VStack>
  );
};

export default ChatRightSidebar;
