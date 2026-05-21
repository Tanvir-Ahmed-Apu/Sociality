import { Box, Flex, useColorModeValue } from "@chakra-ui/react";
import { useEffect, useRef, useState, useCallback } from "react";
import { useRecoilValue, useSetRecoilState } from "recoil";

import { userAtom, conversationsAtom, selectedConversationAtom } from "../../../../atoms";
import { useSocket } from "../../../../hooks/useSocket";

import Message from "../Message";
import MessageInput from "../MessageInput";
import ChatRightSidebar from "../ChatRightSidebar";

import { MessageContainerProps } from "./types";
import MessageHeader from "./components/MessageHeader";
import { EmptyMessageState, MessageSkeletons, AccessDeniedState } from "./components/MessageStates";

import { useChatMessages } from "./hooks/useChatMessages";
import { useChatSocket } from "./hooks/useChatSocket";
import { useChatPolling } from "./hooks/useChatPolling";
import { useChatTheme } from "../../hooks/useChatTheme";
import { formatMessageTime, shouldDisplayTimestamp } from "../../utils/timeUtils";

const MessageContainer = ({
	onShareRoom,
	onDeleteRoom
}: MessageContainerProps) => {
	const selectedConversation = useRecoilValue(selectedConversationAtom);
	const currentUser = useRecoilValue(userAtom);
	const { socket, isConnected, onlineUsers, joinRoom, leaveRoom } = useSocket();
	
	const setConversations = useSetRecoilState(conversationsAtom);
	const setSelectedConversation = useSetRecoilState(selectedConversationAtom);
	
	const containerRef = useRef<HTMLDivElement>(null);
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const [showGroupSettings, setShowGroupSettings] = useState(false);
	const [showRightSidebar, setShowRightSidebar] = useState(false);

	const { bgColor, borderColor, mutedColor: mutedTextColor, timestampBg, chatContainerBg, chatDotPattern } = useChatTheme();

	const {
		messages,
		setMessages,
		loadingMessages,
		accessDenied,
		joinCode,
		setJoinCode,
		joining,
		lastMessageTimestamp,
		handleDeleteMessage,
		handleStarMessage,
		handleJoinWithCode
	} = useChatMessages(selectedConversation);

	// Instead of passing setLastMessageTimestamp to useChatSocket directly to avoid circular dependency loop, 
	// we will handle it through the message state update effect inside useChatMessages.
	// But useChatSocket needs it, so let's just create a dummy setter or rely on useChatMessages effect.
	const setLastMessageTimestamp = useCallback((timestamp: string) => {
		// Handled internally by useChatMessages
	}, []);

	useChatSocket({
		socket,
		selectedConversation,
		currentUser,
		setMessages,
		joinRoom,
		leaveRoom,
		setLastMessageTimestamp
	});

	useChatPolling({
		selectedConversation,
		currentUser,
		socket,
		isConnected,
		lastMessageTimestamp,
		setMessages
	});

	const handleBackClick = useCallback(() => {
		const event = new CustomEvent('goToMainMessages');
		window.dispatchEvent(event);
	}, []);

	const handleUpdateGroup = useCallback((updatedGroup: any) => {
		setConversations(prev => prev.map(conv =>
			conv._id === updatedGroup._id ? { ...conv, ...updatedGroup } : conv
		));

		if (selectedConversation._id === updatedGroup._id) {
			setSelectedConversation({ ...selectedConversation, ...updatedGroup });
		}
	}, [setConversations, setSelectedConversation, selectedConversation]);

	const handleDeleteGroup = useCallback((deletedGroup: any) => {
		setConversations(prev => prev.filter(conv => conv._id !== deletedGroup._id));
		setShowGroupSettings(false);
	}, [setConversations]);



	useEffect(() => {
		const scrollToBottom = () => {
			if (messagesEndRef.current) {
				messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
			}
		};

		if (messages.length > 0) {
			const timeoutId = setTimeout(scrollToBottom, 50);
			return () => clearTimeout(timeoutId);
		}
	}, [messages]);

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
			<MessageHeader 
				selectedConversation={selectedConversation}
				onlineUsers={onlineUsers}
				handleBackClick={handleBackClick}
				showRightSidebar={showRightSidebar}
				setShowRightSidebar={setShowRightSidebar}
			/>

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
							<MessageSkeletons />
						</Flex>
					) : accessDenied ? (
						<AccessDeniedState 
							joinCode={joinCode}
							setJoinCode={setJoinCode}
							handleJoinWithCode={handleJoinWithCode}
							joining={joining}
						/>
					) : (
						<Box ref={containerRef} flex="1" overflow="hidden" display="flex" flexDirection="column">
							{messages.length === 0 && <EmptyMessageState selectedConversation={selectedConversation} />}
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
												{showTimestamp && (
													<Flex justify="center" my={3}>
														<Box
															fontSize="xs"
															color={mutedTextColor}
															bg={timestampBg}
															px={3}
															py={1}
															borderRadius="full"
														>
															{formatMessageTime(msg.createdAt || "")}
														</Box>
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
