import { useState, useEffect } from "react";
import { MessageType } from "../types";
import { fetchWithSession } from "../../../../../utils/api";

interface UseChatPollingProps {
	selectedConversation: any;
	currentUser: any;
	socket: any;
	isConnected: boolean;
	lastMessageTimestamp: string | null;
	setMessages: React.Dispatch<React.SetStateAction<MessageType[]>>;
}

const normalizeFederatedMessage = (msg: any): MessageType => ({
	_id: msg.id || msg._id || msg.messageId || Date.now().toString(),
	messageId: msg.messageId || msg.id || msg._id,
	text: msg.text || msg.content || "",
	img: msg.img || "",
	file: msg.file || "",
	fileName: msg.fileName || "",
	fileSize: msg.fileSize || 0,
	attachmentType: msg.attachmentType || 'none',
	sender: msg.sender?._id || msg.from?.userId || msg.sender || 'unknown',
	senderUsername: msg.sender?.username || msg.from?.displayName || msg.senderUsername || 'Unknown User',
	senderPlatform: msg.sender?.platform || msg.from?.platform || msg.senderPlatform || 'unknown',
	createdAt: msg.timestamp || msg.sentAt || msg.createdAt || new Date().toISOString(),
	isFederated: true,
	platform: msg.platform || msg.sender?.platform || msg.from?.platform || msg.senderPlatform || 'unknown'
});

export const useChatPolling = ({
	selectedConversation,
	currentUser,
	socket,
	isConnected,
	lastMessageTimestamp,
	setMessages
}: UseChatPollingProps) => {
	const [pollingInterval, setPollingInterval] = useState(3000);
	const [isTabActive, setIsTabActive] = useState(true);

	useEffect(() => {
		const handleVisibilityChange = () => {
			const isVisible = document.visibilityState === 'visible';
			setIsTabActive(isVisible);
			setPollingInterval(isVisible ? 3000 : 10000);
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, []);

	useEffect(() => {
		if (!selectedConversation._id || selectedConversation.mock) return;
		if (!selectedConversation.isFederated && isConnected) return;

		let isPolling = false;
		let consecutiveEmptyPolls = 0;

		const messagePollingInterval = setInterval(async () => {
			if (isConnected) return;
			if (isPolling) return;

			if (consecutiveEmptyPolls > 5 && !isTabActive) {
				if (Math.random() > 0.3) return;
			}

			isPolling = true;

			try {
				if (selectedConversation.isFederated) {
					const res = await fetchWithSession(`/api/cross-platform/rooms/${selectedConversation._id}/messages`);
					if (!res.ok) {
						isPolling = false;
						return;
					}

					const data = await res.json();
					const polledMessages = Array.isArray(data.messages) ? data.messages : [];

					if (data.success && polledMessages.length > 0) {
						consecutiveEmptyPolls = 0;

						setMessages(prev => {
							const existingIds = new Set(prev.flatMap(msg => [
								String(msg._id || ""),
								String(msg.messageId || "")
							]));

							const uniqueNewMessages = polledMessages
								.map(normalizeFederatedMessage)
								.filter((msg: MessageType) =>
									!existingIds.has(String(msg._id || "")) &&
									!existingIds.has(String(msg.messageId || ""))
								)
								.map((msg: MessageType) => ({ ...msg, isNew: true }));

							if (uniqueNewMessages.length === 0) return prev;

							setTimeout(() => {
								setMessages(prevMsgs =>
									prevMsgs.map((msg: MessageType) => msg.isNew ? { ...msg, isNew: false } : msg)
								);
							}, 1000);

							return [...prev, ...uniqueNewMessages];
						});
					} else {
						consecutiveEmptyPolls++;
					}

					return;
				}

				const timestampParam = lastMessageTimestamp
					? `?since=${new Date(lastMessageTimestamp).toISOString()}`
					: '';

				const res = await fetchWithSession(`/api/messages/${selectedConversation.userId}${timestampParam}`);
				if (!res.ok) {
					isPolling = false;
					return;
				}

				const newMessages = await res.json();

				if (newMessages.length > 0) {
					consecutiveEmptyPolls = 0;

					setMessages(prev => {
						const existingIds = new Set(prev.map(msg =>
							typeof msg._id === 'string' ? msg._id : String(msg._id)
						));

						const uniqueNewMessages = newMessages
							.filter((msg: any) => !existingIds.has(typeof msg._id === 'string' ? msg._id : String(msg._id)))
							.map((msg: any) => ({ ...msg, isNew: true }));

						if (uniqueNewMessages.length > 0) {
							setTimeout(() => {
								setMessages(prevMsgs =>
									prevMsgs.map((msg: MessageType) => msg.isNew ? { ...msg, isNew: false } : msg)
								);
							}, 1000);

							return [...prev, ...uniqueNewMessages];
						}
						return prev;
					});

					if (socket && currentUser && newMessages.some((msg: any) => {
						const isOwn = currentUser && String(msg.sender?._id || msg.sender) === String(currentUser._id);
						return !isOwn;
					})) {
						socket.emit("markMessagesAsSeen", {
							conversationId: selectedConversation._id,
							userId: selectedConversation.userId,
						});
					}
				} else {
					consecutiveEmptyPolls++;
				}
			} catch (error) {
				console.error("Error polling for messages:", error);
			} finally {
				isPolling = false;
			}
		}, pollingInterval);

		return () => {
			clearInterval(messagePollingInterval);
		};
	}, [selectedConversation._id, selectedConversation.userId, selectedConversation.mock, selectedConversation.isFederated, currentUser?._id, lastMessageTimestamp, pollingInterval, isTabActive, socket, isConnected, setMessages]);
};
