import { useCallback, useEffect, useMemo, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { conversationsAtom, selectedConversationAtom, userAtom } from "../../../atoms";
import { useSocket } from "../../../hooks/useSocket";
import useShowToast from "../../../hooks/useShowToast";
import { fetchWithSession } from "../../../utils/api";

export const useChatConversations = () => {
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedConversation, setSelectedConversation] = useRecoilState(selectedConversationAtom);
  const [conversations, setConversations] = useRecoilState(conversationsAtom);
  const currentUser = useRecoilValue(userAtom);
  const showToast = useShowToast();
  const { socket, onlineUsers } = useSocket();
  const [userSuggestions, setUserSuggestions] = useState<any[]>([]);

  const fetchConversations = useCallback(async () => {
    try {
      const res = await fetchWithSession("/api/messages/conversations");
      if (res.ok) {
        const data = await res.json();
        const valid = data.filter(
          (c: any) =>
            c.participants?.length > 0 &&
            c.participants.every((p: any) => p?._id && p?.username)
        );
        setConversations(valid);
      }
    } catch (error: any) {
      showToast("Error", error.message, "error");
    } finally {
      setLoadingConversations(false);
    }
  }, [showToast, setConversations]);

  const handleMessagesSeen = useCallback(
    ({ conversationId }: { conversationId: string }) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === conversationId);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = {
          ...updated[idx],
          lastMessage: { ...updated[idx].lastMessage, seen: true },
        };
        return updated;
      });
    },
    [setConversations]
  );

  const handleNewMessage = useCallback(
    (message: any) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === message.conversationId);
        if (idx === -1) {
          fetchConversations();
          return prev;
        }
        const updated = [...prev];
        const text =
          message.text ||
          (message.img
            ? "Image"
            : message.gif
              ? "GIF"
              : message.voice
                ? "Voice message"
                : message.file
                  ? "File"
                  : "Message");
        updated[idx] = {
          ...updated[idx],
          lastMessage: {
            text,
            sender: message.sender,
            seen: currentUser?._id === message.sender,
          },
        };
        return updated;
      });
    },
    [setConversations, fetchConversations, currentUser?._id]
  );

  const handleConversationUpdate = useCallback(
    (conversation: any) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c._id === conversation._id);
        if (idx !== -1) {
          const updated = [...prev];
          updated[idx] = conversation;
          return updated;
        }
        return [...prev, conversation];
      });
    },
    [setConversations]
  );

  const handleGoToMainMessages = useCallback(() => {
    setSelectedConversation({});
  }, [setSelectedConversation]);

  const filteredConversations = useMemo(() => {
    const validConversations = conversations.filter(
      (c) =>
        c.participants?.length &&
        !(!c.lastMessage?.text && c.mock) &&
        c.lastMessage
    );

    if (!searchText) return validConversations;

    const filteredActive = validConversations.filter((c) =>
      c.participants?.some((p: any) =>
        p.username?.toLowerCase().includes(searchText.toLowerCase())
      )
    );

    const suggestionMatches = userSuggestions
      .filter(
        (u) =>
          !validConversations.some((c) =>
            c.participants?.some((p: any) => p._id === u._id)
          )
      )
      .map((u) => ({
        _id: `mock-${u._id}`,
        participants: [u],
        lastMessage: { text: "Start a conversation", sender: "", seen: true },
        mock: true,
        isSuggestion: true,
      }));

    return [...filteredActive, ...suggestionMatches];
  }, [conversations, searchText, userSuggestions]);

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

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!searchText.trim() || !currentUser?._id) {
        setUserSuggestions([]);
        return;
      }
      try {
        const res = await fetchWithSession(
          `/api/users/chat-suggestions?query=${searchText.trim()}`
        );
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
    window.addEventListener("goToMainMessages", handleGoToMainMessages);
    return () =>
      window.removeEventListener("goToMainMessages", handleGoToMainMessages);
  }, [handleGoToMainMessages]);

  return {
    loadingConversations,
    searchText,
    setSearchText,
    selectedConversation,
    setSelectedConversation,
    filteredConversations,
    onlineUsers,
  };
};
