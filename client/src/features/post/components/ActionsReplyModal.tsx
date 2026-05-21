import { memo } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Flex,
  Avatar,
  FormControl,
  Textarea,
  Box,
  Image,
  CloseButton,
  Input,
  IconButton,
  Button,
  useColorModeValue,
} from "@chakra-ui/react";
import { BsFillImageFill } from "react-icons/bs";

interface ActionsReplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  reply: string;
  setReply: (val: string) => void;
  imagePreview: string | null;
  clearImage: () => void;
  imageRef: React.RefObject<HTMLInputElement>;
  handleImageChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isReplying: boolean;
  handleReply: () => void;
}

const ActionsReplyModal = memo(({
  isOpen,
  onClose,
  user,
  reply,
  setReply,
  imagePreview,
  clearImage,
  imageRef,
  handleImageChange,
  isReplying,
  handleReply,
}: ActionsReplyModalProps) => {
  const modalBgColor = useColorModeValue("white", "#111111");
  const modalTextColor = useColorModeValue("gray.800", "white");
  const textareaPlaceholderColor = useColorModeValue("gray.500", "gray.400");
  const textareaTextColor = useColorModeValue("gray.800", "white");
  const imagePreviewBorderColor = useColorModeValue("gray.200", "gray.700");
  const closeButtonBgColor = useColorModeValue("whiteAlpha.900", "blackAlpha.700");
  const closeButtonTextColor = useColorModeValue("gray.800", "white");
  const replyButtonBgColor = "brand.primary.500";
  const replyButtonTextColor = "black";
  const replyButtonHoverBgColor = useColorModeValue("brand.primary.400", "brand.primary.600");

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent
        bg={modalBgColor}
        color={modalTextColor}
        borderRadius="24px"
        border="none"
        position="relative"
      >
        <ModalHeader>Reply to Post</ModalHeader>
        <ModalCloseButton
          color={useColorModeValue("gray.600", "gray.400")}
          _hover={{
            bg: useColorModeValue("gray.100", "rgba(0, 179, 116, 0.1)"),
            color: useColorModeValue("gray.800", "white")
          }}
        />
        <ModalBody pb={6}>
          <Flex gap={4}>
            {/* User Avatar */}
            <Avatar
              size="md"
              src={user?.profilePic}
              name={user?.username}
            />

            <Flex direction="column" flex={1}>
              <FormControl>
                <Textarea
                  placeholder="Write your reply..."
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  bg="transparent"
                  border="none"
                  _focus={{ border: "none", boxShadow: "none" }}
                  _placeholder={{ color: textareaPlaceholderColor }}
                  color={textareaTextColor}
                  fontSize="md"
                  minH="100px"
                  resize="none"
                />
              </FormControl>

              {/* Image Preview */}
              {imagePreview && (
                <Box
                  mt={2}
                  mb={4}
                  position={"relative"}
                  borderRadius="lg"
                  overflow="hidden"
                  borderWidth="1px"
                  borderColor={imagePreviewBorderColor}
                >
                  <Image
                    src={imagePreview}
                    alt='Selected img'
                    maxH="200px"
                    objectFit="cover"
                    w="full"
                  />
                  <CloseButton
                    onClick={clearImage}
                    bg={closeButtonBgColor}
                    color={closeButtonTextColor}
                    position={"absolute"}
                    top={2}
                    right={2}
                    size="sm"
                    borderRadius="full"
                  />
                </Box>
              )}

              {/* Add Image Button */}
              <Flex justify="flex-start" mt={2}>
                <Input type='file' hidden ref={imageRef} onChange={handleImageChange} />
                <IconButton
                  aria-label="Add image"
                  icon={<BsFillImageFill />}
                  onClick={() => imageRef.current?.click()}
                  variant="ghost"
                  colorScheme="gray"
                  size="md"
                  borderRadius="full"
                />
              </Flex>
            </Flex>
          </Flex>
        </ModalBody>

        <ModalFooter>
          <Button
            bg={replyButtonBgColor}
            color={replyButtonTextColor}
            _hover={{
              bg: replyButtonHoverBgColor,
              transform: "translateY(-2px)"
            }}
            borderRadius="md"
            px={6}
            py={2}
            fontWeight="bold"
            size="sm"
            isLoading={isReplying}
            onClick={handleReply}
            boxShadow="md"
            transition="all 0.2s"
          >
            Reply
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
});

export default ActionsReplyModal;
