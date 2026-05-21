import { Box, VStack, Button, IconButton, useColorModeValue } from "@chakra-ui/react";
import { IoAttach, IoImageOutline } from "react-icons/io5";
import { FaFileAlt } from "react-icons/fa";
import { RefObject, useEffect } from "react";

interface AttachmentMenuProps {
    showAttachMenu: boolean;
    openAttachMenu: () => void;
    closeAttachMenu: () => void;
    handleImageAttachment: () => void;
    handleFileAttachment: () => void;
    attachMenuRef: RefObject<HTMLDivElement>;
}

export const AttachmentMenu = ({
    showAttachMenu,
    openAttachMenu,
    closeAttachMenu,
    handleImageAttachment,
    handleFileAttachment,
    attachMenuRef
}: AttachmentMenuProps) => {
    const textColor = useColorModeValue("black", "white");
    const attachmentBg = useColorModeValue("white", "#1A1A1A");
    const attachmentColor = useColorModeValue("gray.600", "gray.400");
    const inputBorderColor = useColorModeValue("gray.200", "whiteAlpha.100");

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
    }, [showAttachMenu, closeAttachMenu, attachMenuRef]);

    return (
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
    );
};
