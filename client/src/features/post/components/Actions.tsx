import {
	Box,
	Button,
	Flex,
	FormControl,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalFooter,
	ModalHeader,
	ModalOverlay,
	Text,
	useDisclosure,
	Avatar,
	Textarea,
	Image,
	CloseButton,
	IconButton,
	useToast,
	useColorModeValue,
} from "@chakra-ui/react";
import { useState, useRef, useCallback, memo, useMemo } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { userAtom, postsAtom } from "../../../atoms";
import useShowToast from "../../../hooks/useShowToast";

import { BsFillImageFill } from "react-icons/bs";
import { useNavigate } from "react-router-dom";
import { Heart, ChatCircle, ArrowsClockwise, PaperPlaneTilt } from "phosphor-react";

import { Post, User } from "../../../utils/api";
import { fetchWithSession } from "../../../utils/api";

// Simple debounce function to prevent multiple rapid clicks
const useDebounce = (callback: (...args: any[]) => void, delay = 300) => {
	const timeoutRef = useRef<NodeJS.Timeout | null>(null);

	return useCallback((...args: any[]) => {
		if (timeoutRef.current) {
			clearTimeout(timeoutRef.current);
		}

		timeoutRef.current = setTimeout(() => {
			callback(...args);
		}, delay);
	}, [callback, delay]);
};

// Memoize the Actions component to prevent unnecessary re-renders
interface ActionsProps {
	post: Post;
	onCommentToggle?: () => void;
	isExpanded?: boolean;
}

