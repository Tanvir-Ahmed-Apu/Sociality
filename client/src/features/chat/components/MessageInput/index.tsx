import { memo, useCallback } from "react";
import {
    Box,
    Flex,
    Textarea,
    HStack,
    IconButton,
    Spinner,
    useColorModeValue
} from "@chakra-ui/react";
import { IoSendSharp, IoMicOutline, IoHappyOutline } from "react-icons/io5";
import { useRecoilValue, useSetRecoilState } from "recoil";
import { userAtom, conversationsAtom, selectedConversationAtom } from "../../../../atoms";
import useShowToast from "../../../../hooks/useShowToast";
import SimpleEmojiPicker from "../../../../components/ui/SimpleEmojiPicker";
import { useChatTheme } from "../../hooks/useChatTheme";

import { useMessageAttachments } from "./hooks/useMessageAttachments";
import { useMessageInputState } from "./hooks/useMessageInputState";
import { useMessageSender } from "./hooks/useMessageSender";
import { AttachmentPreview } from "./components/AttachmentPreview";
import { AttachmentMenu } from "./components/AttachmentMenu";

interface MessageInputProps {
    setMessages: React.Dispatch<React.SetStateAction<any[]>>;
}

const MessageInput = memo(({ setMessages }: MessageInputProps) => {
    const showToast = useShowToast();
    const selectedConversation = useRecoilValue(selectedConversationAtom);
    const setConversations = useSetRecoilState(conversationsAtom);
    const currentUser = useRecoilValue(userAtom);

    const {
        selectedFile,
        filePreview,
        fileInputRef,
        imageInputRef,
        attachMenuRef,
        handleFileChange,
        handleFileAttachment,
        handleImageAttachment,
        clearFileSelection,
        imgUrl,
        handleImageChange,
        clearImages
    } = useMessageAttachments();

    const {
        messageText,
        setMessageText,
        isRecording,
        textareaHeight,
        selectedEmoji,
        setSelectedEmoji,
        textareaRef,
        emojiPickerRef,
        showAttachMenu,
        openAttachMenu,
        closeAttachMenu,
        isEmojiOpen,
        onEmojiOpen,
        onEmojiClose,
        addRecentEmoji,
        handleVoiceRecording
    } = useMessageInputState();

    const { handleSendMessage, isSending } = useMessageSender({
        selectedConversation,
        currentUser,
        setMessages,
        setConversations,
        messageText,
        setMessageText,
        imgUrl,
        clearImages,
        selectedEmoji,
        setSelectedEmoji,
        selectedFile,
        clearFileSelection,
        fileInputRef
    });

    const { inputBgColor, textColor, placeholderColor, inputBorderColor, scrollbarThumb, scrollbarThumbHover } = useChatTheme();
    const inputShadow = useColorModeValue("0 4px 12px rgba(0,0,0,0.05)", "0 4px 20px rgba(0,0,0,0.4)");
    const iconHoverBg = useColorModeValue("blackAlpha.100", "whiteAlpha.100");

    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage(e);
        }
    }, [handleSendMessage]);

    return (
        <Box
            bg="transparent"
            p={0}
            position="relative"
            zIndex={100}
            w="full"
        >
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

            <AttachmentPreview 
                imgUrl={imgUrl}
                filePreview={filePreview}
                selectedFile={selectedFile}
                clearImages={clearImages}
                clearFileSelection={clearFileSelection}
            />

            <Flex 
                gap={2} alignItems="center" bg={inputBgColor} 
                borderRadius="30px" px={4} py={2} 
                boxShadow={inputShadow}
                border="1px solid" borderColor={inputBorderColor}
            >
                <AttachmentMenu 
                    showAttachMenu={showAttachMenu}
                    openAttachMenu={openAttachMenu}
                    closeAttachMenu={closeAttachMenu}
                    handleImageAttachment={() => handleImageAttachment(closeAttachMenu)}
                    handleFileAttachment={() => handleFileAttachment(closeAttachMenu)}
                    attachMenuRef={attachMenuRef}
                />

                <Flex flex={1} position="relative" align="center">
                    <Textarea
                        ref={textareaRef}
                        id="messageInput"
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
                        sx={{
                            '&::-webkit-scrollbar': {
                                width: '4px',
                            },
                            '&::-webkit-scrollbar-track': {
                                background: 'transparent',
                            },
                            '&::-webkit-scrollbar-thumb': {
                                background: scrollbarThumb,
                                borderRadius: '2px',
                            },
                            '&::-webkit-scrollbar-thumb:hover': {
                                background: scrollbarThumbHover,
                            }
                        }}
                    />
                </Flex>

                <HStack spacing={1}>
                    <IconButton
                        icon={<IoHappyOutline size={22} />}
                        variant="ghost"
                        color="gray.400"
                        _hover={{ color: textColor, bg: iconHoverBg }}
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
                            _hover={{ color: textColor, bg: iconHoverBg }}
                            borderRadius="full"
                            size="md"
                            onClick={() => handleVoiceRecording(showToast)}
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
