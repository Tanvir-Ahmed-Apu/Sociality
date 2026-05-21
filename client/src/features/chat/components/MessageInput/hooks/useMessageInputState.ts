import { useState, useRef, useEffect, useCallback } from "react";
import { useDisclosure } from "@chakra-ui/react";
import { useRecentEmojis } from "../../../../../hooks/useRecentEmojis";

export const useMessageInputState = (handleSendMessage?: (e?: any) => Promise<void>) => {
    const [messageText, setMessageText] = useState("");
    const [isRecording, setIsRecording] = useState(false);
    const [textareaHeight, setTextareaHeight] = useState(40);
    const [selectedEmoji, setSelectedEmoji] = useState("");
    
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);
    
    const { isOpen: showAttachMenu, onOpen: openAttachMenu, onClose: closeAttachMenu } = useDisclosure();
    const { isOpen: isEmojiOpen, onOpen: onEmojiOpen, onClose: onEmojiClose } = useDisclosure();
    const { addRecentEmoji } = useRecentEmojis();

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

    // Handle voice recording placeholder
    const handleVoiceRecording = useCallback((showToast: any) => {
        setIsRecording(!isRecording);
        showToast("Info", "Voice recording feature coming soon!", "info");
    }, [isRecording]);

    return {
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
    };
};
