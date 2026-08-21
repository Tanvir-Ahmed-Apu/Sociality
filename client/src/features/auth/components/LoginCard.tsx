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
import { useState, } from "react";
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
  
  const textColor = useColorModeValue("gray.900", "white");
  const subTextColor = useColorModeValue("gray.500", "gray.400");
  const googleBtnBg = useColorModeValue("white", "#1A1A1A");
  const googleBtnBorder = useColorModeValue("blackAlpha.200", "whiteAlpha.200");
  const googleBtnHoverBg = useColorModeValue("gray.50", "#222222");

  const handleGoogleLogin = async () => {
    const onSuccess = (userData: any) => {
      setUser(userData);

      if (userData.setupRequired || !userData.isProfileComplete) {
        showToast(
          "Info",
          "Welcome! Please complete your profile setup to get started.",
          "info",
        );
        setTimeout(() => {
          navigate("/profile-setup", { replace: true });
        }, 100);
      } else {
        showToast("Success", "Welcome back!", "success");
        setTimeout(() => {
          navigate("/", { replace: true });
        }, 100);
      }
    };

    const onError = (error: any) => {
      console.error("Google OAuth error:", error);
      let errorMessage = "Google login failed";

      if (
        error.message.includes("Popup blocked") ||
        error.message.includes("Popups are blocked")
      ) {
        errorMessage =
          "Popup blocked. Please allow popups for this site in your browser settings and try again.";
      } else if (error.message.includes("closed before completion")) {
        errorMessage = "Google login was cancelled";
      } else if (error.message.includes("user activation")) {
        errorMessage = "Please click the button directly to open Google login.";
      }

      showToast("Error", errorMessage, "error");
    };

    await startGoogleOAuth(onSuccess, onError, setGoogleLoading);
  };

  return (
    <div>
      <Flex align={"center"} justify={"center"} w="full">
        <VStack spacing={6} mx={"auto"} w="full" maxW={"420px"} p={8}>
          <VStack spacing={6} align="center" textAlign="center" w="full">
            {/* Branding */}
            <VStack spacing={2}>
              <img
                src="/icon.svg"
                alt="Sociality Logo"
                width={64}
                height={64}
              />
              <Heading
                size="lg"
                fontWeight="800"
                letterSpacing="-0.5px"
                color={textColor}
              >
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
                <img
                  src="/google.svg"
                  alt="Google Icon"
                  width={20}
                  height={20}
                />
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
  );
}
