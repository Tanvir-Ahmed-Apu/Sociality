import { useCallback, useEffect, useState } from "react";
import { useRecoilState } from "recoil";
import { Conversation, selectedConversationAtom } from "../../../atoms";
import useShowToast from "../../../hooks/useShowToast";
import { fetchWithSession } from "../../../utils/api";

export const useCrossPlatformRooms = () => {
  const [isCrossPlatformMode, setIsCrossPlatformMode] = useState(false);
  const [federatedRooms, setFederatedRooms] = useState<Conversation[]>([]);
  const [loadingFederatedRooms, setLoadingFederatedRooms] = useState(false);
  const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
  const [newRoomName, setNewRoomName] = useState("");
  const [creatingRoom, setCreatingRoom] = useState(false);
  const [showShareRoomModal, setShowShareRoomModal] = useState(false);
  const [showJoinRoomModal, setShowJoinRoomModal] = useState(false);
  const [showDeleteRoomModal, setShowDeleteRoomModal] = useState(false);
  const [selectedRoom, setSelectedRoom] = useState<Conversation | null>(null);
  const [joinRoomId, setJoinRoomId] = useState("");
  const [joiningRoom, setJoiningRoom] = useState(false);
  const [deletingRoom, setDeletingRoom] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);

  const [selectedConversation, setSelectedConversation] = useRecoilState(
    selectedConversationAtom
  );
  const showToast = useShowToast();

  const fetchFederatedRooms = useCallback(async () => {
    if (!isCrossPlatformMode) return;
    setLoadingFederatedRooms(true);
    try {
      const res = await fetchWithSession("/api/cross-platform/rooms");
      if (res.ok) {
        const data = await res.json();
        if (data.success) setFederatedRooms(data.rooms);
        else
          showToast("Error", data.error || "Failed to fetch rooms", "error");
      } else {
        const err = await res
          .json()
          .catch(() => ({ error: "Failed to fetch rooms" }));
        showToast("Error", err.error || "Failed to fetch rooms", "error");
      }
    } catch {
      showToast("Error", "Failed to connect to federation service", "error");
    } finally {
      setLoadingFederatedRooms(false);
    }
  }, [isCrossPlatformMode, showToast]);

  const handleCreateRoom = useCallback(async () => {
    if (!newRoomName.trim()) {
      showToast("Error", "Please enter a room name", "error");
      return;
    }
    setCreatingRoom(true);
    try {
      const res = await fetchWithSession("/api/cross-platform/rooms", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newRoomName.trim(),
          allowedPlatforms: ["sociality", "telegram", "discord"],
        }),
      });
      const data = await res.json();
      if (data.success) {
        showToast(
          "Success",
          `Room "${newRoomName}" created! Code: ${data.room.roomCode}`,
          "success"
        );
        setNewRoomName("");
        setShowCreateRoomModal(false);
        await fetchFederatedRooms();
        setSelectedConversation({
          _id: data.room.roomId,
          name: data.room.name,
          isFederated: true,
          platforms: [],
        });
      } else {
        showToast("Error", data.error || "Failed to create room", "error");
      }
    } catch {
      showToast("Error", "Failed to create room", "error");
    } finally {
      setCreatingRoom(false);
    }
  }, [newRoomName, showToast, fetchFederatedRooms, setSelectedConversation]);

  const handleJoinRoom = useCallback(async () => {
    if (!joinRoomId.trim()) {
      showToast("Error", "Please enter a room code or ID", "error");
      return;
    }
    setJoiningRoom(true);
    try {
      const res = await fetchWithSession(
        `/api/cross-platform/rooms/${joinRoomId.trim()}/join`,
        { method: "POST" }
      );
      const data = await res.json();
      if (data.success) {
        showToast("Success", `Joined room "${data.room.name}"!`, "success");
        setJoinRoomId("");
        setShowJoinRoomModal(false);
        await fetchFederatedRooms();
        setSelectedConversation({
          _id: data.room.roomId,
          name: data.room.name,
          isFederated: true,
          platforms: [],
        });
      } else {
        showToast("Error", data.error || "Failed to join room", "error");
      }
    } catch {
      showToast("Error", "Failed to join room", "error");
    } finally {
      setJoiningRoom(false);
    }
  }, [joinRoomId, showToast, fetchFederatedRooms, setSelectedConversation]);

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

  const handleShareRoom = useCallback(
    (room: Conversation, event: React.MouseEvent) => {
      event?.stopPropagation?.();
      setSelectedRoom(room);
      setShowShareRoomModal(true);
    },
    []
  );

  const handleDeleteRoom = useCallback(
    (room: Conversation, event: React.MouseEvent) => {
      event?.stopPropagation?.();
      setSelectedRoom(room);
      setShowDeleteRoomModal(true);
    },
    []
  );

  const handleConfirmDeleteRoom = useCallback(async () => {
    if (!selectedRoom) return;
    setDeletingRoom(true);
    try {
      const res = await fetchWithSession(
        `/api/cross-platform/rooms/${selectedRoom._id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          showToast(
            "Success",
            `Room "${selectedRoom.name}" deleted!`,
            "success"
          );
          setFederatedRooms((prev) =>
            prev.filter((r) => r._id !== selectedRoom._id)
          );
          if (selectedConversation._id === selectedRoom._id)
            setSelectedConversation({});
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
  }, [
    selectedRoom,
    showToast,
    fetchFederatedRooms,
    selectedConversation,
    setSelectedConversation,
  ]);

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

  useEffect(() => {
    if (isCrossPlatformMode) fetchFederatedRooms();
  }, [isCrossPlatformMode, fetchFederatedRooms]);

  return {
    isCrossPlatformMode,
    federatedRooms,
    loadingFederatedRooms,
    showCreateRoomModal,
    setShowCreateRoomModal,
    newRoomName,
    setNewRoomName,
    creatingRoom,
    handleCreateRoom,
    showShareRoomModal,
    setShowShareRoomModal,
    showJoinRoomModal,
    setShowJoinRoomModal,
    showDeleteRoomModal,
    setShowDeleteRoomModal,
    selectedRoom,
    joinRoomId,
    setJoinRoomId,
    joiningRoom,
    handleJoinRoom,
    deletingRoom,
    hasCopied,
    handleToggleCrossPlatform,
    handleShareRoom,
    handleDeleteRoom,
    handleConfirmDeleteRoom,
    handleCopyRoomId,
  };
};
