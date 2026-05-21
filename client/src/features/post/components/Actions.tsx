import {
	Flex,
	Text,
	Box,
	useDisclosure,
	useColorModeValue,
} from "@chakra-ui/react";
import { memo } from "react";
import { Heart, ChatCircle, ArrowsClockwise, PaperPlaneTilt } from "phosphor-react";
import { usePostActions } from "../hooks/usePostActions";
import ActionsReplyModal from "./ActionsReplyModal";
import { Post } from "../../../utils/api";

interface ActionsProps {
	post: Post;
	onCommentToggle?: () => void;
	isExpanded?: boolean;
}

const Actions = memo(({ post, onCommentToggle, isExpanded }: ActionsProps) => {
	const { isOpen, onOpen, onClose } = useDisclosure();

	const {
		liked,
		reposted,
		isReplying,
		reply,
		setReply,
		imagePreview,
		imageRef,
		handleLikeAndUnlike,
		handleImageChange,
		handleReply,
		handleRepost,
		handleShare,
		clearImage,
		user,
	} = usePostActions({ post, onClose });

	const actionColor = useColorModeValue("black", "white");

	return (
		<Flex
			gap={4}
			my={2}
			onClick={(e) => e.preventDefault()}
			w="full"
			align="center"
		>
			{/* Like Button */}
			<Flex alignItems="center" gap={1.5}>
				<Box
					onClick={(e) => {
						e.stopPropagation();
						handleLikeAndUnlike();
					}}
					cursor="pointer"
					transition="all 0.2s"
					_hover={{ transform: "scale(1.1)", color: liked ? "#FF3366" : "inherit" }}
					_active={{ transform: "scale(0.9)" }}
				>
					<Heart
						size={22}
						weight={liked ? "fill" : "bold"}
						color={liked ? "#FF3366" : actionColor}
					/>
				</Box>
				{post.likes?.length > 0 && (
					<Text fontSize="sm" color="gray.500">
						{post.likes.length}
					</Text>
				)}
			</Flex>

			{/* Comment Button */}
			<Flex alignItems="center" gap={1.5}>
				<Box
					onClick={(e) => {
						e.stopPropagation();
						onCommentToggle?.();
					}}
					cursor="pointer"
					transition="all 0.2s"
					_hover={{ transform: "scale(1.1)" }}
					_active={{ transform: "scale(0.9)" }}
				>
					<ChatCircle
						size={22}
						weight="bold"
						color={actionColor}
					/>
				</Box>
				{post.replies?.length > 0 && (
					<Text fontSize="sm" color="gray.500">
						{post.replies.length}
					</Text>
				)}
			</Flex>

			{/* Repost Button */}
			<Flex alignItems="center" gap={1.5}>
				<Box
					onClick={(e) => {
						e.stopPropagation();
						handleRepost();
					}}
					cursor="pointer"
					transition="all 0.2s"
					_hover={{ transform: "scale(1.1)", color: reposted ? "#00B374" : "inherit" }}
					_active={{ transform: "scale(0.9)" }}
				>
					<ArrowsClockwise
						size={22}
						weight="bold"
						color={reposted ? "#00B374" : actionColor}
					/>
				</Box>
				{post.reposts?.length > 0 && (
					<Text fontSize="sm" color="gray.500">
						{post.reposts.length}
					</Text>
				)}
			</Flex>

			{/* Share Button */}
			<Flex alignItems="center">
				<Box
					onClick={(e) => {
						e.stopPropagation();
						handleShare();
					}}
					cursor="pointer"
					transition="all 0.2s"
					_hover={{ transform: "scale(1.1)" }}
					_active={{ transform: "scale(0.9)" }}
				>
					<PaperPlaneTilt
						size={22}
						weight="bold"
						color={actionColor}
					/>
				</Box>
			</Flex>

			{/* Reply Modal */}
			<ActionsReplyModal
				isOpen={isOpen}
				onClose={onClose}
				user={user}
				reply={reply}
				setReply={setReply}
				imagePreview={imagePreview}
				clearImage={clearImage}
				imageRef={imageRef}
				handleImageChange={handleImageChange}
				isReplying={isReplying}
				handleReply={handleReply}
			/>
		</Flex>
	);
});

export default Actions;
