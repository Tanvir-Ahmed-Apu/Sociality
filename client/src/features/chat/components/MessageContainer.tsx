import { Avatar, Box, Flex, Skeleton, SkeletonCircle, Text, IconButton, useColorModeValue, Menu, MenuButton, MenuList, MenuItem, AvatarBadge, Badge, HStack, VStack, Heading, Input, Button } from "@chakra-ui/react";

import Message from "./Message";
import MessageInput from "./MessageInput";
import GroupSettingsModal from "./GroupSettingsModal";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import useShowToast from "../../../hooks/useShowToast";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userAtom, conversationsAtom, selectedConversationAtom } from "../../../atoms";
import { useSocket } from "../../../hooks/useSocket";
import messageSound from "../../../assets/sounds/message.mp3";

import { formatDistanceToNow } from "date-fns";
import { BsChatDots, BsThreeDotsVertical } from "react-icons/bs";
import { FaShare, FaTrash, FaCog, FaGlobe } from "react-icons/fa";
import { fetchWithSession } from "../../../utils/api";
import ChatRightSidebar from "./ChatRightSidebar";
import { FiVideo, FiPhone, FiSearch, FiMoreVertical } from "react-icons/fi";

interface MessageContainerProps {
	onShareRoom?: (room: any, event: React.MouseEvent) => void;
	onDeleteRoom?: (room: any, event: React.MouseEvent) => void;
}

export interface MessageType {
	_id: string;
	text?: string;
	img?: string;
	file?: string;
	fileName?: string;
	fileSize?: number;
	attachmentType?: string;
	sender: string;
	senderUsername?: string;
	senderPlatform?: string;
	createdAt?: string;
	isFederated?: boolean;
	platform?: string;
	isNew?: boolean;
	tempId?: string;
	isTemp?: boolean;
	originalTempId?: string;
	isOptimistic?: boolean;
	animationDelay?: string;
	conversationId?: string;
	seen?: boolean;
	deletedForEveryone?: boolean;
	messageId?: string;
	timestamp?: string;
}

