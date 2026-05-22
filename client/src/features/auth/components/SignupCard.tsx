import {
	Flex,
	Box,
	FormControl,
	FormLabel,
	Input,
	HStack,
	Button,
	Text,
	VStack,
	Select,
	InputGroup,
	InputLeftElement,
	useColorModeValue,
	Divider,
	Center,
} from "@chakra-ui/react";
import { useState } from "react";
import { ViewIcon, ViewOffIcon } from "@chakra-ui/icons";
import { useSetRecoilState } from "recoil";
import { authScreenAtom, userAtom } from "../../../atoms";
import useShowToast from "../../../hooks/useShowToast";
import { setCurrentTabUser, getTabId } from "../../../utils/api";
import { apiFetch } from "../../../utils/apiBase";
import { X, CaretDown, User, EnvelopeSimple, LockSimple, Hash } from "phosphor-react";

export default function SignupCard() {
	const setAuthScreen = useSetRecoilState(authScreenAtom);
	const [loading, setLoading] = useState(false);
	const [inputs, setInputs] = useState({
		name: "",
		username: "",
		email: "",
		password: "",
		month: "",
		day: "",
		year: "",
	});
	const [showPassword, setShowPassword] = useState(false);

	// Theme tokens — consistent with the rest of the site
	const textColor = useColorModeValue("gray.900", "white");
	const subTextColor = useColorModeValue("gray.500", "gray.400");
	const inputBg = useColorModeValue("blackAlpha.50", "whiteAlpha.50");
	const borderColor = useColorModeValue("blackAlpha.200", "whiteAlpha.100");
	const placeholderColor = useColorModeValue("gray.400", "gray.600");
	const cardBg = useColorModeValue("white", "#111111");
	const cardBorder = useColorModeValue("blackAlpha.100", "whiteAlpha.100");
	const cardShadow = useColorModeValue(
		"0 8px 40px rgba(0,0,0,0.10), 0 1.5px 6px rgba(0,0,0,0.06)",
		"0 8px 40px rgba(0,0,0,0.5), 0 1.5px 6px rgba(0,0,0,0.3)"
	);
	const submitBtnBg = useColorModeValue("gray.900", "white");
	const submitBtnColor = useColorModeValue("white", "gray.900");
	const submitBtnHover = useColorModeValue("gray.700", "gray.100");
	const optionBg = useColorModeValue("white", "#111111");
	const closeIconColor = useColorModeValue("gray.400", "gray.500");
	const closeIconHoverColor = useColorModeValue("gray.700", "gray.300");

	const showToast = useShowToast();
	const setUser = useSetRecoilState(userAtom);

	const handleSignup = async () => {
		if (!inputs.name.trim() || !inputs.username.trim() || !inputs.email.trim() || !inputs.password.trim()) {
			showToast("Error", "All fields (Name, Username, Email, Password) are required.", "error");
			return;
		}
		if (inputs.password.length < 6) {
			showToast("Error", "Password must be at least 6 characters.", "error");
			return;
		}
		setLoading(true);
		try {
			const payload = {
				name: inputs.name.trim(),
				username: inputs.username.trim().toLowerCase(),
				email: inputs.email.trim().toLowerCase(),
				password: inputs.password,
			};
			const res = await apiFetch(`/api/users/signup?session=${getTabId()}`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(payload),
			});
			const data = await res.json();
			if (data.error) {
				showToast("Error", data.error, "error");
				return;
			}
			showToast("Success", "Account created successfully!", "success");
			setCurrentTabUser(data);
			setUser(data);
		} catch (error: any) {
			showToast("Error", error.message || "An error occurred", "error");
		} finally {
			setLoading(false);
		}
	};

	const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
	const days = Array.from({ length: 31 }, (_, i) => i + 1);
	const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - i);

	// Shared input styles
	const inputStyles = {
		bg: inputBg,
		backdropFilter: "blur(10px)",
		border: "1px solid",
		borderColor: borderColor,
		color: textColor,
		h: "52px",
		borderRadius: "14px",
		_placeholder: { color: placeholderColor },
		pl: "44px",
		_hover: { borderColor: useColorModeValue("blackAlpha.300", "whiteAlpha.300") },
		_focus: {
			borderColor: useColorModeValue("blackAlpha.400", "whiteAlpha.300"),
			boxShadow: "none",
			bg: inputBg,
		},
	};

	return (
		<Flex align="center" justify="center" w="full" minH="100vh" px={{ base: 2, sm: 4 }}>
			{/* Outer card container */}
			<Box
				bg={cardBg}
				w="full"
				maxW="460px"
				borderRadius="28px"
				border="1px solid"
				borderColor={cardBorder}
				boxShadow={cardShadow}
				overflow="hidden"
				position="relative"
			>
				{/* Card top bar — close + title */}
				<Flex
					align="center"
					justify="space-between"
					px={6}
					pt={5}
					pb={0}
				>
					<Box
						as="button"
						onClick={() => setAuthScreen("login")}
						color={closeIconColor}
						_hover={{ color: closeIconHoverColor }}
						transition="color 0.2s"
						display="flex"
						alignItems="center"
						justifyContent="center"
						w="32px"
						h="32px"
						borderRadius="full"
					>
						<X size={18} weight="bold" />
					</Box>

					{/* Logo / Brand mark in centre */}
					<Text
						fontSize="15px"
						fontWeight="800"
						color={textColor}
						letterSpacing="-0.3px"
					>
						Create account
					</Text>

					{/* Spacer to balance the X button */}
					<Box w="32px" />
				</Flex>

				{/* Scrollable form body */}
				<Box px={6} pt={5} pb={6} overflowY="auto" maxH="78vh" style={{ minHeight: 0 }}>
					<VStack spacing={4} align="stretch" w="full">

						{/* Full Name */}
						<FormControl>
							<FormLabel color={textColor} fontWeight="700" fontSize="xs" mb={1.5} textTransform="uppercase" letterSpacing="0.06em">
								Full Name
							</FormLabel>
							<Box position="relative">
								<InputGroup>
									<InputLeftElement h="52px" pl={1}>
										<User size={18} color="gray" />
									</InputLeftElement>
									<Input
										{...inputStyles}
										placeholder="Your full name"
										value={inputs.name}
										onChange={(e) => setInputs({ ...inputs, name: e.target.value })}
										maxLength={50}
									/>
								</InputGroup>
								<Text position="absolute" top={-5} right={0} fontSize="10px" color={subTextColor}>
									{inputs.name.length}/50
								</Text>
							</Box>
						</FormControl>

						{/* Email */}
						<FormControl>
							<FormLabel color={textColor} fontWeight="700" fontSize="xs" mb={1.5} textTransform="uppercase" letterSpacing="0.06em">
								Email
							</FormLabel>
							<InputGroup>
								<InputLeftElement h="52px" pl={1}>
									<EnvelopeSimple size={18} color="gray" />
								</InputLeftElement>
								<Input
									{...inputStyles}
									type="email"
									placeholder="you@example.com"
									value={inputs.email}
									onChange={(e) => setInputs({ ...inputs, email: e.target.value })}
								/>
							</InputGroup>
						</FormControl>

						{/* Username */}
						<FormControl>
							<FormLabel color={textColor} fontWeight="700" fontSize="xs" mb={1.5} textTransform="uppercase" letterSpacing="0.06em">
								Username
							</FormLabel>
							<InputGroup>
								<InputLeftElement h="52px" pl={1}>
									<Hash size={18} color="gray" />
								</InputLeftElement>
								<Input
									{...inputStyles}
									placeholder="choose_a_username"
									value={inputs.username}
									onChange={(e) => setInputs({ ...inputs, username: e.target.value })}
								/>
							</InputGroup>
						</FormControl>

						{/* Password */}
						<FormControl>
							<FormLabel color={textColor} fontWeight="700" fontSize="xs" mb={1.5} textTransform="uppercase" letterSpacing="0.06em">
								Password
							</FormLabel>
							<InputGroup>
								<InputLeftElement h="52px" pl={1}>
									<LockSimple size={18} color="gray" />
								</InputLeftElement>
								<Input
									{...inputStyles}
									type={showPassword ? "text" : "password"}
									placeholder="Min. 6 characters"
									value={inputs.password}
									onChange={(e) => setInputs({ ...inputs, password: e.target.value })}
									pr="44px"
								/>
								<Box
									position="absolute"
									right="14px"
									top="16px"
									cursor="pointer"
									zIndex={2}
									onClick={() => setShowPassword((v) => !v)}
									color="gray.400"
									_hover={{ color: textColor }}
									transition="color 0.2s"
								>
									{showPassword ? <ViewIcon /> : <ViewOffIcon />}
								</Box>
							</InputGroup>
						</FormControl>

						{/* Date of birth section */}
						<Divider borderColor={borderColor} />

						<VStack align="flex-start" spacing={1}>
							<Text fontWeight="700" color={textColor} fontSize="xs" textTransform="uppercase" letterSpacing="0.06em">
								Date of birth
							</Text>
							<Text color={subTextColor} fontSize="12px" lineHeight="1.4">
								Won't be shown publicly. Confirm your own age.
							</Text>
						</VStack>

						<HStack spacing={1.5} w="full">
							{/* Month */}
							<FormControl flex={2}>
								<Select
									placeholder="Month"
									value={inputs.month}
									onChange={(e) => setInputs({ ...inputs, month: e.target.value })}
									h="52px"
									bg={inputBg}
									border="1px solid"
									borderColor={borderColor}
									borderRadius="14px"
									color={textColor}
									icon={<CaretDown weight="bold" size={14} />}
									_focus={{ borderColor: useColorModeValue("blackAlpha.400", "whiteAlpha.300"), boxShadow: "none" }}
									fontSize={{ base: "xs", md: "sm" }}
								>
									{months.map((m) => <option key={m} value={m} style={{ background: optionBg }}>{m}</option>)}
								</Select>
							</FormControl>
							{/* Day */}
							<FormControl flex={1}>
								<Select
									placeholder="Day"
									value={inputs.day}
									onChange={(e) => setInputs({ ...inputs, day: e.target.value })}
									h="52px"
									bg={inputBg}
									border="1px solid"
									borderColor={borderColor}
									borderRadius="14px"
									color={textColor}
									icon={<CaretDown weight="bold" size={14} />}
									_focus={{ borderColor: useColorModeValue("blackAlpha.400", "whiteAlpha.300"), boxShadow: "none" }}
									fontSize={{ base: "xs", md: "sm" }}
								>
									{days.map((d) => <option key={d} value={d} style={{ background: optionBg }}>{d}</option>)}
								</Select>
							</FormControl>
							{/* Year */}
							<FormControl flex={1.5}>
								<Select
									placeholder="Year"
									value={inputs.year}
									onChange={(e) => setInputs({ ...inputs, year: e.target.value })}
									h="52px"
									bg={inputBg}
									border="1px solid"
									borderColor={borderColor}
									borderRadius="14px"
									color={textColor}
									icon={<CaretDown weight="bold" size={14} />}
									_focus={{ borderColor: useColorModeValue("blackAlpha.400", "whiteAlpha.300"), boxShadow: "none" }}
									fontSize={{ base: "xs", md: "sm" }}
								>
									{years.map((y) => <option key={y} value={y} style={{ background: optionBg }}>{y}</option>)}
								</Select>
							</FormControl>
						</HStack>

						{/* Submit button */}
						<Button
							w="full"
							h="52px"
							mt={2}
							borderRadius="14px"
							bg={submitBtnBg}
							color={submitBtnColor}
							fontWeight="800"
							fontSize="md"
							_hover={{ bg: submitBtnHover, transform: "translateY(-1px)", boxShadow: "0 4px 16px rgba(0,0,0,0.18)" }}
							_active={{ transform: "scale(0.98)" }}
							transition="all 0.2s"
							onClick={handleSignup}
							isLoading={loading}
							loadingText="Creating account..."
						>
							Create Account
						</Button>

						{/* Sign in link */}
						<Center pt={1}>
							<Text color={subTextColor} fontSize="sm">
								Already have an account?{" "}
								<Text
									as="span"
									color="blue.400"
									fontWeight="700"
									cursor="pointer"
									onClick={() => setAuthScreen("login")}
									_hover={{ textDecoration: "underline" }}
								>
									Sign in
								</Text>
							</Text>
						</Center>

					</VStack>
				</Box>
			</Box>
		</Flex>
	);
}
