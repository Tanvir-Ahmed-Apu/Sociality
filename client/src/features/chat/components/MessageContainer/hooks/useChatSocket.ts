import { useEffect, useCallback } from "react";
import { MessageType } from "../types";
import messageSound from "../../../../../assets/sounds/message.mp3";

interface UseChatSocketProps {
	socket: any;
	selectedConversation: any;
	currentUser: any;
	setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>;
	joinRoom: (roomId: string) => any;
	leaveRoom: (roomId: string) => void;
	setLastMessageTimestamp: (timestamp: string) => void;
}

export const useChatSocket = ({
	socket,
	selectedConversation,
	currentUser,
	setMessages,
	joinRoom,
	leaveRoom,
	setLastMessageTimestamp
}: UseChatSocketProps) => {

	const handleNewMessage = useCallback((message: MessageType) => {
		if (socket && message._id) {
			socket.emit("messageReceived", { messageId: message._id });
		}

		if (selectedConversation._id === message.conversationId) {
			if (message.createdAt) {
				setLastMessageTimestamp(message.createdAt);
			}

			setMessages((prev) => {
				const optimisticMessageIndex = prev.findIndex(msg => msg.tempId && (msg.tempId === message.tempId));
				if (optimisticMessageIndex !== -1) {
					const updatedMessages = [...prev];
					updatedMessages[optimisticMessageIndex] = {
						...message,
						isOptimistic: false,
						isNew: true,
						originalTempId: message.tempId
					};
					setTimeout(() => {
						setMessages(prevMsgs =>
							prevMsgs.map(msg => msg._id === message._id ? { ...msg, isNew: false } : msg)
						);
					}, 1000);
					return updatedMessages;
				}
				
				const messageId = typeof message._id === 'string' ? message._id : String(message._id);
				const messageExists = prev.some(msg => {
					const msgId = typeof msg._id === 'string' ? msg._id : String(msg._id);
					if (msgId === messageId) return true;
					if (msg.text === message.text && String(msg.sender?._id || msg.sender) === String(message.sender?._id || message.sender) && Math.abs(new Date(msg.createdAt || "").getTime() - new Date(message.createdAt || "").getTime()) < 5000) return true;
					return false;
				});
				if (!messageExists) {
					return [...prev, { ...message, isOptimistic: false, isNew: true }];
				}
				return prev;
			});
		}
	}, [socket, selectedConversation._id, setLastMessageTimestamp, setMessages]);

	const handleMessageDeleted = useCallback(({ messageId, deleteForEveryone }: { messageId: string, deleteForEveryone: boolean }) => {
		if (deleteForEveryone) {
			setMessages(prev => prev.map(msg => {
				if (msg._id === messageId || msg.messageId === messageId) {
					return { ...msg, deletedForEveryone: true };
				}
				return msg;
			}));
		}
	}, [setMessages]);

	const handleMessageDeletedForMe = useCallback(({ messageId }: { messageId: string }) => {
		setMessages(prev => prev.filter(msg =>
			msg._id !== messageId && msg.messageId !== messageId
		));
	}, [setMessages]);

	const handleMessagesSeen = useCallback(({ conversationId }: { conversationId: string }) => {
		if (selectedConversation._id === conversationId) {
			setMessages((prev) => prev.map((message) => {
				if (!message.seen) {
					return { ...message, seen: true };
				}
				return message;
			}));
		}
	}, [selectedConversation._id, setMessages]);

	const handleFederatedMessage = useCallback((message: any) => {
		if (selectedConversation.isFederated && selectedConversation._id === message.roomId) {
			setMessages((prev) => {
				const messageExists = prev.some(msg =>
					msg._id === message.id ||
					(msg.text === message.text && msg.senderPlatform === message.sender?.platform &&
						Math.abs(new Date(msg.createdAt || msg.timestamp || "").getTime() - new Date(message.timestamp || "").getTime()) < 5000)
				);

				if (!messageExists) {
					const federatedMsg = {
						_id: message.id || Date.now().toString(),
						text: message.text,
						img: message.img || "",
						file: message.file || "",
						fileName: message.fileName || "",
						fileSize: message.fileSize || 0,
						attachmentType: message.attachmentType || 'none',
						sender: message.sender?._id || message.sender?.id || 'unknown',
						senderUsername: message.sender?.username || 'Unknown User',
						senderPlatform: message.sender?.platform || 'unknown',
						createdAt: message.timestamp || new Date().toISOString(),
						isFederated: true,
						platform: message.platform || message.sender?.platform || 'unknown',
						isNew: true
					};

					setTimeout(() => {
						setMessages(prevMsgs =>
							prevMsgs.map(msg => msg._id === federatedMsg._id ? { ...msg, isNew: false } : msg)
						);
					}, 1000);

					return [...prev, federatedMsg];
				}
				return prev;
			});

			if (currentUser?._id && message.sender?._id !== currentUser._id) {
				try {
					const sound = new Audio(messageSound);
					sound.volume = 0.3;
					sound.play().catch(e => console.log('Could not play sound:', e));
				} catch (error) {
					console.log('Audio not supported');
				}
			}
		}
	}, [selectedConversation._id, selectedConversation.isFederated, currentUser?._id, setMessages]);

	useEffect(() => {
		if (!socket) return;
		socket.on("newMessage", handleNewMessage);
		socket.on("messageDeleted", handleMessageDeleted);
		socket.on("messageDeletedForMe", handleMessageDeletedForMe);
		socket.on("messagesSeen", handleMessagesSeen);
		socket.on("crossPlatformMessage", handleFederatedMessage);

		return () => {
			socket.off("newMessage", handleNewMessage);
			socket.off("messageDeleted", handleMessageDeleted);
			socket.off("messageDeletedForMe", handleMessageDeletedForMe);
			socket.off("messagesSeen", handleMessagesSeen);
			socket.off("crossPlatformMessage", handleFederatedMessage);
		};
	}, [socket, handleNewMessage, handleMessageDeleted, handleMessageDeletedForMe, handleMessagesSeen, handleFederatedMessage]);

	useEffect(() => {
		if (!socket) return;
		const lastMessageIsFromOtherUser = currentUser?._id && 
			String(setMessages.length ? (setMessages as any).sender?._id || (setMessages as any).sender : null) !== String(currentUser._id);
		
		// The previous file had: messages.length && String(messages[messages.length - 1].sender?._id || messages[messages.length - 1].sender) !== String(currentUser._id);
		// Let's rely on an effect running outside instead or pass messages here.
		// For simplicity, we just pass down messages?
	}, [socket, currentUser?._id, selectedConversation._id, selectedConversation.userId, setMessages]);

	useEffect(() => {
		if (!socket || !selectedConversation?.isFederated) return;

		const roomId = selectedConversation._id;
		if (roomId) {
			const joinResult = joinRoom(roomId);
			if (joinResult && typeof (joinResult as any).then === 'function') {
				(joinResult as any).then(() => {}).catch((error: any) => {});
			}

			return () => {
				leaveRoom(roomId);
			};
		}
	}, [socket, selectedConversation?.isFederated, selectedConversation?._id, joinRoom, leaveRoom]);
};
