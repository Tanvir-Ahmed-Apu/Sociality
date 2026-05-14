import { useState } from "react";
import { Button, useToast, useColorModeValue } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useSetRecoilState, useRecoilValue } from "recoil";
import { conversationsAtom, userAtom } from "../../../atoms";
import { fetchWithSession } from "../../../utils/api";

interface SendMessageButtonProps {
    message: string;
    recipientId: string;
    recipientUsername: string;
    onMessageSent: () => void;
}

export const SendMessageButton = ({ message, recipientId, recipientUsername, onMessageSent }: SendMessageButtonProps) => {
    const [isSending, setIsSending] = useState(false);
    const toast = useToast();
    const navigate = useNavigate();
    const setConversations = useSetRecoilState(conversationsAtom);
    const currentUser = useRecoilValue(userAtom);
    const buttonTextColor = useColorModeValue("gray.700", "white");

    const handleSendMessage = async () => {
        if (!message.trim()) return;
        if (isSending) return;

        setIsSending(true);
        try {
            const res = await fetchWithSession("/api/messages", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    text: message,
                    recipientId,
                }),
            });

            const data = await res.json();

            if (data.error) {
                toast({
                    title: "Error",
                    description: data.error,
                    status: "error",
                    duration: 3000,
                    isClosable: true,
                });
                return;
            }

            // Create or update the conversation in the conversations atom
            setConversations(prev => {
                // Check if conversation already exists
                const existingConvIndex = prev.findIndex(
                    conv => conv.participants?.some(p => p._id === recipientId)
                );

                if (existingConvIndex >= 0) {
                    // Update existing conversation
                    const updatedConversations = [...prev];
                    updatedConversations[existingConvIndex] = {
                        ...updatedConversations[existingConvIndex],
                        lastMessage: {
                            text: message,
                            sender: currentUser?._id,
                        },
                    };
                    return updatedConversations;
                } else {
                    // Create new conversation
                    const newConversation = {
                        _id: data.conversationId,
                        participants: [{
                            _id: recipientId,
                            username: recipientUsername,
                            profilePic: currentUser?.profilePic,
                        }],
                        lastMessage: {
                            text: message,
                            sender: currentUser?._id,
                        },
                    };
                    return [...prev, newConversation];
                }
            });

            toast({
                title: "Message sent",
                status: "success",
                duration: 3000,
                isClosable: true,
            });

            // Call the callback to close the modal and reset the form
            onMessageSent();

            // Navigate to the chat page
            navigate('/chat');

        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                status: "error",
                duration: 3000,
                isClosable: true,
            });
        } finally {
            setIsSending(false);
        }
    };

    return (
        <Button
            bg="rgba(0, 121, 185, 0.2)"
            color={buttonTextColor}
            borderWidth="1px"
            borderColor="rgba(0, 121, 185, 0.5)"
            _hover={{
                bg: "rgba(0, 121, 185, 0.3)",
                transform: "translateY(-2px)",
                borderColor: "rgba(0, 121, 185, 0.7)"
            }}
            transition="all 0.2s"
            borderRadius="md"
            fontWeight="medium"
            mr={3}
            isDisabled={!message.trim()}
            onClick={handleSendMessage}
            isLoading={isSending}
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
                    <line x1="22" y1="2" x2="11" y2="13"></line>
                    <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                </svg>
            }
        >
            Send
        </Button>
    );
};
