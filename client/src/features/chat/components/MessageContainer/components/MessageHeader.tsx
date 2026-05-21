import { Flex, IconButton, Avatar, AvatarBadge, Text, Badge, HStack, useColorModeValue } from "@chakra-ui/react";
import { FaGlobe } from "react-icons/fa";
import { FiMoreVertical } from "react-icons/fi";
import { useChatTheme } from '../../../hooks/useChatTheme';

interface MessageHeaderProps {
	selectedConversation: any;
	onlineUsers: string[];
	handleBackClick: () => void;
	showRightSidebar: boolean;
	setShowRightSidebar: (show: boolean) => void;
}

const MessageHeader = ({
	selectedConversation,
	onlineUsers,
	handleBackClick,
	showRightSidebar,
	setShowRightSidebar
}: MessageHeaderProps) => {
	const { textColor: chatHeaderTextColor } = useChatTheme();
	const chatHeaderBg = useColorModeValue("rgba(255, 255, 255, 0.95)", "rgba(0, 0, 0, 0.7)");
	const iconColor = useColorModeValue("gray.600", "gray.400");
	const iconHoverBg = useColorModeValue("blackAlpha.100", "whiteAlpha.100");

	return (
		<Flex
			w={"full"}
			h="70px"
			alignItems={"center"}
			justifyContent="space-between"
			px={{ base: 3, md: 5 }}
			bg={chatHeaderBg}
			backdropFilter="blur(15px)"
			zIndex={10}
			position="sticky"
			top={0}
		>
			<Flex alignItems="center" gap={4}>
				{/* Back Button for mobile */}
				<IconButton
					onClick={handleBackClick}
					icon={<span>&larr;</span>}
					aria-label="Back"
					variant="ghost"
					size="sm"
					display={{ base: "flex", md: "none" }}
					mr={1}
					color={chatHeaderTextColor}
				/>

				{selectedConversation.isFederated ? (
					<>
						<Avatar
							src={selectedConversation.groupPhoto || ""}
							size="sm"
							icon={<FaGlobe size={18} />}
						/>
						<Flex direction="column">
							<Text fontWeight="700" fontSize="md" color={chatHeaderTextColor}>
								{selectedConversation.name || 'Federated Room'}
							</Text>
							<Flex alignItems="center" gap={1}>
								<Badge colorScheme="blue" variant="subtle" fontSize="9px">Cross-platform</Badge>
							</Flex>
						</Flex>
					</>
				) : (
					<>
						<Avatar
							src={selectedConversation.userProfilePic}
							size={"sm"}
						>
							<AvatarBadge
								boxSize='1.1em'
								bg={selectedConversation.userId && onlineUsers.includes(selectedConversation.userId) ? '#00B374' : 'gray.400'}
								border="2px solid black"
							/>
						</Avatar>
						<Flex direction="column">
							<Text fontWeight="700" fontSize="md" color={chatHeaderTextColor}>
								{selectedConversation.username}
							</Text>
							<Text fontSize="xs" fontWeight="500" color="gray.500">
								{selectedConversation.userId && onlineUsers.includes(selectedConversation.userId)
									? "Active now"
									: "Offline"}
							</Text>
						</Flex>
					</>
				)}
			</Flex>

			<HStack spacing={2}>
				<IconButton
					icon={<FiMoreVertical size={20} />}
					variant="ghost"
					color={iconColor}
					_hover={{ color: chatHeaderTextColor, bg: iconHoverBg }}
					borderRadius="full"
					aria-label="More"
					onClick={() => setShowRightSidebar(!showRightSidebar)}
				/>
			</HStack>
		</Flex>
	);
};

export default MessageHeader;
