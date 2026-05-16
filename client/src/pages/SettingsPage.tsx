import { Button, Text, Box, Flex, VStack, HStack, Divider, AlertDialog, AlertDialogBody, AlertDialogFooter, AlertDialogHeader, AlertDialogContent, AlertDialogOverlay, useColorModeValue, Heading } from "@chakra-ui/react";
import useShowToast from "../hooks/useShowToast";
import useLogout from "../hooks/useLogout";
import { useState, useRef } from "react";
import { SignOut, Trash } from "phosphor-react";
import { fetchWithSession } from "../utils/api";
import { ContentCard, ThemeToggle } from "../components/ui";

export const SettingsPage = () => {
	const showToast = useShowToast();
	const logout = useLogout();

	// For delete account confirmation dialog
	const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
	const cancelRef = useRef<HTMLButtonElement>(null);

	const onDeleteAlertClose = () => setIsDeleteAlertOpen(false);
	const onDeleteAlertOpen = () => setIsDeleteAlertOpen(true);

	// Theme-aware colors
	const bgColor = useColorModeValue("#f7fafc", "#101010");
	const cardBgColor = useColorModeValue("rgba(255, 255, 255, 0.25)", "#1a1a1a");
	const borderColor = useColorModeValue("rgba(255, 255, 255, 0.2)", "rgba(255, 255, 255, 0.08)");
	const textColor = useColorModeValue("gray.800", "white");
	const glassProps = useColorModeValue({
		backdropFilter: "blur(10px)",
		border: "1px solid rgba(255, 255, 255, 0.2)",
		boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)"
	}, {});





	const deleteAccount = async () => {
		try {
			const res = await fetchWithSession("/api/users/delete", {
				method: "DELETE",
				headers: { "Content-Type": "application/json" },
			});

			// Check if the response is ok before trying to parse JSON
			if (!res.ok) {
				// If the API endpoint doesn't exist or returns an error
				if (res.status === 404) {
					showToast("Error", "API endpoint not found. Backend implementation needed.", "error");
				} else {
					showToast("Error", `Server error: ${res.status}`, "error");
				}
				onDeleteAlertClose(); // Close the dialog
				return;
			}

			// Try to parse the JSON response
			let data;
			try {
				data = await res.json();
			} catch (parseError) {
				showToast("Error", "Invalid response from server", "error");
				onDeleteAlertClose(); // Close the dialog
				return;
			}

			if (data.error) {
				showToast("Error", data.error, "error");
				onDeleteAlertClose(); // Close the dialog
				return;
			}

			// Success case
			await logout();
			showToast("Success", "Your account has been permanently deleted", "success");
			onDeleteAlertClose(); // Close the dialog
		} catch (error: any) {
			showToast("Error", error.message, "error");
			onDeleteAlertClose(); // Close the dialog
		}
	};

	return (
		<Box w="full" pt={{ base: 4, md: 8 }} pb={{ base: "80px", md: 8 }} px={{ base: 2, sm: 4, md: 0 }}>
			<VStack spacing={8} align="center" width="100%" maxW="600px" mx="auto">
				<Heading as="h1" size="xl" textAlign="center" color={textColor} w="full" mb={4}>
					Settings
				</Heading>

				{/* Theme Section */}
				<Box w="full">
					<ThemeToggle />
				</Box>

				{/* Account Section */}
				<ContentCard w="full" p={6} withBorder={true}>
					<Text fontSize="xl" fontWeight="bold" mb={5} color={textColor}>
						Account
					</Text>

					{/* Logout Button */}
					<Flex 
						justify="space-between" 
						align="center" 
						p={4} 
						mx={-3}
						borderRadius="2xl"
						bg="transparent"
						_hover={{ 
							bg: useColorModeValue("rgba(0, 0, 0, 0.05)", "rgba(255, 255, 255, 0.08)"),
							backdropFilter: "blur(10px)",
							border: "1px solid",
							borderColor: useColorModeValue("rgba(0, 0, 0, 0.05)", "rgba(255, 255, 255, 0.1)")
						}}
						transition="all 0.3s ease"
						cursor="pointer"
						onClick={logout}
						mb={2}
					>
						<HStack spacing={3}>
							<SignOut size={22} weight="bold" color={useColorModeValue("#4A5568", "#CBD5E0")} />
							<Text fontWeight={"bold"} fontSize="md" color={textColor}>Logout</Text>
						</HStack>
					</Flex>

					<Divider my={3} borderColor={useColorModeValue("gray.100", "whiteAlpha.100")} />

					{/* Delete Account */}
					<Flex 
						justify="space-between" 
						align="center"
						p={4}
						mx={-3}
						borderRadius="2xl"
						bg="transparent"
						_hover={{ 
							bg: useColorModeValue("rgba(229, 62, 62, 0.05)", "rgba(229, 62, 62, 0.1)"),
							backdropFilter: "blur(10px)",
							border: "1px solid",
							borderColor: useColorModeValue("rgba(229, 62, 62, 0.1)", "rgba(229, 62, 62, 0.2)")
						}}
						transition="all 0.3s ease"
						cursor="pointer"
						onClick={onDeleteAlertOpen}
					>
						<HStack spacing={3}>
							<Trash size={22} weight="bold" color="#E53E3E" />
							<Box>
								<Text fontWeight={"bold"} fontSize="md" color={textColor}>Delete Your Account</Text>
								<Text fontSize="xs" color="gray.500">This action is permanent and cannot be undone</Text>
							</Box>
						</HStack>
					</Flex>
				</ContentCard>
			</VStack>

			{/* Delete Account Confirmation Dialog */}
			<AlertDialog
				isOpen={isDeleteAlertOpen}
				leastDestructiveRef={cancelRef}
				onClose={onDeleteAlertClose}
				isCentered
			>
				<AlertDialogOverlay backdropFilter="blur(8px)" bg="blackAlpha.600" />
				<AlertDialogContent
					bg={useColorModeValue("white", "#1E1E1E")}
					borderColor={useColorModeValue("gray.200", "rgba(255, 255, 255, 0.1)")}
					borderWidth="1px"
					borderRadius="xl"
					backdropFilter="blur(10px)"
				>
					<AlertDialogHeader fontSize="xl" fontWeight="bold" color={textColor}>
						Delete Account
					</AlertDialogHeader>

					<AlertDialogBody color={useColorModeValue("gray.700", "gray.300")}>
						Are you sure you want to delete your account? This action cannot be undone and all your data will be permanently removed.
					</AlertDialogBody>

					<AlertDialogFooter>
						<Button
							ref={cancelRef}
							onClick={onDeleteAlertClose}
							bg={useColorModeValue("gray.100", "#1E1E1E")}
							color={useColorModeValue("gray.800", "white")}
							borderWidth="1px"
							borderColor={useColorModeValue("gray.300", "rgba(255, 255, 255, 0.1)")}
							borderRadius="md"
							_hover={{
								bg: useColorModeValue("gray.200", "rgba(255, 255, 255, 0.1)"),
								borderColor: useColorModeValue("gray.400", "rgba(255, 255, 255, 0.2)"),
								transform: "translateY(-2px)"
							}}
							transition="all 0.2s"
						>
							Cancel
						</Button>
						<Button
							bg={useColorModeValue("rgba(229, 62, 62, 0.1)", "rgba(229, 62, 62, 0.3)")}
							color={useColorModeValue("red.600", "white")}
							borderWidth="1px"
							borderColor={useColorModeValue("red.300", "rgba(229, 62, 62, 0.4)")}
							borderRadius="md"
							backdropFilter="blur(8px)"
							boxShadow={useColorModeValue("0 2px 8px rgba(229, 62, 62, 0.2)", "none")}
							_hover={{
								bg: useColorModeValue("rgba(229, 62, 62, 0.2)", "rgba(229, 62, 62, 0.4)"),
								borderColor: useColorModeValue("red.400", "rgba(229, 62, 62, 0.6)"),
								transform: "translateY(-2px)",
								boxShadow: useColorModeValue("0 4px 12px rgba(229, 62, 62, 0.3)", "0 4px 12px rgba(229, 62, 62, 0.2)")
							}}
							transition="all 0.2s"
							onClick={deleteAccount}
							ml={3}
						>
							Delete Account
						</Button>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>


		</Box>
	);
};
