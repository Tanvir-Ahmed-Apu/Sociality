import {
	Flex,
	Box,
	Button,
	Heading,
	Text,
	VStack,
	HStack,
	useColorModeValue,
	Spinner,
} from "@chakra-ui/react";
import { useState } from "react";
import { useSetRecoilState } from "recoil";
import { userAtom } from "../../../atoms";
import useShowToast from "../../../hooks/useShowToast";
import { startGoogleOAuth } from "../../../utils/oauth";
import { useNavigate } from "react-router-dom";

export default function LoginCard() {
	const setUser = useSetRecoilState(userAtom);
	const [googleLoading, setGoogleLoading] = useState(false);
	const navigate = useNavigate();
	const showToast = useShowToast();

	const cardBg = useColorModeValue("white", "#111111");
	const cardBorder = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
	const cardShadow = useColorModeValue(
		"0 20px 40px rgba(0,0,0,0.08), 0 1px 3px rgba(0,0,0,0.05)",
		"0 20px 40px rgba(0,0,0,0.6), 0 1px 3px rgba(0,0,0,0.4)"
	);
	const textColor = useColorModeValue("gray.900", "white");
	const subTextColor = useColorModeValue("gray.500", "gray.400");
	const googleBtnBg = useColorModeValue("white", "#1A1A1A");
	const googleBtnBorder = useColorModeValue("blackAlpha.200", "whiteAlpha.200");
	const googleBtnHoverBg = useColorModeValue("gray.50", "#222222");

	const handleGoogleLogin = async () => {
		const onSuccess = (userData: any) => {
			setUser(userData);

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

		await startGoogleOAuth(onSuccess, onError, setGoogleLoading);
	};

	return (
		<Flex align={"center"} justify={"center"} w="full">
			<VStack spacing={6} mx={"auto"} w="full" maxW={"420px"}>
				<Box
					bg={cardBg}
					border="1px solid"
					borderColor={cardBorder}
					boxShadow={cardShadow}
					p={{ base: 6, md: 8 }}
					w="full"
					borderRadius="24px"
					backdropFilter="blur(20px)"
				>
					<VStack spacing={6} align="center" textAlign="center" w="full">
						{/* Branding */}
						<VStack spacing={2}>
							<Heading size="lg" fontWeight="800" letterSpacing="-0.5px" color={textColor}>
								Sociality
							</Heading>
							<Text fontSize="sm" color={subTextColor} maxW="300px">
								Connect, share, and discover with your community.
							</Text>
						</VStack>

						{/* Google Sign In Button */}
						<Button
							w="full"
							h="56px"
							bg={googleBtnBg}
							color={textColor}
							border="1px solid"
							borderColor={googleBtnBorder}
							borderRadius="16px"
							onClick={handleGoogleLogin}
							isLoading={googleLoading}
							loadingText="Opening Google..."
							spinner={<Spinner size="sm" color="blue.500" />}
							_hover={{
								bg: googleBtnHoverBg,
								transform: "translateY(-1px)",
								boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
							}}
							_active={{
								transform: "scale(0.98)",
							}}
							transition="all 0.2s ease"
							px={4}
						>
							<HStack spacing={3} justify="center" w="full">
								<svg width="22" height="22" viewBox="0 0 24 24">
									<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
									<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
									<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
									<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
								</svg>
								<Text fontWeight="600" fontSize="md">
									Continue with Google
								</Text>
							</HStack>
						</Button>

						<Text fontSize="xs" color={subTextColor} pt={2}>
							By continuing, you agree to our Terms of Service & Privacy Policy.
						</Text>
					</VStack>
				</Box>
			</VStack>
		</Flex>
	);
}
