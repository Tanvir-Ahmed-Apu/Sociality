import { useColorModeValue } from "@chakra-ui/react";

export const useUpdateProfileTheme = () => ({
  bgColor: useColorModeValue("white", "#101010"),
  borderColor: useColorModeValue("gray.200", "gray.700"),
  textColor: useColorModeValue("gray.800", "white"),
  labelColor: useColorModeValue("gray.600", "gray.300"),
  inputBg: useColorModeValue("gray.50", "rgba(0, 0, 0, 0.2)"),
  inputBorderColor: useColorModeValue("gray.300", "gray.600"),
  inputHoverBorderColor: useColorModeValue("gray.400", "gray.500"),
  placeholderColor: useColorModeValue("gray.400", "gray.500"),
  dividerColor: useColorModeValue(
    "rgba(0, 179, 116, 0.3)",
    "rgba(0, 179, 116, 0.2)"
  ),
  cancelButtonBorder: useColorModeValue("gray.300", "gray.600"),
  cancelButtonHoverBg: useColorModeValue("gray.100", "rgba(255, 255, 255, 0.1)"),
  cancelButtonHoverBorder: useColorModeValue("gray.400", "gray.500"),
  buttonTextColor: useColorModeValue("gray.700", "white"),
  backButtonColor: useColorModeValue("gray.600", "white"),
  helperTextColor: useColorModeValue("gray.500", "gray.500"),
});
