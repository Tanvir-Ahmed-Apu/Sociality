import { useRecoilValue } from "recoil";
import LoginCard from "../features/auth/components/LoginCard";
import SignupCard from "../features/auth/components/SignupCard";
import { authScreenAtom } from "../atoms";
import { Box, HStack, Link, Text, useColorModeValue } from "@chakra-ui/react";
import "../styles/CyanGradientBackground.css";
import { useEffect } from "react";

const AuthPage = () => {
	const authScreenState = useRecoilValue(authScreenAtom);

	// Add effect to disable scrolling on auth page
	useEffect(() => {
		// Add the auth-page-no-scroll class to the body
		document.body.classList.add('auth-page-no-scroll');

		// Cleanup function to remove the class when component unmounts
		return () => {
			document.body.classList.remove('auth-page-no-scroll');
		};
	}, []);

	// No background elements or animations

	return (
		<Box
			position="relative"
			minHeight="100vh"
			w="full"
			overflowY={authScreenState === "signup" ? "auto" : "hidden"}
			overflowX="hidden"
			bg={useColorModeValue("#F5F5F7", "#0A0A0A")}
			display="flex"
			flexDirection="column"
			alignItems="center"
			justifyContent={authScreenState === "signup" ? "flex-start" : "center"}
			py={authScreenState === "signup" ? 8 : 0}
		>
			{/* Subtle background pattern */}
			<Box
				position="fixed"
				top={0}
				left={0}
				right={0}
				h="40vh"
				bgImage="url('https://static.cdninstagram.com/rsrc.php/yX/r/U6m8_N098o8.png')"
				bgRepeat="repeat-x"
				bgSize="auto 100%"
				opacity={useColorModeValue(0.04, 0.15)}
				zIndex={0}
				pointerEvents="none"
			/>
			
			{/* Auth card */}
			<Box zIndex={1} w="full">
				{authScreenState === "login" ? <LoginCard /> : <SignupCard />}
			</Box>

			{/* Footer links */}
			<Box position="relative" mt="auto" pb={4} pt={4} w="full" textAlign="center">
				<HStack justify="center" spacing={4} fontSize="10px" color={useColorModeValue("gray.400", "gray.600")}>
					<Text>© 2026 Sociality</Text>
					<Link _hover={{ color: useColorModeValue("black", "white") }}>Terms</Link>
					<Link _hover={{ color: useColorModeValue("black", "white") }}>Privacy Policy</Link>
					<Link _hover={{ color: useColorModeValue("black", "white") }}>Cookies Policy</Link>
					<Link _hover={{ color: useColorModeValue("black", "white") }}>Report a problem</Link>
				</HStack>
			</Box>
		</Box>
	);
};

export default AuthPage;
