import { useColorModeValue } from "@chakra-ui/react";

export const useNotificationTheme = () => ({
  textColor: useColorModeValue("gray.800", "white"),
  mutedTextColor: useColorModeValue("gray.600", "gray.400"),
  spinnerColor: useColorModeValue("gray.600", "whiteAlpha.700"),
  borderColor: useColorModeValue("rgba(0, 0, 0, 0.08)", "rgba(255, 255, 255, 0.08)"),
  scrollbarTrackColor: useColorModeValue("#f0f0f0", "#1a1a1a"),
  scrollbarThumbColor: useColorModeValue(
    "rgba(0, 0, 0, 0.3)",
    "rgba(255, 255, 255, 0.3)"
  ),
  scrollbarThumbHoverColor: useColorModeValue(
    "rgba(0, 0, 0, 0.5)",
    "rgba(255, 255, 255, 0.5)"
  ),
  scrollbarColor: useColorModeValue(
    "rgba(0, 0, 0, 0.3) #f0f0f0",
    "rgba(255, 255, 255, 0.3) #1a1a1a"
  ),
  itemHoverBg: useColorModeValue("gray.50", "whiteAlpha.100"),
  menuHoverBg: useColorModeValue("gray.100", "whiteAlpha.100"),
  menuHoverColor: useColorModeValue("black", "white"),
  menuListBg: useColorModeValue("white", "#1E1E1E"),
  menuItemHoverBg: useColorModeValue("gray.100", "whiteAlpha.200"),
});
