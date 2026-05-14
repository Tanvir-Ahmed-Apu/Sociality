import {
	Flex,
	Input,
	InputGroup,
	InputRightElement,
	InputLeftElement,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalHeader,
	ModalOverlay,
	Spinner,
	useDisclosure,
	Tooltip,
	Box,
	Text,
	Button,
	Icon,
	IconButton,
	Divider,
	Progress,
	Popover,
	PopoverTrigger,
	PopoverContent,
	PopoverBody,
	Portal,
	useColorModeValue,
	Textarea,
	HStack,
	VStack,
	Image,
} from "@chakra-ui/react";
import { IoSendSharp, IoAttach, IoMicOutline, IoHappyOutline, IoImageOutline } from "react-icons/io5";
import { FaPaperclip, FaSmile, FaMicrophone, FaFileAlt } from "react-icons/fa";
import { MdEmojiEmotions, MdAttachFile } from "react-icons/md";
import { CloseIcon } from "@chakra-ui/icons";
import useShowToast from "../../../hooks/useShowToast";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userAtom, conversationsAtom, selectedConversationAtom } from "../../../atoms";
import usePreviewImg from "../../../hooks/usePreviewImg";
import { useSocket } from "../../../hooks/useSocket";
import { memo, useRef, useState, useCallback, useEffect } from "react";
import { fetchWithSession } from "../../../utils/api";
import "../../../styles/telegram-input.css";
import "../../../styles/emoji-picker.css";
import EmojiPicker from 'emoji-picker-react';
import { useRecentEmojis } from "../../../hooks/useRecentEmojis";
import SimpleEmojiPicker from "../../../components/ui/SimpleEmojiPicker";


interface MessageInputProps {
	setMessages: React.Dispatch<React.SetStateAction<any[]>>;
}