const MessageContainer = ({
	onShareRoom,
	onDeleteRoom
}: MessageContainerProps) => {
	const showToast = useShowToast();
	const selectedConversation = useRecoilValue(selectedConversationAtom);
	const [loadingMessages, setLoadingMessages] = useState(true);
	const [messages, setMessages] = useState<MessageType[]>([]);
	const currentUser = useRecoilValue(userAtom);
	const { socket, isConnected, onlineUsers, userLastSeen, joinRoom, leaveRoom } = useSocket();
	const setConversations = useSetRecoilState(conversationsAtom);
	const setSelectedConversation = useSetRecoilState(selectedConversationAtom);
	const listRef = useRef<any>(null);
	const containerRef = useRef<HTMLDivElement>(null);

	// Theme-aware colors
	const bgColor = useColorModeValue("white", "#0A0A0A");
	const headerBgColor = useColorModeValue("white", "#0A0A0A");
	const borderColor = useColorModeValue("gray.100", "whiteAlpha.100");
	const textColor = useColorModeValue("black", "white");
	const mutedTextColor = useColorModeValue("gray.500", "gray.400");
	const timestampBg = useColorModeValue("rgba(0, 0, 0, 0.05)", "rgba(30, 30, 30, 0.7)");
	const chatHeaderBg = useColorModeValue("rgba(255, 255, 255, 0.95)", "rgba(0, 0, 0, 0.7)");
	const chatHeaderTextColor = useColorModeValue("black", "white");
	const chatContainerBg = useColorModeValue("linear(to-b, #F7FAFC 0%, #EDF2F7 100%)", "linear(to-b, #0A0A0A 0%, #000000 100%)");
	const chatDotPattern = useColorModeValue("rgba(0,0,0,0.03)", "rgba(255,255,255,0.03)");

	// Scrollbar theme-aware color for React Window
	const scrollbarColor = useColorModeValue('rgba(0, 0, 0, 0.2) transparent', 'rgba(255, 255, 255, 0.2) transparent');

	const [lastMessageTimestamp, setLastMessageTimestamp] = useState<string | null>(null);
	const [pollingInterval, setPollingInterval] = useState(3000); // Start with 3s polling
	const [isTabActive, setIsTabActive] = useState(true);
	const [showGroupSettings, setShowGroupSettings] = useState(false);
	const [showRightSidebar, setShowRightSidebar] = useState(false);
	const [accessDenied, setAccessDenied] = useState(false);
	const [joinCode, setJoinCode] = useState("");
	const [joining, setJoining] = useState(false);

	const messagesEndRef = useRef<HTMLDivElement>(null);

	// Optimize back button click handler
	const handleBackClick = useCallback(() => {
		// Instead of window.history.back, always go to main message view
		const event = new CustomEvent('goToMainMessages');
		window.dispatchEvent(event);
	}, []);

	// Handler for new messages
	const handleNewMessage = useCallback((message: MessageType) => {
		// Send acknowledgment to server
		if (socket && message._id) {
			socket.emit("messageReceived", { messageId: message._id });
		}

		// Only process messages for the current conversation
		if (selectedConversation._id === message.conversationId) {
			// Update the last message timestamp for polling fallback
			if (message.createdAt) {
				setLastMessageTimestamp(message.createdAt);
			}

			setMessages((prev) => {
				// Robust reconciliation: Replace optimistic message with real one if tempId matches
				const optimisticMessageIndex = prev.findIndex(msg => msg.tempId && (msg.tempId === message.tempId));
				if (optimisticMessageIndex !== -1) {
					const updatedMessages = [...prev];
					updatedMessages[optimisticMessageIndex] = {
						...message,
						isOptimistic: false,
						isNew: true,
						// Keep the original tempId for reference
						originalTempId: message.tempId
					};
					setTimeout(() => {
						setMessages(prevMsgs =>
							prevMsgs.map(msg => msg._id === message._id ? { ...msg, isNew: false } : msg)
						);
					}, 1000);
					return updatedMessages;
				}
				// Otherwise, add if not already present (by _id)
				const messageId = typeof message._id === 'string' ? message._id : String(message._id);
				const messageExists = prev.some(msg => {
					const msgId = typeof msg._id === 'string' ? msg._id : String(msg._id);
					if (msgId === messageId) return true;
					if (msg.text === message.text && String(msg.sender?._id || msg.sender) === String(message.sender?._id || message.sender) && Math.abs(new Date(msg.createdAt || "").getTime() - new Date(message.createdAt || "").getTime()) < 5000) return true;
					return false;
				});
				if (!messageExists) {
					const newMessage = { ...message, isOptimistic: false, isNew: true };
					const updatedMessages = [...prev, newMessage];

					return updatedMessages;
				}
				return prev;
			});
		}
	}, [socket, selectedConversation._id]);

	// Handler for deleted messages (delete for everyone)
	const handleMessageDeleted = useCallback(({ messageId, deleteForEveryone }: { messageId: string, deleteForEveryone: boolean }) => {
		if (deleteForEveryone) {
			// If deleted for everyone, update the message in UI
			setMessages(prev => prev.map(msg => {
				if (msg._id === messageId || msg.messageId === messageId) {
					return { ...msg, deletedForEveryone: true };
				}
				return msg;
			}));
		}
	}, []);

	// Handler for messages deleted for current user only
	const handleMessageDeletedForMe = useCallback(({ messageId }: { messageId: string }) => {
		// Remove message from current user's view only
		setMessages(prev => prev.filter(msg =>
			msg._id !== messageId && msg.messageId !== messageId
		));
	}, []);

	// Handler for messages seen
	const handleMessagesSeen = useCallback(({ conversationId }: { conversationId: string }) => {
		if (selectedConversation._id === conversationId) {
			setMessages((prev) => {
				const updatedMessages = prev.map((message) => {
					if (!message.seen) {
						return {
							...message,
							seen: true,
						};
					}
					return message;
				});
				return updatedMessages;
			});
		}
	}, [selectedConversation._id]);

	// Handler for federated messages
	const handleFederatedMessage = useCallback((message: any) => {
		console.log('Received crossPlatformMessage event:', message);
		console.log('Current selected conversation:', selectedConversation);

		// Only process messages for the current federated room
		if (selectedConversation.isFederated && selectedConversation._id === message.roomId) {
			console.log('Processing federated message for current room');

			setMessages((prev) => {
				// Check if message already exists
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

					console.log('Adding new federated message:', federatedMsg);

					// Remove animation class after animation completes
					setTimeout(() => {
						setMessages(prevMsgs =>
							prevMsgs.map(msg => msg._id === federatedMsg._id ? { ...msg, isNew: false } : msg)
						);
					}, 1000);

					return [...prev, federatedMsg];
				} else {
					console.log('Message already exists, skipping');
				}
				return prev;
			});

			// Play message sound for federated messages (only if not from current user)
			if (currentUser?._id && message.sender?._id !== currentUser._id) {
				try {
					const sound = new Audio(messageSound);
					sound.volume = 0.3;
					sound.play().catch(e => console.log('Could not play sound:', e));
				} catch (error) {
					console.log('Audio not supported');
				}
			}
		} else {
			console.log('Ignoring message - not for current federated room or not in federated mode');
		}
	}, [selectedConversation._id, selectedConversation.isFederated, currentUser?._id]);

	// Function to handle message deletion
	const handleDeleteMessage = useCallback(async (messageId: string, deleteForEveryone = false) => {
		const originalMessages = messages;
		try {

			// Optimistic update
			if (deleteForEveryone) {
				setMessages(prev => prev.map(msg => {
					if (msg._id === messageId || msg.messageId === messageId) {
						return { ...msg, deletedForEveryone: true };
					}
					return msg;
				}));
			} else {
				// Remove message from current user's view only
				setMessages(prev => prev.filter(msg =>
					msg._id !== messageId && msg.messageId !== messageId
				));
			}

			// Determine API endpoint based on conversation type
			let apiUrl;
			if (selectedConversation.isFederated) {
				// Cross-platform message deletion
				apiUrl = `/api/cross-platform/rooms/${selectedConversation._id}/messages/${messageId}`;
			} else {
				// Regular message deletion
				apiUrl = `/api/messages/${messageId}`;
			}

			// API call to delete message
			const res = await fetchWithSession(apiUrl, {
				method: "DELETE",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ deleteForEveryone }),
			});

			const data = await res.json();

			if (!res.ok || data.error) {
				showToast("Error", data.error || "Failed to delete message", "error");
				// Revert changes on error
				setMessages(originalMessages);
			} else {
				showToast("Success", "Message deleted successfully", "success");
			}
		} catch (error: any) {
			showToast("Error", error.message || "An error occurred", "error");
			// Revert changes on error
			setMessages(originalMessages);
		}
	}, [messages, showToast, selectedConversation.isFederated, selectedConversation._id]);

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
				getMessages(); // Reload messages
			} else {
				showToast("Error", data.error || "Failed to join room", "error");
			}
		} catch (err) {
			showToast("Error", "Failed to join room", "error");
		} finally {
			setJoining(false);
		}
	};

	// Function to handle message starring
	const handleStarMessage = useCallback(async (messageId: string) => {
		try {
			// Determine API endpoint based on conversation type
			let apiUrl;
			if (selectedConversation.isFederated) {
				apiUrl = `/api/cross-platform/messages/${messageId}/star`;
			} else {
				apiUrl = `/api/messages/${messageId}/star`;
			}

			const res = await fetchWithSession(apiUrl, {
				method: "PUT",
			});

			const data = await res.json();

			if (data.success) {
				// Update local state
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

	// Handle group update
	const handleUpdateGroup = useCallback((updatedGroup: any) => {
		setConversations(prev => prev.map(conv =>
			conv._id === updatedGroup._id ? { ...conv, ...updatedGroup } : conv
		));

		// Also update selected conversation if it's the same room
		if (selectedConversation._id === updatedGroup._id) {
			setSelectedConversation({ ...selectedConversation, ...updatedGroup });
		}
	}, [setConversations, setSelectedConversation, selectedConversation]);

	// Handle group deletion
	const handleDeleteGroup = useCallback((deletedGroup: any) => {
		setConversations(prev => prev.filter(conv => conv._id !== deletedGroup._id));
		// Close the modal and navigate away if needed
		setShowGroupSettings(false);
	}, [setConversations]);

	// Format message timestamp
	const formatMessageTime = useCallback((timestamp: string | Date) => {
		const date = new Date(timestamp);
		const now = new Date();
		const yesterday = new Date(now);
		yesterday.setDate(yesterday.getDate() - 1);

		// Same day, just show time
		if (date.toDateString() === now.toDateString()) {
			return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
		}
		// Yesterday
		else if (date.toDateString() === yesterday.toDateString()) {
			return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
		}
		// Different day, show date and time
		else {
			return `${date.toLocaleDateString([], { month: 'short', day: 'numeric' })} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
		}
	}, []);

	// Determine if timestamp should be displayed
	const shouldDisplayTimestamp = useCallback((currentMsg: any, previousMsg: any) => {
		if (!previousMsg) return true;

		const currentTime = new Date(currentMsg.createdAt);
		const prevTime = new Date(previousMsg.createdAt);

		// Display timestamp if messages are more than 15 minutes apart
		const timeDiff = currentTime.getTime() - prevTime.getTime();
		return timeDiff > 15 * 60 * 1000; // 15 minutes in milliseconds
	}, []);

	// Memoize the empty message state for better performance
	const emptyMessageState = useMemo(() => (
		<Flex direction="column" align="center" justify="center" h="100%" py={10} position="relative" zIndex={1}>
			<VStack
				p={10}
				borderRadius="40px"
				bg="rgba(30, 30, 30, 0.4)"
				backdropFilter="blur(20px)"
				boxShadow="0 25px 50px rgba(0, 0, 0, 0.4)"
				border="1px solid"
				borderColor="whiteAlpha.100"
				maxW="400px"
				textAlign="center"
				spacing={6}
			>
				<Box
					p={6}
					borderRadius="full"
					bg="rgba(0, 179, 116, 0.1)"
					boxShadow="0 0 30px rgba(0, 179, 116, 0.15)"
				>
					<BsChatDots size={40} color="#00B374" />
				</Box>
				<VStack spacing={2}>
					<Heading color={textColor} fontWeight="800" size="md" letterSpacing="-0.5px">
						No messages yet
					</Heading>
					<Text color="gray.400" fontSize="md" fontWeight="500" lineHeight="tall">
						Your conversation with {selectedConversation.username || selectedConversation.name} starts here. Send a message to break the ice!
					</Text>
				</VStack>
			</VStack>
		</Flex>
	), [selectedConversation, textColor]);

	// Memoize the loading skeletons to prevent unnecessary re-renders
	const loadingSkeletons = useMemo(() => (
		<>
			{[...Array(5)].map((_, i) => (
				<Flex
					key={i}
					gap={3}
					alignItems={"center"}
					p={2}
					borderRadius={"lg"}
					alignSelf={i % 2 === 0 ? "flex-start" : "flex-end"}
					opacity={0}
					animation={`fadeIn 0.3s ease-out ${i * 0.1}s forwards`}
					maxW="70%"
				>
					{i % 2 === 0 && (
						<SkeletonCircle
							size={"8"}
							startColor="#1E1E1E"
							endColor="#151515"
							borderRadius="full"
							boxShadow="0 0 3px rgba(0, 179, 116, 0.1)"
						/>
					)}
					<Flex
						flexDir={"column"}
						gap={2}
						bg={i % 2 === 0 ? "rgba(30, 30, 30, 0.5)" : "rgba(0, 56, 56, 0.15)"}
						p={3}
						borderRadius="lg"
						boxShadow="0 1px 3px rgba(0, 0, 0, 0.1)"
						minW="150px"
					>
						<Skeleton h='10px' w={`${150 + Math.random() * 100}px`} startColor={i % 2 === 0 ? "#1E1E1E" : "#003838"} endColor={i % 2 === 0 ? "#151515" : "#002828"} borderRadius="full" />
						<Skeleton h='10px' w={`${100 + Math.random() * 150}px`} startColor={i % 2 === 0 ? "#1E1E1E" : "#003838"} endColor={i % 2 === 0 ? "#151515" : "#002828"} borderRadius="full" />
						{Math.random() > 0.5 && <Skeleton h='10px' w={`${50 + Math.random() * 100}px`} startColor={i % 2 === 0 ? "#1E1E1E" : "#003838"} endColor={i % 2 === 0 ? "#151515" : "#002828"} borderRadius="full" />}
					</Flex>
					{i % 2 !== 0 && (
						<SkeletonCircle
							size={"8"}
							startColor="#1E1E1E"
							endColor="#151515"
							borderRadius="full"
							boxShadow="0 0 3px rgba(0, 179, 116, 0.1)"
						/>
					)}
				</Flex>
			))}
		</>
	), []);


	useEffect(() => {
		// Debug: Log selectedConversation whenever it changes
		console.log("MessageContainer loaded for conversation:", selectedConversation);
	}, [selectedConversation]);

	// Debug: Log messages array whenever it changes
	useEffect(() => {
		console.log('Current messages array:', messages);
	}, [messages]);

	// Track if tab is active to adjust polling frequency
	useEffect(() => {
		const handleVisibilityChange = () => {
			const isVisible = document.visibilityState === 'visible';
			setIsTabActive(isVisible);
			// Use more frequent polling when tab is visible
			setPollingInterval(isVisible ? 3000 : 10000);
		};

		document.addEventListener('visibilitychange', handleVisibilityChange);
		return () => {
			document.removeEventListener('visibilitychange', handleVisibilityChange);
		};
	}, []);

	useEffect(() => {
		// Update the last message timestamp when messages change
		if (messages.length > 0) {
			const lastMsg = messages[messages.length - 1];
			setLastMessageTimestamp(lastMsg.createdAt || null);
		}
	}, [messages]);

	useEffect(() => {
		// Don't set up listeners if socket is not available
		if (!socket) return;

		// Set up socket event listeners
		socket.on("newMessage", handleNewMessage);
		socket.on("messageDeleted", handleMessageDeleted);
		socket.on("messageDeletedForMe", handleMessageDeletedForMe);
		socket.on("messagesSeen", handleMessagesSeen);
		socket.on("crossPlatformMessage", handleFederatedMessage);

		// Clean up socket event listeners
		return () => {
			socket.off("newMessage", handleNewMessage);
			socket.off("messageDeleted", handleMessageDeleted);
			socket.off("messageDeletedForMe", handleMessageDeletedForMe);
			socket.off("messagesSeen", handleMessagesSeen);
			socket.off("crossPlatformMessage", handleFederatedMessage);
		};
	}, [socket, selectedConversation._id, selectedConversation.userId, currentUser?._id, handleNewMessage, handleMessageDeleted, handleMessageDeletedForMe, handleMessagesSeen, handleFederatedMessage]);

	// Set up polling as a backup to ensure message delivery only when socket is not connected
	useEffect(() => {
		// Only poll if the conversation is selected and not a mock
		if (!selectedConversation._id || selectedConversation.mock) return;

		// Skip polling for federated rooms - they use socket events for real-time updates
		if (selectedConversation.isFederated) return;

		// Skip polling if socket is connected - rely on real-time updates instead
		if (isConnected) {
			return;
		}

		let isPolling = false; // Flag to prevent overlapping polls
		let consecutiveEmptyPolls = 0; // Track consecutive polls with no new messages

		const messagePollingInterval = setInterval(async () => {
			// Skip if socket is now connected
			if (isConnected) {
				return;
			}

			// Skip if already polling
			if (isPolling) {
				return;
			}

			// Adaptive polling - reduce frequency if we're not finding messages
			if (consecutiveEmptyPolls > 5 && !isTabActive) {
				// If we've had 5+ empty polls and tab is inactive, only poll occasionally
				if (Math.random() > 0.3) return; // 70% chance to skip polling when inactive
			}

			isPolling = true;

			try {
				// Only poll for messages newer than our most recent one
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
					// Reset counter when we find messages
					consecutiveEmptyPolls = 0;

					// Only log if we actually found messages (reduces console spam)
					console.log("Polling found new messages:", newMessages.length);

					// Add new messages if they don't already exist
					setMessages(prev => {
						const existingIds = new Set(prev.map(msg =>
							// Consider both _id and tempId to avoid duplicates
							typeof msg._id === 'string' ? msg._id : String(msg._id)
						));

						const uniqueNewMessages = newMessages
							.filter((msg: any) => !existingIds.has(typeof msg._id === 'string' ? msg._id : String(msg._id)))
							.map((msg: any) => ({ ...msg, isNew: true })); // Add animation class

						if (uniqueNewMessages.length > 0) {
							// Remove animation class after animation completes
							setTimeout(() => {
								setMessages(prevMsgs =>
									prevMsgs.map((msg: MessageType) => msg.isNew ? { ...msg, isNew: false } : msg)
								);
							}, 1000);

							return [...prev, ...uniqueNewMessages];
						}
						return prev;
					});

					// Mark new messages as seen if they're from the other user
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
					// Increment counter when no messages found
					consecutiveEmptyPolls++;
				}
			} catch (error) {
				console.error("Error polling for messages:", error);
			} finally {
				isPolling = false;
			}
		}, pollingInterval);

		// Clean up polling interval
		return () => {
			clearInterval(messagePollingInterval);
		};
	}, [selectedConversation._id, selectedConversation.userId, selectedConversation.mock, selectedConversation.isFederated, currentUser?._id, lastMessageTimestamp, pollingInterval, isTabActive, socket, isConnected]);

	useEffect(() => {
		// Don't proceed if socket is not available
		if (!socket) return;

		// Mark messages as seen when conversation is active and there are messages from other users
		const lastMessageIsFromOtherUser = currentUser?._id && messages.length && String(messages[messages.length - 1].sender?._id || messages[messages.length - 1].sender) !== String(currentUser._id);
		if (lastMessageIsFromOtherUser && selectedConversation._id) {
			socket.emit("markMessagesAsSeen", {
				conversationId: selectedConversation._id,
				userId: selectedConversation.userId,
			});
		}
	}, [socket, currentUser?._id, messages, selectedConversation._id, selectedConversation.userId]);

	// Handle socket room joining/leaving for federated rooms
	useEffect(() => {
		if (!socket || !selectedConversation?.isFederated) {
			console.log('Skipping room join - no socket or not federated room');
			return;
		}

		const roomId = selectedConversation._id;
		if (roomId) {
			// Join the socket room for real-time cross-platform messages
			console.log(`Attempting to join socket room: room_${roomId}`);
			const joinResult = joinRoom(roomId);
			if (joinResult && typeof (joinResult as any).then === 'function') {
				(joinResult as any).then(() => {
					console.log(`Successfully joined socket room: room_${roomId}`);
				}).catch((error: any) => {
					console.error(`Failed to join socket room: room_${roomId}`, error);
				});
			}

			// Leave the room when conversation changes or component unmounts
			return () => {
				console.log(`Leaving socket room: room_${roomId}`);
				leaveRoom(roomId);
			};
		}
	}, [socket, selectedConversation?.isFederated, selectedConversation?._id, joinRoom, leaveRoom]);

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

	// Improved auto-scroll to bottom when messages change - prevents flickering
	useEffect(() => {
		const scrollToBottom = () => {
			if (messagesEndRef.current) {
				messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
			}
		};

		if (messages.length > 0) {
			// Add a small delay to ensure DOM is updated and prevent flickering
			const timeoutId = setTimeout(scrollToBottom, 50);
			return () => clearTimeout(timeoutId);
		}
	}, [messages]);


	// Update getMessages to handle both regular conversations and federated rooms
	const getMessages = async () => {
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
				// For federated rooms, try to fetch existing messages from the cross-platform room
				try {
					const res = await fetchWithSession(`/api/cross-platform/rooms/${selectedConversation._id}/messages`);
					if (res.ok) {
						const data = await res.json();
						if (data.success && data.messages) {
							// Transform federated messages to match our message format
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

			// Add a small delay for smoother transition between conversations
			await new Promise(resolve => setTimeout(resolve, 300));
			const res = await fetchWithSession(`/api/messages/${selectedConversation.userId}`);
			if (res.ok) {
				const data = await res.json();
				// Add animation class to all loaded messages
				const animatedMessages = data.map((msg: any, index: number) => ({
					...msg,
					isNew: true,
					// Stagger the animations
					animationDelay: `${index * 50}ms`
				}));
				setMessages(animatedMessages);
				// Remove animation classes after they've played
				setTimeout(() => {
					setMessages(prev => prev.map(msg => ({ ...msg, isNew: false })));
				}, 1500); // Give enough time for all animations to complete
			} else {
				const errorData = await res.json().catch(() => ({ error: 'Failed to fetch messages' }));
				showToast("Error", errorData.error || 'Failed to fetch messages', "error");
			}
		} catch (error: any) {
			showToast("Error", error.message || "Failed to load messages", "error");
		} finally {
			setLoadingMessages(false);
		}
	};

	return (
		<Flex
			direction="column"
			flex="1"
			width="100%"
			height="full"
			bg={bgColor}
			p={0}
			m={0}
			position="relative"
			overflow="hidden"
		>
			{/* Message header - Modern style */}
			<Flex
				w={"full"}
				h="70px"
				alignItems={"center"}
				justifyContent="space-between"
				px={{ base: 3, md: 5 }}
				bg={chatHeaderBg}
				backdropFilter="blur(15px)"
				zIndex={10}
				position="sticky"
				top={0}
			>
				<Flex alignItems="center" gap={4}>
					{/* Back Button for mobile */}
					<IconButton
						onClick={handleBackClick}
						icon={<span>&larr;</span>}
						aria-label="Back"
						variant="ghost"
						size="sm"
						display={{ base: "flex", md: "none" }}
						mr={1}
						color={chatHeaderTextColor}
					/>

					{selectedConversation.isFederated ? (
						<>
							<Avatar
								src={selectedConversation.groupPhoto || ""}
								size="sm"
								icon={<FaGlobe size={18} />}
							/>
							<Flex direction="column">
								<Text fontWeight="700" fontSize="md" color={chatHeaderTextColor}>
									{selectedConversation.name || 'Federated Room'}
								</Text>
								<Flex alignItems="center" gap={1}>
									<Badge colorScheme="blue" variant="subtle" fontSize="9px">Cross-platform</Badge>
								</Flex>
							</Flex>
						</>
					) : (
						<>
							<Avatar
								src={selectedConversation.userProfilePic}
								size={"sm"}
							>
								<AvatarBadge
									boxSize='1.1em'
									bg={selectedConversation.userId && onlineUsers.includes(selectedConversation.userId) ? '#00B374' : 'gray.400'}
									border="2px solid black"
								/>
							</Avatar>
							<Flex direction="column">
								<Text fontWeight="700" fontSize="md" color={chatHeaderTextColor}>
									{selectedConversation.username}
								</Text>
								<Text fontSize="xs" fontWeight="500" color="gray.500">
									{selectedConversation.userId && onlineUsers.includes(selectedConversation.userId)
										? "Active now"
										: "Offline"}
								</Text>
							</Flex>
						</>
					)}
				</Flex>

				<HStack spacing={2}>
					<IconButton
						icon={<FiMoreVertical size={20} />}
						variant="ghost"
						color={useColorModeValue("gray.600", "gray.400")}
						_hover={{ color: chatHeaderTextColor, bg: useColorModeValue("blackAlpha.100", "whiteAlpha.100") }}
						borderRadius="full"
						aria-label="More"
						onClick={() => setShowRightSidebar(!showRightSidebar)}
					/>
				</HStack>
			</Flex>

			<Flex direction="row" flex="1" overflow="hidden">
				<Flex
					flexDirection="column"
					flex="1"
					width="100%"
					height="full"
					p={0}
					m={0}
					gap={0}
					position="relative"
					overflow="hidden"
					bgGradient={chatContainerBg}
					_before={{
						content: '""',
						position: 'absolute',
						top: 0, left: 0, right: 0, bottom: 0,
						backgroundImage: `radial-gradient(circle at 2px 2px, ${chatDotPattern} 1px, transparent 0)`,
						backgroundSize: '32px 32px',
						opacity: 0.4,
						pointerEvents: 'none',
						zIndex: 0
					}}
				>
					{loadingMessages ? (
				<Flex direction="column" flex="1" p={4} gap={4} bg={chatContainerBg}>
					{loadingSkeletons}
				</Flex>
			) : accessDenied ? (
				<Flex direction="column" align="center" justify="center" h="100%" bg={chatContainerBg} p={10}>
					<VStack
						p={10}
						borderRadius="40px"
						bg={useColorModeValue("white", "rgba(30, 30, 30, 0.4)")}
						backdropFilter="blur(20px)"
						boxShadow="0 25px 50px rgba(0, 0, 0, 0.4)"
						border="1px solid"
						borderColor={borderColor}
						maxW="450px"
						textAlign="center"
						spacing={8}
					>
						<Box
							p={6}
							borderRadius="full"
							bg="rgba(255, 165, 0, 0.1)"
							boxShadow="0 0 30px rgba(255, 165, 0, 0.15)"
						>
							<FaGlobe size={40} color="orange" />
						</Box>
						<VStack spacing={3}>
							<Heading color={textColor} fontWeight="900" size="lg" letterSpacing="-1px">
								Private Room
							</Heading>
							<Text color="gray.400" fontSize="md" fontWeight="500" lineHeight="tall">
								This is a private cross-platform room. You need a room code to join and view the conversation.
							</Text>
						</VStack>
						
						<VStack w="full" spacing={4}>
							<Input 
								placeholder="Enter 8-digit Room Code"
								value={joinCode}
								onChange={(e) => setJoinCode(e.target.value)}
								size="lg"
								borderRadius="xl"
								textAlign="center"
								fontWeight="800"
								letterSpacing="4px"
								bg={useColorModeValue("gray.50", "whiteAlpha.50")}
								_focus={{ borderColor: "brand.primary.500" }}
							/>
							<Button 
								w="full" 
								colorScheme="brand" 
								size="lg" 
								borderRadius="xl" 
								onClick={handleJoinWithCode}
								isLoading={joining}
								isDisabled={!joinCode.trim()}
								bg="brand.primary.500"
								_hover={{ bg: "brand.primary.600" }}
							>
								Join Room
							</Button>
						</VStack>
					</VStack>
				</Flex>
			) : (
						<Box ref={containerRef} flex="1" overflow="hidden" display="flex" flexDirection="column">
							{messages.length === 0 && emptyMessageState}
							{messages.length > 0 && (
								<Flex
									flex="1"
									position="relative"
									maxW="750px"
									mx="auto"
									w="full"
									direction="column"
									overflowY="auto"
									px={4}
									className="hide-scrollbar"
								>
									{/* Empty flex space to push few messages to the bottom */}
									<Box flex="1" minH="0" />
									
									{messages.map((msg, index) => {
										const previousMessage = index > 0 ? messages[index - 1] : null;
										const showTimestamp = shouldDisplayTimestamp(msg, previousMessage);

										return (
											<Flex
												key={msg.tempId || msg._id || index}
												direction={"column"}
												className={`message-item ${msg.isNew ? "message-new" : ""}`}
												style={msg.animationDelay ? { animationDelay: msg.animationDelay } : {}}
												mt={2}
												mb={index === messages.length - 1 ? 4 : 0}
											>
												{/* Display timestamp if needed */}
												{showTimestamp && (
													<Flex justify="center" my={3}>
														<Text
															fontSize="xs"
															color={mutedTextColor}
															bg={timestampBg}
															px={3}
															py={1}
															borderRadius="full"
														>
															{formatMessageTime(msg.createdAt || "")}
														</Text>
													</Flex>
												)}
												<Message
													message={msg}
													ownMessage={Boolean(currentUser?._id && String(currentUser._id) === String(msg.sender?._id || msg.sender))}
													onDelete={handleDeleteMessage}
													onStar={handleStarMessage}
												/>
											</Flex>
										);
									})}
									<div ref={messagesEndRef} />
								</Flex>
							)}
						</Box>
					)}

					<Box position="relative" w="full" maxW="750px" mx="auto" pb={6} px={4}>
						<MessageInput setMessages={setMessages} />
					</Box>
				</Flex>

				{/* Right Sidebar - Collapsible */}
				{showRightSidebar && (
					<Box
						w="320px" h="full" bg={bgColor} borderLeft="1px solid" borderColor={borderColor}
						transition="all 0.3s ease" display={{ base: "none", lg: "block" }}
					>
						<ChatRightSidebar 
							user={selectedConversation} 
							messages={messages} 
							onOpenSettings={() => setShowGroupSettings(true)}
							onUpdateGroup={handleUpdateGroup}
							onDeleteGroup={handleDeleteGroup}
						/>
					</Box>
				)}
			</Flex>

		</Flex>
	);
};

export default MessageContainer;
