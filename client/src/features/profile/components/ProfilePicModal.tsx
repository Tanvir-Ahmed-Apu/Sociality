import { Modal, ModalOverlay, ModalContent, ModalBody, IconButton, Box, Image, Flex } from "@chakra-ui/react";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { User } from "../../../utils/api";

interface ProfilePicModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
}

export const ProfilePicModal = ({ isOpen, onClose, user }: ProfilePicModalProps) => {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="full"
            isCentered
            returnFocusOnClose={false}
            blockScrollOnMount={false}
        >
            <ModalOverlay bg="blackAlpha.900" backdropFilter="blur(10px)" />
            <ModalContent bg="transparent" boxShadow="none" maxW="100vw" maxH="100vh">
                {/* Back button */}
                <IconButton
                    icon={<ArrowBackIcon boxSize={6} />}
                    aria-label="Back to previous page"
                    position="absolute"
                    top={4}
                    left={4}
                    zIndex={10}
                    variant="ghost"
                    color="white"
                    _hover={{ color: "rgba(0, 179, 116, 0.9)" }}
                    onClick={onClose}
                    size="md"
                />
                <ModalBody
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    p={0}
                    position="relative"
                >
                    <Box position="relative">
                        {user.profilePic ? (
                            <Image
                                src={user.profilePic}
                                maxH="90vh"
                                maxW="90vw"
                                objectFit="contain"
                                borderRadius="full"
                            />
                        ) : (
                            <Flex
                                width="90vw"
                                height="90vh"
                                maxW="500px"
                                maxH="500px"
                                borderRadius="full"
                                bg="gray.600"
                                color="white"
                                fontSize="8xl"
                                alignItems="center"
                                justifyContent="center"
                            >
                                {user.name ? user.name.charAt(0).toUpperCase() : user.username.charAt(0).toUpperCase()}
                            </Flex>
                        )}
                    </Box>
                </ModalBody>
            </ModalContent>
        </Modal>
    );
};
