import LoginCard from "../features/auth/components/LoginCard";
import { Box, HStack, Link, Text, useColorModeValue } from "@chakra-ui/react";
import { useEffect } from "react";

const AuthPage = () => {
	useEffect(() => {
		document.body.classList.add('auth-page-no-scroll');
		return () => {
			document.body.classList.remove('auth-page-no-scroll');
		};
	}, []);

	return (
		<Box
			position="relative"
			minHeight="100vh"
			w="full"
			overflow="hidden"
			bg={useColorModeValue("#F5F5F7", "#0A0A0A")}
			display="flex"
			flexDirection="column"
			alignItems="center"
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
			<Box 
				zIndex={1} 
				w="full" 
				display="flex" 
				flex={1} 
				flexDirection="column"
				justifyContent="center"
			>
				<LoginCard />
			</Box>

			{/* Footer links */}
			<Box position="relative" pb={4} pt={4} w="full" textAlign="center">
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
