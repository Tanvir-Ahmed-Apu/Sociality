import { useState, useRef } from "react";
import { Box, Flex, Avatar, Textarea, IconButton, Image, CloseButton, Button, useColorModeValue } from "@chakra-ui/react";
import { BsFillImageFill } from "react-icons/bs";
import { User } from "../../../utils/api";

interface PostReplyInputProps {
    currentUser: User | null;
    isSubmitting: boolean;
    onSubmit: (text: string, image: File | null) => void;
}

const PostReplyInput = ({ currentUser, isSubmitting, onSubmit }: PostReplyInputProps) => {
    const [replyText, setReplyText] = useState("");
    const [replyImage, setReplyImage] = useState<File | null>(null);
    const [imagePreview, setImagePreview] = useState<string | ArrayBuffer | null>(null);
    const imageRef = useRef<HTMLInputElement>(null);

    // Theme-aware colors
    const commentInputBg = useColorModeValue("white", "#101010");
    const commentInputColor = useColorModeValue("gray.700", "gray.300");
    const commentInputBorderColor = useColorModeValue("gray.300", "gray.700");
    const imagePreviewCloseBg = useColorModeValue("rgba(255, 255, 255, 0.8)", "rgba(0, 0, 0, 0.7)");
    const imagePreviewCloseColor = useColorModeValue("black", "white");
    const replyButtonBg = useColorModeValue("gray.800", "white");
    const replyButtonColor = useColorModeValue("white", "black");
    const replyButtonHoverBg = useColorModeValue("gray.700", "gray.200");

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file && file.type.startsWith("image/")) {
            setReplyImage(file);
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        if (!replyText.trim() && !replyImage) return;
        onSubmit(replyText, replyImage);
        setReplyText("");
        setReplyImage(null);
        setImagePreview(null);
    };

    return (
        <Box
            bg={commentInputBg}
            borderRadius="md"
            borderWidth="1px"
            borderColor="rgba(0, 179, 116, 0.3)"
            boxShadow="0 0 0 1px rgba(0, 179, 116, 0.2)"
            p={4}
            mb={4}
            position="relative"
            w="full"
        >
            <Flex mt={2} mb={2} gap={3}>
                <Avatar
                    src={currentUser?.profilePic}
                    size="sm"
                    name={currentUser?.username}
                />
                <Flex direction="column" width="full">
                    <Textarea
                        placeholder="Share your thoughts..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        resize="none"
                        minH="60px"
                        bg="transparent"
                        border="none"
                        p={0}
                        _focus={{ border: "none", boxShadow: "none" }}
                        fontSize="sm"
                        color={commentInputColor}
                    />

                    {imagePreview && (
                        <Box position="relative" mt={2} mb={2} borderRadius="md" overflow="hidden" maxW="300px">
                            <Image src={imagePreview as string} maxH="150px" objectFit="cover" />
                            <IconButton
                                icon={<CloseButton />}
                                aria-label="Remove image"
                                size="xs"
                                position="absolute"
                                top={1}
                                right={1}
                                bg={imagePreviewCloseBg}
                                color={imagePreviewCloseColor}
                                borderRadius="full"
                                onClick={() => {
                                    setReplyImage(null);
                                    setImagePreview(null);
                                }}
                            />
                        </Box>
                    )}

                    <Flex justify="space-between" align="center" mt={2} borderTop="1px solid" borderColor={commentInputBorderColor} pt={2}>
                        <Box>
                            <input type="file" hidden ref={imageRef} onChange={handleImageChange} />
                            <IconButton
                                aria-label="Add image"
                                icon={<BsFillImageFill />}
                                variant="ghost"
                                colorScheme="gray"
                                size="sm"
                                onClick={() => imageRef.current?.click()}
                            />
                        </Box>

                        <Button
                            size="sm"
                            bg={replyButtonBg}
                            color={replyButtonColor}
                            borderRadius="full"
                            px={5}
                            fontWeight="bold"
                            _hover={{ bg: replyButtonHoverBg }}
                            isDisabled={(!replyText.trim() && !replyImage) || isSubmitting}
                            isLoading={isSubmitting}
                            onClick={handleSubmit}
                        >
                            Reply
                        </Button>
                    </Flex>
                </Flex>
            </Flex>
        </Box>
    );
};

export default PostReplyInput;