const Actions = memo(({ post, onCommentToggle, isExpanded }: ActionsProps) => {
	const user = useRecoilValue(userAtom);
	const [liked, setLiked] = useState(user && post?.likes ? post.likes.includes(user._id) : false);
	const [posts, setPosts] = useRecoilState(postsAtom);
	const [isLiking, setIsLiking] = useState(false);
	// Add state for repost
	const [reposted, setReposted] = useState(user && post?.reposts ? post.reposts.includes(user._id) : false);
	const [isReposting, setIsReposting] = useState(false);
	// ---
	const [isReplying, setIsReplying] = useState(false);
	const [reply, setReply] = useState("");
	const [image, setImage] = useState<File | null>(null);
	const [imagePreview, setImagePreview] = useState<string | null>(null);
	const imageRef = useRef<HTMLInputElement>(null);

	const showToast = useShowToast();
	const navigate = useNavigate();
	const { isOpen, onOpen, onClose } = useDisclosure();

	// Theme-aware colors
	const modalBgColor = useColorModeValue("white", "#111111");
	const modalTextColor = useColorModeValue("gray.800", "white");
	const actionColor = useColorModeValue("black", "white");
	const textareaPlaceholderColor = useColorModeValue("gray.500", "gray.400");
	const textareaTextColor = useColorModeValue("gray.800", "white");
	const imagePreviewBorderColor = useColorModeValue("gray.200", "gray.700");
	const closeButtonBgColor = useColorModeValue("whiteAlpha.900", "blackAlpha.700");
	const closeButtonTextColor = useColorModeValue("gray.800", "white");
	const replyButtonBgColor = useColorModeValue("brand.primary.500", "brand.primary.500");
	const replyButtonTextColor = useColorModeValue("black", "black");
	const replyButtonHoverBgColor = useColorModeValue("brand.primary.400", "brand.primary.600");

	// Define base handlers without debounce
	const handleLikeAndUnlikeBase = useCallback(async () => {
		if (!user) {
			showToast("Error", "You must be logged in to like a post", "error");
			return;
		}
		if (isLiking) return;
		setIsLiking(true);
		try {
			const res = await fetchWithSession("/api/posts/like/" + post._id, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
			});
			const data = await res.json();
			if (data.error) {
				showToast("Error", data.error, "error");
				return;
			}

			if (!liked) {
				// add the id of the current user to post.likes array
				const updatedPosts = posts.map((p) => {
					if (p._id === post._id) {
						return { ...p, likes: [...(p.likes || []), user._id] };
					}
					return p;
				});
				setPosts(updatedPosts);
			} else {
				// remove the id of the current user from post.likes array
				const updatedPosts = posts.map((p) => {
					if (p._id === post._id) {
						return { ...p, likes: (p.likes || []).filter((id) => id !== user._id) };
					}
					return p;
				});
				setPosts(updatedPosts);
			}

			setLiked(!liked);
		} catch (error: any) {
			showToast("Error", error.message, "error");
		} finally {
			setIsLiking(false);
		}
	}, [user, isLiking, post._id, liked, posts, setPosts, showToast]);

	// Apply debounce to the like handler
	const handleLikeAndUnlike = useDebounce(handleLikeAndUnlikeBase, 300);

	const handleImageChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
		const file = e.target.files?.[0];
		if (file) {
			const reader = new FileReader();
			reader.onload = (event: ProgressEvent<FileReader>) => {
				setImagePreview(event.target?.result as string);
				setImage(file);
			};
			reader.readAsDataURL(file);
		}
	}, []);

	const handleReplyBase = useCallback(async () => {
		if (!user) {
			showToast("Error", "You must be logged in to reply", "error");
			return;
		}
		if (isReplying) return;

		if (!reply.trim() && !image) {
			showToast("Error", "Reply cannot be empty", "error");
			return;
		}

		setIsReplying(true);
		try {
			let imgUrl = null;
			if (image) {
				const reader = new FileReader();
				const imgPromise = new Promise<string | ArrayBuffer | null>((resolve) => {
					reader.onload = (e) => resolve(e.target?.result || null);
					reader.readAsDataURL(image);
				});
				imgUrl = await imgPromise;
			}

			const res = await fetchWithSession("/api/posts/reply/" + post._id, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({
					text: reply,
					img: imgUrl
				}),
			});
			const data = await res.json();

			if (data.error) {
				showToast("Error", data.error, "error");
				return;
			}

			const updatedPosts = posts.map((p) => {
				if (p._id === post._id) {
					return { ...p, replies: [...(p.replies || []), data] };
				}
				return p;
			});
			setPosts(updatedPosts);

			showToast("Success", "Reply posted!", "success");

			onClose();
			setReply("");
			setImage(null);
			setImagePreview(null);
		} catch (error: any) {
			showToast("Error", error.message, "error");
		} finally {
			setIsReplying(false);
		}
	}, [user, isReplying, reply, image, post._id, posts, setPosts, showToast, onClose]);

	const handleReply = useDebounce(handleReplyBase, 300);

	const handleRepostBase = useCallback(async () => {
		if (!user) {
			showToast("Error", "You must be logged in to repost", "error");
			return;
		}
		if (isReposting) return;
		setIsReposting(true);

		const optimisticUpdatedPosts = posts.map((p) => {
			if (p._id === post._id) {
				const currentReposts = p.reposts || [];
				if (reposted) {
					return { ...p, reposts: currentReposts.filter((id) => id !== user._id) };
				} else {
					return { ...p, reposts: [...currentReposts, user._id] };
				}
			}
			return p;
		});
		setPosts(optimisticUpdatedPosts);
		setReposted(!reposted);

		try {
			const res = await fetchWithSession("/api/posts/repost/" + post._id, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
			});
			const data = await res.json();
			if (data.error) {
				setPosts(posts);
				setReposted(reposted);
				showToast("Error", data.error, "error");
				return;
			}
		} catch (error: any) {
			setPosts(posts);
			setReposted(reposted);
		} finally {
			setIsReposting(false);
		}
	}, [user, isReposting, post._id, reposted, posts, setPosts, showToast]);

	const handleRepost = useDebounce(handleRepostBase, 300);

	const handleShareBase = useCallback(async () => {
		const postUrl = `${window.location.origin}/${post.postedBy.username}/post/${post._id}`;
		try {
			if (navigator.share) {
				await navigator.share({
					title: 'Sociality Post',
					url: postUrl,
				});
			} else {
				await navigator.clipboard.writeText(postUrl);
				showToast("Success", "Link copied to clipboard", "success");
			}
		} catch (error: any) {
			if (error.name !== 'AbortError') {
				showToast("Error", error.message, "error");
			}
		}
	}, [post._id, post.postedBy.username, showToast]);

	const handleShare = useDebounce(handleShareBase, 300);

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


			{/* Reply Modal with theme-aware styling */}
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
											onClick={() => {
												setImage(null);
												setImagePreview(null);
											}}
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
		</Flex> // This Flex now wraps all action groups
	);
});

export default Actions;

// Removed the custom SVG components as we are using react-icons now.
// If you prefer the custom SVGs, you can keep them and adjust the code above accordingly.