const MessageInput = memo(({ setMessages }: MessageInputProps) => {
	const [messageText, setMessageText] = useState("");
	const [isRecording, setIsRecording] = useState(false);
	const { isOpen: showAttachMenu, onOpen: openAttachMenu, onClose: closeAttachMenu } = useDisclosure();
	const [textareaHeight, setTextareaHeight] = useState(40);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const fileInputRef = useRef<HTMLInputElement>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);
	const showToast = useShowToast();
	const selectedConversation = useRecoilValue(selectedConversationAtom);
	const setConversations = useSetRecoilState(conversationsAtom);
	const currentUser = useRecoilValue(userAtom);
	const { socket, isConnected } = useSocket();
	const { isOpen: isImageOpen, onOpen: onImageOpen, onClose: onImageClose } = useDisclosure();
	const { isOpen: isEmojiOpen, onOpen: onEmojiOpen, onClose: onEmojiClose } = useDisclosure();


	const { handleImageChange, imgUrl, clearImages } = usePreviewImg();
	const [isSending, setIsSending] = useState(false);
	const isSendingRef = useRef(false);
	const [selectedEmoji, setSelectedEmoji] = useState("");
	const { recentEmojis, addRecentEmoji } = useRecentEmojis();
	const [useSimplePicker, setUseSimplePicker] = useState(true); // Use simple picker by default
	const emojiPickerRef = useRef<HTMLDivElement>(null);

	// File upload state
	const [selectedFile, setSelectedFile] = useState<File | null>(null);
	const [filePreview, setFilePreview] = useState<any>(null);
	const [uploadProgress, setUploadProgress] = useState(0);
	const attachMenuRef = useRef<HTMLDivElement>(null);

	// Theme-aware colors
	const inputBgColor = useColorModeValue("gray.50", "#121212");
	const textColor = useColorModeValue("black", "white");
	const placeholderColor = useColorModeValue("gray.500", "gray.500");
	const containerBg = "transparent";
    const attachmentBg = useColorModeValue("white", "#1A1A1A");
    const attachmentColor = useColorModeValue("gray.600", "gray.400");
    const inputBorderColor = useColorModeValue("gray.200", "whiteAlpha.100");

	// Quick emoji reactions (frequently used)
	const quickEmojis = ["👍", "❤️", "😂", "😮", "😢", "😡", "🔥", "👏"];

	// Auto-resize textarea
	useEffect(() => {
		if (textareaRef.current) {
			textareaRef.current.style.height = 'auto';
			const scrollHeight = textareaRef.current.scrollHeight;
			const newHeight = Math.min(Math.max(scrollHeight, 40), 120); // Min 40px, max 120px
			setTextareaHeight(newHeight);
			textareaRef.current.style.height = `${newHeight}px`;
		}
	}, [messageText]);

	// Click outside handler and keyboard support for emoji picker
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent | TouchEvent) => {
			if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node) && isEmojiOpen) {
				onEmojiClose();
			}
		};

		const handleKeyDown = (event: KeyboardEvent) => {
			if (event.key === 'Escape' && isEmojiOpen) {
				onEmojiClose();
			}
		};

		if (isEmojiOpen) {
			document.addEventListener('mousedown', handleClickOutside);
			document.addEventListener('touchstart', handleClickOutside);
			document.addEventListener('keydown', handleKeyDown);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
			document.removeEventListener('touchstart', handleClickOutside);
			document.removeEventListener('keydown', handleKeyDown);
		};
	}, [isEmojiOpen, onEmojiClose]);



	// Handle file change
	const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (!file) return;

		// Check file size (50MB limit)
		const maxSize = 50 * 1024 * 1024; // 50MB
		if (file.size > maxSize) {
			showToast("Error", "File size must be less than 50MB", "error");
			return;
		}

		setSelectedFile(file);

		// Create preview for different file types
		if (file.type.startsWith('image/')) {
			const reader = new FileReader();
			reader.onload = (e: ProgressEvent<FileReader>) => {
				setFilePreview({
					type: 'image',
					url: e.target?.result,
					name: file.name,
					size: file.size
				});
			};
			reader.readAsDataURL(file);
		} else {
			setFilePreview({
				type: 'file',
				name: file.name,
				size: file.size,
				extension: file.name.split('.').pop()?.toUpperCase() || 'FILE'
			});
		}
	}, [showToast]);

	// Handle file attachment
	const handleFileAttachment = useCallback(() => {
		closeAttachMenu();
		fileInputRef.current?.click();
	}, [closeAttachMenu]);

	// Handle image attachment
	const handleImageAttachment = useCallback(() => {
		closeAttachMenu();
		imageInputRef.current?.click();
	}, [closeAttachMenu]);

	// Clear file selection
	const clearFileSelection = useCallback(() => {
		setSelectedFile(null);
		setFilePreview(null);
		setUploadProgress(0);
	}, []);

	// Handle voice recording (placeholder)
	const handleVoiceRecording = useCallback(() => {
		setIsRecording(!isRecording);
		// Add actual voice recording logic here
		showToast("Info", "Voice recording feature coming soon!", "info");
	}, [isRecording, showToast]);



	// Define sendRequestFn to handle both regular and federated messages
	const sendRequestFn = async (formData: FormData | null, messageData: any) => {
		let responseData = null;

		// Handle federated messages
		if (selectedConversation.isFederated) {
			console.log("Sending federated message:", messageData.text, "with attachments:", !!formData);

			let response;
			if (formData) {
				// Send with attachments using FormData
				formData.append("message", messageData.text || "");
				response = await fetchWithSession("/api/cross-platform/rooms/" + selectedConversation._id + "/messages", {
					method: "POST",
					body: formData, // Don't set Content-Type header for FormData
				});
			} else {
				// Send text-only message
				response = await fetchWithSession("/api/cross-platform/rooms/" + selectedConversation._id + "/messages", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						message: messageData.text
					}),
				});
			}
			responseData = await response.json();
			console.log("Federated message response:", responseData);

			// For federated messages, transform the response to match expected format
			if (responseData.success && responseData.localMessage) {
				return {
					_id: responseData.localMessage.id,
					text: responseData.localMessage.text,
					img: responseData.localMessage.img,
					file: responseData.localMessage.file,
					fileName: responseData.localMessage.fileName,
					fileSize: responseData.localMessage.fileSize,
					attachmentType: responseData.localMessage.attachmentType,
					sender: responseData.localMessage.sender._id,
					senderUsername: responseData.localMessage.sender.username,
					senderPlatform: responseData.localMessage.sender.platform,
					createdAt: responseData.localMessage.timestamp,
					isFederated: true,
					platform: responseData.localMessage.platform,
					tempId: messageData.tempId
				};
			}
		} else {
			// Handle regular messages
			if (formData) {
				const response = await fetchWithSession("/api/messages", {
					method: "POST",
					body: formData,
				});
				responseData = await response.json();
			} else {
				const response = await fetchWithSession("/api/messages", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(messageData),
				});
				responseData = await response.json();
			}
		}

		console.log("Message sent successfully (server response):", responseData);
		return responseData;
	};

	// PATCH: Define messageAlreadyUpdated utility
	const messageAlreadyUpdated = (prev: any[], tempId: string, responseData: any) => {
		return prev.some(msg =>
			(msg.tempId === tempId && !msg.isOptimistic) ||
			(responseData._id && msg._id === responseData._id)
		);
	};

	// Handle message submission
	const handleSendMessage = useCallback(async (e?: React.FormEvent | { preventDefault: () => void }) => {
		e?.preventDefault();
		if (isSendingRef.current) {
			console.log("Blocking duplicate message send");
			return;
		}
		if (!messageText.trim() && !imgUrl && !selectedEmoji && !selectedFile) {
			console.warn('Attempted to send empty message. Aborting.');
			return;
		}
		isSendingRef.current = true;
		setIsSending(true);
		try {
			const tempId = Date.now().toString();
			let formData = null;
			let messageData = {
				tempId,
				text: messageText,
				recipientId: selectedConversation.userId,
				img: imgUrl || undefined,
				emoji: selectedEmoji || undefined,
			};

			// For federated messages, emojis are not supported yet
			if (selectedConversation.isFederated && selectedEmoji) {
				showToast("Info", "Emojis are not supported in cross-platform rooms yet", "info");
				setIsSending(false);
				return;
			}

			// Prepare message with any media type
			if (imgUrl || selectedFile) {
				formData = new FormData();
				formData.append("text", messageText);
				if (selectedConversation.userId) formData.append("recipientId", selectedConversation.userId);
				formData.append("tempId", tempId);

				console.log("Preparing FormData with:", {
					text: messageText,
					hasImg: !!imgUrl,
					hasFile: !!selectedFile,
					hasEmoji: !!selectedEmoji
				});

				if (imgUrl) {
					const url = imgUrl as string;
					if (url.startsWith("blob:")) {
						// Handle blob URLs
						const response = await fetch(url);
						const imgBlob = await response.blob();
						formData.append("img", imgBlob, "image.png");
						console.log("Added image blob to FormData, size:", imgBlob.size);
					} else if (url.startsWith("data:")) {
						// Handle data URLs (base64)
						const response = await fetch(url);
						const imgBlob = await response.blob();
						formData.append("img", imgBlob, "image.png");
						console.log("Added image data URL to FormData, size:", imgBlob.size);
					} else {
						// Handle regular URLs
						formData.append("img", imgUrl as any);
						console.log("Added image URL to FormData:", imgUrl);
					}
				}

				if (selectedFile) {
					formData.append("file", selectedFile);
					formData.append("fileName", selectedFile.name);
					formData.append("fileSize", String(selectedFile.size));
					console.log("Added file to FormData:", selectedFile.name, selectedFile.size);
				}

				if (selectedEmoji) {
					formData.append("emoji", selectedEmoji);
					console.log("Added emoji to FormData:", selectedEmoji);
				}
			}
			// Create display text for message
			const displayText = messageText ||
				(selectedFile ? `📎 ${selectedFile.name}` : '') ||
				(imgUrl ? '' : '') ||
				(selectedEmoji ? selectedEmoji : '');

			const optimisticMessage = selectedConversation.isFederated ? {
				_id: tempId,
				text: displayText,
				img: imgUrl || undefined,
				file: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
				fileName: selectedFile?.name || undefined,
				fileSize: selectedFile?.size || undefined,
				attachmentType: selectedFile ? (selectedFile.type.startsWith('image/') ? 'image' : 'document') : (imgUrl ? 'image' : 'none'),
				sender: currentUser?._id || "",
				senderUsername: currentUser?.name || currentUser?.username || "",
				senderPlatform: 'sociality',
				createdAt: new Date().toISOString(),
				isOptimistic: true,
				isNew: true,
				isFederated: true,
				platform: 'sociality',
				tempId
			} : {
				text: displayText,
				sender: currentUser?._id || "",
				tempId,
				createdAt: new Date().toISOString(),
				isOptimistic: true,
				isNew: true,
				img: imgUrl || undefined,
				emoji: selectedEmoji || undefined,
				file: selectedFile ? URL.createObjectURL(selectedFile) : undefined,
				fileName: selectedFile?.name || undefined,
				fileSize: selectedFile?.size || undefined,
			};
			setMessages(prev => [...prev, optimisticMessage]);

			// Immediately update conversations to keep user in recent contacts
			setConversations(prev => {
				const updatedConversations = [...prev];
				const conversationIndex = updatedConversations.findIndex(c => c._id === selectedConversation._id);
				if (conversationIndex !== -1) {
					// Create last message text for conversation list
					const lastMessageText = messageText ||
						(selectedFile ? `📎 ${selectedFile.name}` : '') ||
						(imgUrl ? '' : '') ||
						(selectedEmoji ? selectedEmoji : '');

					updatedConversations[conversationIndex] = {
						...updatedConversations[conversationIndex],
						lastMessage: {
							text: lastMessageText,
							sender: currentUser?._id || "",
							img: imgUrl ? "true" : undefined,
							emoji: selectedEmoji || undefined,
							file: selectedFile ? "true" : undefined,
							fileName: selectedFile?.name || undefined,
							createdAt: new Date().toISOString(),
						},
						updatedAt: new Date().toISOString(),
					};
					// Move conversation to top
					const conversation = updatedConversations.splice(conversationIndex, 1)[0];
					updatedConversations.unshift(conversation);
				}
				return updatedConversations;
			});

			// Immediate aggressive scroll trigger for optimistic message
			const forceImmediateScroll = () => {
				const messageContainer = document.getElementById('messageListContainer');
				if (messageContainer) {
					console.log('📤 Immediate aggressive scroll after sending message');
					// Force scroll to absolute maximum
					messageContainer.scrollTop = messageContainer.scrollHeight;
					console.log('📤 Set scrollTop to:', messageContainer.scrollTop);
				}
			};

			// Multiple immediate scroll attempts
			setTimeout(forceImmediateScroll, 10);
			setTimeout(forceImmediateScroll, 50);
			setTimeout(forceImmediateScroll, 100);

			try {
				console.log("Waiting for server to process message...");
				const responseData = await sendRequestFn(formData, messageData);
				setMessages(prev => {
					if (messageAlreadyUpdated(prev, tempId, responseData)) {
						console.log("Message already updated by socket, skipping update");
						return prev;
					}
					const updatedMessages = prev.map(msg =>
						msg.tempId === tempId ? { ...responseData, isNew: true } : msg
					);

					return updatedMessages;
				});
				setConversations(prev => {
					const updatedConversations = [...prev];
					const conversationIndex = updatedConversations.findIndex(c => c._id === selectedConversation._id);
					if (conversationIndex !== -1) {
						// Create last message text for conversation list
						const lastMessageText = messageText ||
							(selectedFile ? `📎 ${selectedFile.name}` : '') ||
							(imgUrl ? '' : '') ||
							(selectedEmoji ? selectedEmoji : '');

						updatedConversations[conversationIndex] = {
							...updatedConversations[conversationIndex],
							lastMessage: {
								text: lastMessageText,
								sender: currentUser?._id || "",
								img: imgUrl ? "true" : undefined,
								emoji: selectedEmoji || undefined,
								file: selectedFile ? "true" : undefined,
								fileName: selectedFile?.name || undefined,
								createdAt: new Date().toISOString(),
							},
							updatedAt: new Date().toISOString(),
						};
						// Move conversation to top
						const conversation = updatedConversations.splice(conversationIndex, 1)[0];
						updatedConversations.unshift(conversation);
					}
					return updatedConversations;
				});


			} catch (error: any) {
				showToast("Error", error.message, "error");
			}
			document.getElementById('messageInput')?.blur();
			console.log("Cleaning up after message send...");
			console.log("Before cleanup - imgUrl:", imgUrl, "selectedFile:", selectedFile);

			setMessageText("");
			clearImages(); // Use clearImages instead of setImgUrl("")
			setSelectedEmoji("");
			clearFileSelection();

			// Reset file input to allow selecting the same file again
			if (fileInputRef.current) {
				fileInputRef.current.value = '';
			}

			console.log("After cleanup - should be empty");
		} catch (error: any) {
			showToast("Error", error.message, "error");
		} finally {
			isSendingRef.current = false;
			setIsSending(false);
		}
	}, [
		messageText,
		imgUrl,
		selectedEmoji,
		selectedFile,
		selectedConversation?.userId,
		selectedConversation?.isFederated,
		selectedConversation?._id,
		currentUser?._id,
		setMessages,
		showToast,
		clearImages,
		setConversations,
		isSending,
		clearFileSelection
	]);

	// Update emoji click handler with proper handleSendMessage reference
	const handleEmojiClickWithSend = useCallback((emojiData: any, event: any) => {
		const emoji = emojiData.emoji;

		// Add to recent emojis
		addRecentEmoji(emoji);

		// Check if Ctrl/Cmd key is pressed for standalone emoji message
		if (event?.ctrlKey || event?.metaKey) {
			// Send as standalone emoji message
			setSelectedEmoji(emoji);
			onEmojiClose();
			// Auto-send emoji message
			setTimeout(() => {
				const syntheticEvent = { preventDefault: () => { } };
				handleSendMessage(syntheticEvent);
			}, 100);
		} else {
			// Add to text input
			setMessageText(prev => prev + emoji);
			// Keep picker open for multiple emoji selection
		}
	}, [addRecentEmoji, onEmojiClose, handleSendMessage]);

	// Update quick emoji send handler
	const handleQuickEmojiSendWithRef = useCallback((emoji: any) => {
		addRecentEmoji(emoji);
		setSelectedEmoji(emoji);
		onEmojiClose();
		// Auto-send emoji message
		setTimeout(() => {
			const syntheticEvent = { preventDefault: () => { } };
			handleSendMessage(syntheticEvent);
		}, 100);
	}, [addRecentEmoji, onEmojiClose, handleSendMessage]);

	// Close attachment menu when clicking outside
	useEffect(() => {
		const handleClickOutside = (event: any) => {
			if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
				closeAttachMenu();
			}
		};

		if (showAttachMenu) {
			document.addEventListener('mousedown', handleClickOutside);
		}

		return () => {
			document.removeEventListener('mousedown', handleClickOutside);
		};
	}, [showAttachMenu, closeAttachMenu]);

	// Handle Enter key press
	const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			console.log('Enter key pressed, message text:', messageText);
			handleSendMessage(e);
		}
	}, [handleSendMessage, messageText]);

	return (
		<Box
			bg={containerBg}
			p={0}
			position="relative"
            zIndex={100}
            w="full"
		>
			{/* Hidden Inputs for Attachments */}
			<input 
				type="file" 
				hidden 
				ref={imageInputRef} 
				accept="image/*" 
				onChange={handleImageChange} 
			/>
			<input 
				type="file" 
				hidden 
				ref={fileInputRef} 
				onChange={handleFileChange} 
			/>

			{/* Preview Area */}
			{(imgUrl || filePreview) && (
				<Box 
                    mb={4} p={3} bg={inputBgColor} borderRadius="20px" 
                    border="1px solid" borderColor={inputBorderColor} 
                    boxShadow="xl" mx={2}
                >
					<HStack spacing={3}>
						{(imgUrl || (filePreview?.type === 'image' && filePreview.url)) ? (
							<Image
								w="60px"
								h="60px"
								borderRadius="12px"
								bg={useColorModeValue("gray.200", "black")}
								src={(imgUrl || filePreview?.url) as string}
								objectFit="cover"
                                fallback={<Spinner size="sm" />}
							/>
						) : (
							<Box
								w="60px"
								h="60px"
								borderRadius="12px"
								bg={useColorModeValue("gray.200", "black")}
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
							>
                                <FaFileAlt size={24} color="gray" />
                            </Box>
						)}
						<VStack align="start" spacing={0} flex={1}>
							<Text fontWeight="600" fontSize="xs" color={textColor} noOfLines={1}>
								{selectedFile?.name || "Image Preview"}
							</Text>
							<Text fontSize="10px" color="gray.500">Ready to send</Text>
						</VStack>
						<IconButton
							icon={<CloseIcon boxSize="8px" />}
							size="xs"
							variant="ghost"
                            color="gray.500"
                            _hover={{ color: textColor, bg: useColorModeValue("blackAlpha.100", "whiteAlpha.100") }}
							onClick={() => { clearImages(); clearFileSelection(); }}
							aria-label="Remove"
                            borderRadius="full"
						/>
					</HStack>
				</Box>
			)}

			<Flex 
                gap={2} alignItems="center" bg={inputBgColor} 
                borderRadius="30px" px={4} py={2} 
                boxShadow={useColorModeValue("0 4px 12px rgba(0,0,0,0.05)", "0 4px 20px rgba(0,0,0,0.4)")}
                border="1px solid" borderColor={inputBorderColor}
            >
				{/* Attachment button */}
				<Box position="relative" ref={attachMenuRef}>
					<IconButton
						icon={<IoAttach size={24} />}
						variant="ghost"
                        color="gray.400"
                        _hover={{ color: textColor, bg: useColorModeValue("blackAlpha.100", "whiteAlpha.100") }}
                        borderRadius="full"
                        size="md"
						onClick={(e) => {
							e.preventDefault();
							e.stopPropagation();
							showAttachMenu ? closeAttachMenu() : openAttachMenu();
						}}
						aria-label="Attach"
					/>

					{showAttachMenu && (
						<Box
							position="absolute"
							bottom="60px"
							left="0"
							bg={attachmentBg}
							border="1px solid"
                            borderColor={inputBorderColor}
							borderRadius="16px"
							boxShadow="0 8px 32px rgba(0,0,0,0.2)"
							p={2}
							w="180px"
							zIndex={1000}
						>
							<VStack spacing={1}>
								<Button
									leftIcon={<IoImageOutline />}
									variant="ghost"
									size="sm"
									w="full"
									justifyContent="flex-start"
                                    borderRadius="10px"
                                    color={attachmentColor}
                                    _hover={{ bg: useColorModeValue("blackAlpha.50", "whiteAlpha.100"), color: textColor }}
									onClick={handleImageAttachment}
								>
									Photo or Video
								</Button>
								<Button
									leftIcon={<FaFileAlt />}
									variant="ghost"
									size="sm"
									w="full"
									justifyContent="flex-start"
                                    borderRadius="10px"
                                    color={attachmentColor}
                                    _hover={{ bg: useColorModeValue("blackAlpha.50", "whiteAlpha.100"), color: textColor }}
									onClick={handleFileAttachment}
								>
									Document
								</Button>
							</VStack>
						</Box>
					)}
				</Box>

                {/* Main Input Field */}
                <Flex flex={1} position="relative" align="center">
                    <Textarea
                        ref={textareaRef}
                        placeholder="Type a message..."
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        onKeyDown={handleKeyDown as any}
                        variant="unstyled"
                        bg="transparent"
                        fontFamily="'Inter', sans-serif"
                        fontWeight="400"
                        py={2}
                        px={2}
                        fontSize="md"
                        minH="40px"
                        maxH="120px"
                        rows={1}
                        resize="none"
                        overflow="hidden"
                        color={textColor}
                        _placeholder={{ color: placeholderColor }}
                    />
                </Flex>

				{/* Right side icons */}
				<HStack spacing={1}>
                    <IconButton
                        icon={<IoHappyOutline size={22} />}
                        variant="ghost"
                        color="gray.400"
                        _hover={{ color: textColor, bg: useColorModeValue("blackAlpha.100", "whiteAlpha.100") }}
                        borderRadius="full"
                        size="md"
                        onClick={onEmojiOpen}
                        aria-label="Emojis"
                    />
                    {!messageText.trim() && !imgUrl && !selectedFile ? (
                         <IconButton
                            icon={<IoMicOutline size={22} />}
                            variant="ghost"
                            color="gray.400"
                            _hover={{ color: textColor, bg: useColorModeValue("blackAlpha.100", "whiteAlpha.100") }}
                            borderRadius="full"
                            size="md"
                            onClick={handleVoiceRecording}
                            aria-label="Voice"
                        />
                    ) : (
                        <IconButton
                            icon={isSending ? <Spinner size="xs" /> : <IoSendSharp size={18} />}
                            bg="brand.primary.500"
                            color="white"
                            borderRadius="full"
                            size="sm"
                            _hover={{ bg: "brand.primary.600", transform: "scale(1.05)" }}
                            transition="all 0.2s"
                            onClick={() => handleSendMessage()}
                            isDisabled={isSending}
                            aria-label="Send"
                        />
                    )}
                </HStack>
			</Flex>

            {/* Emoji Picker Modal */}
            {isEmojiOpen && (
                <Box
                    position="absolute"
                    bottom="70px"
                    right="20px"
                    zIndex={1000}
                    ref={emojiPickerRef}
                >
                    <SimpleEmojiPicker 
                        onEmojiClick={(emojiData: any) => {
                            setMessageText(prev => prev + emojiData.emoji);
                        }} 
                        onClose={onEmojiClose}
                    />
                </Box>
            )}
		</Box>
	);
});

MessageInput.displayName = 'MessageInput';

export default MessageInput;



