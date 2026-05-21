import { useState, useCallback, useEffect } from "react";
import { MessageType } from "../types";
import { fetchWithSession } from "../../../../../utils/api";
import useShowToast from "../../../../../hooks/useShowToast";

export const useChatMessages = (selectedConversation: any) => {
	const showToast = useShowToast();
	const [loadingMessages, setLoadingMessages] = useState(true);
	const [messages, setMessages] = useState<MessageType[]>([]);
	const [accessDenied, setAccessDenied] = useState(false);
	const [joinCode, setJoinCode] = useState("");
	const [joining, setJoining] = useState(false);
	const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string | null>(null);

	// Update the last message timestamp when messages change
	useEffect(() => {
		if (messages.length > 0) {
			const lastMsg = messages[messages.length - 1];
			setLastMessageTimestamp(lastMsg.createdAt || null);
		}
	}, [messages]);

	const getMessages = useCallback(async () => {
		setLoadingMessages(true);
		setMessages([]);
		setAccessDenied(false);
		try {
			if (selectedConversation.mock) {
				setLoadingMessages(false);
				return;
			}

			// Handle federated rooms
			if (selectedConversation.isFederated) {
				try {
					const res = await fetchWithSession(`/api/cross-platform/rooms/${selectedConversation._id}/messages`);
					if (res.ok) {
						const data = await res.json();
						if (data.success && data.messages) {
							const federatedMessages = data.messages.map((msg: any) => ({
								_id: msg.id || msg._id || Date.now().toString(),
								text: msg.text || msg.content,
								img: msg.img || "",
								file: msg.file || "",
								fileName: msg.fileName || "",
								fileSize: msg.fileSize || 0,
								attachmentType: msg.attachmentType || 'none',
								sender: msg.sender?._id || msg.from?.userId || 'unknown',
								senderUsername: msg.sender?.username || msg.from?.displayName || 'Unknown User',
								senderPlatform: msg.sender?.platform || msg.from?.platform || 'unknown',
								createdAt: msg.timestamp || msg.sentAt || msg.createdAt || new Date().toISOString(),
								isFederated: true,
								platform: msg.platform || msg.sender?.platform || msg.from?.platform || 'unknown'
							}));
							setMessages(federatedMessages);
						}
					} else if (res.status === 403) {
						setAccessDenied(true);
					}
				} catch (error) {
					console.log('No existing messages found for federated room:', error);
				}
				setLoadingMessages(false);
				return;
			}

			// Handle regular conversations
			if (!selectedConversation.userId) {
				setLoadingMessages(false);
				return;
			}

			await new Promise(resolve => setTimeout(resolve, 300));
			const res = await fetchWithSession(`/api/messages/${selectedConversation.userId}`);
			if (res.ok) {
				const data = await res.json();
				const animatedMessages = data.map((msg: any, index: number) => ({
					...msg,
					isNew: true,
					animationDelay: `${index * 50}ms`
				}));
				setMessages(animatedMessages);
				setTimeout(() => {
					setMessages(prev => prev.map(msg => ({ ...msg, isNew: false })));
				}, 1500);
			} else {
				const errorData = await res.json().catch(() => ({ error: 'Failed to fetch messages' }));
				showToast("Error", errorData.error || 'Failed to fetch messages', "error");
			}
		} catch (error: any) {
			showToast("Error", error.message || "Failed to load messages", "error");
		} finally {
			setLoadingMessages(false);
		}
	}, [selectedConversation, showToast]);

	// Prevent fetching messages with undefined userId or handle federated rooms
	useEffect(() => {
		if (!selectedConversation || (!selectedConversation.userId && !selectedConversation.isFederated)) {
			setMessages([]);
			setLoadingMessages(false);
			return;
		}
		getMessages();
		// eslint-disable-next-line
	}, [selectedConversation]);

	const handleDeleteMessage = useCallback(async (messageId: string, deleteForEveryone = false) => {
		const originalMessages = messages;
		try {
			if (deleteForEveryone) {
				setMessages(prev => prev.map(msg => {
					if (msg._id === messageId || msg.messageId === messageId) {
						return { ...msg, deletedForEveryone: true };
					}
					return msg;
				}));
			} else {
				setMessages(prev => prev.filter(msg =>
					msg._id !== messageId && msg.messageId !== messageId
				));
			}

			let apiUrl = selectedConversation.isFederated 
				? `/api/cross-platform/rooms/${selectedConversation._id}/messages/${messageId}`
				: `/api/messages/${messageId}`;

			const res = await fetchWithSession(apiUrl, {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ deleteForEveryone }),
			});

			const data = await res.json();

			if (!res.ok || data.error) {
				showToast("Error", data.error || "Failed to delete message", "error");
				setMessages(originalMessages);
			} else {
				showToast("Success", "Message deleted successfully", "success");
			}
		} catch (error: any) {
			showToast("Error", error.message || "An error occurred", "error");
			setMessages(originalMessages);
		}
	}, [messages, showToast, selectedConversation.isFederated, selectedConversation._id]);

	const handleStarMessage = useCallback(async (messageId: string) => {
		try {
			let apiUrl = selectedConversation.isFederated
				? `/api/cross-platform/messages/${messageId}/star`
				: `/api/messages/${messageId}/star`;

			const res = await fetchWithSession(apiUrl, { method: "PUT" });
			const data = await res.json();

			if (data.success) {
				setMessages(prev => prev.map(msg => 
					(msg._id === messageId || msg.messageId === messageId) 
					? { ...msg, isStarred: data.isStarred } 
					: msg
				));
				showToast("Success", data.isStarred ? "Message starred" : "Message unstarred", "success");
			} else {
				showToast("Error", data.error || "Failed to star message", "error");
			}
		} catch (error: any) {
			showToast("Error", error.message || "An error occurred", "error");
		}
	}, [selectedConversation, showToast]);

	const handleJoinWithCode = async () => {
		if (!joinCode.trim()) return;
		setJoining(true);
		try {
			const res = await fetchWithSession(`/api/cross-platform/rooms/${joinCode.trim()}/join`, {
				method: 'POST',
			});
			const data = await res.json();
			if (data.success) {
				showToast("Success", `Joined room "${data.room.name}"!`, "success");
				setAccessDenied(false);
				getMessages();
			} else {
				showToast("Error", data.error || "Failed to join room", "error");
			}
		} catch (err) {
			showToast("Error", "Failed to join room", "error");
		} finally {
			setJoining(false);
		}
	};

	return {
		messages,
		setMessages,
		loadingMessages,
		accessDenied,
		joinCode,
		setJoinCode,
		joining,
		lastMessageTimestamp,
		getMessages,
		handleDeleteMessage,
		handleStarMessage,
		handleJoinWithCode
	};
};
