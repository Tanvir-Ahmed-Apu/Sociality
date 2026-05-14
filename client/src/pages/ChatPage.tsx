import {
  Modal, ModalOverlay, ModalContent, ModalHeader, ModalFooter,
  ModalBody, ModalCloseButton, Button, VStack, Text, Input, Flex,
  useColorModeValue,
} from "@chakra-ui/react";
import ModernChat from "../features/chat/components/ModernChat";
import { useEffect, useState, useCallback, useMemo } from "react";
import useShowToast from "../hooks/useShowToast";
import { useRecoilState, useRecoilValue } from "recoil";
import { conversationsAtom, selectedConversationAtom, userAtom, Conversation } from "../atoms";
import { useSocket } from "../hooks/useSocket";
import { fetchWithSession } from "../utils/api";

const ChatPage = () => {
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
  const [conversations, setConversations] = useRecoilState(conversationsAtom);
  const currentUser = useRecoilValue(userAtom);
  const showToast = useShowToast();
  const { socket, onlineUsers } = useSocket();

  const modalBgColor = useColorModeValue("white", "#1E1E1E");

  // Cross-platform messaging state
  const [isCrossPlatformMode, setIsCrossPlatformMode] = useState(false);
  const [federatedRooms, setFederatedRooms] = useState<Conversation[]>([]);
  const [loadingFederatedRooms, setLoadingFederatedRooms] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);

  // Room actions state
  const [showShareRoomModal, setShowShareRoomModal] = useState(false);
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);
  const [showDeleteRoomModal, setShowDeleteRoomModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Conversation | null>(null);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  // Fetch federated rooms
  const fetchFederatedRooms = useCallback(async () => {
    if (!isCrossPlatformMode) return;
    setLoadingFederatedRooms(true);
    try {
      const res = await fetchWithSession('/api/cross-platform/rooms');
      if (res.ok) {
        const data = await res.json();
        if (data.success) setFederatedRooms(data.rooms);
        else showToast("Error", data.error || "Failed to fetch rooms", "error");
      } else {
        const err = await res.json().catch(() => ({ error: 'Failed to fetch rooms' }));
        showToast("Error", err.error || "Failed to fetch rooms", "error");
      }
    } catch {
      showToast("Error", "Failed to connect to federation service", "error");
    } finally {
      setLoadingFederatedRooms(false);
    }
  }, [isCrossPlatformMode, showToast]);

  // Create a new cross-platform room
  const handleCreateRoom = useCallback(async () => {
    if (!newRoomName.trim()) {
      showToast("Error", "Please enter a room name", "error");
      return;
    }
    setCreatingRoom(true);
    try {
      const res = await fetchWithSession('/api/cross-platform/rooms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newRoomName.trim(), allowedPlatforms: ['sociality', 'telegram', 'discord'] }),
      });
      const data = await res.json();
      if (data.success) {
        showToast("Success", `Room "${newRoomName}" created! Code: ${data.room.roomCode}`, "success");
        setNewRoomName("");
        setShowCreateRoomModal(false);
        await fetchFederatedRooms();
        setSelectedConversation({ _id: data.room.roomId, name: data.room.name, isFederated: true, platforms: [] });
      } else {
        showToast("Error", data.error || "Failed to create room", "error");
      }
    } catch {
      showToast("Error", "Failed to create room", "error");
    } finally {
      setCreatingRoom(false);
    }
  }, [newRoomName, showToast, fetchFederatedRooms, setSelectedConversation]);

  // Join an existing cross-platform room
  const handleJoinRoom = useCallback(async () => {
    if (!joinRoomId.trim()) {
      showToast("Error", "Please enter a room code or ID", "error");
      return;
    }
    setJoiningRoom(true);
    try {
      const res = await fetchWithSession(`/api/cross-platform/rooms/${joinRoomId.trim()}/join`, {
        method: 'POST',
      });
      const data = await res.json();
      if (data.success) {
        showToast("Success", `Joined room "${data.room.name}"!`, "success");
        setJoinRoomId("");
        setShowJoinRoomModal(false);
        await fetchFederatedRooms();
        setSelectedConversation({ _id: data.room.roomId, name: data.room.name, isFederated: true, platforms: [] });
      } else {
        showToast("Error", data.error || "Failed to join room", "error");
      }
    } catch {
      showToast("Error", "Failed to join room", "error");
    } finally {
      setJoiningRoom(false);
    }
  }, [joinRoomId, showToast, fetchFederatedRooms, setSelectedConversation]);

  // Toggle cross-platform mode
  const handleToggleCrossPlatform = useCallback(() => {
    if (!isCrossPlatformMode) {
      setIsCrossPlatformMode(true);
      setSelectedConversation({});
    } else {
      setIsCrossPlatformMode(false);
      setFederatedRooms([]);
      setSelectedConversation({});
    }
  }, [isCrossPlatformMode, setSelectedConversation]);

  const handleShareRoom = useCallback((room: Conversation, event: React.MouseEvent) => {
    event?.stopPropagation?.();
    setSelectedRoom(room);
    setShowShareRoomModal(true);
  }, []);

  const handleDeleteRoom = useCallback((room: Conversation, event: React.MouseEvent) => {
    event?.stopPropagation?.();
    setSelectedRoom(room);
    setShowDeleteRoomModal(true);
  }, []);

  const handleConfirmDeleteRoom = useCallback(async () => {
    if (!selectedRoom) return;
    setDeletingRoom(true);
    try {
      const res = await fetchWithSession(`/api/cross-platform/rooms/${selectedRoom._id}`, { method: 'DELETE' });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          showToast("Success", `Room "${selectedRoom.name}" deleted!`, "success");
          setFederatedRooms(prev => prev.filter(r => r._id !== selectedRoom._id));
          if (selectedConversation._id === selectedRoom._id) setSelectedConversation({});
          setTimeout(() => fetchFederatedRooms(), 500);
        } else {
          showToast("Error", data.error || "Failed to delete room", "error");
        }
      } else {
        showToast("Error", "Failed to delete room", "error");
      }
    } catch {
      showToast("Error", "Failed to delete room", "error");
    } finally {
      setDeletingRoom(false);
      setShowDeleteRoomModal(false);
      setSelectedRoom(null);
    }
  }, [selectedRoom, showToast, fetchFederatedRooms, selectedConversation, setSelectedConversation]);

  const handleCopyRoomId = useCallback(async () => {
    const codeToCopy = selectedRoom?.roomCode || selectedRoom?._id;
    if (!codeToCopy) return;
    try {
      await navigator.clipboard.writeText(codeToCopy);
      setHasCopied(true);
      showToast("Success", "Room Code copied!", "success");
      setTimeout(() => setHasCopied(false), 2000);
    } catch {
      showToast("Error", "Failed to copy room code", "error");
    }
  }, [selectedRoom, showToast]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetchWithSession("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        const valid = data.filter((c: any) =>
          c.participants?.length > 0 && c.participants.every((p: any) => p?._id && p?.username)
        );
        setConversations(valid);
      }
    } catch (error: any) {
      showToast("Error", error.message, "error");
    } finally {
      setLoadingConversations(false);
    }
  }, [showToast, setConversations]);

  const handleMessagesSeen = useCallback(({ conversationId }: { conversationId: string }) => {
    setConversations(prev => {
      const idx = prev.findIndex(c => c._id === conversationId);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], lastMessage: { ...updated[idx].lastMessage, seen: true } };
      return updated;
    });
  }, [setConversations]);

  const handleNewMessage = useCallback((message: any) => {
    setConversations(prev => {
      const idx = prev.findIndex(c => c._id === message.conversationId);
      if (idx === -1) { fetchConversations(); return prev; }
      const updated = [...prev];
      const text = message.text || (message.img ? "Image" : message.gif ? "GIF" : message.voice ? "Voice message" : message.file ? "File" : "Message");
      updated[idx] = { ...updated[idx], lastMessage: { text, sender: message.sender, seen: currentUser?._id === message.sender } };
      return updated;
    });
  }, [setConversations, fetchConversations, currentUser?._id]);

  const handleConversationUpdate = useCallback((conversation: any) => {
    setConversations(prev => {
      const idx = prev.findIndex(c => c._id === conversation._id);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = conversation;
        return updated;
      }
      return [...prev, conversation];
    });
  }, [setConversations]);

  const handleGoToMainMessages = useCallback(() => {
    setSelectedConversation({});
  }, [setSelectedConversation]);

  const filteredConversations = useMemo(() => {
    // 1. Get current active conversations
    const validConversations = conversations.filter(c =>
      c.participants?.length && !(!c.lastMessage?.text && c.mock) && c.lastMessage
    );

    if (!searchText) return validConversations;

    // 2. Filter existing conversations by search text
    const filteredActive = validConversations.filter(c =>
      c.participants?.some((p: any) => p.username?.toLowerCase().includes(searchText.toLowerCase()))
    );

    // 3. Find users from suggestions who match the search but don't have a conversation yet
    const suggestionMatches = userSuggestions
      .filter(u => !validConversations.some(c => c.participants?.some((p: any) => p._id === u._id)))
      .map(u => ({
        _id: `mock-${u._id}`,
        participants: [u],
        lastMessage: { text: "Start a conversation", sender: "", seen: true },
        mock: true,
        isSuggestion: true
      }));

    return [...filteredActive, ...suggestionMatches];
  }, [conversations, searchText, userSuggestions]);

  // Auto-select first conversation removed to show landing page by default
  /*
  useEffect(() => {
    if (!selectedConversation?._id) {
      if (isCrossPlatformMode && federatedRooms.length > 0) {
        const first = federatedRooms[0];
        setSelectedConversation({
          _id: first.roomId || first._id,
          name: first.name,
          groupPhoto: first.groupPhoto,
          roomCode: first.roomCode,
          isFederated: true,
          platforms: first.peers || []
        });
      } else if (!isCrossPlatformMode && filteredConversations.length > 0) {
        const first = filteredConversations[0];
        setSelectedConversation({
          _id: first._id,
          userId: first.participants?.[0]?._id,
          userProfilePic: first.participants?.[0]?.profilePic,
          username: first.participants?.[0]?.username,
          mock: first.mock,
        });
      }
    }
  }, [filteredConversations, federatedRooms, isCrossPlatformMode, selectedConversation?._id, setSelectedConversation]);
  */

  // Socket event listeners
  useEffect(() => {
    if (!socket) return;
    socket.on("messagesSeen", handleMessagesSeen);
    socket.on("newMessage", handleNewMessage);
    socket.on("conversationUpdate", handleConversationUpdate);
    return () => {
      socket.off("messagesSeen", handleMessagesSeen);
      socket.off("newMessage", handleNewMessage);
      socket.off("conversationUpdate", handleConversationUpdate);
    };
  }, [socket, handleMessagesSeen, handleNewMessage, handleConversationUpdate]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);
  useEffect(() => { if (isCrossPlatformMode) fetchFederatedRooms(); }, [isCrossPlatformMode, fetchFederatedRooms]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchText.trim() || !currentUser?._id) {
        setUserSuggestions([]);
        return;
      }
      try {
        const res = await fetchWithSession(`/api/users/chat-suggestions?query=${searchText.trim()}`);
        if (res.ok) {
          const data = await res.json();
          setUserSuggestions(Array.isArray(data) ? data : []);
        }
      } catch (error) {
        console.error("Error fetching chat suggestions:", error);
      }
    };

    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [searchText, currentUser?._id]);

  useEffect(() => {
    window.addEventListener('goToMainMessages', handleGoToMainMessages);
    return () => window.removeEventListener('goToMainMessages', handleGoToMainMessages);
  }, [handleGoToMainMessages]);

  return (
    <>
      <ModernChat
        conversations={filteredConversations}
        federatedRooms={federatedRooms}
        isCrossPlatformMode={isCrossPlatformMode}
        selectedConversation={selectedConversation}
        setSelectedConversation={setSelectedConversation}
        loading={loadingConversations || loadingFederatedRooms}
        searchText={searchText}
        setSearchText={setSearchText}
        onToggleMode={handleToggleCrossPlatform}
        onShowCreateRoom={() => setShowCreateRoomModal(true)}
        onShowJoinRoom={() => setShowJoinRoomModal(true)}
        onShareRoom={handleShareRoom}
        onDeleteRoom={handleDeleteRoom}
        onlineUsers={onlineUsers}
      />

      {/* Create Room Modal */}
      <Modal isOpen={showCreateRoomModal} onClose={() => setShowCreateRoomModal(false)} isCentered>
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <ModalContent bg={modalBgColor} borderRadius="2xl">
          <ModalHeader>Create Cross-Platform Room</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Text fontSize="sm" color="gray.500">Connect with Telegram and Discord users in a single panel!</Text>
              <Input
                placeholder="Enter room name..."
                value={newRoomName}
                onChange={(e) => setNewRoomName(e.target.value)}
                borderRadius="xl"
              />
            </VStack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setShowCreateRoomModal(false)}>Cancel</Button>
            <Button colorScheme="yellow" onClick={handleCreateRoom} isLoading={creatingRoom} isDisabled={!newRoomName.trim()} borderRadius="xl">Create</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Share Room Modal */}
      <Modal isOpen={showShareRoomModal} onClose={() => setShowShareRoomModal(false)} isCentered>
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <ModalContent bg={modalBgColor} borderRadius="2xl">
          <ModalHeader>Share Room Code</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4} align="stretch">
              <Text fontSize="sm" color="gray.500">Share this code with others so they can join this room from any platform!</Text>
              <Flex gap={2}>
                <Input value={selectedRoom?.roomCode || selectedRoom?._id || ""} isReadOnly borderRadius="xl" fontWeight="bold" textAlign="center" fontSize="xl" letterSpacing="2px" />
                <Button onClick={handleCopyRoomId} colorScheme={hasCopied ? "green" : "yellow"} borderRadius="xl" px={8}>
                  {hasCopied ? "Copied!" : "Copy"}
                </Button>
              </Flex>
            </VStack>
          </ModalBody>
        </ModalContent>
      </Modal>

      {/* Join Room Modal */}
      <Modal isOpen={showJoinRoomModal} onClose={() => setShowJoinRoomModal(false)} isCentered>
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <ModalContent bg={modalBgColor} borderRadius="2xl">
          <ModalHeader>Join Cross-Platform Room</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <VStack spacing={4}>
              <Text fontSize="sm" color="gray.500">Enter a room code or ID to join an existing conversation.</Text>
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
            <Button variant="ghost" mr={3} onClick={() => setShowJoinRoomModal(false)}>Cancel</Button>
            <Button colorScheme="yellow" onClick={handleJoinRoom} isLoading={joiningRoom} isDisabled={!joinRoomId.trim()} borderRadius="xl">Join Room</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>

      {/* Delete Room Modal */}
      <Modal isOpen={showDeleteRoomModal} onClose={() => setShowDeleteRoomModal(false)} isCentered>
        <ModalOverlay bg="blackAlpha.700" backdropFilter="blur(4px)" />
        <ModalContent bg={modalBgColor} borderRadius="2xl">
          <ModalHeader>Delete Room?</ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            <Text fontWeight="bold" color="red.500">Warning: This will destroy the room forever!</Text>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={() => setShowDeleteRoomModal(false)}>Cancel</Button>
            <Button colorScheme="red" onClick={handleConfirmDeleteRoom} isLoading={deletingRoom} borderRadius="xl">Delete</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default ChatPage;
