import {
	Button,
	Flex,
	FormControl,
	Input,
	Modal,
	ModalBody,
	ModalCloseButton,
	ModalContent,
	ModalHeader,
	ModalOverlay,
	Text,
	Textarea,
	useColorModeValue,
	useDisclosure,
	Avatar,
	IconButton,
} from "@chakra-ui/react";
import { useRef } from "react";
import { BsFillImageFill } from "react-icons/bs";
import { useCreatePost } from "../hooks/useCreatePost";
import CreatePostTrigger from "./CreatePostTrigger";
import CreatePostImagePreview from "./CreatePostImagePreview";
import { Post } from "../../../utils/api";

interface CreatePostProps {
	onPostCreated?: (post: Post) => void;
	hideTrigger?: boolean;
	inline?: boolean;
	externalOpen?: boolean;
	externalClose?: () => void;
}

const CreatePost = ({ onPostCreated, hideTrigger = false, inline = false, externalOpen, externalClose }: CreatePostProps) => {
	const internalDisclosure = useDisclosure();
	const isOpen = externalOpen !== undefined ? externalOpen : internalDisclosure.isOpen;
	const onOpen = internalDisclosure.onOpen;
	const onClose = externalClose !== undefined ? externalClose : internalDisclosure.onClose;

	const {
		postText,
		remainingChar,
		loading,
		currentImageIndex,
		setCurrentImageIndex,
		imgUrls,
		handleImageChange,
		handleTextChange,
		handleCreatePost,
		handleCloseImage,
		user,
		MAX_CHAR,
	} = useCreatePost({ onPostCreated, onClose });

	const imageRef = useRef<HTMLInputElement>(null);

	return (
		<>
			<CreatePostTrigger
				inline={inline}
				hideTrigger={hideTrigger}
				profilePic={user?.profilePic}
				username={user?.username}
				onOpen={onOpen}
			/>

			<Modal
				isOpen={isOpen}
				onClose={onClose}
				size={{ base: "full", sm: "xl", md: "2xl" }}
				scrollBehavior="inside"
			>
				<ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />

				<ModalContent
					className="glass-card create-post-modal"
					bg={useColorModeValue("white", "rgba(16, 16, 16, 0.8)")}
					color={useColorModeValue("gray.800", "white")}
					borderColor={useColorModeValue("gray.200", "rgba(255, 255, 255, 0.05)")}
					borderWidth="1px"
					borderRadius={{ base: "0", sm: "32px" }}
					boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.3)"
					m={{ base: 0, sm: 4 }}
					maxH={{ base: "100vh", sm: "90vh" }}
				>
					<ModalHeader>Create Post</ModalHeader>
					<ModalCloseButton />
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
									{/* Text Input Area */}
									<Textarea
										placeholder="What's happening?"
										value={postText}
										onChange={handleTextChange}
										mb="3"
										bg={useColorModeValue("gray.50", "rgba(0, 0, 0, 0.2)")}
										borderColor={useColorModeValue("gray.300", "rgba(255, 255, 255, 0.1)")}
										borderWidth="1px"
										borderRadius="md"
										_focus={{ borderColor: "brand.primary.500", boxShadow: "0 0 0 1px rgba(0, 179, 116, 0.3)" }}
										_hover={{ borderColor: "brand.secondary.500" }}
										color={useColorModeValue("gray.800", "white")}
										_placeholder={{ color: useColorModeValue("gray.500", "gray.400") }}
										minH="100px"
										fontSize="md"
										resize="none"
										className="glass-card"
									/>
									<Text fontSize='xs' fontWeight='bold' textAlign={"right"} mb={2} color={useColorModeValue("gray.600", "gray.400")}>
										{remainingChar}/{MAX_CHAR}
									</Text>
								</FormControl>

								{/* Image Preview */}
								<CreatePostImagePreview
									imgUrls={imgUrls}
									currentImageIndex={currentImageIndex}
									setCurrentImageIndex={setCurrentImageIndex}
									onCloseImage={handleCloseImage}
									onAddMoreClick={() => imageRef.current?.click()}
								/>

								{/* Action Buttons */}
								<Flex justify="space-between" align="center" mt={2}>
									<Flex align="center">
										<Input
											type='file'
											hidden
											ref={imageRef}
											onChange={handleImageChange}
											multiple // Allow multiple file selection
											accept="image/*" // Only accept image files
										/>
										<IconButton
											aria-label="Add images"
											icon={<BsFillImageFill />}
											onClick={() => imageRef.current?.click()}
											variant="ghost"
											color="brand.secondary.500"
											_hover={{ color: "brand.secondary.400", bg: "rgba(0, 121, 185, 0.1)" }}
											size="md"
											borderRadius="full"
											title="Add multiple images"
										/>
									</Flex>

									<Button
										bg="brand.primary.500"
										color={useColorModeValue("white", "white")}
										_hover={{ bg: "brand.primary.600", transform: "translateY(-2px)" }}
										isLoading={loading}
										onClick={handleCreatePost}
										isDisabled={!postText.trim() && imgUrls.length === 0}
										borderRadius="md"
										px={6}
										py={3}
										fontWeight="bold"
										size="md"
										borderWidth="1px"
										borderColor={useColorModeValue("rgba(0, 0, 0, 0.1)", "rgba(255, 255, 255, 0.1)")}
										boxShadow="0 4px 12px rgba(0, 179, 116, 0.2)"
										transition="all 0.2s"
										className="brand-button"
									>
										Post
									</Button>
								</Flex>
							</Flex>
						</Flex>
					</ModalBody>
				</ModalContent>
			</Modal>
		</>
	);
};

export default CreatePost;
