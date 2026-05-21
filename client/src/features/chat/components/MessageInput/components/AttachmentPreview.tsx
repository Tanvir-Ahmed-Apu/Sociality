import { Box, HStack, Image, Spinner, VStack, Text, IconButton, useColorModeValue } from "@chakra-ui/react";
import { FaFileAlt } from "react-icons/fa";
import { CloseIcon } from "@chakra-ui/icons";

interface AttachmentPreviewProps {
    imgUrl: string | null | ArrayBuffer;
    filePreview: any;
    selectedFile: File | null;
    clearImages: () => void;
    clearFileSelection: () => void;
}

export const AttachmentPreview = ({
    imgUrl,
    filePreview,
    selectedFile,
    clearImages,
    clearFileSelection
}: AttachmentPreviewProps) => {
    const inputBgColor = useColorModeValue("gray.50", "#121212");
    const inputBorderColor = useColorModeValue("gray.200", "whiteAlpha.100");
    const textColor = useColorModeValue("black", "white");

    if (!imgUrl && !filePreview) return null;

    return (
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
    );
};
