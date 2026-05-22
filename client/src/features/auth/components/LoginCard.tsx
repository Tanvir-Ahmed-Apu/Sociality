import {
	Flex,
	Box,
	FormControl,
	FormLabel,
	Input,
	InputGroup,
	InputRightElement,
	Stack,
	Button,
	Heading,
	Text,
	Link,
	Image,
	Center,
	VStack,
	Divider,
	HStack,
	Icon,
	Checkbox,
	InputLeftElement,
	useColorModeValue,
} from "@chakra-ui/react";
import { useState } from "react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { CaretRight, User, LockSimple } from "phosphor-react";
import { useSetRecoilState } from "recoil";
import { authScreenAtom, userAtom } from "../../../atoms";
import useShowToast from "../../../hooks/useShowToast";
import { startGoogleOAuth } from "../../../utils/oauth";
import { setCurrentTabUser, getTabId } from "../../../utils/api";
import { apiFetch } from "../../../utils/apiBase";
import { useNavigate } from "react-router-dom";

export default function LoginCard() {
	const [showPassword, setShowPassword] = useState(false);
	const setAuthScreen = useSetRecoilState(authScreenAtom);
	const setUser = useSetRecoilState(userAtom);
	const [loading, setLoading] = useState(false);
	const [googleLoading, setGoogleLoading] = useState(false);
	const navigate = useNavigate();

	const [inputs, setInputs] = useState({
		username: "",
		password: "",
	});
	const showToast = useShowToast();
	const inputBg = useColorModeValue("blackAlpha.50", "whiteAlpha.50");
	const borderColor = useColorModeValue("blackAlpha.200", "whiteAlpha.100");
	const textColor = useColorModeValue("black", "white");
	const placeholderColor = useColorModeValue("gray.400", "gray.600");
	const buttonBg = useColorModeValue("#F7F7F7", "#0A0A0A");
	const buttonHoverBg = useColorModeValue("#EEEEEE", "#151515");

	const handleLogin = async () => {
		setLoading(true);
		try {
		const res = await apiFetch(`/api/users/login?session=${getTabId()}`, {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(inputs),
			});

			// Safely parse JSON response
			let data;
			try {
				data = await res.json();
			} catch (parseError) {
				const text = await res.text();
				console.error('Login response was not JSON:', text.substring(0, 200));
				throw new Error(res.ok ? 'Unexpected server response' : `Login failed (${res.status})`);
			}

			if (data.error) {
				showToast("Error", data.error, "error");
				return;
			}

			if (!res.ok) {
				throw new Error(data.error || `Login failed (${res.status})`);
			}

			// Store user data in tab-specific storage
			setCurrentTabUser(data);
			setUser(data);
		} catch (error: any) {
			showToast("Error", error.message || "An error occurred", "error");
		} finally {
			setLoading(false);
		}
	};

	const handleGoogleLogin = async () => {
		// Use mobile-optimized OAuth flow
		const onSuccess = (userData: any) => {
			// Set user data in Recoil state
			setUser(userData);

			// Navigate based on profile completion status (single toast only)
			if (userData.setupRequired || !userData.isProfileComplete) {
				showToast("Info", "Welcome! Please complete your profile setup to get started.", "info");
				setTimeout(() => {
					navigate('/profile-setup', { replace: true });
				}, 100);
			} else {
				showToast("Success", "Welcome back!", "success");
				setTimeout(() => {
					navigate('/', { replace: true });
				}, 100);
			}
		};

		const onError = (error: any) => {
			console.error('Google OAuth error:', error);
			let errorMessage = "Google login failed";

			if (error.message.includes('Popup blocked') || error.message.includes('Popups are blocked')) {
				errorMessage = "Popup blocked. Please allow popups for this site in your browser settings and try again.";
			} else if (error.message.includes('closed before completion')) {
				errorMessage = "Google login was cancelled";
			} else if (error.message.includes('user activation')) {
				errorMessage = "Please click the button directly to open Google login.";
			}

			showToast("Error", errorMessage, "error");
		};

		// Use the mobile-optimized OAuth handler
		await startGoogleOAuth(onSuccess, onError, setGoogleLoading);
	};
	return (
		<Flex align={"center"} justify={"center"} w="full">
			<VStack spacing={6} mx={"auto"} w="full" maxW={"420px"}>
				<Box
					bg="transparent"
					p={{ base: 5, md: 8 }}
					w="full"
					borderRadius="24px"
				>
					<VStack spacing={5} align="flex-start" w="full">
						<FormControl>
							<FormLabel color={textColor} fontWeight="800" fontSize="sm" mb={2}>Username</FormLabel>
							<InputGroup>
								<InputLeftElement h="56px">
									<User size={20} color="gray" />
								</InputLeftElement>
								<Input
									type='text'
									value={inputs.username}
									onChange={(e) => setInputs((inputs) => ({ ...inputs, username: e.target.value }))}
									bg={inputBg}
									backdropFilter="blur(10px)"
									border="1px solid"
									borderColor={borderColor}
									color={textColor}
									_hover={{
										borderColor: useColorModeValue("blackAlpha.300", "whiteAlpha.300"),
										bg: useColorModeValue("blackAlpha.100", "whiteAlpha.100")
									}}
									_focus={{
										borderColor: useColorModeValue("blackAlpha.500", "whiteAlpha.500"),
										bg: useColorModeValue("blackAlpha.100", "whiteAlpha.100"),
										boxShadow: "none"
									}}
									h="56px"
									borderRadius="12px"
									placeholder="Username or email"
									_placeholder={{ color: placeholderColor }}
									pl="45px"
								/>
							</InputGroup>
						</FormControl>

						<FormControl>
							<FormLabel color={textColor} fontWeight="800" fontSize="sm" mb={2}>Password</FormLabel>
							<InputGroup>
								<InputLeftElement h="56px">
									<LockSimple size={20} color="gray" />
								</InputLeftElement>
								<Input
									type={showPassword ? "text" : "password"}
									value={inputs.password}
									onChange={(e) => setInputs((inputs) => ({ ...inputs, password: e.target.value }))}
									bg={inputBg}
									backdropFilter="blur(10px)"
									border="1px solid"
									borderColor={borderColor}
									color={textColor}
									_hover={{
										borderColor: useColorModeValue("blackAlpha.300", "whiteAlpha.300"),
										bg: useColorModeValue("blackAlpha.100", "whiteAlpha.100")
									}}
									_focus={{
										borderColor: useColorModeValue("blackAlpha.500", "whiteAlpha.500"),
										bg: useColorModeValue("blackAlpha.100", "whiteAlpha.100"),
										boxShadow: "none"
									}}
									h="56px"
									borderRadius="12px"
									placeholder="••••••••••••••••"
									_placeholder={{ color: placeholderColor }}
									pl="45px"
								/>
								<InputRightElement h={"56px"}>
									<Button
										variant={"ghost"}
										onClick={() => setShowPassword((showPassword) => !showPassword)}
										color={"gray.500"}
										_hover={{
											color: textColor,
											bg: "transparent"
										}}
									>
										{showPassword ? <ViewIcon /> : <ViewOffIcon />}
									</Button>
								</InputRightElement>
							</InputGroup>
						</FormControl>

						<Flex w="full" justify="space-between" align="center" mt={-2}>
							<Checkbox colorScheme="blue" size="md">
								<Text color="gray.400" fontSize="sm" fontWeight="600">Remember me</Text>
							</Checkbox>
							<Link color="blue.400" fontSize="sm" fontWeight="600" _hover={{ color: "blue.300" }}>
								Forgot password?
							</Link>
						</Flex>

						<Button
							loadingText='Signing In'
							h="56px"
							bg={buttonBg}
							color={textColor}
							border="1px solid"
							borderColor={borderColor}
							_hover={{
								bg: buttonHoverBg,
							}}
							_active={{
								transform: "scale(0.98)",
							}}
							onClick={handleLogin}
							isLoading={loading}
							mt={2}
							width={"full"}
							borderRadius="12px"
							fontWeight={"800"}
							fontSize="md"
						>
							Sign In
						</Button>

						<Center w="full" mt={2}>
							<Text color="gray.500" fontSize="sm" fontWeight="600">
								Don’t have an account?{" "}
								<Text
									as="span"
									color="blue.400"
									onClick={() => setAuthScreen("signup")}
									cursor="pointer"
									_hover={{
										textDecoration: "underline"
									}}
								>
									Sign up
								</Text>
							</Text>
						</Center>

						<HStack width="full" mt={2} spacing={4}>
							<Divider borderColor={borderColor} flex={1} />
							<Text color="gray.500" fontSize="sm" fontWeight="600" whiteSpace="nowrap">Or</Text>
							<Divider borderColor={borderColor} flex={1} />
						</HStack>

						<Flex
							w="full"
							bg="transparent"
							border="1px solid"
							borderColor={borderColor}
							borderRadius="12px"
							p={4}
							align="center"
							justify="space-between"
							cursor="pointer"
							onClick={handleGoogleLogin}
							_hover={{ bg: inputBg }}
							transition="all 0.2s"
						>
							<HStack spacing={4}>
								<Box borderRadius="lg" p={2} display="flex" alignItems="center" justifyContent="center">
									<svg width="24" height="24" viewBox="0 0 24 24">
										<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
										<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
										<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
										<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
									</svg>
								</Box>
								<Box>
									<Text color="gray.500" fontSize="xs">Continue with Google</Text>
									<Text color={textColor} fontWeight="800" fontSize="sm">sociality.user</Text>
								</Box>
							</HStack>
							<CaretRight size={20} color="gray" weight="bold" />
						</Flex>

						<Button
							variant="outline"
							h="56px"
							color={textColor}
							borderColor={borderColor}
							_hover={{
								bg: inputBg,
							}}
							_active={{
								transform: "scale(0.98)",
							}}
							onClick={() => setAuthScreen("signup")}
							width={"full"}
							borderRadius={"full"}
							fontWeight={"800"}
							fontSize="md"
						>
							Create account
						</Button>
					</VStack>
				</Box>
			</VStack>
		</Flex>
	);
}
