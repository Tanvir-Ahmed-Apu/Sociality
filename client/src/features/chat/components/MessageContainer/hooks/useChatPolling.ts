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
		if (selectedConversation.isFederated) return;
		if (isConnected) return;

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
