import { Flex, VStack, Heading, Text, Box, Skeleton, SkeletonCircle, Input, Button, useColorModeValue } from "@chakra-ui/react";
import { BsChatDots } from "react-icons/bs";
import { FaGlobe } from "react-icons/fa";

export const EmptyMessageState = ({ selectedConversation }: { selectedConversation: any }) => {
	const textColor = useColorModeValue("black", "white");
	
	return (
		<Flex direction="column" align="center" justify="center" h="100%" py={10} position="relative" zIndex={1}>
			<VStack
				p={10}
				borderRadius="40px"
				bg="rgba(30, 30, 30, 0.4)"
				backdropFilter="blur(20px)"
				boxShadow="0 25px 50px rgba(0, 0, 0, 0.4)"
				border="1px solid"
				borderColor="whiteAlpha.100"
				maxW="400px"
				textAlign="center"
				spacing={6}
			>
				<Box
					p={6}
					borderRadius="full"
					bg="rgba(0, 179, 116, 0.1)"
					boxShadow="0 0 30px rgba(0, 179, 116, 0.15)"
				>
					<BsChatDots size={40} color="#00B374" />
				</Box>
				<VStack spacing={2}>
					<Heading color={textColor} fontWeight="800" size="md" letterSpacing="-0.5px">
						No messages yet
					</Heading>
					<Text color="gray.400" fontSize="md" fontWeight="500" lineHeight="tall">
						Your conversation with {selectedConversation.username || selectedConversation.name} starts here. Send a message to break the ice!
					</Text>
				</VStack>
			</VStack>
		</Flex>
	);
};

export const MessageSkeletons = () => {
	return (
		<>
			{[...Array(5)].map((_, i) => (
				<Flex
					key={i}
					gap={3}
					alignItems={"center"}
					p={2}
					borderRadius={"lg"}
					alignSelf={i % 2 === 0 ? "flex-start" : "flex-end"}
					opacity={0}
					animation={`fadeIn 0.3s ease-out ${i * 0.1}s forwards`}
					maxW="70%"
				>
					{i % 2 === 0 && (
						<SkeletonCircle
							size={"8"}
							startColor="#1E1E1E"
							endColor="#151515"
							borderRadius="full"
							boxShadow="0 0 3px rgba(0, 179, 116, 0.1)"
						/>
					)}
					<Flex
						flexDir={"column"}
						gap={2}
						bg={i % 2 === 0 ? "rgba(30, 30, 30, 0.5)" : "rgba(0, 56, 56, 0.15)"}
						p={3}
						borderRadius="lg"
						boxShadow="0 1px 3px rgba(0, 0, 0, 0.1)"
						minW="150px"
					>
						<Skeleton h='10px' w={`${150 + Math.random() * 100}px`} startColor={i % 2 === 0 ? "#1E1E1E" : "#003838"} endColor={i % 2 === 0 ? "#151515" : "#002828"} borderRadius="full" />
						<Skeleton h='10px' w={`${100 + Math.random() * 150}px`} startColor={i % 2 === 0 ? "#1E1E1E" : "#003838"} endColor={i % 2 === 0 ? "#151515" : "#002828"} borderRadius="full" />
						{Math.random() > 0.5 && <Skeleton h='10px' w={`${50 + Math.random() * 100}px`} startColor={i % 2 === 0 ? "#1E1E1E" : "#003838"} endColor={i % 2 === 0 ? "#151515" : "#002828"} borderRadius="full" />}
					</Flex>
					{i % 2 !== 0 && (
						<SkeletonCircle
							size={"8"}
							startColor="#1E1E1E"
							endColor="#151515"
							borderRadius="full"
							boxShadow="0 0 3px rgba(0, 179, 116, 0.1)"
						/>
					)}
				</Flex>
			))}
		</>
	);
};

export const AccessDeniedState = ({ 
	joinCode, 
	setJoinCode, 
	handleJoinWithCode, 
	joining 
}: {
	joinCode: string;
	setJoinCode: (code: string) => void;
	handleJoinWithCode: () => void;
	joining: boolean;
}) => {
	const borderColor = useColorModeValue("gray.100", "whiteAlpha.100");
	const textColor = useColorModeValue("black", "white");
	const chatContainerBg = useColorModeValue("linear(to-b, #F7FAFC 0%, #EDF2F7 100%)", "linear(to-b, #0A0A0A 0%, #000000 100%)");

	return (
		<Flex direction="column" align="center" justify="center" h="100%" bg={chatContainerBg} p={10}>
			<VStack
				p={10}
				borderRadius="40px"
				bg={useColorModeValue("white", "rgba(30, 30, 30, 0.4)")}
				backdropFilter="blur(20px)"
				boxShadow="0 25px 50px rgba(0, 0, 0, 0.4)"
				border="1px solid"
				borderColor={borderColor}
				maxW="450px"
				textAlign="center"
				spacing={8}
			>
				<Box
					p={6}
					borderRadius="full"
					bg="rgba(255, 165, 0, 0.1)"
					boxShadow="0 0 30px rgba(255, 165, 0, 0.15)"
				>
					<FaGlobe size={40} color="orange" />
				</Box>
				<VStack spacing={3}>
					<Heading color={textColor} fontWeight="900" size="lg" letterSpacing="-1px">
						Private Room
					</Heading>
					<Text color="gray.400" fontSize="md" fontWeight="500" lineHeight="tall">
						This is a private cross-platform room. You need a room code to join and view the conversation.
					</Text>
				</VStack>
				
				<VStack w="full" spacing={4}>
					<Input 
						placeholder="Enter 8-digit Room Code"
						value={joinCode}
						onChange={(e) => setJoinCode(e.target.value)}
						size="lg"
						borderRadius="xl"
						textAlign="center"
						fontWeight="800"
						letterSpacing="4px"
						bg={useColorModeValue("gray.50", "whiteAlpha.50")}
						_focus={{ borderColor: "brand.primary.500" }}
					/>
					<Button 
						w="full" 
						colorScheme="brand" 
						size="lg" 
						borderRadius="xl" 
						onClick={handleJoinWithCode}
						isLoading={joining}
						isDisabled={!joinCode.trim()}
						bg="brand.primary.500"
						_hover={{ bg: "brand.primary.600" }}
					>
						Join Room
					</Button>
				</VStack>
			</VStack>
		</Flex>
	);
};
