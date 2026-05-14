import { useToast, Box, Flex, Text, Icon, CloseButton, useColorModeValue } from "@chakra-ui/react";
import { useCallback } from "react";
import { FiCheckCircle, FiAlertCircle, FiInfo, FiAlertTriangle } from "react-icons/fi";

const useShowToast = () => {
	const toast = useToast();

	const showToast = useCallback(
		(title: string, description: string, status: "info" | "warning" | "success" | "error" | "loading" | undefined) => {
			toast({
				position: "top",
				duration: 4000,
				isClosable: true,
				render: ({ onClose }) => {
					// Define colors based on status
					let color = "brand.primary.500"; // Default green
					let icon = FiCheckCircle;

					if (status === "error") {
						color = "#FF3366"; // brand.secondary.500
						icon = FiAlertCircle;
					} else if (status === "warning") {
						color = "orange.400";
						icon = FiAlertTriangle;
					} else if (status === "info") {
						color = "brand.accent.500";
						icon = FiInfo;
					}

					return (
						<Box
							p={4}
							mx={4}
							mt={4}
							borderRadius="20px"
							bg={useColorModeValue("whiteAlpha.800", "blackAlpha.700")}
							backdropFilter="blur(20px) saturate(180%)"
							border="1px solid"
							borderColor={useColorModeValue(`${color}40`, `${color}80`)}
							boxShadow="0 8px 32px 0 rgba(0, 0, 0, 0.37)"
							position="relative"
							overflow="hidden"
							minW={{ base: "xs", md: "sm" }}
						>
							{/* Background Glow */}
							<Box 
								position="absolute" 
								top="-20%" 
								left="-10%" 
								w="60px" 
								h="60px" 
								bg={color} 
								filter="blur(30px)" 
								opacity="0.2" 
								borderRadius="full" 
							/>

							<Flex align="center" gap={4}>
								<Flex 
									align="center" 
									justify="center" 
									w="40px" 
									h="40px" 
									borderRadius="14px" 
									bg={`${color}20`}
									border="1px solid"
									borderColor={`${color}40`}
								>
									<Icon as={icon} color={color} boxSize={5} />
								</Flex>

								<Flex direction="column" flex={1} pr={4}>
									<Text fontWeight="800" color={useColorModeValue("gray.800", "white")} fontSize="md" letterSpacing="-0.5px">
										{title}
									</Text>
									{description && (
										<Text fontWeight="500" color={useColorModeValue("gray.600", "gray.400")} fontSize="sm" mt={0.5}>
											{description}
										</Text>
									)}
								</Flex>

								<CloseButton 
									size="sm" 
									onClick={onClose} 
									color={useColorModeValue("gray.400", "gray.500")}
									_hover={{ color: useColorModeValue("gray.800", "white"), bg: "whiteAlpha.200" }}
									borderRadius="full"
								/>
							</Flex>
						</Box>
					);
				}
			});
		},
		[toast]
	);

	return showToast;
};

export default useShowToast;
