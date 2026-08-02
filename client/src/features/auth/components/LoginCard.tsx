import {
	Flex,
	Button,
	Heading,
	Text,
	VStack,
	HStack,
	useColorModeValue,
	useColorMode,
	Spinner,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
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
	const { colorMode } = useColorMode();

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

	const stars = useMemo(() => {
		return Array.from({ length: 180 }).map(() => ({
			top: Math.random() * 100,
			left: Math.random() * 100,
			size: Math.random() * 2 + 1, // 1px - 3px
			duration: Math.random() * 3 + 2, // 2s - 5s
			delay: Math.random() * 5, // 0s - 5s
			opacity: Math.random() * 0.5 + 0.4, // 0.4 - 0.9 peak opacity
		}));
	}, []);

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
		<div className={`aurora-container ${colorMode === "dark" ? "dark" : ""}`}>
			{/* Inline aurora CSS — no Tailwind, no external file */}
			<style>{`
				.aurora-container {
					position: relative;
					display: flex;
					flex-direction: column;
					min-height: 100vh;
					width: 100%;
					align-items: center;
					justify-content: center;
					background-color: #fafafa;
					overflow: hidden;
					transition: background-color 0.3s ease;
				}

				.aurora-container.dark {
					background-color: #111111;
				}

				.aurora-layer {
					position: absolute;
					inset: 0;
					overflow: hidden;
					pointer-events: none;
				}

				.aurora-overlay {
					--aurora: repeating-linear-gradient(
						100deg,
						#00DF89 10%, 
						#009E95 25%, 
						#0082C8 45%, 
						#005885 65%, 
						#00DF89 85%
					);
					--white-gradient: repeating-linear-gradient(
						100deg,
						#fff 0%,
						#fff 7%,
						transparent 10%,
						transparent 12%,
						#fff 16%
					);
					--dark-gradient: repeating-linear-gradient(
						100deg,
						#000 0%,
						#000 7%,
						transparent 10%,
						transparent 12%,
						#000 16%
					);

					position: absolute;
					inset: -10px;
					background-image: var(--white-gradient), var(--aurora);
					background-size: 300%, 200%;
					background-position: 50% 50%, 50% 50%;
					opacity: 0.5;
					filter: blur(10px) invert(1);
					will-change: transform;
					-webkit-mask-image: radial-gradient(ellipse at 100% 0%, black 10%, transparent 70%);
					mask-image: radial-gradient(ellipse at 100% 0%, black 10%, transparent 70%);
				}

				.aurora-overlay::after {
					content: "";
					position: absolute;
					inset: 0;
					background-image: var(--white-gradient), var(--aurora);
					background-size: 200%, 100%;
					background-attachment: fixed;
					mix-blend-mode: difference;
					animation: aurora-move 60s linear infinite;
				}

				.aurora-container.dark .aurora-overlay {
					background-image: var(--dark-gradient), var(--aurora);
					filter: blur(10px);
				}

				.aurora-container.dark .aurora-overlay::after {
					background-image: var(--dark-gradient), var(--aurora);
				}

				@keyframes aurora-move {
					from {
						background-position: 50% 50%, 50% 50%;
					}
					to {
						background-position: 350% 50%, 350% 50%;
					}
				}

				@media (prefers-reduced-motion: reduce) {
					.aurora-overlay::after {
						animation: none;
					}
				}

				.star-layer {
					position: absolute;
					inset: 0;
					overflow: hidden;
					pointer-events: none;
					z-index: 2;
				}

				.star {
					position: absolute;
					border-radius: 50%;
					background: #ffffff;
					box-shadow: 0 0 4px 1px rgba(255, 255, 255, 0.6);
					animation-name: twinkle;
					animation-timing-function: ease-in-out;
					animation-iteration-count: infinite;
				}

				@keyframes twinkle {
					0%,
					100% {
						opacity: 0.15;
						transform: scale(0.8);
					}
					50% {
						opacity: var(--peak-opacity, 0.9);
						transform: scale(1.15);
					}
				}

				@media (prefers-reduced-motion: reduce) {
					.star {
						animation: none;
						opacity: 0.6;
					}
				}

				.aurora-content {
					position: relative;
					z-index: 10;
					width: 100%;
					display: flex;
					align-items: center;
					justify-content: center;
				}
			`}</style>

			<div className="aurora-layer">
				<div className="aurora-overlay" />
			</div>

			<div className="star-layer">
				{stars.map((star, i) => (
					<span
						key={i}
						className="star"
						style={{
							top: `${star.top}%`,
							left: `${star.left}%`,
							width: `${star.size}px`,
							height: `${star.size}px`,
							animationDuration: `${star.duration}s`,
							animationDelay: `${star.delay}s`,
							// @ts-ignore - custom property for the keyframe
							"--peak-opacity": star.opacity,
						}}
					/>
				))}
			</div>

			<div className="aurora-content">
				<Flex align={"center"} justify={"center"} w="full">
					<VStack
						spacing={6}
						mx={"auto"}
						w="full"
						maxW={"420px"}

						p={8}
					>
						<VStack spacing={6} align="center" textAlign="center" w="full">
							{/* Branding */}
							<VStack spacing={2}>
								<img src="/icon.svg" alt="Sociality Logo" width={64} height={64} />
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
									
									<img src="/google.svg" alt="Google Icon" width={20} height={20} />
									<Text fontWeight="600" fontSize="md">
										Continue with Google
									</Text>
								</HStack>
							</Button>

							<Text fontSize="xs" color={subTextColor} pt={2}>
								Press Continue. We promise not to sell your soul.
							</Text>
						</VStack>
					</VStack>
				</Flex>
			</div>
		</div>
	);
}
