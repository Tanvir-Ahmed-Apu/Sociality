import {
	Button,
	Flex,
	FormControl,
	FormLabel,
	Heading,
	Input,
	Stack,
	Avatar,
	Box,
	Text,
	IconButton,
	Divider,
	InputGroup,
	InputLeftElement,
	Textarea,
	useColorModeValue,
} from "@chakra-ui/react";
import { useRef, useState, useEffect } from "react";
import { useRecoilState } from "recoil";
import { useNavigate } from "react-router-dom";
import { ArrowBackIcon } from "@chakra-ui/icons";
import { FaUser, FaEnvelope, FaLock, FaIdCard, FaQuoteLeft } from "react-icons/fa";
import { userAtom } from "../atoms";
import usePreviewImg from "../hooks/usePreviewImg";
import { FiCamera } from "react-icons/fi";
import useShowToast from "../hooks/useShowToast";
import useUserEvents from "../hooks/useUserEvents";
import { fetchWithSession, setCurrentTabUser } from "../utils/api";

export default function UpdateProfilePage() {
	const navigate = useNavigate();
	const [user, setUser] = useRecoilState(userAtom);
	const { emitUserUpdate } = useUserEvents();
	const [inputs, setInputs] = useState({
		name: "",
		username: "",
		email: "",
		bio: "",
		password: "",
	});

	// Theme-aware colors
	const bgColor = useColorModeValue("white", "#101010");
	const borderColor = useColorModeValue("gray.200", "gray.700");
	const textColor = useColorModeValue("gray.800", "white");
	const labelColor = useColorModeValue("gray.600", "gray.300");
	const inputBg = useColorModeValue("gray.50", "rgba(0, 0, 0, 0.2)");
	const inputBorderColor = useColorModeValue("gray.300", "gray.600");
	const inputHoverBorderColor = useColorModeValue("gray.400", "gray.500");
	const placeholderColor = useColorModeValue("gray.400", "gray.500");
	const dividerColor = useColorModeValue("rgba(0, 179, 116, 0.3)", "rgba(0, 179, 116, 0.2)");
	const cancelButtonBorder = useColorModeValue("gray.300", "gray.600");
	const cancelButtonHoverBg = useColorModeValue("gray.100", "rgba(255, 255, 255, 0.1)");
	const cancelButtonHoverBorder = useColorModeValue("gray.400", "gray.500");
	const buttonTextColor = useColorModeValue("gray.700", "white");
	const backButtonColor = useColorModeValue("gray.600", "white");
	const helperTextColor = useColorModeValue("gray.500", "gray.500");

	useEffect(() => {
		if (user) {
			setInputs({
				name: user.name || "",
				username: user.username || "",
				email: user.email || "",
				bio: user.bio || "",
				password: "",
			});
		}
	}, [user]);
	const fileRef = useRef<HTMLInputElement>(null);
	const [updating, setUpdating] = useState(false);

	const showToast = useShowToast();

	const { handleImageChange: handleProfilePicChange, imgUrl: profilePicUrl } = usePreviewImg();
	const { handleImageChange: handleCoverPicChange, imgUrl: coverPicUrl } = usePreviewImg();
	const coverFileRef = useRef<HTMLInputElement>(null);

	const handleSubmit = async (e?: React.FormEvent | React.MouseEvent) => {
		try {
			if (e) e.preventDefault();
			console.log("[UpdateProfile] Button clicked, updating state:", updating);
			
			if (updating) {
				console.log("[UpdateProfile] Already updating, returning early.");
				return;
			}
			
			if (inputs.password && inputs.password.length < 6) {
				console.warn("[UpdateProfile] Validation failed: Password must be at least 6 characters. Current length:", inputs.password.length);
				showToast("Error", "Password must be at least 6 characters. If you don't want to change it, leave it completely blank.", "error");
				return;
			}
			if (!user) {
				console.error("[UpdateProfile] User is null, cannot submit");
				showToast("Error", "User session not found", "error");
				return;
			}
			
			console.log("[UpdateProfile] Starting submission with payload:", { ...inputs, password: inputs.password ? '***' : '' });
			setUpdating(true);
			
			// Only send image fields if a new image was selected (non-empty base64)
			const payload: Record<string, any> = { ...inputs };
			if (profilePicUrl) payload.profilePic = profilePicUrl as string;
			if (coverPicUrl) payload.coverPic = coverPicUrl as string;

			const res = await fetchWithSession(`/api/users/update/${user._id}`, {
				method: "PUT",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});

			console.log("[UpdateProfile] Response status:", res.status);

			if (res.ok) {
				const data = await res.json();
				// Preserve fields the backend doesn't return (sessionPath, isProfileComplete)
				const updatedUser = {
					...user,
					...data,
					isProfileComplete: data.isProfileComplete ?? user.isProfileComplete ?? true,
					sessionPath: user.sessionPath,
				};
				// Update Recoil state
				setUser(updatedUser);
				// Update tab-specific localStorage (correct key)
				setCurrentTabUser(updatedUser);

				// Emit global user update event to synchronize all components
				emitUserUpdate(updatedUser);

				showToast("Success", "Profile updated successfully", "success");

				// Navigate to the profile page after successful update
				// Using the most up-to-date username from the response
				const targetPath = `/${updatedUser.username}`;
				console.log("[UpdateProfile] Navigating to:", targetPath);
				
				setTimeout(() => {
					navigate(targetPath, { replace: true });
				}, 100);
			} else {
				const errorData = await res.json().catch(() => ({ error: 'Failed to update profile' }));
				console.error("[UpdateProfile] Error response:", res.status, errorData);
				showToast("Error", errorData.error || errorData.message || 'Failed to update profile', "error");
			}
		} catch (error: any) {
			console.error("[UpdateProfile] Exception:", error);
			showToast("Error", error.message || 'An unexpected error occurred', "error");
		} finally {
			setUpdating(false);
		}
	};


	return (
		<Box as="form" onSubmit={handleSubmit}>
			<Flex direction="column" align="center" justify="center" my={{ base: 2, md: 4 }} px={4} pb={{ base: "180px", md: "20px" }}>
				{/* Back Button */}
				<Box alignSelf="flex-start" mb={{ base: 2, md: 3 }}>
					<IconButton
						icon={<ArrowBackIcon boxSize={5} />}
						aria-label="Go back"
						variant="ghost"
						color={backButtonColor}
						_hover={{
							color: "rgba(0, 179, 116, 0.9)",
							bg: "rgba(0, 179, 116, 0.1)"
						}}
						onClick={() => navigate(`/${user?.username}`)}
						size="md"
						borderRadius="md"
					/>
				</Box>

				{/* Main Container */}
				<Stack
					spacing={{ base: 3, md: 5 }}
					w="full"
					maxW="md"
					bg={bgColor}
					rounded="xl"
					borderWidth="1px"
					borderColor={borderColor}
					boxShadow="0 4px 20px rgba(0, 0, 0, 0.3)"
					p={{ base: 4, md: 6 }}
					className="glass-card"
					position="relative"
				>
					{/* Header */}
					<Flex direction="column" align="center" mb={{ base: 1, md: 2 }}>
						<Heading
							lineHeight={1.1}
							fontSize={{ base: "xl", sm: "2xl", md: "3xl" }}
							bgGradient="linear(to-r, rgba(0, 179, 116, 0.8), rgba(0, 121, 185, 0.8))"
							bgClip="text"
							fontWeight="bold"
						>
							Edit Your Profile
						</Heading>
						<Text fontSize="sm" color={labelColor} mt={{ base: 0.5, md: 1 }}>
							Update your personal information
						</Text>
					</Flex>

					<Divider borderColor={dividerColor} />

					{/* Cover Photo Section */}
					<FormControl id="coverPic">
						<Box 
							w="full" 
							h={{ base: "120px", md: "160px" }} 
							bg={(coverPicUrl as string) || user?.coverPic ? `url(${(coverPicUrl as string) || user?.coverPic})` : "brand.primary.500"}
							bgSize="cover"
							bgPosition="center"
							borderRadius="xl"
							position="relative"
							overflow="hidden"
							mb={4}
							cursor="pointer"
							onClick={() => coverFileRef.current?.click()}
							transition="all 0.3s ease"
							_hover={{ opacity: 0.9 }}
						>
							<Flex 
								position="absolute"
								top={0} left={0} right={0} bottom={0}
								bg="blackAlpha.400"
								align="center"
								justify="center"
								opacity={0}
								_hover={{ opacity: 1 }}
								transition="opacity 0.2s"
							>
								<Button 
									leftIcon={<FiCamera />} 
									size="sm" 
									variant="solid" 
									colorScheme="whiteAlpha"
									pointerEvents="none"
									type="button"
								>
									Change Cover Photo
								</Button>
							</Flex>
							<Input type="file" hidden ref={coverFileRef} onChange={handleCoverPicChange} accept="image/*" />
						</Box>
					</FormControl>

					{/* Avatar Section */}
					<FormControl id="userName">
						<Flex direction="column" align="center" justify="center" mt="-60px" position="relative" zIndex={2}>
							<Box
								position="relative"
								mb={{ base: 2, md: 3 }}
								cursor="pointer"
								onClick={() => fileRef.current?.click()}
								transition="all 0.3s ease"
								_hover={{ transform: "scale(1.05)" }}
							>
								<Avatar
									size={{ base: "xl", md: "2xl" }}
									src={(profilePicUrl as string) || user?.profilePic}
									boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
									border="4px solid"
									borderColor={bgColor}
								/>
								<Box
									position="absolute"
									bottom="0"
									right="0"
									bg="rgba(0, 179, 116, 0.8)"
									p={1}
									borderRadius="full"
									boxShadow="0 2px 6px rgba(0, 0, 0, 0.2)"
								>
									<FaUser color="white" size={14} />
								</Box>
							</Box>
							<Button
								size="sm"
								bg="rgba(0, 179, 116, 0.2)"
								color={buttonTextColor}
								borderWidth="1px"
								borderColor="rgba(0, 179, 116, 0.5)"
								_hover={{
									bg: "rgba(0, 179, 116, 0.3)",
									transform: "translateY(-2px)",
									borderColor: "rgba(0, 179, 116, 0.7)"
								}}
								transition="all 0.2s"
								borderRadius="md"
								fontWeight="medium"
								onClick={() => fileRef.current?.click()}
								boxShadow="0 2px 6px rgba(0, 0, 0, 0.1)"
								px={4}
								py={2}
								type="button"
								_active={{
									transform: "scale(0.98)",
									boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
								}}
								leftIcon={<FaUser size={14} />}
							>
								Change Avatar
							</Button>
							<Input type="file" hidden ref={fileRef} onChange={handleProfilePicChange} accept="image/*" />
						</Flex>
					</FormControl>

					<Divider borderColor={dividerColor} />

					{/* Form Fields */}
					<Stack spacing={{ base: 2, md: 3 }}>
						{/* Full Name */}
						<FormControl>
							<FormLabel fontWeight="medium" color={labelColor}>Full Name</FormLabel>
							<InputGroup>
								<InputLeftElement pointerEvents="none">
									<FaUser color="rgba(0, 179, 116, 0.6)" />
								</InputLeftElement>
								<Input
									placeholder="John Doe"
									value={inputs.name}
									onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
									_placeholder={{ color: placeholderColor }}
									type="text"
									bg={inputBg}
									borderColor={inputBorderColor}
									borderRadius="md"
									color={textColor}
									_hover={{ borderColor: inputHoverBorderColor }}
									_focus={{
										borderColor: "rgba(0, 179, 116, 0.6)",
										boxShadow: "0 0 0 1px rgba(0, 179, 116, 0.6)"
									}}
									transition="all 0.3s ease"
								/>
							</InputGroup>
						</FormControl>

						{/* Username */}
						<FormControl>
							<FormLabel fontWeight="medium" color={labelColor}>Username</FormLabel>
							<InputGroup>
								<InputLeftElement pointerEvents="none">
									<FaIdCard color="rgba(0, 179, 116, 0.6)" />
								</InputLeftElement>
								<Input
									placeholder="johndoe"
									value={inputs.username}
									onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
									_placeholder={{ color: placeholderColor }}
									type="text"
									bg={inputBg}
									borderColor={inputBorderColor}
									borderRadius="md"
									color={textColor}
									_hover={{ borderColor: inputHoverBorderColor }}
									_focus={{
										borderColor: "rgba(0, 179, 116, 0.6)",
										boxShadow: "0 0 0 1px rgba(0, 179, 116, 0.6)"
									}}
									transition="all 0.3s ease"
								/>
							</InputGroup>
						</FormControl>

						{/* Email */}
						<FormControl>
							<FormLabel fontWeight="medium" color={labelColor}>Email Address</FormLabel>
							<InputGroup>
								<InputLeftElement pointerEvents="none">
									<FaEnvelope color="rgba(0, 179, 116, 0.6)" />
								</InputLeftElement>
								<Input
									placeholder="your-email@example.com"
									value={inputs.email}
									onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
									_placeholder={{ color: placeholderColor }}
									type="email"
									bg={inputBg}
									borderColor={inputBorderColor}
									borderRadius="md"
									color={textColor}
									_hover={{ borderColor: inputHoverBorderColor }}
									_focus={{
										borderColor: "rgba(0, 179, 116, 0.6)",
										boxShadow: "0 0 0 1px rgba(0, 179, 116, 0.6)"
									}}
									transition="all 0.3s ease"
								/>
							</InputGroup>
						</FormControl>

						{/* Bio */}
						<FormControl>
							<FormLabel fontWeight="medium" color={labelColor}>Bio</FormLabel>
							<InputGroup>
								<InputLeftElement pointerEvents="none">
									<FaQuoteLeft color="rgba(0, 179, 116, 0.6)" />
								</InputLeftElement>
								<Textarea
									placeholder="Tell us about yourself"
									value={inputs.bio}
									onChange={(e) => setInputs({ ...inputs, bio: e.target.value })}
									_placeholder={{ color: placeholderColor }}
									bg={inputBg}
									borderColor={inputBorderColor}
									borderRadius="md"
									color={textColor}
									_hover={{ borderColor: inputHoverBorderColor }}
									_focus={{
										borderColor: "rgba(0, 179, 116, 0.6)",
										boxShadow: "0 0 0 1px rgba(0, 179, 116, 0.6)"
									}}
									transition="all 0.3s ease"
									pl={10}
									minH={{ base: "60px", md: "80px" }}
									resize="vertical"
								/>
							</InputGroup>
						</FormControl>

						{/* Password */}
						<FormControl>
							<FormLabel fontWeight="medium" color={labelColor}>Password</FormLabel>
							<InputGroup>
								<InputLeftElement pointerEvents="none">
									<FaLock color="rgba(0, 179, 116, 0.6)" />
								</InputLeftElement>
								<Input
									placeholder="Leave blank to keep current password"
									value={inputs.password}
									onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
									_placeholder={{ color: placeholderColor }}
									type="password"
									bg={inputBg}
									borderColor={inputBorderColor}
									borderRadius="md"
									color={textColor}
									_hover={{ borderColor: inputHoverBorderColor }}
									_focus={{
										borderColor: "rgba(0, 179, 116, 0.6)",
										boxShadow: "0 0 0 1px rgba(0, 179, 116, 0.6)"
									}}
									transition="all 0.3s ease"
								/>
							</InputGroup>
							<Text fontSize="xs" color={helperTextColor} mt={1}>
								Must be at least 6 characters
							</Text>
						</FormControl>
					</Stack>

					<Divider borderColor={dividerColor} mt={{ base: 1, md: 2 }} />

					{/* Action Buttons */}
					<Stack spacing={{ base: 2, md: 3 }} direction={["column", "row"]} pt={{ base: 1, md: 2 }}>
						<Button
							bg="transparent"
							color={buttonTextColor}
							borderWidth="1px"
							borderColor={cancelButtonBorder}
							_hover={{
								bg: cancelButtonHoverBg,
								transform: "translateY(-2px)",
								borderColor: cancelButtonHoverBorder
							}}
							transition="all 0.2s"
							borderRadius="md"
							fontWeight="medium"
							w="full"
							onClick={() => navigate(`/${user?.username}`)}
							boxShadow="0 2px 6px rgba(0, 0, 0, 0.1)"
							_active={{
								transform: "scale(0.98)",
								boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
							}}
						>
							Cancel
						</Button>
						<Button
							bg="rgba(0, 179, 116, 0.2)"
							color={buttonTextColor}
							borderWidth="1px"
							borderColor="rgba(0, 179, 116, 0.5)"
							_hover={{
								bg: "rgba(0, 179, 116, 0.3)",
								transform: "translateY(-2px)",
								borderColor: "rgba(0, 179, 116, 0.7)"
							}}
							transition="all 0.2s"
							borderRadius="md"
							fontWeight="medium"
							w="full"
							type="button"
							onClick={handleSubmit}
							isLoading={updating}
							boxShadow="0 2px 6px rgba(0, 0, 0, 0.1)"
							_active={{
								transform: "scale(0.98)",
								boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)"
							}}
						>
							Save Changes
						</Button>
					</Stack>
				</Stack>
			</Flex>
		</Box>
	);
}
