import { Modal, ModalOverlay, ModalContent, ModalHeader, ModalCloseButton, ModalBody, FormControl, Textarea, ModalFooter, Button, useColorModeValue } from "@chakra-ui/react";
import { SendMessageButton } from "./SendMessageButton";
import { User } from "../../../utils/api";

interface ProfileMessageModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: User;
    message: string;
    setMessage: (msg: string) => void;
}

export const ProfileMessageModal = ({ isOpen, onClose, user, message, setMessage }: ProfileMessageModalProps) => {
    const modalBg = useColorModeValue("white", "gray.dark");
    const modalTextColor = useColorModeValue("gray.800", "white");

    return (
        <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent bg={modalBg} color={modalTextColor}>
                <ModalHeader>Message {user.username}</ModalHeader>
                <ModalCloseButton />
                <ModalBody pb={6}>
                    <FormControl>
                        <Textarea
                            placeholder={`Write a message to ${user.username}...`}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            size="sm"
                            resize="vertical"
                            minH="100px"
                        />
                    </FormControl>
                </ModalBody>

                <ModalFooter>
                    <SendMessageButton
                        message={message}
                        recipientId={user._id!}
                        recipientUsername={user.username}
                        onMessageSent={() => {
                            setMessage("");
                            onClose();
                        }}
                    />
                    <Button
                        bg="transparent"
                        color={modalTextColor}
                        borderWidth="1px"
                        borderColor={useColorModeValue("gray.300", "gray.600")}
                        _hover={{
                            bg: useColorModeValue("gray.100", "rgba(255, 255, 255, 0.1)"),
                            transform: "translateY(-2px)",
                            borderColor: "gray.500"
                        }}
                        transition="all 0.2s"
                        borderRadius="md"
                        fontWeight="medium"
                        onClick={onClose}
                        boxShadow="0 2px 6px rgba(0, 0, 0, 0.1)"
                        px={5}
                        _active={{
                            transform: "scale(0.98)",
                            boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
                        }}
                        leftIcon={
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <line x1="18" y1="6" x2="6" y2="18"></line>
                                <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                        }
                    >
                        Cancel
                    </Button>
                </ModalFooter>
            </ModalContent>
        </Modal>
    );
};
